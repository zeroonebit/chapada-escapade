"""Slice refs/hud scores nameless.png em 6 boxes individuais.
Layout: 2 cols x 3 rows, detectado via verde-brilhante (border).
Saves em assets/pixel_labs/hud/<name>_box_v2.png"""
from PIL import Image
import numpy as np

SRC = 'H:/Projects/ChapadaEscapade/refs/hud scores nameless.png'
DST_DIR = 'assets/pixel_labs/hud'

# Bboxes medidos via Pillow (gaps detectados em verde brilhante):
# Rows: 110-311, 381-578, 652-846 / Cols: 74-698, 781-1461
ROWS = [(110, 311), (381, 578), (652, 846)]
COLS = [(74, 698), (781, 1461)]

# Mapping (row, col) -> name
NAMES = {
    (0, 0): 'score_v2',     # empty box (top-left) — pontos
    (0, 1): 'burgers_v2',   # burger icon (top-right)
    (1, 0): 'cows_v2',      # cow icon (mid-left)
    (1, 1): 'oxen_v2',      # ox/bull icon (mid-right)
    (2, 0): 'farmers_v2',   # farmer icon (bottom-left)
    (2, 1): 'shooters_v2',  # scarecrow icon (bottom-right) — atiradores/torres
}

PAD = 4  # margem pra evitar clipping

img = Image.open(SRC).convert('RGBA')
W, H = img.size
arr = np.array(img)

# Pixels com algum conteudo (verde-borda OR não-fundo-checker)
r,g,b,a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
# Mask: nao-fundo (fundo transparente checker é alpha 255 com R~G~B claro)
content = (a > 30) & ~((r > 200) & (g > 200) & (b > 200))

for (ri, ci), name in NAMES.items():
    y0, y1 = ROWS[ri]
    x0, x1 = COLS[ci]
    # Refinar bbox dentro da grid cell pra pegar so o box (sem espaço extra)
    cell = content[y0:y1+1, x0:x1+1]
    rows_in = np.where(cell.any(axis=1))[0]
    cols_in = np.where(cell.any(axis=0))[0]
    if len(rows_in) == 0:
        print(f'SKIP {name}: cell vazia')
        continue
    yy0 = max(y0 + rows_in.min() - PAD, 0)
    yy1 = min(y0 + rows_in.max() + PAD, H - 1)
    xx0 = max(x0 + cols_in.min() - PAD, 0)
    xx1 = min(x0 + cols_in.max() + PAD, W - 1)
    cropped = img.crop((xx0, yy0, xx1+1, yy1+1))
    out = f'{DST_DIR}/{name}.png'
    cropped.save(out)
    print(f'OK {name}: {cropped.size} -> {out}')
