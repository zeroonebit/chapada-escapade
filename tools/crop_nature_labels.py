"""
Detecta automaticamente o label band no rodapé de cada PNG nature
(linha de pixels totalmente transparente seguida de mais conteúdo = banda de texto)
e crop fora.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
NATURE = ROOT / "assets" / "pixel_labs" / "chars" / "nature"

def find_label_top(img_arr):
    """Encontra y onde o label começa (gap transparente entre conteúdo e label)."""
    H, W = img_arr.shape[:2]
    if img_arr.shape[2] < 4: return H
    alpha_per_row = img_arr[:, :, 3].sum(axis=1)
    thr = W * 255 * 0.01
    # Procura de baixo pra cima: pula linhas vazias do final
    y = H - 1
    while y >= 0 and alpha_per_row[y] < thr: y -= 1
    bottom_content_end = y
    # Acha gap acima desse conteúdo
    while y >= 0 and alpha_per_row[y] >= thr: y -= 1
    bottom_block_top = y + 1
    # Se há um gap acima, isso é provavelmente o label
    while y >= 0 and alpha_per_row[y] < thr: y -= 1
    upper_content_end = y
    # Se há conteúdo acima do gap = label band confirmada
    if upper_content_end >= 0 and bottom_block_top > upper_content_end + 2:
        return upper_content_end + 1  # crop a partir daqui
    return H  # sem label detectado

def crop_one(path):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    cut = find_label_top(arr)
    if cut >= arr.shape[0]:
        return False, "no label"
    cropped = im.crop((0, 0, im.width, cut))
    cropped.save(path)
    return True, f"{im.height} -> {cut}"

if __name__ == "__main__":
    total, cropped, skipped = 0, 0, 0
    for cat_dir in sorted(NATURE.iterdir()):
        if not cat_dir.is_dir(): continue
        for png in sorted(cat_dir.glob("*.png")):
            total += 1
            ok, msg = crop_one(png)
            tag = "✂" if ok else "·"
            print(f"  {tag} {cat_dir.name}/{png.name:35s} {msg}")
            if ok: cropped += 1
            else: skipped += 1
    print(f"\n{cropped}/{total} cropped, {skipped} skipped")
