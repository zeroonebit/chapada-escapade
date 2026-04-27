// 02_preload.js — Carregamento de assets (PNGs)
Object.assign(Jogo.prototype, {

    preload() {
        // ── PERSONAGENS PIXELLAB (200×200, top-down único) ───────────
        // Sobrescreve as keys vaca_/boi_ pra usar o asset PixelLab
        this.load.image('vaca_frente',     'assets/pixel_labs/vaca.png');
        this.load.image('vaca_cima_sobe',  'assets/pixel_labs/vaca.png');
        this.load.image('vaca_cima_desce', 'assets/pixel_labs/vaca.png');
        this.load.image('boi_frente',      'assets/pixel_labs/boi.png');
        this.load.image('boi_cima_sobe',   'assets/pixel_labs/boi.png');
        this.load.image('boi_cima_desce',  'assets/pixel_labs/boi.png');
        this.load.image('nave',            'assets/pixel_labs/nave.png');
        this.load.image('beam_halo',       'assets/pixel_labs/beam.png');
        // ── HUD ──────────────────────────────────────────────────────
        // barra_frame e lvl_badge removidos (substituídos por retângulos no código)
        ['score_frame','map_btn',
         'frame_combustivel','frame_graviton',
         'cows_box','burgers_box'].forEach(k => {
            this.load.image(`hud_${k}`, `assets/ui/hud_${k}.png`);
        });

        // ── SPLASH ───────────────────────────────────────────────────
        this.load.image('splash', 'splash.png');

        // (Wang tileset PNGs removidos — terreno agora é renderizado pelo
        //  fragment shader cell-shaded em js/13_terrain_shader.js)
    }

});
