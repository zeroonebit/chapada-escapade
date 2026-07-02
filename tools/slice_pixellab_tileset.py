"""
slice_pixellab_tileset.py — Baixa tilesheet do PixelLab e sliceia em 16 PNGs wang.

Uso:
    python tools/slice_pixellab_tileset.py <tileset_id> <styleKey> [--tile-size 16]

Exemplo:
    python tools/slice_pixellab_tileset.py 267836d8-f211-4260-8917-938216d7e0f1 mapa1_dirt_grass

O tilesheet PixelLab é um grid 4×4 de tiles, row-major (top-left → bottom-right).
Salva cada tile como assets/terrain/<styleKey>/wang_NN.png (00..15).
"""
import sys
import urllib.request
from pathlib import Path
from PIL import Image
from io import BytesIO

ROOT = Path(__file__).parent.parent
DST_BASE = ROOT / "assets" / "terrain"

API_BASE = "https://api.pixellab.ai/mcp/tilesets"


def fetch_tilesheet(tileset_id):
    url = f"{API_BASE}/{tileset_id}/image"
    print(f"  GET {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            print(f"  downloaded {len(data)} bytes")
            return Image.open(BytesIO(data)).convert("RGBA")
    except urllib.error.HTTPError as e:
        print(f"  ERROR {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None


def fetch_metadata(tileset_id):
    url = f"{API_BASE}/{tileset_id}/metadata"
    print(f"  GET {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            import json
            return json.loads(resp.read())
    except Exception as e:
        print(f"  metadata skip: {e}")
        return None


def slice_grid(img, out_dir, expected_tile_size=None):
    w, h = img.size
    cols = 4
    rows = 4
    tw = w // cols
    th = h // rows

    if expected_tile_size and tw != expected_tile_size:
        print(f"  WARN: detected tile {tw}×{th}, expected {expected_tile_size}×{expected_tile_size}")

    print(f"  tilesheet {w}×{h} → {cols}×{rows} grid, tile {tw}×{th}")

    out_dir.mkdir(parents=True, exist_ok=True)
    for idx in range(16):
        col = idx % cols
        row = idx // cols
        x0 = col * tw
        y0 = row * th
        tile = img.crop((x0, y0, x0 + tw, y0 + th))
        out_path = out_dir / f"wang_{idx:02d}.png"
        tile.save(out_path)

    print(f"  saved 16 tiles in {out_dir}")
    return tw


TILESETS = {
    "mapa1_dirt_grass": {
        "id": "267836d8-f211-4260-8917-938216d7e0f1",
        "biome": "cerrado-verde",
        "season": "chuva",
        "name": "[MAPA 1] dirt ↔ grass cerrado",
        "meta": "PixelLab · 16×16 · BASE tileset",
        "tileSize": 16,
        "info": "BASE dirt↔grass pra mapa1 (cerrado verde).",
    },
    "mapa2_dirt_grass": {
        "id": "5398c10b-52b2-45b3-b6ab-dac141249b1f",
        "biome": "cerrado-seco",
        "season": "seca",
        "name": "[MAPA 2] dirt ↔ grass cerrado v2",
        "meta": "PixelLab · 16×16 · BASE tileset",
        "tileSize": 16,
        "info": "BASE dirt↔grass pra mapa2 (cerrado seco).",
    },
    "shared_ocean_sand_16": {
        "id": "2640e1f9-1e20-464d-b4ca-f700357733ee",
        "biome": "costa",
        "season": "universal",
        "name": "[SHARED 16px] ocean ↔ sand",
        "meta": "PixelLab · 16×16 · shared cross-mapas",
        "tileSize": 16,
        "info": "Versão 16px do ocean↔sand (shared entre mapa1 e mapa2).",
    },
}


def main():
    if len(sys.argv) < 2:
        print("Uso: python tools/slice_pixellab_tileset.py <styleKey|tileset_id> [styleKey] [--tile-size N]")
        print(f"\nPresets conhecidos: {', '.join(TILESETS.keys())}")
        print("\nOu: python tools/slice_pixellab_tileset.py --all")
        sys.exit(1)

    tile_size_override = None
    if "--tile-size" in sys.argv:
        idx = sys.argv.index("--tile-size")
        tile_size_override = int(sys.argv[idx + 1])
        sys.argv.pop(idx)
        sys.argv.pop(idx)

    if sys.argv[1] == "--all":
        targets = list(TILESETS.keys())
    elif sys.argv[1] in TILESETS:
        targets = [sys.argv[1]]
    else:
        tileset_id = sys.argv[1]
        style_key = sys.argv[2] if len(sys.argv) > 2 else tileset_id[:8]
        targets = [None]
        TILESETS["_cli"] = {"id": tileset_id}

    results = {"ok": [], "fail": []}

    for key in targets if targets[0] is not None else ["_cli"]:
        cfg = TILESETS[key]
        style_key = key if key != "_cli" else (sys.argv[2] if len(sys.argv) > 2 else cfg["id"][:8])
        tileset_id = cfg["id"]
        expected = tile_size_override or cfg.get("tileSize")

        print(f"\n=== {style_key} ({tileset_id}) ===")

        meta = fetch_metadata(tileset_id)
        if meta:
            print(f"  metadata: {meta.get('name', '?')} — {meta.get('tileSize', '?')}px")

        img = fetch_tilesheet(tileset_id)
        if img is None:
            print(f"  SKIP — download failed")
            results["fail"].append(style_key)
            continue

        out_dir = DST_BASE / style_key
        actual_size = slice_grid(img, out_dir, expected)
        results["ok"].append((style_key, actual_size))

    print(f"\n=== Summary ===")
    for key, size in results["ok"]:
        print(f"  ✅ {key} — {size}px tiles")
    for key in results["fail"]:
        print(f"  ❌ {key} — failed")


if __name__ == "__main__":
    main()
