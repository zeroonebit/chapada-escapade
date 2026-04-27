"""
preview_shaders.py — gera previews de duas direções de shader procedural pra terreno.
Aplica o mesmo algoritmo que rodaria no GLSL, em Python+PIL pra visualização.

Output:
  refs/preview_shader_A_natural.png    — fully procedural natural painterly
  refs/preview_shader_C_cellshaded.png — stylized cell-shaded ink + watercolor
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).parent.parent
OUT_DIR = ROOT / "refs"

# Resolução do preview (proporção do mapa do jogo: 3200x2400)
W, H = 1280, 960
COLS, ROWS = 40, 30
CELL_W = W / COLS
CELL_H = H / ROWS

# ── 1. Gera CA grid com pesos que mostram TODOS os terrenos ───────
np.random.seed(7)  # seed que dá boa distribuição
grid = np.zeros((ROWS, COLS), dtype=int)
for y in range(ROWS):
    for x in range(COLS):
        r = np.random.random()
        if r < 0.18:    grid[y][x] = 0  # água
        elif r < 0.40:  grid[y][x] = 1  # areia
        elif r < 0.72:  grid[y][x] = 2  # grama
        else:           grid[y][x] = 3  # terra

# Apenas 3 passes pra preservar variedade
for _ in range(3):
    nxt = grid.copy()
    for y in range(ROWS):
        for x in range(COLS):
            s, c = 0, 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y+dy, x+dx
                    if 0 <= ny < ROWS and 0 <= nx < COLS:
                        s += grid[ny][nx]; c += 1
            nxt[y][x] = round(s / c)
    grid = nxt

# ── 2. Simple value noise pra simular noise() do GLSL ────────────
def hash2(x, y):
    return (np.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1.0

def value_noise(x, y):
    xi, yi = np.floor(x), np.floor(y)
    xf, yf = x - xi, y - yi
    a = hash2(xi, yi); b = hash2(xi+1, yi)
    c = hash2(xi, yi+1); d = hash2(xi+1, yi+1)
    u = xf * xf * (3 - 2*xf)
    v = yf * yf * (3 - 2*yf)
    return a * (1-u) * (1-v) + b * u * (1-v) + c * (1-u) * v + d * u * v

def fbm(x, y, octaves=4):
    v, amp, freq = 0.0, 0.5, 1.0
    for _ in range(octaves):
        v += amp * value_noise(x*freq, y*freq)
        freq *= 2; amp *= 0.5
    return v

# Cores por terreno
COLORS = {
    'A': {  # natural painterly
        0: (58, 122, 160),   # água profunda
        1: (217, 201, 143),  # areia
        2: (130, 176, 72),   # grama
        3: (160, 104, 72),   # terra-roxa
    },
    'C': {  # cell-shaded ink+watercolor
        0: (45, 95, 130),    # água tinta saturada
        1: (235, 218, 165),  # areia clara papel
        2: (105, 165, 80),   # grama saturada
        3: (180, 95, 60),    # terra-roxa intensa
    }
}

# Versões mais escuras (sombra/borda)
SHADE_A = {0:(40,90,120), 1:(180,160,110), 2:(95,140,55), 3:(120,75,50)}
INK_C   = {0:(15,30,50),  1:(120,90,55),   2:(40,75,30),  3:(80,40,20)}  # ink lines

def sample_terrain(gx, gy):
    """Sample altitude no grid com clamp."""
    gx = max(0, min(COLS-1, int(gx)))
    gy = max(0, min(ROWS-1, int(gy)))
    return grid[gy][gx]

def bilinear_blend(px, py, palette, jitter_amount, jitter_freq):
    """
    Smooth blend dos 4 terrenos vizinhos com jitter de noise pra borda orgânica.
    """
    gx = px / CELL_W
    gy = py / CELL_H
    # Jitter as coordenadas com noise pra deslocar a borda
    jx = (fbm(px * jitter_freq, py * jitter_freq) - 0.5) * jitter_amount
    jy = (fbm(px * jitter_freq + 100, py * jitter_freq + 100) - 0.5) * jitter_amount
    gx += jx
    gy += jy
    # Pega os 4 cells vizinhos
    x0, y0 = int(np.floor(gx)), int(np.floor(gy))
    fx, fy = gx - x0, gy - y0
    a = sample_terrain(x0,   y0)
    b = sample_terrain(x0+1, y0)
    c = sample_terrain(x0,   y0+1)
    d = sample_terrain(x0+1, y0+1)
    # Interpolação bilinear nos VALORES de altitude
    val = (a*(1-fx) + b*fx) * (1-fy) + (c*(1-fx) + d*fx) * fy
    # Snap pro terreno mais próximo
    terrain_id = int(round(val))
    return palette[terrain_id], terrain_id

def render_option_A():
    """Natural painterly (BotW / Hades style)."""
    print("Rendering Option A — natural painterly...")
    img = Image.new('RGB', (W, H), (0, 0, 0))
    px = img.load()
    for y in range(H):
        for x in range(W):
            color, tid = bilinear_blend(x, y, COLORS['A'], 1.2, 0.008)
            # Adiciona variação por noise pra dar textura
            n = fbm(x * 0.015, y * 0.015, 3)
            shade = SHADE_A[tid]
            t = (n - 0.4) * 0.6  # -0.24 .. +0.36
            t = max(0, min(1, 0.5 + t))
            r = int(color[0] * (1-t) + shade[0] * t)
            g = int(color[1] * (1-t) + shade[1] * t)
            b = int(color[2] * (1-t) + shade[2] * t)
            # Adiciona micro-variação pra "painterly brush" feel
            micro = (fbm(x*0.08, y*0.08, 2) - 0.5) * 25
            r = max(0, min(255, int(r + micro)))
            g = max(0, min(255, int(g + micro)))
            b = max(0, min(255, int(b + micro)))
            px[x, y] = (r, g, b)
    return img

def render_option_C():
    """Cell-shaded ink + watercolor (Hollow Knight / Don't Starve style)."""
    print("Rendering Option C — cell-shaded ink + watercolor...")
    img = Image.new('RGB', (W, H), (0, 0, 0))
    px = img.load()
    for y in range(H):
        for x in range(W):
            # Use mais jitter pra borda mais orgânica/wavy
            color, tid = bilinear_blend(x, y, COLORS['C'], 2.5, 0.012)
            base = color
            # Detecta se está perto da borda (entre dois terrenos diferentes)
            gx, gy = x / CELL_W, y / CELL_H
            jx = (fbm(x * 0.012, y * 0.012) - 0.5) * 2.5
            jy = (fbm(x * 0.012 + 100, y * 0.012 + 100) - 0.5) * 2.5
            # Sample 4 cantos pra detectar borda
            corners = []
            for dx in (0, 1):
                for dy in (0, 1):
                    corners.append(sample_terrain(gx + jx + dx, gy + jy + dy))
            is_border = len(set(corners)) > 1
            # Watercolor: zone 1 = base flat saturada, zone 2 = ink line nas bordas
            if is_border:
                ink = INK_C[tid]
                # Mistura ink com base pra fazer linha
                t = 0.65
                r = int(base[0] * (1-t) + ink[0] * t)
                g = int(base[1] * (1-t) + ink[1] * t)
                b = int(base[2] * (1-t) + ink[2] * t)
            else:
                # Watercolor wash: cor base flat + sutil noise wash
                wash = (fbm(x*0.005, y*0.005, 2) - 0.5) * 18
                edge_dark = (fbm(x*0.025, y*0.025, 3) - 0.5) * 12
                r = max(0, min(255, int(base[0] + wash + edge_dark)))
                g = max(0, min(255, int(base[1] + wash + edge_dark)))
                b = max(0, min(255, int(base[2] + wash + edge_dark)))
                # Posterize pra cell-shade hard steps
                r = (r // 22) * 22
                g = (g // 22) * 22
                b = (b // 22) * 22
            px[x, y] = (r, g, b)
    return img

if __name__ == "__main__":
    OUT_DIR.mkdir(exist_ok=True)
    img_a = render_option_A()
    img_a.save(OUT_DIR / "preview_shader_A_natural.png")
    print(f"saved: {OUT_DIR / 'preview_shader_A_natural.png'}")
    img_c = render_option_C()
    img_c.save(OUT_DIR / "preview_shader_C_cellshaded.png")
    print(f"saved: {OUT_DIR / 'preview_shader_C_cellshaded.png'}")
