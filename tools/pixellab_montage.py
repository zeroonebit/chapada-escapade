"""
Gera contact sheet de assets/pixel_labs/_inbox/nature/<cat>/
pra facilitar identificação visual.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "nature"
OUT = ROOT / "assets" / "pixel_labs" / "_inbox" / "_contact_sheet.png"

CELL = 200       # tamanho de cada thumbnail
COLS = 6
PAD = 8
LABEL_H = 30

def build():
    cats = ["cercas", "cactus", "geral"]
    files = []
    for cat in cats:
        d = INBOX / cat
        if not d.exists(): continue
        for p in sorted(d.glob("*.png")):
            files.append((cat, p))

    n = len(files)
    rows = (n + COLS - 1) // COLS
    W = COLS * (CELL + PAD) + PAD
    H = rows * (CELL + LABEL_H + PAD) + PAD

    sheet = Image.new("RGB", (W, H), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()

    for i, (cat, p) in enumerate(files):
        r, c = divmod(i, COLS)
        x = PAD + c * (CELL + PAD)
        y = PAD + r * (CELL + LABEL_H + PAD)

        img = Image.open(p).convert("RGBA")
        # Fit dentro de CELL preservando aspect
        img.thumbnail((CELL, CELL), Image.NEAREST)
        ix = x + (CELL - img.width) // 2
        iy = y + (CELL - img.height) // 2

        # Background do tile
        draw.rectangle([x, y, x+CELL, y+CELL], fill=(28,28,28))
        sheet.paste(img, (ix, iy), img if img.mode == "RGBA" else None)

        label = f"[{cat[0].upper()}] {p.stem}"
        draw.rectangle([x, y+CELL, x+CELL, y+CELL+LABEL_H], fill=(40,40,40))
        draw.text((x+6, y+CELL+6), label, fill=(180,220,200), font=font)

    sheet.save(OUT)
    print(f"Contact sheet: {OUT}  ({n} items, {COLS}x{rows})")

if __name__ == "__main__":
    build()
