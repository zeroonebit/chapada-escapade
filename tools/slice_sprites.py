"""
slice_sprites.py — Fatiador automático de sprite sheets do Chapada Escapade
Uso: python tools/slice_sprites.py <imagem> [--out assets/ui] [--prefix hud] [--bg a7b3a3] [--tol 25] [--pad 2] [--gap 8] [--min 20]
"""

import sys
import argparse
import os
import numpy as np
from PIL import Image
from pathlib import Path


def remove_bg(img: Image.Image, bg_hex: str, tol: int) -> Image.Image:
    img = img.convert("RGBA")
    data = np.array(img, dtype=np.int32)
    r = int(bg_hex[0:2], 16)
    g = int(bg_hex[2:4], 16)
    b = int(bg_hex[4:6], 16)
    mask = (
        (np.abs(data[:, :, 0] - r) <= tol) &
        (np.abs(data[:, :, 1] - g) <= tol) &
        (np.abs(data[:, :, 2] - b) <= tol)
    )
    data[mask, 3] = 0
    return Image.fromarray(data.astype(np.uint8))


def find_bands(has_content: np.ndarray, gap: int) -> list[tuple[int, int]]:
    bands = []
    start = None
    silent = 0
    for i, v in enumerate(has_content):
        if v:
            if start is None:
                start = i
            silent = 0
        else:
            if start is not None:
                silent += 1
                if silent > gap:
                    bands.append((start, i - silent))
                    start = None
                    silent = 0
    if start is not None:
        bands.append((start, len(has_content) - 1))
    return bands


def find_elements(img: Image.Image, gap: int, min_size: int) -> list[tuple[int, int, int, int]]:
    """Usa componentes conectados pra separar elementos corretamente."""
    try:
        from scipy import ndimage
    except ImportError:
        raise SystemExit("❌ scipy não instalado. Rode: pip install scipy")

    alpha = np.array(img)[:, :, 3]
    binary = alpha > 0

    # Dilatar por gap px pra fundir pixels próximos do mesmo elemento
    struct = ndimage.generate_binary_structure(2, 1)
    dilated = ndimage.binary_dilation(binary, structure=struct, iterations=gap)

    labeled, n = ndimage.label(dilated)

    elements = []
    for lbl in range(1, n + 1):
        # Bbox do componente na imagem original (sem dilatação)
        component = (labeled == lbl) & binary
        rows = np.any(component, axis=1)
        cols = np.any(component, axis=0)
        if not rows.any():
            continue
        y0, y1 = np.where(rows)[0][[0, -1]]
        x0, x1 = np.where(cols)[0][[0, -1]]
        if (y1 - y0) < min_size or (x1 - x0) < min_size:
            continue
        elements.append((int(x0), int(y0), int(x1), int(y1)))

    # Ordenar top→bottom, left→right
    elements.sort(key=lambda e: (e[1], e[0]))
    return elements


def main():
    parser = argparse.ArgumentParser(description="Fatia sprite sheet removendo fundo sage-gray")
    parser.add_argument("image", help="Caminho da imagem de entrada")
    parser.add_argument("--out", default="assets/ui", help="Pasta de saída (default: assets/ui)")
    parser.add_argument("--prefix", default="sprite", help="Prefixo dos arquivos (default: sprite)")
    parser.add_argument("--bg", default="a7b3a3", help="Cor de fundo hex sem # (default: a7b3a3)")
    parser.add_argument("--tol", type=int, default=25, help="Tolerância de cor 0-255 (default: 25)")
    parser.add_argument("--pad", type=int, default=2, help="Padding em px ao redor de cada elemento (default: 2)")
    parser.add_argument("--gap", type=int, default=8, help="Gap mínimo entre elementos em px (default: 8)")
    parser.add_argument("--min", type=int, default=20, dest="min_size", help="Tamanho mínimo de elemento em px (default: 20)")
    args = parser.parse_args()

    # Resolve caminho relativo à raiz do projeto (um nível acima de tools/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    img_path = Path(args.image) if Path(args.image).is_absolute() else project_root / args.image
    out_dir = Path(args.out) if Path(args.out).is_absolute() else project_root / args.out

    if not img_path.exists():
        print(f"❌ Arquivo não encontrado: {img_path}")
        sys.exit(1)

    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"📂 Entrada : {img_path}")
    print(f"📂 Saída   : {out_dir}")
    print(f"🎨 BG color: #{args.bg}  tolerância: {args.tol}")

    img = Image.open(img_path)
    print(f"📐 Tamanho : {img.width}x{img.height}px")

    img_no_bg = remove_bg(img, args.bg, args.tol)
    elements = find_elements(img_no_bg, args.gap, args.min_size)

    if not elements:
        print("⚠️  Nenhum elemento encontrado. Tente aumentar --tol ou diminuir --min.")
        sys.exit(1)

    print(f"\n✂️  {len(elements)} elemento(s) encontrado(s):\n")
    w, h = img_no_bg.width, img_no_bg.height

    for i, (x0, y0, x1, y1) in enumerate(elements, 1):
        x0p = max(0, x0 - args.pad)
        y0p = max(0, y0 - args.pad)
        x1p = min(w, x1 + args.pad)
        y1p = min(h, y1 + args.pad)

        crop = img_no_bg.crop((x0p, y0p, x1p, y1p))
        filename = f"{args.prefix}_{i:02d}.png"
        out_path = out_dir / filename
        crop.save(out_path, "PNG")

        print(f"  [{i:02d}] {filename}  {crop.width}x{crop.height}px  (pos {x0},{y0} → {x1},{y1})")

    print(f"\n✅ Salvo em: {out_dir}")
    print("\n💡 Renomeie os arquivos conforme a convenção do projeto:")
    print("   hud_score_frame.png, hud_burger_frame.png, hud_barra_frame.png,")
    print("   hud_barra_combustivel.png, hud_barra_graviton.png, hud_map_btn.png, hud_lvl_badge.png")


if __name__ == "__main__":
    main()
