#!/usr/bin/env python
"""
pack_atlas.py — Empacota frames PNG individuais em sprite atlases Phaser-compatíveis.

Por que: 880+ PNGs individuais no boot causam 60-90s de latência cumulativa no
GitHub Pages. Empacotar em ~5-8 atlases reduz pra ~5-10s.

Output:
  assets/atlases/<name>.png        # imagem única com todos frames
  assets/atlases/<name>.json       # mapa Phaser-style (texturepacker JSONHash)
  + roda pngquant + oxipng no PNG final pra economizar bytes

Uso:
  python tools/pack_atlas.py                # roda todos os configs
  python tools/pack_atlas.py cow            # só atlas 'cow'
  python tools/pack_atlas.py --no-compress  # pula pngquant/oxipng (testing rápido)

JSON output (formato Phaser JSONHash):
  {
    "frames": {
      "walk_S_0": { "frame": {"x":0,"y":0,"w":92,"h":92}, ... },
      ...
    },
    "meta": {"image":"cow.png","size":{"w":512,"h":512},"scale":"1"}
  }

Convenção de framenames:
  - Static dirs: '<dir>'              ex: 'S', 'NE'
  - Anims: '<animname>_<dir>_<i>'     ex: 'walk_S_0', 'idle_head_shake_NE_3'
"""
import argparse
import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PIXEL_LABS = ASSETS / "pixel_labs" / "chars"
ATLAS_DIR = ASSETS / "atlases"
ATLAS_DIR.mkdir(parents=True, exist_ok=True)

# Configs de atlases. Tipos:
#   'char'  → 8-dir + anims (cow/ox/farmer/ufo). Static dirs + anim frames.
#   'flat'  → lista de PNGs avulsos, framename = key esperado pelo Phaser.
#             Suporta 'files' (lista direta) ou 'groups' (subdirs por prefix).
ATLASES = {
    "cow": {
        "char_dir": "cow",
        "dirs8": ["S","E","N","W","SE","NE","NW","SW"],
        "static_pattern": "{dir_long}.png",
        "static_keys": "cow_{D}",                       # framename: cow_S, cow_E, ...
        "anims": [
            # (anim_folder_no_disco,  framename_prefix_in_atlas,  frame_count,  dirs_override)
            ("walk",            "cow_walk",   4,  None),
            ("idle_head_shake", "cow_eat",    11, None),
            ("lie_down",        "cow_angry",  8,  None),
        ],
    },
    # Pig (parity Bevy CowKind::Pig): 10% do rebanho, entrega = tanque cheio.
    # Arte copiada de Bevy/assets/textures/chars/pig — só eat + walk (sem
    # lie_down: abduzido também toca eat, igual ao Bevy).
    "pig": {
        "char_dir": "pig",
        "dirs8": ["S","E","N","W","SE","NE","NW","SW"],
        "static_pattern": "{dir_long}.png",
        "static_keys": "pig_{D}",
        "anims": [
            ("walk", "pig_walk", 4,  None),
            ("eat",  "pig_eat",  11, None),
        ],
    },
    "ox": {
        "char_dir": "ox",
        "dirs8": ["S","E","N","W","SE","NE","NW","SW"],
        "static_pattern": "{dir_long}.png",
        "static_keys": "ox_{D}",
        "anims": [
            ("walk",            "ox_walk",    4,  None),
            ("idle_head_shake", "ox_idle",    11, ["S","E","W","SE","NE","NW","SW"]),
        ],
    },
    "farmer": {
        "char_dir": "farmer",
        "dirs8": ["S","E","N","W","SE","NE","NW","SW"],
        "static_pattern": "{dir_long}.png",
        "static_keys": "farmer_{D}",
        "anims": [
            ("running", "farmer_run", 4, None),
        ],
    },
    "ufo": {
        "char_dir": "ufo",
        "dirs8": ["S","E","N","W","SE","NE","NW","SW"],
        "static_pattern": "{dir_long}.png",
        "static_keys": "ufo_{D}",
        "anims": [
            ("hovering_idle", "ufo_hover", 4, None),
        ],
    },
    # ── HUD atlas — score boxes + small bars + radar (10 PNGs ~200-700 wide).
    # NÃO inclui os 4 PNGs gigantes 1536x1024 (combined bars) — esses ficam
    # individuais (atlas com eles desperdiçaria 90% do espaço).
    "hud": {
        "type": "flat",
        "files": [
            ("pixel_labs/hud/score_v2.png",     "hud_score_v2"),
            ("pixel_labs/hud/burgers_v2.png",   "hud_burgers_v2"),
            ("pixel_labs/hud/cows_v2.png",      "hud_cows_v2"),
            ("pixel_labs/hud/bulls_v2.png",     "hud_bulls_v2"),
            ("pixel_labs/hud/farmers_v2.png",   "hud_farmers_v2"),
            ("pixel_labs/hud/shooters_v2.png",  "hud_shooters_v2"),
            ("pixel_labs/hud/combustivel_v2.png","hud_comb_v2"),
            ("pixel_labs/hud/graviton_v2.png",  "hud_grav_v2"),
            ("pixel_labs/hud/radar_dome_v2.png","hud_radar_dome_v2"),
            ("pixel_labs/hud/radar_ring_v2.png","hud_radar_ring_v2"),
        ],
    },
    # ── Nature atlas — rocks + vegetation + fences + misc + objects (~55 PNGs).
    # Mistura tamanhos (64x64 a 200x200) mas todos sub-200, então grid eficiente.
    "nature": {
        "type": "flat",
        "groups": [
            # (subdir, key_prefix)  — auto-coleta todos *.png
            ("env/rocks",       "nat_rock"),
            ("env/vegetation",  "nat_veg"),
            ("env/fences",      "nat_fence"),
            ("env/fences_v2",   "nat_fence"),  # mesmo prefix nat_fence (v2 sobrescreve v1)
            ("env/misc",        "nat_misc"),
            ("env/objects",     "nat_obj"),
        ],
    },
    # ── Mecha atlas — scarecrow droids 3 cores × 8-dir + torpedo 8 frames.
    # Sliced desde 2026-04-30 (handoff), wired no F2 do backport Bevy.
    # Framenames: mecha_blue_S, mecha_red_NE… + missile_frame_00..07
    "mecha": {
        "type": "flat",
        "groups": [
            ("pixel_labs/chars/scarecrow_droid/blue",         "mecha_blue"),
            ("pixel_labs/chars/scarecrow_droid/red",          "mecha_red"),
            ("pixel_labs/chars/scarecrow_droid/green",        "mecha_green"),
            ("pixel_labs/chars/scarecrow_droid/missile_anim", "missile"),
        ],
    },
    # ── Items atlas — 3 variantes de burger.
    "items": {
        "type": "flat",
        "files": [
            ("pixel_labs/items/burger_classic.png", "burger_classic"),
            ("pixel_labs/items/burger_cheese.png",  "burger_cheese"),
            ("pixel_labs/items/burger_double.png",  "burger_double"),
        ],
    },
}

