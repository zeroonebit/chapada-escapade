"""
wang_test_palette.py — gera 16 tiles Wang de teste com paleta TERROSA (Chapada).
Lower = areia/grama seca (claro), Upper = grama verde (médio).
Quadrantes intermediários usam mistura pra dar transição suave.

Convenção cr31 (2-corner Wang, padrão da indústria):
    NE=1, SE=2, SW=4, NW=8     (1 = upper terrain present)
    index = soma dos pesos dos corners "upper" (0..15)

Saída:
    assets/terrain/test/wang_00.png .. wang_15.png   (tile_size 32)
    assets/terrain/test/_montage.png                 (4x4 grid p/ eyeball)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent.parent
DST = ROOT / "assets" / "terrain" / "test"
DST.mkdir(parents=True, exist_ok=True)

TILE = 32
HALF = TILE // 2

CORNER_BITS = {"NE": 1, "SE": 2, "SW": 4, "NW": 8}

# Paleta terrosa Chapada — areia/seca → grama verde
LOWER = (201, 165, 116)  # areia bege quente (#c9a574)
UPPER = (110, 155,  58)  # grama verde média (#6e9b3a)

# Cores auxiliares pra grama-seca (transição). Mistura entre LOWER e UPPER por quadrante,
# mas o "core" de cada quadrante usa cor pura — bordas opcionalmente recebem dry-grass.
DRY_GRASS = (168, 149,  72)  # grama seca dourada (#a89548)


def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def make_tile(idx):
    img = Image.new("RGBA", (TILE, TILE), LOWER + (255,))
    draw = ImageDraw.Draw(img)
    quads = {
        "NW": (0, 0, HALF, HALF),
        "NE": (HALF, 0, TILE, HALF),
        "SW": (0, HALF, HALF, TILE),
        "SE": (HALF, HALF, TILE, TILE),
    }
    # Cor por quadrante: upper = grama verde, lower = areia
    for name, box in quads.items():
        upper = bool(idx & CORNER_BITS[name])
        col = UPPER if upper else LOWER
        draw.rectangle(box, fill=col)

    # Banda de "grama seca" 1px nas bordas entre quadrantes que misturam upper+lower
    # (suaviza visualmente a costura do Wang)
    for name, box in quads.items():
        upper = bool(idx & CORNER_BITS[name])
        # Procura vizinhos no mesmo tile que tenham bit oposto
        neighbors = {
            "NW": ["NE", "SW"], "NE": ["NW", "SE"],
            "SW": ["NW", "SE"], "SE": ["NE", "SW"],
        }
        for nb in neighbors[name]:
            nb_upper = bool(idx & CORNER_BITS[nb])
            if nb_upper == upper:
                continue
            # Desenha uma linha 1px na borda compartilhada com cor dry_grass
            x0, y0, x1, y1 = box
            blend = mix(LOWER, UPPER, 0.5) if (upper, nb_upper) != (False, False) else DRY_GRASS
            # Borda direita (compartilha com NE→SE etc)
            if name == "NW" and nb == "NE":
                draw.line([(x1-1, y0), (x1-1, y1-1)], fill=DRY_GRASS)
            elif name == "NW" and nb == "SW":
                draw.line([(x0, y1-1), (x1-1, y1-1)], fill=DRY_GRASS)
            elif name == "NE" and nb == "SE":
                draw.line([(x0, y1-1), (x1-1, y1-1)], fill=DRY_GRASS)
            elif name == "SW" and nb == "SE":
                draw.line([(x1-1, y0), (x1-1, y1-1)], fill=DRY_GRASS)

    return img


def main():
    montage = Image.new("RGBA", (TILE * 4, TILE * 4), (40, 40, 40, 255))
    for i in range(16):
        tile = make_tile(i)
        out = DST / f"wang_{i:02d}.png"
        tile.save(out)
        montage.paste(tile, ((i % 4) * TILE, (i // 4) * TILE), tile)
        print(f"[ok] {out.relative_to(ROOT)}")
    montage_path = DST / "_montage.png"
    montage.save(montage_path)
    print(f"\n[montage] {montage_path.relative_to(ROOT)}")
    print(f"\nPaleta: areia rgb{LOWER} → grama verde rgb{UPPER} (transição: dry rgb{DRY_GRASS})")


if __name__ == "__main__":
    main()
