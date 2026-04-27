"""
process_chars.py — Extrai e processa sprites de personagens do Chapada Escapade.

Assume que a sheet tem 4 colunas (UP / RIGHT / DOWN / LEFT) e que as
linhas pares são duplicatas a descartar. Extrai por animal:
  frente  = sprite DOWN  (coluna 3)
  cima    = sprite UP    (coluna 1)
  costas  = sprite UP rotacionado 180°
  lado_d  = sprite RIGHT (coluna 2)

Uso:
  python tools/process_chars.py refs/vacas.jpg vaca boi
  python tools/process_chars.py refs/fazendeiros.jpg fazendeiro
"""

import sys
import argparse
import numpy as np
from PIL import Image
from pathlib import Path
from scipy import ndimage


BG_HEX      = "a7b3a3"
TOL         = 35
GAP         = 3
MIN_PX      = 40   # filtra letras de label e artefatos pequenos
MIN_ROW_N   = 3    # linha precisa ter ao menos N sprites
OUT_DIR     = "assets/characters"

# Ordem das colunas geradas pelo AI: UP=0, RIGHT=1, DOWN=2, LEFT=3
COL_CIMA    = 0
COL_LADO_D  = 1
COL_FRENTE  = 2


def remove_bg(img: Image.Image) -> Image.Image:
    """Flood fill a partir das bordas — remove só o fundo externo, sem tocar pixels internos."""
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.int32)
    r, g, b = int(BG_HEX[0:2], 16), int(BG_HEX[2:4], 16), int(BG_HEX[4:6], 16)

    # Máscara de pixels próximos à cor de fundo
    bg_mask = (
        (np.abs(data[:, :, 0] - r) <= TOL) &
        (np.abs(data[:, :, 1] - g) <= TOL) &
        (np.abs(data[:, :, 2] - b) <= TOL)
    )

    # Flood fill: marca só os componentes conectados às bordas da imagem
    labeled, _ = ndimage.label(bg_mask)
    h, w = bg_mask.shape
    border_labels = set(labeled[0, :]) | set(labeled[-1, :]) | \
                    set(labeled[:, 0]) | set(labeled[:, -1])
    border_labels.discard(0)

    flood = np.zeros_like(bg_mask)
    for lbl in border_labels:
        flood |= (labeled == lbl)

    # Erosão leve pra limpar halos de JPG nas bordas dos sprites
    flood = ndimage.binary_dilation(flood, iterations=2)

    data[flood, 3] = 0
    return Image.fromarray(data.astype(np.uint8))


def detect_sprites(img: Image.Image) -> list[tuple[int,int,int,int]]:
    alpha = np.array(img)[:, :, 3]
    binary = alpha > 0
    struct = ndimage.generate_binary_structure(2, 1)
    dilated = ndimage.binary_dilation(binary, structure=struct, iterations=GAP)
    labeled, n = ndimage.label(dilated)
    boxes = []
    for lbl in range(1, n + 1):
        comp = (labeled == lbl) & binary
        rows = np.any(comp, axis=1)
        cols = np.any(comp, axis=0)
        if not rows.any():
            continue
        y0, y1 = int(np.where(rows)[0][[0, -1]].tolist()[0]), int(np.where(rows)[0][[0, -1]].tolist()[1])
        x0, x1 = int(np.where(cols)[0][[0, -1]].tolist()[0]), int(np.where(cols)[0][[0, -1]].tolist()[1])
        if (y1 - y0) < MIN_PX or (x1 - x0) < MIN_PX:
            continue
        boxes.append((x0, y0, x1, y1))
    return sorted(boxes, key=lambda b: (b[1], b[0]))  # top→bottom, left→right


def group_rows(boxes: list, row_gap: int = 30) -> list[list]:
    """Agrupa bounding boxes em linhas por proximidade vertical."""
    if not boxes:
        return []
    rows, cur_row, cur_y = [], [boxes[0]], boxes[0][1]
    for b in boxes[1:]:
        if abs(b[1] - cur_y) < row_gap:
            cur_row.append(b)
        else:
            rows.append(sorted(cur_row, key=lambda b: b[0]))
            cur_row, cur_y = [b], b[1]
    rows.append(sorted(cur_row, key=lambda b: b[0]))
    return rows


def crop_sprite(img: Image.Image, box: tuple, pad: int = 2) -> Image.Image:
    w, h = img.size
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0-pad), max(0, y0-pad), min(w, x1+pad), min(h, y1+pad)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("image", help="Sprite sheet de entrada (ex: refs/vacas.jpg)")
    parser.add_argument("animais", nargs="+", help="Nomes dos animais em ordem de linha (ex: vaca boi)")
    parser.add_argument("--out", default=OUT_DIR)
    args = parser.parse_args()

    script_dir  = Path(__file__).parent
    root        = script_dir.parent
    img_path    = root / args.image
    out_dir     = root / args.out

    if not img_path.exists():
        sys.exit(f"❌ Arquivo não encontrado: {img_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"📂 Entrada : {img_path}")

    img     = Image.open(img_path)
    no_bg   = remove_bg(img)
    boxes   = detect_sprites(no_bg)
    rows    = group_rows(boxes, row_gap=80)

    print(f"📐 {len(boxes)} sprites detectados em {len(rows)} linhas\n")
    for ri, r in enumerate(rows):
        sizes = [f"{b[2]-b[0]}x{b[3]-b[1]}" for b in r]
        print(f"  linha {ri+1}: {len(r)} sprites — {sizes}")

    # Remove linhas com poucos sprites (artefatos, texto)
    valid_rows = [r for r in rows if len(r) >= MIN_ROW_N]
    print(f"📋 Linhas válidas (≥{MIN_ROW_N} sprites): {len(valid_rows)}")

    # Agrupa pares de linhas por animal (todas as linhas, sem pular)
    sprites_per_animal = len(valid_rows) // len(args.animais)
    kept_rows_per_animal = [
        valid_rows[i * sprites_per_animal:(i + 1) * sprites_per_animal]
        for i in range(len(args.animais))
    ]

    if len(kept_rows_per_animal) != len(args.animais):
        print(f"⚠️  {len(kept_rows_per_animal)} grupos mas {len(args.animais)} animais informados.\n")

    saved = []
    for animal, animal_rows in zip(args.animais, kept_rows_per_animal):
        # Achata todas as linhas do animal em sequência numerada
        row = [box for r in animal_rows for box in r]
        if len(row) < 1:
            print(f"⚠️  {animal}: nenhum sprite detectado, pulando.")
            continue

        # Pasta individual por animal
        animal_dir = out_dir / animal
        animal_dir.mkdir(parents=True, exist_ok=True)
        # Limpa arquivos anteriores
        for old in animal_dir.glob("*.png"):
            old.unlink()

        for i, box in enumerate(row, 1):
            spr   = crop_sprite(no_bg, box)
            fname = animal_dir / f"{animal}_{i}.png"
            spr.save(fname, "PNG")
            saved.append(fname.name)
            print(f"  ✅ {fname.name}  {spr.width}x{spr.height}px")

    print(f"\n✅ {len(saved)} sprites salvos em {out_dir}")


if __name__ == "__main__":
    main()