# Map dir-short → dir-long (filename na pasta pixel_labs)
DIR_LONG = {
    "S":"south","E":"east","N":"north","W":"west",
    "SE":"south-east","NE":"north-east","NW":"north-west","SW":"south-west",
}


def collect_frames(cfg):
    """Retorna lista de (framename, PIL.Image) pra todos sprites do atlas."""
    if cfg.get("type") == "flat":
        return collect_frames_flat(cfg)
    return collect_frames_char(cfg)


def collect_frames_char(cfg):
    """Char atlas — static dirs + anims via folder structure."""
    base = PIXEL_LABS / cfg["char_dir"]
    frames = []
    for d in cfg["dirs8"]:
        path = base / cfg["static_pattern"].format(dir_long=DIR_LONG[d])
        if not path.exists():
            print(f"  WARN: missing static {path}", file=sys.stderr)
            continue
        framename = cfg["static_keys"].format(D=d)
        frames.append((framename, Image.open(path).convert("RGBA")))

    for anim_folder, prefix, count, dirs_override in cfg["anims"]:
        dirs = dirs_override or cfg["dirs8"]
        for d in dirs:
            for i in range(count):
                fname = f"frame_{i:03d}.png"
                path = base / "anims" / anim_folder / d / fname
                if not path.exists():
                    print(f"  WARN: missing anim {path}", file=sys.stderr)
                    continue
                framename = f"{prefix}_{d}_{i}"
                frames.append((framename, Image.open(path).convert("RGBA")))
    return frames


def collect_frames_flat(cfg):
    """Flat atlas — lista de PNGs avulsos, ou auto-coleta de subdirs com prefix."""
    frames = []

    # Modo 1: lista explícita de (relpath, framename)
    for relpath, framename in cfg.get("files", []):
        path = ASSETS / relpath
        if not path.exists():
            print(f"  WARN: missing {path}", file=sys.stderr)
            continue
        frames.append((framename, Image.open(path).convert("RGBA")))

    # Modo 2: auto-coleta por subdir; framename = "<prefix>_<basename_sem_ext>"
    for subdir, prefix in cfg.get("groups", []):
        d = ASSETS / subdir
        if not d.exists():
            print(f"  WARN: missing dir {d}", file=sys.stderr)
            continue
        for png in sorted(d.glob("*.png")):
            framename = f"{prefix}_{png.stem}"
            frames.append((framename, Image.open(png).convert("RGBA")))

    return frames


