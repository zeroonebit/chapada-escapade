// 04_scenery.js — Scenery: terreno procedural via Cellular Automata + obstáculos + corrals
// Layered overlap: 4 camadas de altitude (water/sand/grass/dirt) renderizadas as
// polígonos orgânicos oversize. Cells adjacentes do same nível fundem visualmente.
Object.assign(Jogo.prototype, {

    // ── ILHA PROCEDURAL (F3 backport — port mecânico de Bevy terrain.rs) ──
    // hash2 → valueNoise → fBm 4 octaves, determinístico por seed u32.
    _terrHash2(x, y, seed) {
        let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
        return ((h ^ (h >>> 16)) & 0xffff) / 65536;
    },
    _terrNoise(x, y, seed) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const fx = x - xi, fy = y - yi;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = this._terrHash2(xi, yi, seed),     b = this._terrHash2(xi + 1, yi, seed);
        const c = this._terrHash2(xi, yi + 1, seed), d = this._terrHash2(xi + 1, yi + 1, seed);
        return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    },
    _terrFbm(x, y, seed) {
        let amp = 0.5, freq = 1, sum = 0, norm = 0;
        for (let o = 0; o < 4; o++) {
            sum += this._terrNoise(x * freq, y * freq, (seed + o * 7919) >>> 0) * amp;
            norm += amp; amp *= 0.5; freq *= 2;
        }
        return sum / norm;
    },

    // Seed por ELEVAÇÃO/UMIDADE (Bevy seed_grid_noise): elevação decide
    // água×terra (água SÓ em zona verde — no árido a depressão vira terra),
    // umidade decide grass×dirt. O CA vira só o passe de limpeza.
    _seedIslandGrid(COLS, ROWS, proc, mapCfg) {
        const seed = (Math.random() * 0xffffffff) >>> 0;
        this._islandSeed = seed;
        // Defaults = Bevy debug_menu.rs (14/0.34/0.30). moisture 0.30 fica na
        // CAUDA da distribuição do fBm (média ~0.5): árido vira 2-3 manchas
        // localizadas. O 0.47 antigo era a MEDIANA → ilha inteira flipava
        // grama/terra por seed (bug "terreno quebrado" do Pages).
        // waterLevel 0.30 (≠ Bevy 0.34): o grid 4:3 com recorte ELÍPTICO já
        // perde mais terra pro rim que o círculo do Bevy num grid quadrado —
        // 0.34 aqui dava 43% de água (F3 calibrou 0.30 ≈ 32%).
        const scale  = mapCfg.noiseScale ?? proc.noiseScale ?? 14;
        const tWater = mapCfg.waterLevel ?? proc.waterLevel ?? 0.30;
        const tMoist = mapCfg.moisture   ?? proc.moisture   ?? 0.30;
        const moistSeed = (seed + 0x9E3779B9) >>> 0;
        const grid = [];
        for (let y = 0; y < ROWS; y++) {
            grid[y] = [];
            for (let x = 0; x < COLS; x++) {
                const e = this._terrFbm(x / scale, y / scale, seed);
                const m = this._terrFbm(x / (scale * 2.6), y / (scale * 2.6), moistSeed);
                const arid = m < tMoist;
                if (e < tWater) grid[y][x] = arid ? 3 : 0;
                else            grid[y][x] = arid ? 3 : 2;
            }
        }
        return grid;
    },

    // EDT euclidiano exato (Felzenszwalb & Huttenlocher, parábolas 1D em
    // dist², 2 passes col→row) — port de distance_from_euclid (terrain.rs).
    _edtFromWater(grid, COLS, ROWS) {
        return this._edtFrom(grid, COLS, ROWS, (c) => c === 0);
    },
    _edtFrom(grid, COLS, ROWS, isSource) {
        const INF = 1e12;
        const f = [];
        for (let y = 0; y < ROWS; y++) {
            f[y] = [];
            for (let x = 0; x < COLS; x++) f[y][x] = isSource(grid[y][x]) ? 0 : INF;
        }
        const edt1d = (src, out) => {
            const n = src.length;
            const v = new Array(n).fill(0), z = new Array(n + 1).fill(0);
            let k = 0; z[0] = -1e20; z[1] = 1e20;
            for (let q = 1; q < n; q++) {
                let s;
                for (;;) {
                    const p = v[k];
                    s = ((src[q] + q * q) - (src[p] + p * p)) / (2 * (q - p));
                    if (s <= z[k] && k > 0) k--;
                    else break;
                }
                k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
            }
            k = 0;
            for (let q = 0; q < n; q++) {
                while (z[k + 1] < q) k++;
                const p = v[k];
                out[q] = (q - p) * (q - p) + src[p];
            }
        };
        const colIn = new Array(ROWS), buf = new Array(Math.max(ROWS, COLS));
        for (let x = 0; x < COLS; x++) {
            for (let y = 0; y < ROWS; y++) colIn[y] = f[y][x];
            edt1d(colIn, buf);
            for (let y = 0; y < ROWS; y++) f[y][x] = buf[y];
        }
        const rowIn = new Array(COLS);
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) rowIn[x] = f[y][x];
            edt1d(rowIn, buf);
            for (let x = 0; x < COLS; x++) f[y][x] = Math.sqrt(buf[x]);
        }
        return f;
    },

    // ── TERRENO SEM TILES (parity Bevy pós-07-07: "MOTOR WANG ARRANCADO") ──
    // Uma ÚNICA textura canvas pro mundo inteiro, pintada POR PIXEL com
    // domain warp (as bordas de célula somem, viram costa orgânica — o
    // truque do terrain_proc.wgsl em 2D). Água com profundidade + espuma
    // na costa, praia com faixa molhada, grama/terra com dithering fBm.
    // Substitui ~7k imagens de tile por 1 image → FPS do Pages agradece.
    _renderTerrainCanvas(grid, COLS, ROWS, CELL, W, H) {
        const t0 = performance.now();
        const RES = 8;                       // 1 texel = 8 world px (cell 80 = 10 texels)
        const CW = Math.round(W / RES), CH2 = Math.round(H / RES);
        const seed = (this._islandSeed || 1) >>> 0;
        const distW = this._distWater;       // células de terra: dist da água
        const distL = this._edtFrom(grid, COLS, ROWS, (c) => c !== 0);  // células de água: dist da terra
        const ocean = this._oceanMask;

        // Paleta (tons Bevy/cerrado)
        const PAL = {
            oceanDeep:  [18, 42, 66],   oceanShal: [43, 93, 126],
            lake:       [47, 106, 143], foam:      [196, 226, 232],
            sand:       [216, 192, 132], sandWet:  [178, 148, 96],
            grassA:     [110, 162, 77],  grassB:   [92, 143, 66],
            dirtA:      [160, 104, 72],  dirtB:    [140, 88, 58],
        };
        const canvas = document.createElement('canvas');
        canvas.width = CW; canvas.height = CH2;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(CW, CH2);
        const px = img.data;
        const noise = (x, y, s) => this._terrNoise(x, y, s);  // 1 octave (barato)
        // ±0.85 célula = 68px: derrete o degrau de 80px sem descolar demais
        // do grid lógico (barreira da nave tolera ~1 célula de mismatch —
        // mesmo trade do Bevy: "margem de fronteira no scatter, warp ±8u")
        const WARP = 0.85;                   // amplitude do warp em CÉLULAS
        const WSCALE = 2.6;                  // escala do noise do warp (células)

        for (let ty = 0; ty < CH2; ty++) {
            const gy0 = (ty * RES) / CELL;   // pos em células (float)
            for (let tx = 0; tx < CW; tx++) {
                const gx0 = (tx * RES) / CELL;
                // Domain warp: amostra deslocada por noise coerente
                const wx = gx0 + (noise(gx0 / WSCALE, gy0 / WSCALE, seed ^ 0xA11CE) - 0.5) * 2 * WARP;
                const wy = gy0 + (noise(gx0 / WSCALE + 37.7, gy0 / WSCALE + 11.3, seed ^ 0xB0B0) - 0.5) * 2 * WARP;
                let cx = Math.floor(wx), cy = Math.floor(wy);
                if (cx < 0) cx = 0; else if (cx >= COLS) cx = COLS - 1;
                if (cy < 0) cy = 0; else if (cy >= ROWS) cy = ROWS - 1;
                const t = grid[cy][cx];
                // Dither/variação: hash por texel + fBm suave por área
                const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
                const dth = ((h >>> 8) & 0xff) / 255;         // 0..1
                let r, g2, b;
                if (t === 0) {
                    const dl = distL[cy][cx];                  // profundidade (células)
                    const isOc = ocean ? ocean[cy][cx] : true;
                    if (dl <= 1 && dth > 0.55 - (1 - dl) * 0.2) {
                        [r, g2, b] = PAL.foam;                 // espuma na linha da costa
                    } else if (!isOc) {
                        [r, g2, b] = PAL.lake;
                        const k = Math.min(1, dl / 3) * 0.25;
                        r *= (1 - k); g2 *= (1 - k); b *= (1 - k);
                    } else {
                        // gradiente raso → fundo (cap 6 células)
                        const k = Math.min(1, dl / 6);
                        r  = PAL.oceanShal[0] + (PAL.oceanDeep[0] - PAL.oceanShal[0]) * k;
                        g2 = PAL.oceanShal[1] + (PAL.oceanDeep[1] - PAL.oceanShal[1]) * k;
                        b  = PAL.oceanShal[2] + (PAL.oceanDeep[2] - PAL.oceanShal[2]) * k;
                        // traços de onda sutis — 2 noises multiplicados
                        // quebram as bandas contínuas (ficava listrado)
                        const wv = noise(gx0 / 1.6, gy0 / 0.9, seed ^ 0x77A7);
                        const wm = noise(gx0 / 4.2, gy0 / 4.2, seed ^ 0x3EA1);
                        if (wv > 0.74 && wm > 0.45 && k < 0.8) { r += 24; g2 += 28; b += 28; }
                    }
                } else if (t === 1) {
                    const dw = distW ? distW[cy][cx] : 3;
                    const wet = Math.max(0, 1 - dw / 2.2);     // faixa molhada rente à água
                    r  = PAL.sand[0] + (PAL.sandWet[0] - PAL.sand[0]) * wet;
                    g2 = PAL.sand[1] + (PAL.sandWet[1] - PAL.sand[1]) * wet;
                    b  = PAL.sand[2] + (PAL.sandWet[2] - PAL.sand[2]) * wet;
                    const gr = (dth - 0.5) * 14;               // grão
                    r += gr; g2 += gr; b += gr;
                } else {
                    const A = (t === 2) ? PAL.grassA : PAL.dirtA;
                    const B = (t === 2) ? PAL.grassB : PAL.dirtB;
                    // manchas orgânicas 2-tons (fBm binário + dither na fronteira)
                    const m = noise(gx0 / 3.2, gy0 / 3.2, seed ^ (t === 2 ? 0x6EA5 : 0xD1F7));
                    const mix = (m + (dth - 0.5) * 0.22) > 0.5 ? 1 : 0;
                    r = mix ? B[0] : A[0]; g2 = mix ? B[1] : A[1]; b = mix ? B[2] : A[2];
                    const gr = (((h >>> 16) & 0xff) / 255 - 0.5) * 10;
                    r += gr; g2 += gr; b += gr;
                }
                const i = (ty * CW + tx) * 4;
                px[i] = r; px[i + 1] = g2; px[i + 2] = b; px[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        if (this.textures.exists('terrain_canvas')) this.textures.remove('terrain_canvas');
        this.textures.addCanvas('terrain_canvas', canvas);
        this.add.image(W / 2, H / 2, 'terrain_canvas')
            .setDisplaySize(W, H).setDepth(-0.5);
        console.log('[TERRAIN] canvas', CW + 'x' + CH2, 'em', Math.round(performance.now() - t0) + 'ms');
    },

    // QUINTAIS de curral (port terrain.rs:1558+): escolhe os spots ANTES do
    // render e carimba um disco de TERRA wobbled sob cada um — no Bevy é
    // daqui que vem quase todo o dirt visível (moisture 0.30 deixa o árido
    // raro). Easing: costa WANT 16 → MIN 9 células (nunca abaixo — currais
    // na borda eram reclamação do user), separação 1360→880px (85→55u).
    _stampCorralYards(grid, COLS, ROWS, CELL) {
        const spots = [];
        if (!this._distWater) { this._corralSpots = spots; return; }
        const yardSeed = ((this._islandSeed || 1) ^ 0xD1B7) >>> 0;
        let tries = 0;
        while (spots.length < 5 && tries < 6000) {
            tries++;
            const sepEase   = Math.min(1, tries / 1200);
            const coastEase = Math.max(0, Math.min(1, (tries - 1500) / 3000));
            const sep   = 1360 - 480 * sepEase;
            const coast = 16 + (9 - 16) * coastEase;
            const gy = Phaser.Math.Between(2, ROWS - 3);
            const gx = Phaser.Math.Between(2, COLS - 3);
            if (grid[gy][gx] !== 2) continue;
            if (this._distWater[gy][gx] < coast) continue;
            const px = gx * CELL + CELL / 2, py = gy * CELL + CELL / 2;
            if (spots.some(p => Phaser.Math.Distance.Between(px, py, p.x, p.y) < sep)) continue;
            const baseR = 3 + Math.random() * 1.5;
            for (let dr = -6; dr <= 6; dr++) {
                for (let dc = -6; dc <= 6; dc++) {
                    const rr = gy + dr, cc = gx + dc;
                    if (rr < 0 || cc < 0 || rr >= ROWS || cc >= COLS) continue;
                    const d = Math.sqrt(dr * dr + dc * dc);
                    const wobble = this._terrFbm(cc / 3, rr / 3, yardSeed) * 1.6;
                    if (d < baseR + wobble && grid[rr][cc] === 2) grid[rr][cc] = 3;
                }
            }
            spots.push({ x: px, y: py });
        }
        if (spots.length < 5) console.warn('[CORRAL] só', spots.length, 'de 5 quintais couberam');
        this._corralSpots = spots;
    },

    // Pós-CA (ordem do Bevy): recorte ELÍPTICO da ilha com rim ondulado por
    // fBm → dist_water (BFS multi-fonte) → praia GARANTIDA (anel 4 células
    // de areia) → máscara oceano×lago (flood fill das bordas). Lagos internos
    // são sobrevoáveis; o OCEANO é a barreira da nave (o "void" do Bevy em 2D).
    _applyIslandPost(grid, COLS, ROWS) {
        const borderSeed = ((this._islandSeed || 1) ^ 0xB07D) >>> 0;
        const halfC = COLS / 2, halfR = ROWS / 2;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const nx = (x + 0.5 - halfC) / (halfC - 1);
                const ny = (y + 0.5 - halfR) / (halfR - 1);
                const d = Math.sqrt(nx * nx + ny * ny);
                // wobble de ~3 células (4 comia ilha demais no grid retangular)
                const rim = 1 - this._terrFbm(x / 7, y / 7, borderSeed) * (3 / Math.min(halfC, halfR));
                if (d > rim) grid[y][x] = 0;
            }
        }

        // dist_water: EUCLIDIANO (Felzenszwalb 2-pass, port de
        // distance_from_euclid do Bevy) + wobble fBm de costa. O BFS 4-conn
        // antigo media Manhattan → isolinhas viravam octógono ("ângulos
        // quase retos") e a praia afinava nas diagonais.
        const dist = this._edtFromWater(grid, COLS, ROWS);
        const coastSeed = ((this._islandSeed || 1) ^ 0xC0A57) >>> 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (dist[y][x] > 0) {
                    const w = (this._terrFbm(x / 3.5, y / 3.5, coastSeed) - 0.5) * 1.5;
                    dist[y][x] = Math.round(Math.max(0.51, dist[y][x] + w));
                }
            }
        }
        this._distWater = dist;

        // Praia garantida: anel de 4 células de AREIA na costa toda
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (dist[y][x] >= 1 && dist[y][x] <= 4) grid[y][x] = 1;
            }
        }

        // Oceano × lago: flood fill de água partindo das bordas do grid
        const ocean = [];
        for (let y = 0; y < ROWS; y++) ocean[y] = new Array(COLS).fill(false);
        const q2 = [];
        for (let x = 0; x < COLS; x++) {
            if (grid[0][x] === 0)      { ocean[0][x] = true;      q2.push([0, x]); }
            if (grid[ROWS-1][x] === 0) { ocean[ROWS-1][x] = true; q2.push([ROWS-1, x]); }
        }
        for (let y = 0; y < ROWS; y++) {
            if (grid[y][0] === 0)      { ocean[y][0] = true;      q2.push([y, 0]); }
            if (grid[y][COLS-1] === 0) { ocean[y][COLS-1] = true; q2.push([y, COLS-1]); }
        }
        qi = 0;
        while (qi < q2.length) {
            const [y, x] = q2[qi++];
            if (y > 0        && !ocean[y-1][x] && grid[y-1][x] === 0) { ocean[y-1][x] = true; q2.push([y-1, x]); }
            if (y < ROWS - 1 && !ocean[y+1][x] && grid[y+1][x] === 0) { ocean[y+1][x] = true; q2.push([y+1, x]); }
            if (x > 0        && !ocean[y][x-1] && grid[y][x-1] === 0) { ocean[y][x-1] = true; q2.push([y, x-1]); }
            if (x < COLS - 1 && !ocean[y][x+1] && grid[y][x+1] === 0) { ocean[y][x+1] = true; q2.push([y, x+1]); }
        }
        this._oceanMask = ocean;
        console.log('[ISLAND] seed', this._islandSeed, '— rim elíptico + praia 4 células + masks ok');
    },

    // ── Helpers de consulta (spawns, IA, barreira da nave) ──────────
    _cellIdxAt(px, py) {
        const CELL = this.terrainCell || 80;
        return { cx: Math.floor(px / CELL), cy: Math.floor(py / CELL) };
    },
    _isWaterAt(px, py) {
        const g = this.terrainGrid;
        if (!g) return false;
        const { cx, cy } = this._cellIdxAt(px, py);
        if (cy < 0 || cy >= g.length || cx < 0 || cx >= g[0].length) return true;
        return g[cy][cx] === 0;
    },
    _isOceanAt(px, py) {
        const m = this._oceanMask;
        if (!m) return false;
        const { cx, cy } = this._cellIdxAt(px, py);
        if (cy < 0 || cy >= m.length || cx < 0 || cx >= m[0].length) return true;
        return m[cy][cx];
    },
    // Sorteia posição em TERRA (grama/terra; areia se allowSand) — spawns
    _randLandPos(allowSand = false) {
        const g = this.terrainGrid;
        const CELL = this.terrainCell || 80;
        if (!g) return { x: Phaser.Math.Between(300, 7700), y: Phaser.Math.Between(300, 5700) };
        const ROWS = g.length, COLS = g[0].length;
        for (let i = 0; i < 80; i++) {
            const cy = Phaser.Math.Between(1, ROWS - 2);
            const cx = Phaser.Math.Between(1, COLS - 2);
            const t = g[cy][cx];
            if (t >= 2 || (allowSand && t === 1)) {
                return {
                    x: cx * CELL + CELL / 2 + Phaser.Math.Between(-28, 28),
                    y: cy * CELL + CELL / 2 + Phaser.Math.Between(-28, 28),
                };
            }
        }
        return { x: 4000, y: 3000 };
    },

    _setupScenery(W, H) {
        const CELL = 80;
        const COLS = Math.ceil(W / CELL);
        const ROWS = Math.ceil(H / CELL);

        // Procedural cfg via debug menu OU map preset salvo no PixaPro.
        // Cache do preset esta em localStorage (escrito quando user seleciona
        // no dropdown da MAP tab via _loadMapPreset). Le sync aqui no scene
        // init -- nao precisa async fetch durante create.
        const proc = this.dbg?.proc || {};
        let mapCfg = {};
        if (proc.activeMap) {
            try {
                const cached = localStorage.getItem('CEP_DBG__activeMapCache');
                if (cached) {
                    mapCfg = JSON.parse(cached);
                    this._activeMapConfig = mapCfg;
                    console.log('[MAP] using preset:', mapCfg.name || proc.activeMap, mapCfg);
                }
            } catch (e) { console.warn('[MAP] cache parse fail:', e); }
        } else {
            this._activeMapConfig = null;
        }
        const SEED_WATER = mapCfg.seedWater ?? proc.seedWater ?? 0.10;
        const SEED_SAND  = mapCfg.seedSand  ?? proc.seedSand  ?? 0.18;
        const SEED_GRASS = mapCfg.seedGrass ?? proc.seedGrass ?? 0.40;
        const CA_PASSES  = mapCfg.caPasses  ?? proc.caPasses  ?? 3;

        // ── 1. SEED ──────────────────────────────────────────────────
        // ILHA fBm (parity Bevy terrain.rs, DEFAULT) ou salt-and-pepper
        // legado (proc.island = false no CONFIGS → mapa retangular antigo)
        const useIsland = mapCfg.island ?? proc.island ?? true;
        this._distWater = null; this._oceanMask = null; this._islandSeed = null;
        let grid = [];
        if (useIsland) {
            grid = this._seedIslandGrid(COLS, ROWS, proc, mapCfg);
        } else {
            // SEED RANDOM legado com pesos balanceados
            // Valores defaults: 10% water + 18% sand + 40% grass + 32% dirt
            for (let y = 0; y < ROWS; y++) {
                grid[y] = [];
                for (let x = 0; x < COLS; x++) {
                    const r = Math.random();
                    if (r < SEED_WATER)                          grid[y][x] = 0;  // water
                    else if (r < SEED_WATER + SEED_SAND)         grid[y][x] = 1;  // sand
                    else if (r < SEED_WATER + SEED_SAND + SEED_GRASS) grid[y][x] = 2;  // grass
                    else                                          grid[y][x] = 3;  // dirt
                }
            }
        }

        // ── 2. SMOOTHING via MAJORITY VOTE (modo, nao media)
        // Media com tipos categoricos misturava tudo (water+grass = sand?!)
        // e convergia tudo pra grass. Majority vote preserva blobs/manchas.
        for (let pass = 0; pass < CA_PASSES; pass++) {
            const next = [];
            for (let y = 0; y < ROWS; y++) {
                next[y] = [];
                for (let x = 0; x < COLS; x++) {
                    const counts = [0, 0, 0, 0];  // count por tipo
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
                            counts[grid[ny][nx]]++;
                        }
                    }
                    // Tipo com mais votos — empate mantém o ATUAL (parity
                    // Rust; o argmax antigo deixava o menor id vencer = viés
                    // pra água nos empates)
                    let best = grid[y][x], bestCount = counts[best];
                    for (let t = 0; t < 4; t++) {
                        if (counts[t] > bestCount) { bestCount = counts[t]; best = t; }
                    }
                    next[y][x] = best;
                }
            }
            grid = next;
        }

        // Pós-CA da ilha (ordem do Bevy: seed → CA → rim/praia/masks)
        this._corralSpots = null;
        if (useIsland) {
            this._applyIslandPost(grid, COLS, ROWS);
            // Quintais ANTES do render: o dirt carimbado precisa existir no
            // grid quando os wang tiles forem criados (Bevy: yards → mesh)
            this._stampCorralYards(grid, COLS, ROWS, CELL);
        }

        // Saves grid to detecção de grass nas cows
        this.terrainGrid = grid;
        this.terrainCell = CELL;

        // ── 3. RENDER ─────────────────────────────────────────────────
        const useWang = this.dbg?.fx?.wangtiles;
        if (useWang) {
            // Wang tiles cr31 corner convention (mesma do PixaPro):
            //   NW=1, NE=2, SE=4, SW=8 -> bits = nw + ne*2 + se*4 + sw*8
            // ANTES o codigo usava NE=1, NW=8 (rotacionado). Cantos eram derivados
            // do cell grid via "majoria de grass" -- com CA convergindo tudo pra
            // grass, todos os cantos viravam 1 e todo tile = 15.
            //
            // FIDELIDADE (pós-F3): o vertex grid agora DERIVA do terrainGrid —
            // antes era white noise PRÓPRIO, desconectado do mapa lógico (a
            // ilha existia nos spawns/barreira/radar mas NÃO NA TELA). Cada
            // vértice olha as até 4 células vizinhas: grama = upper (1),
            // resto = lower (0). Água/areia nem recebem tile (rects abaixo).
            const CW = COLS + 1, CH = ROWS + 1;
            const corners = [];
            for (let y = 0; y < CH; y++) {
                corners[y] = [];
                for (let x = 0; x < CW; x++) {
                    let g = 0, n = 0;
                    if (y > 0    && x > 0)    { n++; if (grid[y-1][x-1] === 2) g++; }
                    if (y > 0    && x < COLS) { n++; if (grid[y-1][x]   === 2) g++; }
                    if (y < ROWS && x > 0)    { n++; if (grid[y][x-1]   === 2) g++; }
                    if (y < ROWS && x < COLS) { n++; if (grid[y][x]     === 2) g++; }
                    corners[y][x] = (n > 0 && g * 2 >= n) ? 1 : 0;
                }
            }
            // Cell (x,y) reads seus 4 cantos:
            //   NW = corners[y][x],  NE = corners[y][x+1]
            //   SW = corners[y+1][x], SE = corners[y+1][x+1]
            // Bits cr31 (PixaPro convention): NW=1, NE=2, SE=4, SW=8
            // tileStyle: 'test' (placeholder), 'dirt_grass_32' ou 'ocean_sand_32'
            // Preset pode override o tileStyle escolhido nos sliders
            const style = mapCfg.tileStyle || this.dbg?.fx?.tileStyle;
            const useStyle = (style && style !== 'test' && this.textures.exists(`wang_${style}_00`));
            // Diagnostico: log style escolhido + se assets carregaram
            console.log('[WANG] tileStyle=', style, 'useStyle=', useStyle,
                'has wang_00=', this.textures.exists(`wang_${style}_00`));
            // Se style escolhido nao tem assets, avisa missing tiles
            if (style && style !== 'test' && !useStyle) {
                console.warn('[WANG] style "' + style + '" sem assets carregados — fallback pra test palette');
            }
            // Auto-sort: detecta cantos por color sampling e remapeia 0..15
            // pra cr31. Resolve tilesets PixelLab com convencao trocada.
            // Resultado em this._wangRemap[style] = arr16 (cr31Bits -> srcBits).
            const remap = (useStyle && this.dbg?.proc?.autoSortTiles)
                ? this._autoSortWangTiles(style)
                : null;
            // Tile transforms via wang_presets.js: resolve srcIdx + rot + flip
            // por cr31Idx. Pre-resolve os 16 (uma vez por _setupScenery call).
            const styleKey = useStyle ? style : 'test';
            const resolveT = (typeof resolveTileTransform === 'function')
                ? (i) => resolveTileTransform(styleKey, i)
                : (i) => ({ srcIdx: i, rot: 0, flipH: false, flipV: false });
            const tileT = [];
            for (let i = 0; i < 16; i++) tileT.push(resolveT(i));
            // CAMADA BASE: água e areia pintadas por célula (1 Graphics só) —
            // é aqui que a ILHA finalmente aparece. Oceano mais escuro que
            // lago, praia em faixa clara. Terra recebe wang tile por cima.
            // Backdrop full-world de segurança: tile faltando vira cor de
            // oceano em vez de buraco preto sobre o void
            this.add.rectangle(W/2, H/2, W, H, 0x1d4260).setDepth(-0.7);
            const baseGfx = this.add.graphics().setDepth(-0.5);
            const OCEAN_COL = 0x1d4260, LAKE_COL = 0x2f6a8f, SAND_COL = 0xd8c084;
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const t0 = grid[y][x];
                    if (t0 === 0) {
                        const isOcean = this._oceanMask ? this._oceanMask[y][x] : true;
                        baseGfx.fillStyle(isOcean ? OCEAN_COL : LAKE_COL, 1);
                        baseGfx.fillRect(x * CELL, y * CELL, CELL, CELL);
                    } else if (t0 === 1) {
                        baseGfx.fillStyle(SAND_COL, 1);
                        baseGfx.fillRect(x * CELL, y * CELL, CELL, CELL);
                    }
                }
            }

            // CAMADA OCEANO↔PRAIA (dual-layer wang, parity Bevy pré-shader
            // 2026-07-05: "wang DUAL-LAYER water/sand→set ocean↔sand,
            // grass/dirt→set dirt↔grass"). Mata a água/areia CHAPADA em
            // blocos retos — todo cell de água/areia ganha tile com
            // transição. Cantos: maioria de TERRA (grid>=1) nos vizinhos.
            const oceanStyle = mapCfg.oceanStyle || 'ocean_sand_32';
            const useOcean = this.textures.exists(`wang_${oceanStyle}_00`);
            if (useOcean) {
                const remapO = (this.dbg?.proc?.autoSortTiles)
                    ? this._autoSortWangTiles(oceanStyle)
                    : null;
                const resolveO = (typeof resolveTileTransform === 'function')
                    ? (i) => resolveTileTransform(oceanStyle, i)
                    : (i) => ({ srcIdx: i, rot: 0, flipH: false, flipV: false });
                const tileTO = [];
                for (let i = 0; i < 16; i++) tileTO.push(resolveO(i));
                const cornersO = [];
                for (let y = 0; y < CH; y++) {
                    cornersO[y] = [];
                    for (let x = 0; x < CW; x++) {
                        let l = 0, n = 0;
                        if (y > 0    && x > 0)    { n++; if (grid[y-1][x-1] >= 1) l++; }
                        if (y > 0    && x < COLS) { n++; if (grid[y-1][x]   >= 1) l++; }
                        if (y < ROWS && x > 0)    { n++; if (grid[y][x-1]   >= 1) l++; }
                        if (y < ROWS && x < COLS) { n++; if (grid[y][x]     >= 1) l++; }
                        cornersO[y][x] = (n > 0 && l * 2 >= n) ? 1 : 0;
                    }
                }
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        if (grid[y][x] >= 2) continue;  // terra: dirt_grass cuida
                        const nw = cornersO[y][x],   ne = cornersO[y][x+1];
                        const sw = cornersO[y+1][x], se = cornersO[y+1][x+1];
                        const idx = nw + ne*2 + se*4 + sw*8;
                        const t = tileTO[idx];
                        const srcIdx = remapO ? remapO[idx] : t.srcIdx;
                        const key = `wang_${oceanStyle}_${String(srcIdx).padStart(2, '0')}`;
                        // SEM rot/flip aleatório: tiles PixelLab não são
                        // rotation-safe (lição Bevy 2026-07-05, hash revertido)
                        const img = this.add.image(x*CELL + CELL/2, y*CELL + CELL/2, key)
                            .setDisplaySize(CELL, CELL).setDepth(-0.4);
                        if (t.rot) img.setAngle(t.rot);
                        if (t.flipH) img.setFlipX(true);
                        if (t.flipV) img.setFlipY(true);
                        // Lago: leve véu claro por cima (distingue do oceano
                        // sem perder a textura — o tint não clareia)
                        if (grid[y][x] === 0 && this._oceanMask && !this._oceanMask[y][x]) {
                            img.setAlpha(0.88);
                        }
                    }
                }
            }

            // Salva tile indices pra _renderWangDebug usar (toggle live)
            this._wangIndices = [];
            for (let y = 0; y < ROWS; y++) {
                this._wangIndices[y] = [];
                for (let x = 0; x < COLS; x++) {
                    const nw = corners[y][x],     ne = corners[y][x+1];
                    const sw = corners[y+1][x],   se = corners[y+1][x+1];
                    const idx = nw + ne*2 + se*4 + sw*8;   // cr31
                    this._wangIndices[y][x] = idx;
                    // Água/areia: só a camada base (tile aqui tapava a ilha)
                    if (grid[y][x] < 2) continue;
                    const t = tileT[idx];
                    const srcIdx = remap ? remap[idx] : t.srcIdx;
                    const f = String(srcIdx).padStart(2, '0');
                    const key = useStyle ? `wang_${style}_${f}` : `wang_${f}`;
                    // SEM rot/flip aleatório nos uniformes: tiles PixelLab não
                    // são rotation-safe (lição Bevy 2026-07-05, hash revertido)
                    const img = this.add.image(x*CELL + CELL/2, y*CELL + CELL/2, key)
                        .setDisplaySize(CELL, CELL).setDepth(0);
                    if (t.rot) img.setAngle(t.rot);
                    if (t.flipH) img.setFlipX(true);
                    if (t.flipV) img.setFlipY(true);
                }
            }
            // Re-render overlay caso ja estivesse on antes do scenery
            if (this.dbg?.fx?.wangDebug) this._renderWangDebug();
        } else {
            // DEFAULT (parity Bevy pós-07-07, sem tiles): canvas procedural
            // por pixel com domain warp — ver _renderTerrainCanvas
            this._renderTerrainCanvas(grid, COLS, ROWS, CELL, W, H);
        }
        // this._setupTerrainShader(W, H);  // re-habilitar when confirmar não trava

        // Mantém function de noise to compat (algumas funções consultam this._noiseR)
        const noise = (a, seed) =>
              Math.sin(a*3 + seed)        * 0.10
            + Math.sin(a*5 + seed*1.7)    * 0.06
            + Math.sin(a*7 + seed*2.3)    * 0.04;

        // ── 4. GRASS PATCHES — gera points de grass to IA de fuga das cows
        // (substitui o sistema antigo de blobs explícitos)
        this.grassPatches = [];
        for (let attempts = 0; attempts < 100 && this.grassPatches.length < 12; attempts++) {
            const cx = Phaser.Math.Between(2, COLS-3);
            const cy = Phaser.Math.Between(2, ROWS-3);
            if (grid[cy][cx] === 2) {
                this.grassPatches.push({
                    x: cx * CELL + CELL/2,
                    y: cy * CELL + CELL/2,
                    r: 100,
                    seed: Math.random() * 1000
                });
            }
        }
        this._noiseR = noise; // mantém compat (algumas funções consultam)

        // MOBILE_MODE teaser: pula a maioria dos itens. Mantem decoracao
        // esparsa (~25 small rocks + small cactus/bush) to nao ficar empty.
        // without matter physics — sao puramente visuais (player nao colide).
        if (window.__MOBILE_MODE) {
            this.corrals = [];
            this.driveThrus = this.corrals;
            const smallRocks = ['nat_rock_rock_small_smooth', 'nat_rock_boulder_red_cluster'];
            const smallVeg   = ['nat_veg_cactus_dead_dry', 'nat_veg_cactus_medium',
                                'nat_veg_bush_round', 'nat_veg_bush_dry', 'nat_veg_agave_dark'];
            const isLandMobile = (px, py) => {
                const cx = Math.floor(px / CELL);
                const cy = Math.floor(py / CELL);
                if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
                return grid[cy][cx] >= 1;
            };
            for (let i = 0; i < 30; i++) {
                const x = Phaser.Math.Between(200, W - 200);
                const y = Phaser.Math.Between(200, H - 200);
                if (!isLandMobile(x, y)) continue;
                const useRock = Math.random() < 0.45;
                const arr = useRock ? smallRocks : smallVeg;
                const key = arr[Math.floor(Math.random() * arr.length)];
                const sc = useRock
                    ? Phaser.Math.FloatBetween(0.6, 1.0)
                    : Phaser.Math.FloatBetween(0.85, 1.2);
                this.add.image(x, y, key).setScale(sc).setDepth(1);
            }
            return;
        }

        // ── 5. SCATTER — PARIDADE BEVY LIVE (scatter.json): o mundo Bevy do
        // user roda com 7 landmarks ligados de 156 assets — windmill 20u,
        // water_tower 20u (sem PNG aqui), 4 trucks 10u (idem) e old_truck 7u.
        // Cactos/arbustos/agaves/barris/dry_turf/church/satellite = OFF lá,
        // então saem daqui também. Régua mundo-a-mundo: 500u ↔ 8000px = 16px/u.
        const isLand = (px, py) => {
            const cx = Math.floor(px / CELL);
            const cy = Math.floor(py / CELL);
            if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
            return grid[cy][cx] >= 1;  // sand ou above
        };

        // 5a. PEDRAS — Bevy tem elas off, mas aqui são MECÂNICA (farmer morre
        // em pedra + tutorial REVIDE). Mantém um set mínimo nos TAMANHOS do
        // manifest Bevy: rock_small 1.9u=30px, boulder 4u=64px, pillar 5.4u=86px.
        const ROCK_TARGET = {
            'nat_rock_rock_small_smooth': 30,
            'nat_rock_boulder_red_cluster': 64,
            'nat_rock_rock_pillar_tall': 86,
        };
        const rockKeys = Object.keys(ROCK_TARGET).filter(k => this.textures.exists(k));
        const placed = [];
        for (let i = 0; i < 8 && rockKeys.length; i++) {
            for (let tries = 0; tries < 12; tries++) {
                const ox = Phaser.Math.Between(300, W - 300);
                const oy = Phaser.Math.Between(300, H - 300);
                if (!isLand(ox, oy)) continue;
                const tex = rockKeys[Phaser.Math.Between(0, rockKeys.length - 1)];
                const target = ROCK_TARGET[tex] * Phaser.Math.FloatBetween(0.85, 1.15);
                const myR = target * 0.45;
                let collides = false;
                for (const p of placed) {
                    const dx = p.x - ox, dy = p.y - oy;
                    if ((dx*dx + dy*dy) < (p.r + myR) * (p.r + myR)) { collides = true; break; }
                }
                if (collides) continue;
                placed.push({ x: ox, y: oy, r: myR });
                const o = this.matter.add.image(ox, oy, tex, null, {isStatic:true, shape:'circle'});
                const sc = target / (o.height || 64);
                o.setDepth(1).setScale(sc).body.label = 'rock';
                break;
            }
        }

        // 5b. LANDMARKS (só os do Bevy live com PNG local): windmill 20u=320px,
        // old_truck 7u=112px. Separação 140u=2240px (clear_of do scenery.rs).
        const LM_TARGET = { nat_obj_windmill: 320, nat_obj_old_truck: 112 };
        const lmPlaced = [];
        for (const lm of Object.keys(LM_TARGET)) {
            if (!this.textures.exists(lm)) continue;
            for (let tries = 0; tries < 60; tries++) {
                const cx = Phaser.Math.Between(800, W-800);
                const cy = Phaser.Math.Between(800, H-800);
                if (!isLand(cx, cy)) continue;
                const tooClose = lmPlaced.some(p => Phaser.Math.Distance.Between(cx, cy, p.x, p.y) < 2240);
                if (tooClose) continue;
                lmPlaced.push({x: cx, y: cy});
                const img = this.add.image(cx, cy, lm).setDepth(1.4);
                img.setScale(LM_TARGET[lm] / (img.height || 192));
                // Track to sistema de quips (proximity check em 20_quips.js)
                if (!this._landmarkPositions) this._landmarkPositions = [];
                this._landmarkPositions.push({ x: cx, y: cy, key: lm });
                break;
            }
        }

        // ── 6. corrals — nos SPOTS escolhidos por _stampCorralYards (cada
        // curral senta no próprio quintal de terra, como no Bevy). Fallback
        // pro search antigo se os spots não existirem (mapa legado sem ilha).
        this.corrals = [];
        this.driveThrus = this.corrals;
        if (this._corralSpots && this._corralSpots.length) {
            for (const p of this._corralSpots) this._buildCorral(p.x, p.y);
        } else {
            const corralPositions = [];
            for (let i = 0; i < 5; i++) {
                for (let tries = 0; tries < 300; tries++) {
                    const ease = Math.min(1, tries / 150);
                    const minCoast = this._distWater ? Math.round(9 - 4 * ease) : 0;
                    const minDist  = 1300 - 700 * ease;
                    const gy = Phaser.Math.Between(2, ROWS - 3);
                    const gx = Phaser.Math.Between(2, COLS - 3);
                    if (grid[gy][gx] !== 2) continue;  // só grama
                    if (this._distWater && this._distWater[gy][gx] < minCoast) continue;
                    const px = gx * CELL + CELL / 2, py = gy * CELL + CELL / 2;
                    const tooClose = corralPositions.some(p =>
                        Phaser.Math.Distance.Between(px, py, p.x, p.y) < minDist);
                    if (tooClose) continue;
                    corralPositions.push({ x: px, y: py });
                    this._buildCorral(px, py);
                    break;
                }
            }
            if (corralPositions.length < 5) {
                console.warn('[CORRAL] só', corralPositions.length, 'de 5 currais couberam inland');
            }
        }
    },

    // 4 variantes de corral aleatorias by spawn
    _buildCorral(cx, cy) {
        // Curral V2: sprite PixelLab 200x200 (substitui cercas procedural).
        // 5 variantes random + slotOffsetY pro burger row em 08_corrals._slotPos.
        // displaySize 224 flat = CORRAL_QUAD 14u × 16px/u (paridade Bevy)
        const VARIANTS = [
            // mascotCfg: tipo (cow/ox), anim, posicao relativa ao curral, e se mostra balde
            { key: 'nat_obj_curral_01_pequeno',    displaySize: 224, slotOffsetY: 121, gateOpen: true,  name: 'pequeno_quadrado',
              mascotCfg: { tipo: 'cow', anim: 'cow_eat_S',  dx: -14, dy:  0, bucket: true } },
            { key: 'nat_obj_curral_02_redondo',    displaySize: 224, slotOffsetY: 121, gateOpen: true,  name: 'redondo_feno',
              mascotCfg: { tipo: 'cow', anim: 'cow_eat_S',  dx: -14, dy:  0, bucket: true } },
            // hexagonal: tem coxo (water trough) ao norte -> boi/vaca bebendo agua, facing N
            { key: 'nat_obj_curral_03_hexagonal',  displaySize: 224, slotOffsetY: 120, gateOpen: true,  name: 'hexagonal_ornamental',
              mascotCfg: { tipo: 'cow', anim: 'cow_eat_N',  dx:  0,  dy: 20, bucket: false } },
            // rustico_pedra: cow deitada (lie_down anim) — feno ja no sprite
            { key: 'nat_obj_curral_04_rustico',    displaySize: 224, slotOffsetY: 121, gateOpen: true,  name: 'rustico_pedra',
              mascotCfg: { tipo: 'cow', anim: 'cow_angry_S', dx: -9, dy: 4, bucket: false } },
            { key: 'nat_obj_curral_05_abandonado', displaySize: 224, slotOffsetY: 121, gateOpen: false, name: 'abandonado',
              mascotCfg: { tipo: 'ox',  anim: 'ox_walk_S',  dx: -14, dy:  0, bucket: false } },
        ];
        const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

        // Sprite (depth 1.5 — abaixo do mascot/burgers, acima do chao/turf)
        if (this.textures.exists(v.key)) {
            this.add.image(cx, cy, v.key)
                .setDisplaySize(v.displaySize, v.displaySize)
                .setDepth(1.5);
        } else {
            // Fallback: marker se sprite nao carregou
            this.add.rectangle(cx, cy, 200, 200, 0x7a5230, 0.5).setDepth(0.6);
        }

        this.corrals.push({
            x: cx, y: cy, sprite: null, processing: [], ready: [],
            variant: v,
            slotOffsetY: v.slotOffsetY,  // override pra _slotPos em 08_corrals
        });
        // V2: cenografico — mascote sempre visivel, config por variante (mascotCfg)
        const corralObj = this.corrals[this.corrals.length - 1];
        corralObj.mascotCenografico = true;
        corralObj.mascotCfg = v.mascotCfg;  // tipo/anim/dx/dy/bucket por curral
        if (this._ensureCowMascot) {
            this._ensureCowMascot(corralObj);
            if (corralObj.mascot)       corralObj.mascot.setVisible(true);
            if (corralObj.mascotBucket) corralObj.mascotBucket.setVisible(!!v.mascotCfg?.bucket);
        }
    },

    // ── DEBUG OVERLAY: numeros dos wang tiles em cada celula ──────────
    // Toggle live via dbg.fx.wangDebug (checkbox no menu CONFIGS aba VFX).
    // Renderiza/destroi os Phaser.Text labels sob demanda. Se on, fica
    // ativo ate desligar (sem precisar restart pra atualizar).
    _renderWangDebug() {
        // Limpa labels antigos
        if (this._wangDebugLabels) {
            for (const t of this._wangDebugLabels) if (t && t.scene) t.destroy();
        }
        this._wangDebugLabels = [];
        if (!this._wangIndices || !this.dbg?.fx?.wangDebug) return;
        const CELL = this.terrainCell;
        const ROWS = this._wangIndices.length;
        for (let y = 0; y < ROWS; y++) {
            const row = this._wangIndices[y];
            for (let x = 0; x < row.length; x++) {
                const idx = row[x];
                const t = this.add.text(x*CELL + CELL/2, y*CELL + CELL/2, String(idx), {
                    fontSize: '12px', fontStyle: 'bold',
                    fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
                }).setOrigin(0.5).setDepth(2);
                this._wangDebugLabels.push(t);
            }
        }
    },

    _toggleWangDebug() {
        // Chamado pelo checkbox handler no debug menu. Re-renderiza ou limpa.
        this._renderWangDebug();
    },

    // ── AUTO-SORT WANG TILES (PixaPro port) ──────────────────────────
    // PixelLab as vezes gera tilesets com convencao CCW-shifted vs cr31.
    // Solucao: amostra os 4 cantos de cada tile (tile 0 = all-lower,
    // tile 15 = all-upper -> referencia de cor), classifica cada canto,
    // computa cr31 bits do tile, e cria remap[cr31Bits] -> srcIdx.
    // Cacheado em this._wangRemap[style] pra evitar reprocessar.
    _autoSortWangTiles(style) {
        if (!this._wangRemap) this._wangRemap = {};
        if (this._wangRemap[style]) return this._wangRemap[style];

        // Sample 4 corners de cada tile via 3×3 region averaging (PixaPro algorithm).
        // Single getImageData por tile (full image), depois indexa pixels do buffer
        // — ~50× mais rápido que getImageData per-pixel.
        const sampleCorners = (idx) => {
            const f = String(idx).padStart(2, '0');
            const tex = this.textures.get(`wang_${style}_${f}`);
            if (!tex || !tex.source || !tex.source[0]) return null;
            const src = tex.source[0].image;
            if (!src || !src.width) return null;
            const w = src.width, h = src.height;
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            const ctx = cv.getContext('2d');
            ctx.drawImage(src, 0, 0);
            let buf;
            try { buf = ctx.getImageData(0, 0, w, h).data; }
            catch(e) { console.warn('[WANG SORT] getImageData fail (CORS?):', e); return null; }
            const margin = Math.max(1, Math.floor(w * 0.08));   // 8% (vs 10% antes — match PixaPro)
            // Average 3×3 region centrada em (cx, cy) pra robustez vs noise
            const sampleRegion = (cx, cy) => {
                let r=0, g=0, b=0, n=0;
                for (let dy=-1; dy<=1; dy++) {
                    for (let dx=-1; dx<=1; dx++) {
                        const x = Math.max(0, Math.min(w-1, cx+dx));
                        const y = Math.max(0, Math.min(h-1, cy+dy));
                        const i = (y * w + x) * 4;
                        r += buf[i]; g += buf[i+1]; b += buf[i+2]; n++;
                    }
                }
                return [r/n, g/n, b/n];
            };
            return {
                NW: sampleRegion(margin, margin),
                NE: sampleRegion(w - 1 - margin, margin),
                SE: sampleRegion(w - 1 - margin, h - 1 - margin),
                SW: sampleRegion(margin, h - 1 - margin),
            };
        };

        const samples = [];
        for (let i = 0; i < 16; i++) samples.push(sampleCorners(i));

        // Refs: tile 0 = lower (avg dos 4 cantos), tile 15 = upper.
        // Se um deles falhar, tenta variance-based fallback (PixaPro fallback path).
        const avg = (s) => [
            (s.NW[0]+s.NE[0]+s.SE[0]+s.SW[0])/4,
            (s.NW[1]+s.NE[1]+s.SE[1]+s.SW[1])/4,
            (s.NW[2]+s.NE[2]+s.SE[2]+s.SW[2])/4,
        ];
        let lowerRef, upperRef;
        if (samples[0] && samples[15]) {
            lowerRef = avg(samples[0]);
            upperRef = avg(samples[15]);
        } else {
            // Fallback: 2 mais uniformes (low variance), lum menor = lower.
            // Variance score: soma das distâncias entre cantos vs média do tile.
            const variance = (s) => {
                const a = avg(s);
                const ks = ['NW','NE','SE','SW'];
                let v = 0;
                for (const k of ks) {
                    for (let i=0;i<3;i++) v += (s[k][i] - a[i]) ** 2;
                }
                return { v, a };
            };
            const scored = samples.map((s, idx) => s ? { idx, ...variance(s) } : null).filter(Boolean);
            if (scored.length < 2) {
                console.warn(`[WANG SORT] ${style}: not enough samples — skip`);
                return null;
            }
            scored.sort((x, y) => x.v - y.v);
            const ref1 = scored[0];
            let ref2 = null;
            for (let i = 1; i < scored.length; i++) {
                const d = (scored[i].a[0]-ref1.a[0])**2 + (scored[i].a[1]-ref1.a[1])**2 + (scored[i].a[2]-ref1.a[2])**2;
                if (d > 3000) { ref2 = scored[i]; break; }
            }
            if (!ref2) {
                console.warn(`[WANG SORT] ${style}: 2 distinct colors not found — skip`);
                return null;
            }
            const lum = (rgb) => 0.299*rgb[0] + 0.587*rgb[1] + 0.114*rgb[2];
            lowerRef = lum(ref1.a) < lum(ref2.a) ? ref1.a : ref2.a;
            upperRef = lowerRef === ref1.a ? ref2.a : ref1.a;
        }
        const dist = (a, b) => (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
        const classify = (rgb) => dist(rgb, upperRef) < dist(rgb, lowerRef) ? 1 : 0;

        // Pra cada src tile, computa cr31 bits que ele representa
        const remap = new Array(16);   // remap[cr31Bits] = srcIdx
        const conflicts = [];
        for (let srcIdx = 0; srcIdx < 16; srcIdx++) {
            const s = samples[srcIdx];
            if (!s) continue;
            const nw = classify(s.NW);
            const ne = classify(s.NE);
            const se = classify(s.SE);
            const sw = classify(s.SW);
            const cr31 = nw + ne*2 + se*4 + sw*8;
            if (remap[cr31] === undefined) {
                remap[cr31] = srcIdx;
            } else {
                conflicts.push({ cr31, kept: remap[cr31], dropped: srcIdx });
            }
        }
        // Preenche buracos com srcIdx == cr31 (fallback identidade)
        let filled = 0, moved = 0;
        for (let i = 0; i < 16; i++) {
            if (remap[i] === undefined) remap[i] = i;
            else filled++;
            if (remap[i] !== i) moved++;
        }
        console.log(
            `[WANG SORT] ${style}: ${moved} moved · ${filled}/16 classified · ${conflicts.length} conflicts ·`,
            `lower=rgb(${lowerRef.map(v => Math.round(v)).join(',')})`,
            `upper=rgb(${upperRef.map(v => Math.round(v)).join(',')})`
        );
        if (conflicts.length) console.log('[WANG SORT] conflicts:', conflicts);
        this._wangRemap[style] = remap;
        return remap;
    }

});
