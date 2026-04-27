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
        ['score_frame','burger_frame',
         'barra_combustivel','barra_graviton','map_btn'].forEach(k => {
            this.load.image(`hud_${k}`, `assets/ui/hud_${k}.png`);
        });

        // ── SPLASH ───────────────────────────────────────────────────
        this.load.image('splash', 'splash.png');
    }

});