def pack_atlas(frames, padding=2):
    """Empacota frames numa grid retangular. Retorna (atlas_image, frames_meta)."""
    if not frames:
        raise ValueError("no frames to pack")

    # Tamanho máximo individual (todos frames mesmo char têm dim parecida)
    max_w = max(img.width for _, img in frames)
    max_h = max(img.height for _, img in frames)
    cell_w = max_w + padding
    cell_h = max_h + padding

    # Grid quadrada (potência de 2 para GPU friendly)
    n = len(frames)
    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)

    atlas_w = cols * cell_w
    atlas_h = rows * cell_h
    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))

    frames_meta = {}
    for idx, (name, img) in enumerate(frames):
        col = idx % cols
        row = idx // cols
        x = col * cell_w
        y = row * cell_h
        atlas.paste(img, (x, y))
        frames_meta[name] = {
            "frame": {"x": x, "y": y, "w": img.width, "h": img.height},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": img.width, "h": img.height},
            "sourceSize": {"w": img.width, "h": img.height},
        }

    return atlas, frames_meta, atlas_w, atlas_h


def compress_png(path):
    """Roda pngquant (lossy) + oxipng (lossless) no PNG. Mantem extensão."""
    if not shutil.which("pngquant"):
        print("  skip pngquant (not installed)")
    else:
        # --quality=80-95: lossy mas visualmente idêntico em pixel art
        # --speed 1: lento mas melhor compressão
        # --strip: remove metadata
        # --skip-if-larger: não substitui se ficar maior
        # --force --output: sobrescreve
        out = subprocess.run([
            "pngquant",
            "--quality=80-95",
            "--speed", "1",
            "--strip",
            "--skip-if-larger",
            "--force",
            "--output", str(path),
            str(path),
        ], capture_output=True)
        if out.returncode not in (0, 99):  # 99 = skipped (size larger)
            print(f"  pngquant warn: {out.stderr.decode()[:200]}")

    if not shutil.which("oxipng"):
        print("  skip oxipng (not installed)")
    else:
        # -o6: max optimization (slow), --strip safe: remove non-essential metadata
        subprocess.run([
            "oxipng", "-o", "6", "--strip", "safe", "--quiet",
            str(path),
        ], capture_output=True)


def build_atlas(name, cfg, do_compress=True):
    print(f"\n=== Building atlas: {name} ===")
    frames = collect_frames(cfg)
    if not frames:
        print(f"  ERROR: no frames collected for {name}")
        return None

    print(f"  collected {len(frames)} frames")
    atlas, frames_meta, w, h = pack_atlas(frames)

    png_path = ATLAS_DIR / f"{name}.png"
    json_path = ATLAS_DIR / f"{name}.json"

    atlas.save(png_path, "PNG", optimize=True)
    raw_size = png_path.stat().st_size

    json_data = {
        "frames": frames_meta,
        "meta": {
            "app": "tools/pack_atlas.py",
            "image": f"{name}.png",
            "format": "RGBA8888",
            "size": {"w": w, "h": h},
            "scale": "1",
        },
    }
    with open(json_path, "w") as f:
        json.dump(json_data, f, separators=(",", ":"))

    if do_compress:
        compress_png(png_path)
        compressed_size = png_path.stat().st_size
        savings = (1 - compressed_size / raw_size) * 100
        print(f"  PNG: {raw_size:,}b -> {compressed_size:,}b (-{savings:.1f}%)")
    else:
        print(f"  PNG: {raw_size:,}b (no compress)")

    print(f"  Atlas: {w}x{h}, {len(frames)} frames -> {png_path.relative_to(ROOT)}")
    return name


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", help="Atlas names to build (default: all)")
    ap.add_argument("--no-compress", action="store_true", help="Skip pngquant/oxipng")
    args = ap.parse_args()

    names = args.names or list(ATLASES.keys())
    built = []
    for name in names:
        if name not in ATLASES:
            print(f"unknown atlas: {name}", file=sys.stderr)
            continue
        result = build_atlas(name, ATLASES[name], do_compress=not args.no_compress)
        if result:
            built.append(result)

    print(f"\nDone. Built {len(built)} atlas(es): {', '.join(built)}")


if __name__ == "__main__":
    main()
