"""
wang_test_palette.py — gera 16 tiles Wang de teste, cada um cor sólida distinta,
pra validar o seletor antes de plugar tiles "de verdade" do PixelLab/Nano Banana.

Convenção cr31 (2-corner Wang, padrão da indústria):
    NE=1, SE=2, SW=4, NW=8     (1 = upper terrain present)
    index = soma dos pesos dos corners "upper" (0..15)

Saída:
    assets/terrain/test/wang_00.png .. wang_15.png   (tile_size 32)
    assets/terrain/test/_montage.png                 (4x4 grid p/ eyeball)
"""
from pathlib import Path
import colorsys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent.parent
DST = ROOT / "assets" / "terrain" / "test"
DST.mkdir(parents=True, exist_ok=True)

TILE = 32
HALF = TILE // 2

CORNER_BITS = {"NE": 1, "SE": 2, "SW": 4, "NW": 8}


def hsv_color(i, n=16, s=0.78, v=0.95):
    r, g, b = colorsys.hsv_to_rgb(i / n, s, v)
    return (int(r * 255), int(g * 255), int(b * 255))


def shade(rgb, factor):
    return tuple(max(0, min(255, int(c * factor))) for c in rgb)


def make_tile(idx, color):
    img = Image.new("RGBA", (TILE, TILE), color + (255,))
    draw = ImageDraw.Draw(img)
    quads = {
        "NW": (0, 0, HALF, HALF),
        "NE": (HALF, 0, TILE, HALF),
        "SW": (0, HALF, HALF, TILE),
        "SE": (HALF, HALF, TILE, TILE),
    }
    for name, box in quads.items():
        upper = bool(idx & CORNER_BITS[name])
        draw.rectangle(box, fill=shade(color, 1.18 if upper else 0.50))

    try:
        font = ImageFont.truetype("arial.ttf", 10)
    except OSError:
        font = ImageFont.load_default()
    txt = f"{idx:02d}"
    bbox = draw.textbbox((0, 0), txt, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = ((TILE - tw) // 2, (TILE - th) // 2 - 1)
    for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        draw.text((pos[0] + ox, pos[1] + oy), txt, fill=(0, 0, 0, 255), font=font)
    draw.text(pos, txt, fill=(255, 255, 255, 255), font=font)
    return img


def main():
    montage = Image.new("RGBA", (TILE * 4, TILE * 4), (40, 40, 40, 255))
    for i in range(16):
        color = hsv_color(i)
        tile = make_tile(i, color)
        out = DST / f"wang_{i:02d}.png"
        tile.save(out)
        montage.paste(tile, ((i % 4) * TILE, (i // 4) * TILE), tile)
        print(f"[ok] {out.relative_to(ROOT)}  rgb={color}")
    montage_path = DST / "_montage.png"
    montage.save(montage_path)
    print(f"\n[montage] {montage_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
