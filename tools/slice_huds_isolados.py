"""
Slica refs/huds isolados.png em frames separados (graviton + combustivel)
e cria versão "frame-only" mascarando o fill colorido (interior).
Output em assets/pixel_labs/hud/.
"""
from PIL import Image
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC  = ROOT.parent.parent.parent / "refs" / "huds isolados.png"
OUT  = ROOT / "assets" / "pixel_labs" / "hud"

# Coords detectadas via análise: graviton 252-424, combustivel 480-640
# Cols: 335-1179
GRAVITON_BBOX    = (300, 240, 1200, 440)   # left, top, right, bottom (com margem)
COMBUSTIVEL_BBOX = (300, 470, 1200, 660)

def slice_bar(bbox, name):
    img = Image.open(SRC).convert("RGBA")
    crop = img.crop(bbox)
    arr = np.array(crop)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    # Considera "fundo" o branco/cinza claro -> alpha 0
    is_bg = (r > 240) & (g > 240) & (b > 240)
    arr[is_bg, 3] = 0
    Image.fromarray(arr).save(OUT / f"{name}_full.png")
    print(f"OK {name}_full.png ({crop.size})")

    # Frame-only: tornar transparente o miolo colorido (fill).
    # Detecta cores saturadas (azul/roxo/vermelho/amarelo) e aplica alpha 0
    arr2 = np.array(crop)
    r2, g2, b2, a2 = arr2[:,:,0], arr2[:,:,1], arr2[:,:,2], arr2[:,:,3]
    is_bg2 = (r2 > 240) & (g2 > 240) & (b2 > 240)
    arr2[is_bg2, 3] = 0
    # Identifica fill: pixels com alta saturacao colorida (max-min > 80)
    rgb = arr2[:,:,:3].astype(np.int32)
    cmax = rgb.max(axis=2)
    cmin = rgb.min(axis=2)
    sat = cmax - cmin
    is_fill = (sat > 80) & (a2 > 100) & ~is_bg2
    arr2[is_fill, 3] = 0
    Image.fromarray(arr2).save(OUT / f"{name}_frame.png")
    print(f"OK {name}_frame.png (frame-only)")

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    slice_bar(GRAVITON_BBOX,    "graviton")
    slice_bar(COMBUSTIVEL_BBOX, "combustivel")
    print(f"\nOut: {OUT}")
