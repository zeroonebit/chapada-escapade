"""
slice_hud_frames.py — extrai os frames GRAVITON e COMBUSTÍVEL de refs/hud-vazia.png
Salva PNGs transparentes em assets/ui/ substituindo as barras gradiente antigas.

A barra de fill (gradiente colorido) NÃO vem da imagem — é desenhada por código no
HUD pra ter cores customizadas (azul→roxo no graviton, amarelo→vermelho no combustível).
"""
import os
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(__file__).parent.parent / "refs" / "hud-vazia.png"
DST = Path(__file__).parent.parent / "assets" / "ui"

# Limiar pra distinguir background branco vs conteúdo (pontilhado conta como bg)
BG_THRESHOLD = 220

def find_components(mask):
    """Flood fill BFS. Retorna lista de (bbox, pixel_count)."""
    H, W = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components = []
    for y0 in range(H):
        for x0 in range(W):
            if not mask[y0, x0] or visited[y0, x0]:
                continue
            # BFS
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
            components.append(((min_x, min_y, max_x, max_y), count))
    return components

def main():
    img = Image.open(SRC).convert("RGB")
    arr = np.array(img)
    H, W = arr.shape[:2]
    print(f"input: {W}x{H}")

    # Mask: pixel é conteúdo se algum canal < threshold
    mask = (arr[:,:,0] < BG_THRESHOLD) | (arr[:,:,1] < BG_THRESHOLD) | (arr[:,:,2] < BG_THRESHOLD)
    print(f"content pixels: {mask.sum()} ({100*mask.sum()/(H*W):.1f}%)")

    print("finding components (pode demorar ~10s)...")
    comps = find_components(mask)
    comps.sort(key=lambda c: c[1], reverse=True)
    print(f"found {len(comps)} components")
    for i, (bbox, count) in enumerate(comps[:6]):
        x0,y0,x1,y1 = bbox
        print(f"  #{i}: bbox=({x0},{y0},{x1},{y1}) size={x1-x0+1}x{y1-y0+1} pixels={count}")

    # Os 2 maiores são GRAVITON e COMBUSTÍVEL.
    # COMBUSTÍVEL é mais largo; GRAVITON é mais estreito (mas ambos têm header).
    top2 = comps[:2]
    top2.sort(key=lambda c: c[0][2] - c[0][0])  # ordena por largura
    grav_bbox = top2[0][0]
    comb_bbox = top2[1][0]

    for name, bbox in [("graviton", grav_bbox), ("combustivel", comb_bbox)]:
        x0,y0,x1,y1 = bbox
        # Pad pra não cortar borda
        PAD = 4
        x0 = max(0, x0-PAD); y0 = max(0, y0-PAD)
        x1 = min(W-1, x1+PAD); y1 = min(H-1, y1+PAD)
        crop = arr[y0:y1+1, x0:x1+1]
        # Cria RGBA: alpha = 255 onde não é branco, com fade suave
        ch, cw = crop.shape[:2]
        rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
        rgba[:,:,:3] = crop
        # Alpha baseado em "quão escuro" — branco puro = 0, qualquer não-branco = 255
        # Suaviza a borda: usa o canal mais escuro pra calcular
        darkest = crop.min(axis=2)
        rgba[:,:,3] = np.where(darkest < BG_THRESHOLD, 255, 0)
        out = Image.fromarray(rgba, "RGBA")
        out_path = DST / f"hud_frame_{name}.png"
        out.save(out_path)
        print(f"saved {out_path.name}: {cw}x{ch}")

if __name__ == "__main__":
    main()
