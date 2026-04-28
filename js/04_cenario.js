// 04_cenario.js — Cenário: terreno procedural via Cellular Automata + obstáculos + currais
// Layered overlap: 4 camadas de altitude (água/areia/grama/terra) renderizadas como
// polígonos orgânicos oversize. Cells adjacentes do mesmo nível fundem visualmente.
Object.assign(Jogo.prototype, {

    _setupCenario(W, H) {
        const CELL = 80;
        const COLS = Math.ceil(W / CELL);
        const ROWS = Math.ceil(H / CELL);

        // ── 1. SEED RANDOM com pesos: 6% água, 14% areia, 50% grama, 30% terra
        let grid = [];
        for (let y = 0; y < ROWS; y++) {
            grid[y] = [];
            for (let x = 0; x < COLS; x++) {
                const r = Math.random();
                if (r < 0.06)      grid[y][x] = 0;  // água
                else if (r < 0.20) grid[y][x] = 1;  // areia
                else if (r < 0.70) grid[y][x] = 2;  // grama
                else               grid[y][x] = 3;  // terra
            }
        }

        // ── 2. SMOOTHING: 5 passes de média 3×3 arredondada (cellular automata)
        for (let pass = 0; pass < 5; pass++) {
            const next = [];
            for (let y = 0; y < ROWS; y++) {
                next[y] = [];
                for (let x = 0; x < COLS; x++) {
                    let sum = 0, count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y + dy, nx = x + dx;
                            if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
                            sum += grid[ny][nx];
                            count++;
                        }
                    }
                    next[y][x] = Math.round(sum / count);
                }
            }
            grid = next;
        }

        // Salva grid pra detecção de grama nas vacas
        this.terrainGrid = grid;
        this.terrainCell = CELL;

        // ── 3. RENDER ─────────────────────────────────────────────────
        const useWang = this.dbg?.fx?.wangtiles;
        if (useWang) {
            // Wang tiles cr31 corner convention.
            // Convenção tools/wang_test_palette.py: NE=1, SE=2, SW=4, NW=8.
            // Cada CELL é renderizada com 4 cantos compartilhados com vizinhos.
            // Construímos um corner grid (COLS+1)×(ROWS+1) — não é o cell grid,
            // são os cantos entre cells. Fica robusto: cantos compartilhados sempre
            // batem entre cells vizinhas (sem costura).
            const CW = COLS + 1, CH = ROWS + 1;
            // Canto = 1 (UPPER, grama verde) só se a maioria dos 4 cells ao redor é
            // PURO grass (===2). Sand/water/terra todos contam como 0 (LOWER, areia).
            // Isso evita o bug "tudo idx=15" quando grass+terra dominavam o grid.
            const corners = [];
            for (let y = 0; y < CH; y++) {
                corners[y] = [];
                for (let x = 0; x < CW; x++) {
                    let hi = 0, total = 0;
                    for (let dy = -1; dy <= 0; dy++) {
                        for (let dx = -1; dx <= 0; dx++) {
                            const cy = y + dy, cx = x + dx;
                            if (cy < 0 || cy >= ROWS || cx < 0 || cx >= COLS) continue;
                            total++;
                            if (grid[cy][cx] === 2) hi++;
                        }
                    }
                    // 50%+ de pureza pra ser upper
                    corners[y][x] = (total > 0 && hi * 2 >= total) ? 1 : 0;
                }
            }
            // Pass extra de smoothing nos cantos pra fechar manchas isoladas
            for (let pass = 0; pass < 2; pass++) {
                const next = [];
                for (let y = 0; y < CH; y++) {
                    next[y] = [];
                    for (let x = 0; x < CW; x++) {
                        let s = 0, c = 0;
                        for (let dy = -1; dy <= 1; dy++)
                            for (let dx = -1; dx <= 1; dx++) {
                                const ny = y+dy, nx = x+dx;
                                if (ny<0||ny>=CH||nx<0||nx>=CW) continue;
                                s += corners[ny][nx]; c++;
                            }
                        next[y][x] = (s/c) >= 0.5 ? 1 : 0;
                    }
                }
                corners.length = 0; corners.push(...next);
            }
            // Cell (x,y) lê seus 4 cantos:
            //   NW = corners[y][x],  NE = corners[y][x+1]
            //   SW = corners[y+1][x], SE = corners[y+1][x+1]
            // Bits cr31: NE=1, SE=2, SW=4, NW=8
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const nw = corners[y][x],     ne = corners[y][x+1];
                    const sw = corners[y+1][x],   se = corners[y+1][x+1];
                    const idx = (ne * 1) | (se * 2) | (sw * 4) | (nw * 8);
                    const f = String(idx).padStart(2, '0');
                    this.add.image(x*CELL + CELL/2, y*CELL + CELL/2, `wang_${f}`)
                        .setDisplaySize(CELL, CELL).setDepth(0);
                }
            }
        } else {
            // Fallback: solid color verde + manchas de terra
            this.add.rectangle(W/2, H/2, W, H, 0x6e9b3a).setDepth(0);
            const terraGfx = this.add.graphics().setDepth(0.1);
            terraGfx.fillStyle(0xa06848, 1);
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (grid[y][x] === 3) {
                        terraGfx.fillCircle(x*CELL + CELL/2, y*CELL + CELL/2, CELL*0.55);
                    }
                }
            }
        }
        // this._setupTerrainShader(W, H);  // re-habilitar quando confirmar não trava

        // Mantém função de noise pra compat (algumas funções consultam this._noiseR)
        const noise = (a, seed) =>
              Math.sin(a*3 + seed)        * 0.10
            + Math.sin(a*5 + seed*1.7)    * 0.06
            + Math.sin(a*7 + seed*2.3)    * 0.04;

        // ── 4. GRASS PATCHES — gera pontos de grama pra IA de fuga das vacas
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

        // ── 5. OBSTÁCULOS (preferem terra/grama, evitam água)
        const isLand = (px, py) => {
            const cx = Math.floor(px / CELL);
            const cy = Math.floor(py / CELL);
            if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
            return grid[cy][cx] >= 1;  // areia ou acima
        };
        // Pools de assets PixelLab carregados em preload (nat_vege_* e nat_pedra_*)
        const vegeKeys   = this._natureVegeKeys   || [];
        const pedrasKeys = this._naturePedrasKeys || [];
        const pickV = () => vegeKeys[Phaser.Math.Between(0, vegeKeys.length - 1)];
        const pickP = () => pedrasKeys[Phaser.Math.Between(0, pedrasKeys.length - 1)];

        // Scale BASE por asset — sources são 64×64 mas conteúdo varia muito
        // (saguaro alto preenche todo, agave preenche pouco). Map manual + jitter ±15%.
        const SCALE_MAP = {
            // pedras
            'boulder_red_cluster': 1.6,   // cluster largo
            'rock_small_smooth':   1.0,   // pedrinha
            'rock_pillar_tall':    1.9,   // formação alta
            // vegetação — saguaros e clusters maiores, dead/dry menores
            'cactus_saguaro_tall': 2.0,
            'cactus_saguaro_2':    1.9,
            'cactus_branching':    1.7,
            'cactus_medium':       1.3,
            'cactus_cluster_low':  1.4,
            'cactus_dead_dry':     1.0,
            'cactus_dead_vine':    1.0,
            'agave_dark':          1.3,
            'bush_round_dense':    1.5,
            'bush_round':          1.4,
            'bush_dry':            0.9,
            'patch_cluster':       1.6,
        };
        const scaleFor = (texKey) => {
            const name = texKey.replace(/^nat_(pedra|vege)_/, '');
            const base = SCALE_MAP[name] || 1.0;
            return base * Phaser.Math.FloatBetween(0.85, 1.15);
        };

        // Coloca uma peça testando overlap (até 12 tentativas), retorna true se conseguiu
        const placed = [];
        const tryPlace = (cx0, cy0, spread, tex, label) => {
            const sc = scaleFor(tex);
            const myR = 32 * sc * 0.85;  // raio de bounding circle (source 64×64) — 0.85 permite leve overlap
            for (let att = 0; att < 12; att++) {
                const rr = Math.random() * spread, aa = Math.random() * Math.PI * 2;
                const ox = cx0 + Math.cos(aa) * rr, oy = cy0 + Math.sin(aa) * rr;
                if (!isLand(ox, oy)) continue;
                // Checa contra TODAS as peças já colocadas (não só do cluster atual)
                let collides = false;
                for (const p of placed) {
                    const dx = p.x - ox, dy = p.y - oy;
                    if ((dx*dx + dy*dy) < (p.r + myR) * (p.r + myR)) { collides = true; break; }
                }
                if (collides) continue;
                placed.push({ x: ox, y: oy, r: myR });
                const o = this.matter.add.image(ox, oy, tex, null, {isStatic:true, shape:'circle'});
                o.setDepth(1).setScale(sc).body.label = label;
                return true;
            }
            return false;
        };

        for (let i = 0; i < 18; i++) {
            for (let tries = 0; tries < 8; tries++) {
                const cx = Phaser.Math.Between(300, W-300);
                const cy = Phaser.Math.Between(300, H-300);
                if (!isLand(cx, cy)) continue;
                if (Math.random() > 0.5) {
                    // Cluster de vegetação — 5 peças em ~90px de spread
                    for (let j = 0; j < 5; j++) tryPlace(cx, cy, 90, pickV() || 'moita', 'moita');
                } else {
                    // Cluster de pedras — 3 peças em ~70px de spread
                    for (let j = 0; j < 3; j++) tryPlace(cx, cy, 70, pickP() || 'rocha_organica', 'rocha');
                }
                break;
            }
        }

        // ── 6. CURRAIS (em terra firme)
        this.currais = [];
        this.driveThrus = this.currais;
        // Currais SÓ em cells de terra (grid===3) — área marrom, fora da grama
        const isTerra = (px, py) => {
            const cx = Math.floor(px / CELL);
            const cy = Math.floor(py / CELL);
            if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
            return grid[cy][cx] === 3;
        };
        for (let i = 0; i < 5; i++) {
            for (let tries = 0; tries < 30; tries++) {
                const cx = Phaser.Math.Between(500, W-500);
                const cy = Phaser.Math.Between(500, H-500);
                if (!isTerra(cx, cy)) continue;
                this._construirCurral(cx, cy);
                break;
            }
        }
    },

    _construirCurral(cx, cy) {
        const W2 = 110, H2 = 90;        // half-extents do retângulo (curral 220×180)
        const FENCE_SIZE = 60;          // tamanho visual de cada peça de cerca
        const SEG = 56;                 // espaçamento entre peças

        // Marcador central (texto "CRL" pra debug visual)
        this.add.rectangle(cx, cy, W2*1.6, H2*1.6, 0x6e9b3a, 0.0).setDepth(0.5);
        this.add.text(cx, cy, 'CRL', {
            fontSize:'14px', fill:'#1a0800', fontStyle:'bold'
        }).setOrigin(0.5).setDepth(2);

        // Helper: posiciona uma cerca como matter static
        const placeFence = (x, y, key, scale = 1.0, angle = 0) => {
            const o = this.matter.add.image(x, y, key, null,
                { isStatic: true, shape: { type:'rectangle', width: FENCE_SIZE*0.9, height: FENCE_SIZE*0.5 } });
            o.setDepth(1).setScale(scale).setAngle(angle);
            o.body.label = 'cerca';
        };

        // Lado norte (top): fence_long alinhado horizontal
        for (let x = -W2 + SEG/2; x < W2; x += SEG) {
            placeFence(cx + x, cy - H2, 'nat_cerca_fence_long', 1.0, 0);
        }
        // Lado sul (bottom): SEMPRE com porta aberta no centro (sem colisão)
        // Pula 2 segmentos centrais pra criar abertura larga; gate visual só
        for (let x = -W2 + SEG/2; x < W2; x += SEG) {
            const inGate = Math.abs(x) < SEG;  // 2 segments wide door
            if (inGate) {
                if (Math.abs(x) < SEG/2) {
                    // Visual da porta aberta — sem matter body, vacas atravessam
                    this.add.image(cx + x, cy + H2, 'nat_cerca_fence_gate_open').setDepth(1);
                }
                continue; // pula colisão nessa região
            }
            placeFence(cx + x, cy + H2, 'nat_cerca_fence_long', 1.0, 0);
        }
        // Lados leste/oeste: rotaciona 90° pra ficar vertical
        for (let y = -H2 + SEG/2; y < H2; y += SEG) {
            placeFence(cx - W2, cy + y, 'nat_cerca_fence_long', 1.0, 90);
            placeFence(cx + W2, cy + y, 'nat_cerca_fence_long', 1.0, 90);
        }
        // Cantos com post_thin
        placeFence(cx - W2, cy - H2, 'nat_cerca_post_thin', 1.0, 0);
        placeFence(cx + W2, cy - H2, 'nat_cerca_post_thin', 1.0, 0);
        placeFence(cx - W2, cy + H2, 'nat_cerca_post_thin', 1.0, 0);
        placeFence(cx + W2, cy + H2, 'nat_cerca_post_thin', 1.0, 0);

        this.currais.push({ x: cx, y: cy, sprite: null, processing: [], ready: [] });
    }

});
