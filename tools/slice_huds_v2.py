"""
Slica refs/slice_combustivel_192.png e slice_graviton_192.png em 2 PNGs cada:
- _full_v2.png: imagem original (fill bakeded)
- _empty_v2.png: fill area pintada de preto (mostra frame+label sem fill)

Detecta o fill via saturação alta (gradiente colorido vermelho/laranja ou azul/ciano/roxo).
Frame/borda: cinza/verde escuro saturação baixa.
"""
from PIL import Image
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFS = ROOT.parent.parent.parent / "refs"
OUT  = ROOT / "assets" / "pixel_labs" / "hud"

SOURCES = [
    ("slice_combustivel_192.png", "combustivel"),
    ("slice_graviton_192.png",    "graviton"),
]

def slice_bar(src_name, out_prefix):
    src = REFS / src_name
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

    # 1. Salva _full direto (apenas trim de fundo cinza fora do frame)
    # Detecta pixels do "fundo cinza" da imagem (cinza/verde claro neutro)
    # Pra simplificar mantém alpha original do PNG (já tem fundo cinza visível).
    # Vamos cortar a borda cinza usando bounding box do que NÃO é cinza neutro.
    rgb = arr[:,:,:3].astype(np.int32)
    cmax = rgb.max(axis=2)
    cmin = rgb.min(axis=2)
    sat  = cmax - cmin
    is_neutral_bg = (sat < 25) & (cmax > 100) & (cmax < 180)  # cinza médio
    is_content = ~is_neutral_bg
    rows = np.where(is_content.any(axis=1))[0]
    cols = np.where(is_content.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        print(f"FAIL {src_name}: nada detectado")
        return
    bbox = (cols.min(), rows.min(), cols.max()+1, rows.max()+1)
    cropped = img.crop(bbox)
    # Aplica alpha 0 ao fundo cinza dentro do crop pra ficar transparent
    crop_arr = np.array(cropped)
    crop_rgb = crop_arr[:,:,:3].astype(np.int32)
    crop_max = crop_rgb.max(axis=2)
    crop_min = crop_rgb.min(axis=2)
    crop_sat = crop_max - crop_min
    is_bg_crop = (crop_sat < 25) & (crop_max > 100) & (crop_max < 180)
    crop_arr[is_bg_crop, 3] = 0
    Image.fromarray(crop_arr).save(OUT / f"{out_prefix}_full_v2.png")
    print(f"OK {out_prefix}_full_v2.png ({cropped.size})")

    # 2. _empty_v2: pinta o fill area de PRETO mas mantém frame+label
    # Fill = pixels com saturação alta (gradiente colorido)
    arr2 = crop_arr.copy()
    a2 = arr2[:,:,3]
    crop_rgb2 = arr2[:,:,:3].astype(np.int32)
    cmax2 = crop_rgb2.max(axis=2)
    cmin2 = crop_rgb2.min(axis=2)
    sat2  = cmax2 - cmin2
    is_fill = (sat2 > 70) & (a2 > 100)  # saturação alta = fill colorido
    arr2[is_fill, 0] = 0
    arr2[is_fill, 1] = 0
    arr2[is_fill, 2] = 0
    arr2[is_fill, 3] = 255
    Image.fromarray(arr2).save(OUT / f"{out_prefix}_empty_v2.png")
    print(f"OK {out_prefix}_empty_v2.png (fill pintado preto)")

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for src, prefix in SOURCES:
        slice_bar(src, prefix)
    print(f"\nOut: {OUT}")
