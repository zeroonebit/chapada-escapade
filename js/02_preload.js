// 02_preload.js — Carregamento de assets (PNGs)
Object.assign(Jogo.prototype, {

    preload() {
        // ── PERSONAGENS ──────────────────────────────────────────────
        // frente = movimento normal/abdução; cima_sobe/desce = dentro do curral
        ['frente','cima_sobe','cima_desce'].forEach(d => {
            this.load.image(`vaca_${d}`, `assets/characters/vaca/vaca_${d}.png`);
            this.load.image(`boi_${d}`,  `assets/characters/boi/boi_${d}.png`);
        });
        // ── HUD ──────────────────────────────────────────────────────
        // barra_frame e lvl_badge removidos (substituídos por retângulos no código)
        ['score_frame','map_btn',
         'frame_combustivel','frame_graviton',
         'cows_box','burgers_box'].forEach(k => {
            this.load.image(`hud_${k}`, `assets/ui/hud_${k}.png`);
        });

        // ── SPLASH ───────────────────────────────────────────────────
        this.load.image('splash', 'splash.png');

        // ── WANG TILESET (terreno) ──────────────────────────────────
        // Pack escolhido via localStorage; 'T' pra alternar in-game (recarrega)
        const pack = localStorage.getItem('terrainPack') || 'nanobanana';
        this.terrainPack = pack;
        // 14 patterns Wang (8 source + 6 derivados via mirror/rotation)
        const WANG_PATTERNS = [
            '0000','0001','0010','0011','0100','0101','0111',
            '1000','1010','1011','1100','1101','1110','1111'
        ];
        WANG_PATTERNS.forEach(p => {
            this.load.image(`wang_${p}`, `assets/terrain/${pack}/wang_${p}.png`);
        });
    }

});
