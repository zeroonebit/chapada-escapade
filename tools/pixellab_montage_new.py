"""Contact sheet dos 20 assets novos em _inbox/new_batch/"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "assets" / "pixel_labs" / "_inbox" / "new_batch"
OUT = ROOT / "assets" / "pixel_labs" / "_inbox" / "new_batch_sheet.png"

CELL = 220
COLS = 5
PAD = 10
LABEL_H = 28

def build():
    files = sorted(INBOX.glob("*.png"))
    n = len(files)
    if n == 0:
        print(f"Nada em {INBOX}")
        return
    rows = (n + COLS - 1) // COLS
    W = COLS * (CELL + PAD) + PAD
    H = rows * (CELL + LABEL_H + PAD) + PAD

    sheet = Image.new("RGB", (W, H), (16, 16, 16))
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
    except:
        font = ImageFont.load_default()

    for i, p in enumerate(files):
        r, c = divmod(i, COLS)
        x = PAD + c * (CELL + PAD)
        y = PAD + r * (CELL + LABEL_H + PAD)

        img = Image.open(p).convert("RGBA")
        img.thumbnail((CELL, CELL), Image.NEAREST)
        ix = x + (CELL - img.width) // 2
        iy = y + (CELL - img.height) // 2

        draw.rectangle([x, y, x+CELL, y+CELL], fill=(28,28,28))
        sheet.paste(img, (ix, iy), img)

        # Numero index gigante no topo esquerdo
        idx_str = p.stem.split("_")[0]
        draw.text((x+6, y+4), idx_str, fill=(255, 220, 120), font=font)

        # Hash curto embaixo
        hash_str = p.stem.split("_")[1] if "_" in p.stem else ""
        draw.rectangle([x, y+CELL, x+CELL, y+CELL+LABEL_H], fill=(40,40,40))
        draw.text((x+6, y+CELL+6), f"#{idx_str} {hash_str}", fill=(180,200,255), font=font)

    sheet.save(OUT)
    print(f"OK -> {OUT}  ({n} thumbs, {W}x{H}px)")

if __name__ == "__main__":
    build()
