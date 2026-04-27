// 04_cenario.js — Cenário: chão, grama (noise blobs), obstáculos e currais
Object.assign(Jogo.prototype, {

    _setupCenario(W, H) {
        // Chão base + grid
        this.add.rectangle(W/2, H/2, W, H, 0xb8a870).setDepth(0);
        let grid = this.add.graphics().setDepth(0);
        grid.lineStyle(1, 0xa89860, 0.3);
        for(let x=0; x<=W; x+=120) grid.lineBetween(x,0,x,H);
        for(let y=0; y<=H; y+=120) grid.lineBetween(0,y,W,y);
        this.add.rectangle(W/2, 600, W, 8, 0x5c3520).setDepth(1);

        // ── CAMPOS DE GRAMA (noise blobs, união boolean visual) ──────
        this.grassPatches = [];
        const SEGMENTS = 56;
        const noiseR = (a, seed) =>
              Math.sin(a*3 + seed)        * 0.14
            + Math.sin(a*5 + seed*1.7)    * 0.08
            + Math.sin(a*7 + seed*2.3)    * 0.05
            + Math.sin(a*11 + seed*3.1)   * 0.03;

        for (let i = 0; i < 4; i++) {
            this.grassPatches.push({
                x: Phaser.Math.Between(500, W-500),
                y: Phaser.Math.Between(500, H-500),
                r: Phaser.Math.Between(160, 240),
                seed: Math.random() * 1000
            });
        }

        const grassGfx = this.add.graphics().setDepth(0.3);
        // Fill base
        grassGfx.fillStyle(0x82b048, 1);
        for (const p of this.grassPatches) {
            grassGfx.beginPath();
            for (let i = 0; i <= SEGMENTS; i++) {
                const a = (i / SEGMENTS) * Math.PI * 2;
                const rr = p.r * (1 + noiseR(a, p.seed));
                const x = p.x + Math.cos(a)*rr, y = p.y + Math.sin(a)*rr;
                if (i === 0) grassGfx.moveTo(x, y); else grassGfx.lineTo(x, y);
            }
            grassGfx.closePath(); grassGfx.fillPath();
        }
        // Camada interna mais escura
        grassGfx.fillStyle(0x6e9b3a, 0.55);
        for (const p of this.grassPatches) {
            grassGfx.beginPath();
            for (let i = 0; i <= SEGMENTS; i++) {
                const a = (i / SEGMENTS) * Math.PI * 2;
                const rr = p.r * 0.78 * (1 + noiseR(a, p.seed + 10));
                const x = p.x + Math.cos(a)*rr, y = p.y + Math.sin(a)*rr;
                if (i === 0) grassGfx.moveTo(x, y); else grassGfx.lineTo(x, y);
            }
            grassGfx.closePath(); grassGfx.fillPath();
        }
        // Tufos
        for (const p of this.grassPatches) {
            const tufts = Math.floor(p.r / 7);
            grassGfx.fillStyle(0x4f7a22, 0.85);
            for (let j = 0; j < tufts; j++) {
                const a = Math.random()*Math.PI*2, rr = Math.random()*p.r*0.85;
                const px = p.x + Math.cos(a)*rr, py = p.y + Math.sin(a)*rr;
                grassGfx.fillTriangle(px-2, py+3, px+2, py+3, px, py-4);
            }
            grassGfx.fillStyle(0xb5d472, 0.6);
            for (let j = 0; j < tufts/2; j++) {
                const a = Math.random()*Math.PI*2, rr = Math.random()*p.r*0.8;
                const px = p.x + Math.cos(a)*rr, py = p.y + Math.sin(a)*rr;
                grassGfx.fillTriangle(px-1.5, py+2, px+1.5, py+2, px, py-3);
            }
        }
        this._noiseR = noiseR;

        // ── OBSTÁCULOS (clusters de moitas e rochas) ─────────────────
        for(let i=0; i<16; i++) {
            let cx = Phaser.Math.Between(300, W-300), cy = Phaser.Math.Between(300, H-300);
            if(Math.random()>0.5) {
                for(let j=0; j<5; j++) {
                    let r=Math.random()*80, a=Math.random()*Math.PI*2;
                    let o = this.matter.add.image(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 'moita', null, {isStatic:true, shape:'circle'});
                    o.setDepth(1).setScale(Phaser.Math.FloatBetween(0.8,1.5)).body.label='moita';
                }
            } else {
                for(let j=0; j<3; j++) {
                    let r=Math.random()*60, a=Math.random()*Math.PI*2, s=Phaser.Math.FloatBetween(1.0,2.5);
                    let o = this.matter.add.image(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 'rocha_organica', null, {isStatic:true, shape:'circle'});
                    o.setDepth(1).setScale(s).body.label='rocha';
                }
            }
        }

        // ── CURRAIS ──────────────────────────────────────────────────
        this.currais = [];
        this.driveThrus = this.currais; // alias temporário
        for(let i=0; i<5; i++) {
            let img = this.add.image(Phaser.Math.Between(400,W-400), Phaser.Math.Between(400,H-400), 'curral').setDepth(1);
            this.add.text(img.x, img.y, 'CRL', {fontSize:'14px', fill:'#1a0800', fontStyle:'bold'}).setOrigin(0.5).setDepth(2);
            this.currais.push({ x: img.x, y: img.y, sprite: img, processing: [], ready: [] });
        }
    }

});
