// 04_scenery.js — Scenery: terreno procedural via Cellular Automata + obstáculos + corrals
// Layered overlap: 4 camadas de altitude (water/sand/grass/dirt) renderizadas as
// polígonos orgânicos oversize. Cells adjacentes do same nível fundem visualmente.
Object.assign(Jogo.prototype, {

    _setupScenery(W, H) {
        const CELL = 80;
        const COLS = Math.ceil(W / CELL);
        const ROWS = Math.ceil(H / CELL);

        // Procedural cfg via debug menu OU map preset salvo no PixaPro.
        // Se proc.activeMap setado E _activeMapConfig carregado pelo flow
        // assincrono em _scenery_loadMapAsync, usa esses valores. Caso
        // contrario usa sliders live do dbg.proc.
        const proc = this.dbg?.proc || {};
        const mapCfg = this._activeMapConfig || {};
        const SEED_WATER = mapCfg.seedWater ?? proc.seedWater ?? 0.10;
        const SEED_SAND  = mapCfg.seedSand  ?? proc.seedSand  ?? 0.18;
        const SEED_GRASS = mapCfg.seedGrass ?? proc.seedGrass ?? 0.40;
        const CA_PASSES  = mapCfg.caPasses  ?? proc.caPasses  ?? 3;

        // ── 1. SEED RANDOM com pesos balanceados (todos os 4 tipos visiveis)
        // Valores defaults: 10% water + 18% sand + 40% grass + 32% dirt
        let grid = [];
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
                    // Pega o tipo com mais votos (tiebreak: tipo atual ou maior id)
                    let best = grid[y][x], bestCount = -1;
                    for (let t = 0; t < 4; t++) {
                        if (counts[t] > bestCount) { bestCount = counts[t]; best = t; }
                    }
                    next[y][x] = best;
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
            // Wang tiles cr31 corner convention (mesma do PixaPro):
            //   NW=1, NE=2, SE=4, SW=8 -> bits = nw + ne*2 + se*4 + sw*8
            // ANTES o codigo usava NE=1, NW=8 (rotacionado). Cantos eram derivados
            // do cell grid via "majoria de grass" -- com CA convergindo tudo pra
            // grass, todos os cantos viravam 1 e todo tile = 15.
            //
            // Agora: gera um VERTEX GRID binario direto (lower=0, upper=1) via
            // white noise + CA opcional (mesma logica do PixaPro generateTerrainGrid).
            const CW = COLS + 1, CH = ROWS + 1;
            const VERT_THRESHOLD = mapCfg.vertThreshold ?? proc.vertThreshold ?? 0.50;
            const VERT_CA_PASSES = mapCfg.vertCaPasses ?? proc.vertCaPasses ?? 4;
            const corners = [];
            for (let y = 0; y < CH; y++) {
                corners[y] = [];
                for (let x = 0; x < CW; x++) {
                    corners[y][x] = Math.random() < VERT_THRESHOLD ? 1 : 0;
                }
            }
            // CA majoritario no vertex grid (preserva blobs naturais)
            for (let pass = 0; pass < VERT_CA_PASSES; pass++) {
                const next = [];
                for (let y = 0; y < CH; y++) {
                    next[y] = [];
                    for (let x = 0; x < CW; x++) {
                        let count = 0, total = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const ny = y+dy, nx = x+dx;
                                if (ny<0 || ny>=CH || nx<0 || nx>=CW) {
                                    // borda: conta como 1 (upper) -- evita ilhas de
                                    // lower nas bordas. PixaPro faz igual.
                                    count++; total++; continue;
                                }
                                count += corners[ny][nx];
                                total++;
                            }
                        }
                        next[y][x] = count >= Math.ceil(total/2) ? 1 : 0;
                    }
                }
                for (let y = 0; y < CH; y++) corners[y] = next[y];
            }
            // Cell (x,y) reads seus 4 cantos:
            //   NW = corners[y][x],  NE = corners[y][x+1]
            //   SW = corners[y+1][x], SE = corners[y+1][x+1]
            // Bits cr31 (PixaPro convention): NW=1, NE=2, SE=4, SW=8
            // tileStyle: 'test' (placeholder), 'dirt_grass_32' ou 'ocean_sand_32'
            const style = this.dbg?.fx?.tileStyle;
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
            // Salva tile indices pra _renderWangDebug usar (toggle live)
            this._wangIndices = [];
            for (let y = 0; y < ROWS; y++) {
                this._wangIndices[y] = [];
                for (let x = 0; x < COLS; x++) {
                    const nw = corners[y][x],     ne = corners[y][x+1];
                    const sw = corners[y+1][x],   se = corners[y+1][x+1];
                    // cr31 convention (PixaPro): NW=1, NE=2, SE=4, SW=8
                    const idx = nw + ne*2 + se*4 + sw*8;
                    this._wangIndices[y][x] = idx;
                    // Se ha remap (auto-sort), substitui idx pelo srcIdx correto
                    const srcIdx = remap ? remap[idx] : idx;
                    const f = String(srcIdx).padStart(2, '0');
                    const key = useStyle ? `wang_${style}_${f}` : `wang_${f}`;
                    this.add.image(x*CELL + CELL/2, y*CELL + CELL/2, key)
                        .setDisplaySize(CELL, CELL).setDepth(0);
                }
            }
            // Re-render overlay caso ja estivesse on antes do scenery
            if (this.dbg?.fx?.wangDebug) this._renderWangDebug();
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
            const myR = 32 * sc * 0.85;  // radius de bounding circle (source 64×64) — 0.85 allows leve overlap
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
        // without collision (decorativos puros), depth 1.4 to ficar below de personagens
        const landmarks = ['nat_obj_church', 'nat_obj_windmill', 'nat_obj_old_truck', 'nat_obj_satellite_dish_rusty'];
        const LM_SCALE = { nat_obj_church: 2.6, nat_obj_windmill: 2.4, nat_obj_old_truck: 2.0, nat_obj_satellite_dish_rusty: 2.0 };
        const lmPlaced = [];
        const truckSpots = [];  // pra spawnar gas_cans atrelados ao truck (5c)
        for (const lm of landmarks) {
            for (let tries = 0; tries < 20; tries++) {
                const cx = Phaser.Math.Between(800, W-800);
                const cy = Phaser.Math.Between(800, H-800);
                if (!isLand(cx, cy)) continue;
                const tooClose = lmPlaced.some(p => Phaser.Math.Distance.Between(cx, cy, p.x, p.y) < 1500);
                if (tooClose) continue;
                lmPlaced.push({x: cx, y: cy});
                const lmScale = LM_SCALE[lm] || 2.0;
                this.add.image(cx, cy, lm).setScale(lmScale).setDepth(1.4);
                if (lm === 'nat_obj_old_truck') truckSpots.push({ x: cx, y: cy, scale: lmScale });
                // Track to sistema de quips (proximity check em 20_quips.js)
                if (!this._landmarkPositions) this._landmarkPositions = [];
                this._landmarkPositions.push({ x: cx, y: cy, key: lm });
                break;
            }
        }

        // ── 5c. GAS CANS — sempre atrelados a um truck (visualmente associados)
        // Tamanho proporcional ao truck (~35% do scale do truck) + tint marrom
        // pra harmonizar com a paleta do old_truck (cor enferrujada)
        for (const t of truckSpots) {
            const n = Phaser.Math.Between(1, 3);
            const gasScale = t.scale * 0.35;
            for (let j = 0; j < n; j++) {
                const angj = Math.random() * Math.PI * 2;
                const rr   = 60 + Math.random() * 40;  // 60-100px do truck
                const px = t.x + Math.cos(angj) * rr;
                const py = t.y + Math.sin(angj) * rr;
                this.add.image(px, py, 'nat_obj_gas_can')
                    .setScale(gasScale * (0.9 + Math.random() * 0.2))
                    .setTint(0xc88a5a)  // marrom-laranja pra casar com truck enferrujado
                    .setDepth(1.5);
            }
        }

        // ── 5c-2. BARRELS RUSTY — cluster random independente (mantem variedade)
        for (let i = 0; i < 3; i++) {
            for (let tries = 0; tries < 8; tries++) {
                const cx = Phaser.Math.Between(500, W-500);
                const cy = Phaser.Math.Between(500, H-500);
                if (!isLand(cx, cy)) continue;
                const n = Phaser.Math.Between(2, 4);
                for (let j = 0; j < n; j++) {
                    const angj = Math.random() * Math.PI * 2;
                    const rr   = Math.random() * 50;
                    this.add.image(cx + Math.cos(angj)*rr, cy + Math.sin(angj)*rr, 'nat_obj_barrel_rusty')
                        .setScale(0.9 + Math.random()*0.3).setDepth(1.5);
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
        // Curral V2: sprite PixelLab 200x200 (substitui cercas procedural).
        // 5 variantes random + slotOffsetY pro burger row em 08_corrals._slotPos.
        const VARIANTS = [
            // mascotCfg: tipo (cow/ox), anim, posicao relativa ao curral, e se mostra balde
            { key: 'nat_obj_curral_01_pequeno',    displaySize: 240, slotOffsetY: 130, gateOpen: true,  name: 'pequeno_quadrado',
              mascotCfg: { tipo: 'cow', anim: 'cow_eat_S',  dx: -14, dy:  0, bucket: true } },
            { key: 'nat_obj_curral_02_redondo',    displaySize: 260, slotOffsetY: 140, gateOpen: true,  name: 'redondo_feno',
              mascotCfg: { tipo: 'cow', anim: 'cow_eat_S',  dx: -14, dy:  0, bucket: true } },
            // hexagonal: tem coxo (water trough) ao norte -> boi/vaca bebendo agua, facing N
            { key: 'nat_obj_curral_03_hexagonal',  displaySize: 280, slotOffsetY: 150, gateOpen: true,  name: 'hexagonal_ornamental',
              mascotCfg: { tipo: 'cow', anim: 'cow_eat_N',  dx:  0,  dy: 24, bucket: false } },
            // rustico_pedra: cow deitada (lie_down anim) — feno ja no sprite
            { key: 'nat_obj_curral_04_rustico',    displaySize: 250, slotOffsetY: 135, gateOpen: true,  name: 'rustico_pedra',
              mascotCfg: { tipo: 'cow', anim: 'cow_angry_S', dx: -10, dy: 5, bucket: false } },
            { key: 'nat_obj_curral_05_abandonado', displaySize: 260, slotOffsetY: 140, gateOpen: false, name: 'abandonado',
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
        // Carrega texture 00 (all-lower) e 15 (all-upper) pra ref de cor
        const sampleCorners = (idx) => {
            const f = String(idx).padStart(2, '0');
            const tex = this.textures.get(`wang_${style}_${f}`);
            if (!tex || !tex.source || !tex.source[0]) return null;
            const src = tex.source[0].image;
            if (!src) return null;
            const cv = document.createElement('canvas');
            cv.width = src.width; cv.height = src.height;
            const ctx = cv.getContext('2d');
            ctx.drawImage(src, 0, 0);
            const m = Math.max(1, Math.floor(src.width * 0.10));  // 10% de margem
            const px = (x, y) => {
                const d = ctx.getImageData(x, y, 1, 1).data;
                return [d[0], d[1], d[2]];
            };
            return {
                NW: px(m, m),
                NE: px(src.width - 1 - m, m),
                SE: px(src.width - 1 - m, src.height - 1 - m),
                SW: px(m, src.height - 1 - m),
            };
        };
        // Amostra todos 16 tiles
        const samples = [];
        for (let i = 0; i < 16; i++) samples.push(sampleCorners(i));
        // Refs: tile 0 = lower (todos os 4 cantos), tile 15 = upper
        if (!samples[0] || !samples[15]) {
            console.warn('[WANG AUTO-SORT] sem refs (00 ou 15 missing) -- skip');
            return null;
        }
        const avg = (s) => {
            const r = (s.NW[0]+s.NE[0]+s.SE[0]+s.SW[0])/4;
            const g = (s.NW[1]+s.NE[1]+s.SE[1]+s.SW[1])/4;
            const b = (s.NW[2]+s.NE[2]+s.SE[2]+s.SW[2])/4;
            return [r, g, b];
        };
        const lowerRef = avg(samples[0]);
        const upperRef = avg(samples[15]);
        const dist = (a, b) =>
            (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2;
        const classify = (rgb) => dist(rgb, upperRef) < dist(rgb, lowerRef) ? 1 : 0;
        // Pra cada src tile, computa cr31 bits que ele realmente representa
        const remap = new Array(16);  // remap[cr31Bits] = srcIdx
        for (let srcIdx = 0; srcIdx < 16; srcIdx++) {
            const s = samples[srcIdx];
            if (!s) continue;
            const nw = classify(s.NW);
            const ne = classify(s.NE);
            const se = classify(s.SE);
            const sw = classify(s.SW);
            const cr31 = nw + ne*2 + se*4 + sw*8;
            // Primeira ocorrencia ganha a posicao (resolve duplicatas)
            if (remap[cr31] === undefined) remap[cr31] = srcIdx;
        }
        // Preenche buracos com srcIdx == cr31 (fallback identidade)
        let moved = 0;
        for (let i = 0; i < 16; i++) {
            if (remap[i] === undefined) remap[i] = i;
            if (remap[i] !== i) moved++;
        }
        console.log(`[WANG AUTO-SORT] ${style}: ${moved} tiles remapeados`,
                    remap.map((v, i) => i !== v ? `${i}<-${v}` : null).filter(Boolean));
        this._wangRemap[style] = remap;
        return remap;
    }

});
