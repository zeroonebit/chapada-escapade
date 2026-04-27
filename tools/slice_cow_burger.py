"""
slice_cow_burger.py — extrai os boxes COWS e BURGERS de refs/cow-burgers.png
A imagem já tem alpha (background transparente), então detecto componentes por alpha>0
e ignoro os tufos de grama na borda inferior (componentes pequenos).
"""
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).parent.parent / "refs" / "cow-burgers.png"
DST = Path(__file__).parent.parent / "assets" / "ui"

ALPHA_THRESHOLD = 30
MIN_COMPONENT_PIXELS = 2000  # ignora tufos pequenos

def find_components(mask):
    H, W = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components = []
    for y0 in range(H):
        for x0 in range(W):
            if not mask[y0, x0] or visited[y0, x0]:
                continue
            stack = [(y0, x0)]
            min_x, min_y = x0, y0
            max_x, max_y = x0, y0
            count = 0
            while stack:
                y, x = stack.pop()
                if y < 0 or y >= H or x < 0 or x >= W: continue
                if visited[y, x] or not mask[y, x]: continue
                visited[y, x] = True
                count += 1
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                stack.extend([(y+1,x),(y-1,x),(y,x+1),(y,x-1)])
            if count >= MIN_COMPONENT_PIXELS:
                components.append(((min_x, min_y, max_x, max_y), count))
    return components

def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img)
    H, W = arr.shape[:2]
    print(f"input: {W}x{H}")

    # Detecta INTERIOR escuro dos boxes (sum RGB < 80 = preto/quase-preto)
    rgb_sum = arr[:,:,:3].astype(int).sum(axis=2)
    mask = rgb_sum < 80
    print(f"dark interior pixels: {mask.sum()} ({100*mask.sum()/(H*W):.1f}%)")

    comps = find_components(mask)
    comps.sort(key=lambda c: c[1], reverse=True)
    print(f"found {len(comps)} components (>= {MIN_COMPONENT_PIXELS}px)")
    for i, (bbox, count) in enumerate(comps[:4]):
        x0,y0,x1,y1 = bbox
        print(f"  #{i}: bbox=({x0},{y0},{x1},{y1}) size={x1-x0+1}x{y1-y0+1} pixels={count}")

    # Pega top 2 e ordena por X (esquerda = COWS, direita = BURGERS)
    top2 = comps[:2]
    top2.sort(key=lambda c: c[0][0])
    names = ["cows", "burgers"]

    for name, (bbox, _) in zip(names, top2):
        x0,y0,x1,y1 = bbox
        # Expande pra incluir header tab (em cima) + borda verde dos lados/baixo
        x0 = max(0, x0-6); x1 = min(W-1, x1+6)
        y0 = max(0, y0-22); y1 = min(H-1, y1+6)
        crop = arr[y0:y1+1, x0:x1+1].copy()
        # Remove o background verde — fica só o box (alpha=0 no que era bg)
        rgb_sum = crop[:,:,:3].astype(int).sum(axis=2)
        # bg verde tem r+g+b ≈ 122+157+55 = 334; dark interior < 80; border verde tem rgb_sum maior que 200 mas é dentro do box
        # Estratégia: alpha=255 nos pixels do componente (dark) E adjacentes (borda do box)
        # Simpler: torna transparente onde for parecido com o bg verde detectado
        bg = np.array([122, 157, 55])
        diff_bg = np.abs(crop[:,:,:3].astype(int) - bg).sum(axis=2)
        crop[:,:,3] = np.where(diff_bg < 60, 0, 255)
        out = Image.fromarray(crop, "RGBA")
        out_path = DST / f"hud_{name}_box.png"
        out.save(out_path)
        print(f"saved {out_path.name}: {crop.shape[1]}x{crop.shape[0]}")

if __name__ == "__main__":
    main()
