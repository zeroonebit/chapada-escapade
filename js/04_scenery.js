// 04_cenario.js — Cenário: terreno procedural via Cellular Automata + obstáculos + currais
// Layered overlap: 4 camadas de altitude (água/areia/grama/terra) renderizadas como
// polígonos orgânicos oversize. Cells adjacentes do mesmo nível fundem visualmente.
Object.assign(Jogo.prototype, {

    _setupScenery(W, H) {
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
            // Wang tiles cr31 corner convention (standard):
            //   NW=1, NE=2, SE=4, SW=8  (1 = upper terrain)
            // Cada CELL é renderizada com 4 cantos compartilhados com vizinhos.
            // Construímos um corner grid (COLS+1)×(ROWS+1) — cantos compartilhados
            // sempre batem entre cells vizinhas (sem costura).
            const CW = COLS + 1, CH = ROWS + 1;
            // Canto = 1 (UPPER, grama verde) só se a maioria dos 4 cells ao redor é
            // PURO grass (===2). Sand/water/terra todos contam como 0 (LOWER, areia).
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
            // Bits cr31: NW=1, NE=2, SE=4, SW=8
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const nw = corners[y][x],     ne = corners[y][x+1];
                    const sw = corners[y+1][x],   se = corners[y+1][x+1];
                    const idx = (nw * 1) | (ne * 2) | (se * 4) | (sw * 8);
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

        // ── 4. GRASS PATCHES — gera points de grama pra IA de fuga das vacas
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
        const rocksKeys = this._naturePedrasKeys || [];
        const pickV = () => vegeKeys[Phaser.Math.Between(0, vegeKeys.length - 1)];
        const pickP = () => rocksKeys[Phaser.Math.Between(0, rocksKeys.length - 1)];

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
                    for (let j = 0; j < 5; j++) tryPlace(cx, cy, 90, pickV() || 'moita', 'moita');
                } else {
                    for (let j = 0; j < 3; j++) tryPlace(cx, cy, 70, pickP() || 'rocha_organica', 'rocha');
                }
                break;
            }
        }

        // ── 5b. LANDMARKS V3 (objects) — 1 cada, distantes entre si
        // church, windmill, old_truck, satellite_dish_rusty
        // Sem colisão (decorativos puros), depth 1.4 pra ficar abaixo de personagens
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
                break;
            }
        }

        // ── 5c. PROPS INDUSTRIAIS (gas_can, barrel_rusty) em cluster pequeno
        // 3-4 spots no mapa, cada um com 2-3 props
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

        // ── 5d. DRY TURF patches (chão seco amarelado) — 8 spots aleatórios em terra
        for (let i = 0; i < 8; i++) {
            for (let tries = 0; tries < 5; tries++) {
                const cx = Phaser.Math.Between(400, W-400);
                const cy = Phaser.Math.Between(400, H-400);
                if (!isLand(cx, cy)) continue;
                this.add.image(cx, cy, 'nat_obj_dry_turf').setScale(1.5 + Math.random()*0.8).setDepth(0.65).setAlpha(0.85);
                break;
            }
        }

        // ── 5e. CERCAS DECORATIVAS (ruínas/postes esquecidos) — sem colisão
        // 14 spots aleatórios, com peças "broken/post" pra dar vibe rural abandonado
        // (assets ainda existem do sistema antigo de curral, agora reaproveitados como deco)
        const DECO_CERCAS = [
            'nat_cerca_fence_broken',     'nat_cerca_fence_corner',
            'nat_cerca_post_single',      'nat_cerca_post_thin',
            'nat_cerca_plank_v',          'nat_cerca_post_lantern_low',
            'nat_cerca_post_lantern_thin','nat_cerca_post_carved',
            'nat_cerca_post_thin_simple', 'nat_cerca_post_double_rope',
        ];
        const cercasAvail = DECO_CERCAS.filter(k => this.textures.exists(k));
        if (cercasAvail.length > 0) {
            for (let i = 0; i < 14; i++) {
                for (let tries = 0; tries < 8; tries++) {
                    const cx = Phaser.Math.Between(400, W-400);
                    const cy = Phaser.Math.Between(400, H-400);
                    if (!isLand(cx, cy)) continue;
                    // 60% spot único · 40% mini cluster de 2-3 peças
                    const isCluster = Math.random() < 0.4;
                    const n = isCluster ? Phaser.Math.Between(2, 3) : 1;
                    for (let j = 0; j < n; j++) {
                        const ang = Math.random() * Math.PI * 2;
                        const rr  = isCluster ? Math.random() * 36 : 0;
                        const px = cx + Math.cos(ang) * rr;
                        const py = cy + Math.sin(ang) * rr;
                        const tex = cercasAvail[Phaser.Math.Between(0, cercasAvail.length - 1)];
                        const angle = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 90 : -90);
                        this.add.image(px, py, tex)
                            .setScale(0.8 + Math.random()*0.4)
                            .setAngle(angle)
                            .setAlpha(0.85 + Math.random()*0.15)
                            .setDepth(1.4);
                    }
                    break;
                }
            }
        }

        // ── 6. CURRAIS (em terra firme)
        this.corrals = [];
        this.driveThrus = this.corrals;
        // Currais — qualquer posição válida (terra ou grama), longe das bordas
        // e com distância mínima entre si pra não sobrepor
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

    // Curral V2: sprite PixelLab 200×200 (substitui cercas procedural)
    // 5 variantes random (pequeno/redondo/hexagonal/rustico/abandonado)
    // Mascot/feno/balde/burger slots ainda procedural por cima (Option C)
    _buildCorral(cx, cy) {
        // Catálogo de variantes — cada um tem displaySize e slotOffsetY
        // (onde os 3 burger icons aparecem abaixo do gate visível do sprite)
        const VARIANTS = [
            { key: 'nat_obj_curral_01_pequeno',    displaySize: 240, slotOffsetY: 130, gateOpen: true,  name: 'pequeno_quadrado' },
            { key: 'nat_obj_curral_02_redondo',    displaySize: 260, slotOffsetY: 140, gateOpen: true,  name: 'redondo_feno' },
            { key: 'nat_obj_curral_03_hexagonal',  displaySize: 280, slotOffsetY: 150, gateOpen: true,  name: 'hexagonal_ornamental' },
            { key: 'nat_obj_curral_04_rustico',    displaySize: 250, slotOffsetY: 135, gateOpen: true,  name: 'rustico_pedra' },
            { key: 'nat_obj_curral_05_abandonado', displaySize: 260, slotOffsetY: 140, gateOpen: false, name: 'abandonado' },
        ];
        const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

        // Sprite do curral — depth 1.5 pra ficar abaixo de mascot/burgers (depth 1.9-40)
        // mas acima de chão/turf (depth 0.6-0.65)
        if (this.textures.exists(v.key)) {
            this.add.image(cx, cy, v.key)
                .setDisplaySize(v.displaySize, v.displaySize)
                .setDepth(1.5);
        } else {
            // Fallback: marker visual se sprite não carregou
            this.add.rectangle(cx, cy, 200, 200, 0x7a5230, 0.5).setDepth(0.6);
        }

        this.corrals.push({
            x: cx, y: cy, sprite: null, processing: [], ready: [],
            variant: v,
            slotOffsetY: v.slotOffsetY,  // override pra _slotPos em 08_curral.js
        });
    }

});
