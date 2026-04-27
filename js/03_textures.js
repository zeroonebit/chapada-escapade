// 03_textures.js — Geração de sprites geométricos via Phaser.Graphics
// (nave, hambúrguer, curral, gaiola, rocha, moita, atirador, fazendeiro)
// Vaca/boi vêm de PNGs carregados em 02_preload.js
Object.assign(Jogo.prototype, {

    _setupTexturasGeometricas() {
        let g = this.add.graphics();

        // NAVE — disco redondo
        g.fillStyle(0x00dd44, 1); g.fillCircle(20, 20, 19);
        g.fillStyle(0x009933, 1); g.fillCircle(20, 20, 14);
        g.lineStyle(2, 0x003311, 1); g.strokeCircle(20, 20, 19);
        g.fillStyle(0x001a08, 1); g.fillCircle(20, 20, 9);
        g.fillStyle(0x44ffaa, 0.9); g.fillCircle(17, 18, 2); g.fillCircle(23, 18, 2);
        g.generateTexture('nave', 40, 40);

        // HAMBÚRGUER — moedinha vista de cima (pão com gergelim)
        g.clear();
        g.fillStyle(0xa0671e, 1); g.fillCircle(10, 10, 9);
        g.fillStyle(0xc88e44, 1); g.fillCircle(10, 10, 7);
        g.lineStyle(1.5, 0x5c2e0d, 1); g.strokeCircle(10, 10, 9);
        g.fillStyle(0xfff0c0, 1);
        g.fillCircle(10, 6, 1); g.fillCircle(7, 8, 1); g.fillCircle(13, 8, 1);
        g.fillCircle(8, 12, 1); g.fillCircle(12, 12, 1); g.fillCircle(10, 14, 1);
        g.fillStyle(0xffe9b0, 0.4); g.fillCircle(7, 7, 2);
        g.generateTexture('hamburguer', 20, 20);

        // CURRAL — chão de terra com cerca de madeira
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
        g.generateTexture('moita', 30, 40);

        // ATIRADOR — torre sentinela
        g.clear();
        g.fillStyle(0x993300, 1); g.fillRect(2, 2, 28, 28);
        g.fillStyle(0x661a00, 1); g.fillRect(0, 0, 32, 7);
        g.fillStyle(0xff6600, 1); g.fillRect(7, 10, 18, 12);
        g.fillStyle(0x220000, 1); g.fillRect(10, 13, 5, 6); g.fillRect(17, 13, 5, 6);
        g.lineStyle(2, 0x440000, 1); g.strokeRect(2, 2, 28, 28);
        g.generateTexture('atirador', 32, 32);

        // FAZENDEIRO — chapéu de cangaceiro top-down
        g.clear();
        g.fillStyle(0x5c3808, 0.35); g.fillEllipse(21, 30, 44, 12);
        g.fillStyle(0xb88820, 1);
        g.beginPath(); g.moveTo(20,2); g.lineTo(42,32); g.lineTo(0,32); g.closePath(); g.fillPath();
        g.fillStyle(0xe0aa28, 1);
        g.beginPath(); g.moveTo(20,2); g.lineTo(36,28); g.lineTo(4,28); g.closePath(); g.fillPath();
        g.fillStyle(0xf0c840, 0.5);
        g.beginPath(); g.moveTo(20,4); g.lineTo(10,26); g.lineTo(20,26); g.closePath(); g.fillPath();
        g.fillStyle(0x7a4a10, 1); g.fillRect(6, 25, 28, 5);
        g.fillStyle(0xc87840, 1); g.fillCircle(20, 29, 5);
        g.lineStyle(2, 0x5c3808, 1);
        g.beginPath(); g.moveTo(20,2); g.lineTo(42,32); g.lineTo(0,32); g.closePath(); g.strokePath();
        g.generateTexture('fazendeiro', 42, 36);

        g.destroy();
    }

});
