// 03_textures.js — Geração de sprites geométricos via Phaser.Graphics
// (ship, burger, corral, gaiola, rock, bush, shooter, farmer)
// Cow/ox vêm de PNGs carregados em 02_preload.js
Object.assign(Jogo.prototype, {

    _setupGeometricTextures() {
        let g = this.add.graphics();

        // ufo — now vem de assets/fx/ship.png (carregado no preload)
        // Geometria antiga removida to não sobrescrever o PNG.

        // burger — now vem de assets/fx/items/burger_classic.png

        // corral — chão de dirt with fence de madeira
        g.clear();
        g.fillStyle(0x8b6839, 1); g.fillCircle(50, 50, 46);
        g.fillStyle(0xa07840, 0.55); g.fillCircle(50, 50, 32);
        g.fillStyle(0x5c3a18, 1);
        g.lineStyle(3, 0x5c3a18, 1);
        g.strokeCircle(50, 50, 46);
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            const px = 50 + Math.cos(a) * 46, py = 50 + Math.sin(a) * 46;
            g.fillRect(px - 3, py - 3, 6, 6);
        }
        g.fillStyle(0x8b6839, 1); g.fillRect(44, 0, 12, 8);
        g.generateTexture('curral', 100, 100);

        // GAIOLA
        g.clear(); g.lineStyle(3, 0xff2222, 1); g.strokeRect(0,0,24,34);
        g.lineBetween(6,0,6,34); g.lineBetween(18,0,18,34);
        g.lineBetween(0,11,24,11); g.lineBetween(0,23,24,23);
        g.generateTexture('gaiola_recusa', 24, 34);

        // ROCHA
        g.clear(); g.fillStyle(0x666677, 1);
        g.beginPath(); g.moveTo(10,0); g.lineTo(38,4); g.lineTo(44,22); g.lineTo(32,42); g.lineTo(8,38); g.lineTo(0,18); g.closePath(); g.fillPath();
        g.lineStyle(2, 0x333344, 1);
        g.beginPath(); g.moveTo(10,0); g.lineTo(38,4); g.lineTo(44,22); g.lineTo(32,42); g.lineTo(8,38); g.lineTo(0,18); g.closePath(); g.strokePath();
        g.generateTexture('rocha_organica', 44, 42);

        // MOITA
        g.clear(); g.fillStyle(0x1a5c1a, 1); g.lineStyle(2, 0x0d3d0d, 1);
        g.beginPath(); g.moveTo(15,0); g.lineTo(0,28); g.lineTo(30,28); g.closePath(); g.fillPath(); g.strokePath();
        g.beginPath(); g.moveTo(15,10); g.lineTo(2,36); g.lineTo(28,36); g.closePath(); g.fillPath(); g.strokePath();
        g.generateTexture('bush', 30, 40);

        // shooter — torre sentinela
        g.clear();
        g.fillStyle(0x993300, 1); g.fillRect(2, 2, 28, 28);
        g.fillStyle(0x661a00, 1); g.fillRect(0, 0, 32, 7);
        g.fillStyle(0xff6600, 1); g.fillRect(7, 10, 18, 12);
        g.fillStyle(0x220000, 1); g.fillRect(10, 13, 5, 6); g.fillRect(17, 13, 5, 6);
        g.lineStyle(2, 0x440000, 1); g.strokeRect(2, 2, 28, 28);
        g.generateTexture('atirador', 32, 32);

        // farmer — now vem de assets/fx/chars/farmer/*.png (8 dir)

        g.destroy();
    }

});
