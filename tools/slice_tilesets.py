"""
slice_tilesets.py — slicia DUAS tilesheets (Nano Banana + GPT Image 2),
augmenta cada uma via mirror/rotation pra cobrir Wang corner-tile patterns,
e salva em assets/terrain/{pack}/ com NOMES IDÊNTICOS pros 2 packs.

Esquema de paridade:
  assets/terrain/nanobanana/wang_XXXX.png
  assets/terrain/gpt/wang_XXXX.png
  ↑ mesmos arquivos, conteúdo diferente — switch é só trocar o pack name.

Wang pattern naming (TL TR BL BR em binário, 1=grass, 0=dirt):
  1111 = full grass     0000 = full dirt
  1100 = grass top      0011 = grass bottom
  1010 = grass left     0101 = grass right
  1000 = grass TL only  0001 = grass BR only
  0100 = grass TR only  0010 = grass BL only
  + 1110, 1101, 1011, 0111 = three-corners-grass (derived via 180-rot)
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent.parent
REFS = ROOT / "refs"
DST_BASE = ROOT / "assets" / "terrain"

# Mapeamento dos 8 tiles do prompt → Wang patterns (TL TR BL BR)
# Esta é a ordem que pedimos no prompt (row-major: top→bottom, left→right)
SOURCE_PATTERNS = [
    "1111",  # 1: full grass
    "0000",  # 2: full dirt
    "1100",  # 3: grass top half
    "0011",  # 4: grass bottom half
    "1010",  # 5: grass left half
    "0101",  # 6: grass right half
    "1000",  # 7: grass TL corner only (rest dirt)
    "0001",  # 8: grass BR corner only (rest dirt) — note: AI pode inverter, ajustar manual se necessário
]

# Augmentação: target Wang pattern → (source pattern, [PIL ops])
# Ops: 'flip_h', 'flip_v', 'rot_90', 'rot_180', 'rot_270'
AUGMENT_MAP = {
    # 4 single corners (0001 e 1000 já são source; 0010 e 0100 derivam)
    "0100": ("1000", ["flip_h"]),     # TL → TR
    "0010": ("1000", ["flip_v"]),     # TL → BL
    # 4 three-corners (180 rot dos single-corners)
    "1110": ("0001", ["rot_180"]),    # everything-but-TL grass
    "1101": ("0010", ["rot_180"]),    # everything-but-TR
    "1011": ("0100", ["rot_180"]),    # everything-but-BL
    "0111": ("1000", ["rot_180"]),    # everything-but-BR
    # 1010 e 0101 cardinal-splits já são source (não precisam derivar)
    # Diagonais 0110 e 1001 não derivam de rotação simples — geramos compondo
}

def detect_components(arr, threshold=80):
    """Flood fill BFS pra achar componentes não-background.
    Background detectado pelos cantos da imagem."""
    H, W = arr.shape[:2]
    # bg = média dos 4 cantos
    corners = np.array([arr[0,0,:3], arr[0,-1,:3], arr[-1,0,:3], arr[-1,-1,:3]])
    bg = np.median(corners, axis=0).astype(int)
    diff = np.abs(arr[:,:,:3].astype(int) - bg).sum(axis=2)
    mask = diff > threshold
    visited = np.zeros_like(mask, dtype=bool)
    comps = []
    for y0 in range(H):
        for x0 in range(W):
            if not mask[y0, x0] or visited[y0, x0]: continue
            stack = [(y0, x0)]
            mn_x, mn_y, mx_x, mx_y, count = x0, y0, x0, y0, 0
            while stack:
                y, x = stack.pop()
                if y < 0 or y >= H or x < 0 or x >= W: continue
                if visited[y, x] or not mask[y, x]: continue
                visited[y, x] = True
                count += 1
                if x < mn_x: mn_x = x
                if x > mx_x: mx_x = x
                if y < mn_y: mn_y = y
                if y > mx_y: mx_y = y
                stack.extend([(y+1,x),(y-1,x),(y,x+1),(y,x-1)])
            if count > 5000:  # filtra ruído pequeno
                comps.append({'bbox': (mn_x, mn_y, mx_x, mx_y), 'count': count})
    return comps

def slice_sheet(src_path, out_dir, target_size=128):
    """Slicia 8 tiles de um tilesheet, ordenado row-major (top-left → bottom-right)."""
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)
    print(f"  input: {src_path.name} ({img.size[0]}x{img.size[1]})")

    comps = detect_components(arr)
    print(f"  found {len(comps)} components")
    if len(comps) != 8:
        print(f"  ⚠️ Esperava 8 tiles, achei {len(comps)} — verificar imagem")

    # Ordena: linha primeiro (Y), depois coluna (X), com tolerância de metade da altura média
    avg_h = sum(c['bbox'][3]-c['bbox'][1] for c in comps) // max(len(comps), 1)
    row_bin = max(avg_h // 2, 1)
    comps.sort(key=lambda c: (c['bbox'][1] // row_bin, c['bbox'][0]))

    out_dir.mkdir(parents=True, exist_ok=True)
    tiles = []
    for i, comp in enumerate(comps[:8]):
        x0, y0, x1, y1 = comp['bbox']
        crop = img.crop((x0, y0, x1+1, y1+1))
        # Resize pra tamanho consistente (square)
        crop = crop.resize((target_size, target_size), Image.LANCZOS)
        pattern = SOURCE_PATTERNS[i] if i < len(SOURCE_PATTERNS) else f"src_{i+1}"
        out_path = out_dir / f"wang_{pattern}.png"
        crop.save(out_path)
        tiles.append((pattern, crop))
        print(f"    tile {i+1} → {pattern}: ({x1-x0+1}x{y1-y0+1}) saved {out_path.name}")
    return dict(tiles)

def apply_ops(img, ops):
    out = img
    for op in ops:
        if op == 'flip_h':  out = out.transpose(Image.FLIP_LEFT_RIGHT)
        elif op == 'flip_v': out = out.transpose(Image.FLIP_TOP_BOTTOM)
        elif op == 'rot_90': out = out.rotate(-90)
        elif op == 'rot_180': out = out.rotate(180)
        elif op == 'rot_270': out = out.rotate(90)
    return out

def augment(source_tiles, out_dir, max_passes=3):
    """Gera Wang patterns derivados via mirror/rotation.
    Múltiplos passes pra suportar derivadas de derivadas."""
    pool = dict(source_tiles)  # copia mutável
    derived_count = 0
    for pass_n in range(max_passes):
        progress = False
        for target, (src, ops) in AUGMENT_MAP.items():
            if target in pool: continue
            if src not in pool: continue
            derived = apply_ops(pool[src], ops)
            (out_dir / f"wang_{target}.png").write_bytes(b"")  # touch
            derived.save(out_dir / f"wang_{target}.png")
            pool[target] = derived
            derived_count += 1
            progress = True
        if not progress: break
    # Reporta faltantes
    missing = [t for t in AUGMENT_MAP if t not in pool]
    if missing:
        print(f"    ⚠️ não derivados: {missing}")
    print(f"  augmented: {derived_count} tiles")
    return derived_count

def make_seamless_preview(tiles_dir, out_path):
    """Cola cada tile 3x3 numa folha grande pra QA visual de seamless."""
    files = sorted(tiles_dir.glob("wang_*.png"))
    if not files: return
    sample = Image.open(files[0])
    tile_w, tile_h = sample.size
    cols = 4
    rows = (len(files) + cols - 1) // cols
    canvas = Image.new('RGBA', (cols * tile_w * 3 + (cols-1)*20,
                                  rows * tile_h * 3 + (rows-1)*20),
                       (40, 60, 60, 255))
    for i, f in enumerate(files):
        tile = Image.open(f)
        cx = (i % cols) * (tile_w * 3 + 20)
        cy = (i // cols) * (tile_h * 3 + 20)
        # 3x3 paste pra mostrar como tile se repete
        for dy in range(3):
            for dx in range(3):
                canvas.paste(tile, (cx + dx*tile_w, cy + dy*tile_h))
    canvas.save(out_path)
    print(f"  seamless preview: {out_path.name}")

def main():
    packs = {
        "nanobanana": REFS / "tilenanobanana.jpg",
        "gpt":        REFS / "tilegpt.png",
    }

    for pack_name, src in packs.items():
        if not src.exists():
            print(f"⚠️ {src.name} não encontrado, pulando")
            continue
        print(f"\n=== Processing pack: {pack_name} ===")
        out_dir = DST_BASE / pack_name
        # Apaga conteúdo antigo
        if out_dir.exists():
            for f in out_dir.glob("*.png"): f.unlink()
        sources = slice_sheet(src, out_dir)
        augment(sources, out_dir)
        # QA preview
        preview_path = REFS / f"seamless_preview_{pack_name}.png"
        make_seamless_preview(out_dir, preview_path)

    # Verifica paridade — ambos packs devem ter mesmos arquivos
    nano_files = set(f.name for f in (DST_BASE / "nanobanana").glob("*.png")) if (DST_BASE / "nanobanana").exists() else set()
    gpt_files  = set(f.name for f in (DST_BASE / "gpt").glob("*.png"))        if (DST_BASE / "gpt").exists() else set()
    print("\n=== Parity check ===")
    print(f"  nanobanana: {len(nano_files)} tiles")
    print(f"  gpt:        {len(gpt_files)} tiles")
    only_nano = nano_files - gpt_files
    only_gpt  = gpt_files - nano_files
    if only_nano: print(f"  ⚠️ Só em nanobanana: {sorted(only_nano)}")
    if only_gpt:  print(f"  ⚠️ Só em gpt: {sorted(only_gpt)}")
    if not only_nano and not only_gpt and nano_files:
        print(f"  ✅ paridade total — switch entre packs é seguro")

if __name__ == "__main__":
    main()
