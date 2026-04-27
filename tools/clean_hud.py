"""
clean_hud.py — Limpa dígitos placeholder dos frames de HUD.

  hud_score_frame.png  : apaga "12988"  (preserva frame + label "SCORE")
  hud_burger_frame.png : apaga "5"      (preserva frame, "BURGER", ícone)
  Deleta: hud_barra_frame.png  e  hud_lvl_badge.png

Uso:
  python tools/clean_hud.py
"""

import numpy as np
from PIL import Image
from pathlib import Path

UI = Path(__file__).parent.parent / "assets" / "ui"

# Interior escuro dos frames — quasi-preto, hardcoded
# (bordas são verde-brilhante; qualquer pixel mais brilhante que min_brightness
#  dentro da região de dígito É texto — substituímos pelo escuro)
DARK_BG = np.array([9, 16, 9], dtype=np.uint8)


def clean_region(arr, y0_f, y1_f, x0_f, x1_f, min_brightness=55):
    """
    Substitui por DARK_BG todo pixel com luminosidade > min_brightness
    na região (y0_f..y1_f, x0_f..x1_f) em frações da imagem.
    """
    h, w = arr.shape[:2]
    y0, y1 = int(h * y0_f), int(h * y1_f)
    x0, x1 = int(w * x0_f), int(w * x1_f)
    count = 0
    for y in range(y0, y1):
        for x in range(x0, x1):
            px = arr[y, x]
            if int(px[3]) < 100:
                continue
            if max(int(px[0]), int(px[1]), int(px[2])) > min_brightness:
                arr[y, x, :3] = DARK_BG
                count += 1
    return count


# ── hud_score_frame.png ───────────────────────────────────────────────────────
# "SCORE" no header (top ~28%) — limpar de 30% pra baixo, dentro das bordas
path = UI / "hud_score_frame.png"
img  = Image.open(path).convert("RGBA")
arr  = np.array(img, dtype=np.uint8)

n = clean_region(arr, 0.30, 0.94, 0.04, 0.96, min_brightness=12)
Image.fromarray(arr).save(path)
print(f"✅ score_frame : {n} px limpos")

# ── hud_burger_frame.png ──────────────────────────────────────────────────────
# "BURGER" no header, ícone à esquerda, "5" à direita
path = UI / "hud_burger_frame.png"
img  = Image.open(path).convert("RGBA")
arr  = np.array(img, dtype=np.uint8)

# Só metade direita, abaixo do header (preserva ícone do burger)
n = clean_region(arr, 0.28, 0.94, 0.53, 0.96, min_brightness=12)
Image.fromarray(arr).save(path)
print(f"✅ burger_frame: {n} px limpos")

# ── Deletar arquivos descontinuados ───────────────────────────────────────────
for fname in ["hud_barra_frame.png", "hud_lvl_badge.png"]:
    p = UI / fname
    if p.exists():
        p.unlink()
        print(f"🗑  Deletado: {fname}")
    else:
        print(f"⚠  Já deletado: {fname}")

print("\nDone.")
