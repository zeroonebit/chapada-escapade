// 04_scenery.js — Scenery: terreno procedural via Cellular Automata + obstáculos + corrals
// Layered overlap: 4 camadas de altitude (water/sand/grass/dirt) renderizadas as
// polígonos orgânicos oversize. Cells adjacentes do same nível fundem visualmente.
Object.assign(Jogo.prototype, {

    _setupScenery(W, H) {
        const CELL = 80;
        const COLS = Math.ceil(W / CELL);
        const ROWS = Math.ceil(H / CELL);

        // ── 1. SEED RANDOM with pesos: 6% water, 14% sand, 50% grass, 30% dirt
        let grid = [];
        for (let y = 0; y < ROWS; y++) {
            grid[y] = [];
            for (let x = 0; x < COLS; x++) {
                const r = Math.random();
                if (r < 0.06)      grid[y][x] = 0;  // water
                else if (r < 0.20) grid[y][x] = 1;  // sand
                else if (r < 0.70) grid[y][x] = 2;  // grass
                else               grid[y][x] = 3;  // dirt
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

        // Saves grid to detecção de grass nas cows
        this.terrainGrid = grid;
        this.terrainCell = CELL;

        // ── 3. RENDER ─────────────────────────────────────────────────
        const useWang = this.dbg?.fx?.wangtiles;
        if (useWang) {
            // Wang tiles cr31 corner convention.
            // Convenção tools/wang_test_palette.py: NE=1, SE=2, SW=4, NW=8.
            // each CELL is renderizada with 4 cantos compartilhados with vizinhos.
            // Construímos um corner grid (COLS+1)×(ROWS+1) — não is o cell grid,
            // são os cantos between cells. Fica robusto: cantos compartilhados always
            // batem between cells vizinhas (without costura).
            const CW = COLS + 1, CH = ROWS + 1;
            // Canto = 1 (UPPER, grass verde) only se a maioria dos 4 cells ao redor is
            // PURO grass (===2). Sand/water/dirt all contam as 0 (LOWER, sand).
            // this evita o bug "tudo idx=15" when grass+dirt dominavam o grid.
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
                    // 50%+ de pureza to ser upper
                    corners[y][x] = (total > 0 && hi * 2 >= total) ? 1 : 0;
                }
            }
            // Pass extra de smoothing nos cantos to fechar manchas isoladas
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
            // Cell (x,y) reads seus 4 cantos:
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
            // Fallback: solid color verde + manchas de dirt
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
        // this._setupTerrainShader(W, H);  // re-habilitar when confirmar não trava

        // Mantém função de noise to compat (algumas funções consultam this._noiseR)
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
        // esparsa (~25 small rocks + small cactus/bush) to nao ficar vazio.
        // Sem matter physics — sao puramente visuais (player nao colide).
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

        // ── 5. OBSTÁCULOS (preferem dirt/grass, evitam water)
        const isLand = (px, py) => {
            const cx = Math.floor(px / CELL);
            const cy = Math.floor(py / CELL);
            if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
            return grid[cy][cx] >= 1;  // sand ou above
        };
        // Pools de assets PixelLab carregados em preload (nat_vege_* e nat_pedra_*)
        const vegeKeys  = this._natureVegKeys   || [];
        const rocksKeys = this._natureRocksKeys || [];
        const pickV = () => vegeKeys[Phaser.Math.Between(0, vegeKeys.length - 1)];
        const pickP = () => rocksKeys[Phaser.Math.Between(0, rocksKeys.length - 1)];

        // Scale BASE by asset — sources são 64×64 mas conteúdo varia muito
        // (saguaro high preenche todo, agave preenche pouco). Map manual + jitter ±15%.
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
            // D+R2: prefixo atualizado pos refator (nat_pedra_/nat_vege_ -> nat_rock_/nat_veg_)
            const name = texKey.replace(/^nat_(rock|veg)_/, '');
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
                // Checa contra TODAS as peças já colocadas (não only do cluster atual)
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
                    for (let j = 0; j < 5; j++) tryPlace(cx, cy, 90, pickV() || 'bush', 'bush');
                } else {
                    for (let j = 0; j < 3; j++) tryPlace(cx, cy, 70, pickP() || 'rocha_organica', 'rock');
                }
                break;
            }
        }

        // ── 5b. LANDMARKS V3 (objects) — 1 each, distantes between si
        // church, windmill, old_truck, satellite_dish_rusty
        // Sem colisão (decorativos puros), depth 1.4 to ficar below de personagens
        const landmarks = ['nat_obj_church', 'nat_obj_windmill', 'nat_obj_old_truck', 'nat_obj_satellite_dish_rusty'];
        const LM_SCALE = { nat_obj_church: 2.6, nat_obj_windmill: 2.4, nat_obj_old_truck: 2.0, nat_obj_satellite_dish_rusty: 2.0 };
        const lmPlaced = [];
        for (const lm of landmarks) {
            for (let tries = 0; tries < 20; tries++) {
                const cx = Phaser.Math.Between(800, W-800);
                const cy = Phaser.Math.Between(800, H-800);
                if (!isLand(cx, cy)) continue;
                const tooClose = lmPlaced.some(p => Phaser.Math.Distance.Between(cx, cy, p.x, p.y) < 1500);
                if (tooClose) continue;
                lmPlaced.push({x: cx, y: cy});
                this.add.image(cx, cy, lm).setScale(LM_SCALE[lm] || 2.0).setDepth(1.4);
                // Track to sistema de quips (proximity check em 20_quips.js)
                if (!this._landmarkPositions) this._landmarkPositions = [];
                this._landmarkPositions.push({ x: cx, y: cy, key: lm });
                break;
            }
        }

        // ── 5c. PROPS INDUSTRIAIS (gas_can, barrel_rusty) em cluster small
        // 3-4 spots no map, each um with 2-3 props
        for (let i = 0; i < 4; i++) {
            for (let tries = 0; tries < 8; tries++) {
                const cx = Phaser.Math.Between(500, W-500);
                const cy = Phaser.Math.Between(500, H-500);
                if (!isLand(cx, cy)) continue;
                const n = Phaser.Math.Between(2, 4);
                for (let j = 0; j < n; j++) {
                    const angj = Math.random() * Math.PI * 2;
                    const rr   = Math.random() * 50;
                    const px = cx + Math.cos(angj) * rr;
                    const py = cy + Math.sin(angj) * rr;
                    const k = Math.random() < 0.5 ? 'nat_obj_gas_can' : 'nat_obj_barrel_rusty';
                    this.add.image(px, py, k).setScale(0.9 + Math.random()*0.3).setDepth(1.5);
                }
                break;
            }
        }

        // ── 5d. DRY TURF patches (chão seco amarelado) — 8 spots aleatórios em dirt
        for (let i = 0; i < 8; i++) {
            for (let tries = 0; tries < 5; tries++) {
                const cx = Phaser.Math.Between(400, W-400);
                const cy = Phaser.Math.Between(400, H-400);
                if (!isLand(cx, cy)) continue;
                this.add.image(cx, cy, 'nat_obj_dry_turf').setScale(1.5 + Math.random()*0.8).setDepth(0.65).setAlpha(0.85);
                break;
            }
        }

        // ── 6. corrals (em dirt firme)
        this.corrals = [];
        this.driveThrus = this.corrals;
        // Corrals — qualquer position válida (dirt ou grass), far das bordas
        // e with distance mínima between si to não sobrepor
        const corralPositions = [];
        const MIN_DIST = 800;
        for (let i = 0; i < 5; i++) {
            for (let tries = 0; tries < 50; tries++) {
                const cx = Phaser.Math.Between(600, W-600);
                const cy = Phaser.Math.Between(600, H-600);
                const tooClose = corralPositions.some(p =>
                    Phaser.Math.Distance.Between(cx, cy, p.x, p.y) < MIN_DIST
                );
                if (tooClose) continue;
                corralPositions.push({x: cx, y: cy});
                this._buildCorral(cx, cy);
                break;
            }
        }
    },

    // 4 variantes de corral aleatorias by spawn
    _buildCorral(cx, cy) {
        const VARIANTS = [
            // V1: padrao chapada (fence curved + tower ornamental + lanterna baixa, gate open)
            { side:'fence_curved_long', gate:'gate_open_double', corner:'tower_ornamental_thin',
              lantern:'post_lantern_low', size:'medio', gateOpen:true },
            // V2: rustico closed (fence curva curta + posts esculpidos + lanterna alta)
            { side:'fence_curved_short', gate:'gate_closed_solid', corner:'post_carved',
              lantern:'post_lantern_thin', size:'medio', gateOpen:false },
            // V3: large open duplo (fence curved long + cantos with posts duplos + lanterna baixa)
            { side:'fence_curved_long', gate:'gate_thin_double', corner:'post_double_rope',
              lantern:'post_lantern_low', size:'grande', gateOpen:true },
            // V4: small reto (fence dupla curta horizontal + posts simples + without lanterna)
            { side:'fence_double_short_h', gate:'gate_open_double', corner:'post_thin_simple',
              lantern:null, size:'pequeno', gateOpen:true },
        ];
        const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
        const SIZE_MAP = { pequeno:[100,80], medio:[120,96], grande:[150,120] };
        const [W2, H2] = SIZE_MAP[v.size];
        const SEG = 56;
        const SCALE = 0.9;

        // Chão de dirt
        this.add.rectangle(cx, cy, W2*2, H2*2, 0x7a5230, 0.38).setDepth(0.6);
        this.add.rectangle(cx, cy, W2*1.6, H2*1.5, 0x8b6535, 0.22).setDepth(0.61);

        const place = (x, y, key, scale = SCALE, angle = 0) => {
            this.add.image(x, y, `nat_fence_${key}`).setScale(scale).setAngle(angle).setDepth(1.5);
        };

        // Norte
        for (let x = -W2 + SEG/2; x < W2; x += SEG)
            place(cx + x, cy - H2, v.side);

        // Sul (gate always no centro, open ou closed)
        for (let x = -W2 + SEG/2; x < W2; x += SEG) {
            if (Math.abs(x) < SEG * 0.6) {
                place(cx + x, cy + H2, v.gate, SCALE * 1.2);
            } else {
                place(cx + x, cy + H2, v.side);
            }
        }

        // Leste/oeste rotacionados
        for (let y = -H2 + SEG/2; y < H2; y += SEG) {
            place(cx - W2, cy + y, v.side, SCALE, 90);
            place(cx + W2, cy + y, v.side, SCALE, 90);
        }

        // Cantos
        [[-W2,-H2],[W2,-H2],[-W2,H2],[W2,H2]].forEach(([ox,oy]) =>
            place(cx+ox, cy+oy, v.corner, SCALE * 1.1)
        );

        // Lanternas decorativas (opcional)
        if (v.lantern) {
            place(cx - SEG, cy + H2 + 10, v.lantern, SCALE * 0.8);
            place(cx + SEG, cy + H2 + 10, v.lantern, SCALE * 0.8);
        }

        this.corrals.push({
            x: cx, y: cy, sprite: null, processing: [], ready: [],
            variant: v
        });
    }

});
