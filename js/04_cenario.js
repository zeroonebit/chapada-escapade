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

        // ── 3. RENDER via fragment shader (DESLIGADO temporariamente — pode estar travando)
        // Fallback: solid color baseado em altitude majoritária (grama)
        this.add.rectangle(W/2, H/2, W, H, 0x6e9b3a).setDepth(0);
        // Manchas de terra pra ter alguma variação visual
        const terraGfx = this.add.graphics().setDepth(0.1);
        terraGfx.fillStyle(0xa06848, 1);
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (grid[y][x] === 3) {
                    terraGfx.fillCircle(x*CELL + CELL/2, y*CELL + CELL/2, CELL*0.55);
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
