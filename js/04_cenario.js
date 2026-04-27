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

        // ── 3. RENDER em camadas (layered overlap)
        // Base água ocupa o mapa inteiro — outros terrenos pintam por cima onde altitude >= layer
        this.add.rectangle(W/2, H/2, W, H, 0x3a7aa0).setDepth(0);
        // Reflexo de água — pequenas ondulações
        const waterFx = this.add.graphics().setDepth(0.01);
        waterFx.fillStyle(0x5a9bc4, 0.25);
        for (let i = 0; i < 80; i++) {
            const wx = Math.random()*W, wy = Math.random()*H;
            waterFx.fillEllipse(wx, wy, 18 + Math.random()*22, 4);
        }

        // Função pra desenhar polígono wobbly (orgânico) numa célula
        const noise = (a, seed) =>
              Math.sin(a*3 + seed)        * 0.10
            + Math.sin(a*5 + seed*1.7)    * 0.06
            + Math.sin(a*7 + seed*2.3)    * 0.04;

        const drawWobblyCell = (gfx, cx, cy, baseR, seed) => {
            const SEG = 12;
            gfx.beginPath();
            for (let i = 0; i <= SEG; i++) {
                const a = (i / SEG) * Math.PI * 2;
                const r = baseR * (1 + noise(a, seed));
                const px = cx + Math.cos(a) * r;
                const py = cy + Math.sin(a) * r;
                if (i === 0) gfx.moveTo(px, py); else gfx.lineTo(px, py);
            }
            gfx.closePath();
            gfx.fillPath();
        };

        // ── WANG TILE RENDERING (substitui o layered overlap antigo) ──
        // Para cada cell, calcula bitmask Wang (TL TR BL BR) baseado em
        // self + 3 vizinhos (right, below, down-right). Bit=1 quando altitude>=2 (grama).
        const grassBit = (gx, gy) => {
            if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return 0;
            return grid[gy][gx] >= 2 ? 1 : 0;
        };

        // Fallback pra patterns não geradas (diagonais 0110/1001)
        const PATTERN_FALLBACK = { '0110': '0011', '1001': '1100' };
        const tileExists = (key) => this.textures.exists(key);

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const tl = grassBit(x,   y);
                const tr = grassBit(x+1, y);
                const bl = grassBit(x,   y+1);
                const br = grassBit(x+1, y+1);
                let pattern = `${tl}${tr}${bl}${br}`;
                let tileKey = `wang_${pattern}`;
                if (!tileExists(tileKey) && PATTERN_FALLBACK[pattern]) {
                    tileKey = `wang_${PATTERN_FALLBACK[pattern]}`;
                }
                if (!tileExists(tileKey)) tileKey = `wang_0000`; // fallback final
                const cx = x * CELL + CELL/2;
                const cy = y * CELL + CELL/2;
                // +2 px de overlap pra evitar gap de antialiasing
                this.add.image(cx, cy, tileKey).setDisplaySize(CELL+2, CELL+2).setDepth(0.2);
            }
        }

        // (Tufos decorativos removidos — agora vêm baked dentro dos Wang tiles)

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
        for (let i = 0; i < 16; i++) {
            for (let tries = 0; tries < 8; tries++) {
                const cx = Phaser.Math.Between(300, W-300);
                const cy = Phaser.Math.Between(300, H-300);
                if (!isLand(cx, cy)) continue;
                if (Math.random() > 0.5) {
                    for (let j = 0; j < 5; j++) {
                        const r = Math.random()*80, a = Math.random()*Math.PI*2;
                        const ox = cx + Math.cos(a)*r, oy = cy + Math.sin(a)*r;
                        if (!isLand(ox, oy)) continue;
                        const o = this.matter.add.image(ox, oy, 'moita', null, {isStatic:true, shape:'circle'});
                        o.setDepth(1).setScale(Phaser.Math.FloatBetween(0.8,1.5)).body.label = 'moita';
                    }
                } else {
                    for (let j = 0; j < 3; j++) {
                        const r = Math.random()*60, a = Math.random()*Math.PI*2, s = Phaser.Math.FloatBetween(1.0,2.5);
                        const ox = cx + Math.cos(a)*r, oy = cy + Math.sin(a)*r;
                        if (!isLand(ox, oy)) continue;
                        const o = this.matter.add.image(ox, oy, 'rocha_organica', null, {isStatic:true, shape:'circle'});
                        o.setDepth(1).setScale(s).body.label = 'rocha';
                    }
                }
                break;
            }
        }

        // ── 6. CURRAIS (em terra firme)
        this.currais = [];
        this.driveThrus = this.currais;
        for (let i = 0; i < 5; i++) {
            for (let tries = 0; tries < 12; tries++) {
                const cx = Phaser.Math.Between(400, W-400);
                const cy = Phaser.Math.Between(400, H-400);
                if (!isLand(cx, cy)) continue;
                const img = this.add.image(cx, cy, 'curral').setDepth(1);
                this.add.text(cx, cy, 'CRL', {fontSize:'14px', fill:'#1a0800', fontStyle:'bold'}).setOrigin(0.5).setDepth(2);
                this.currais.push({ x: cx, y: cy, sprite: img, processing: [], ready: [] });
                break;
            }
        }
    }

});
