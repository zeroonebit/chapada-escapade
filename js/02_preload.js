// 02_preload.js — Carregamento de assets (PNGs)
Object.assign(Jogo.prototype, {

    preload() {
        // ── HERO ASSETS 200×200 (single sprite usado em algumas situações) ──
        this.load.image('nave',      'assets/pixel_labs/nave.png');
        this.load.image('beam_halo', 'assets/pixel_labs/beam.png');

        // ── DIRECTIONAL SPRITES PIXELLAB (128px) ─────────────────────
        // Vaca/boi: 4 direções (cat/bear template não suporta 8d, bug PixelLab)
        ['south','east','north','west'].forEach(d => {
            const k = ({south:'S', east:'E', north:'N', west:'W'})[d];
            this.load.image(`vaca_${k}`, `assets/pixel_labs/chars/vaca/${d}.png`);
            this.load.image(`boi_${k}`,  `assets/pixel_labs/chars/boi/${d}.png`);
        });
        // Fazendeiro/UFO: 8 direções
        const dirs8 = {
            'south':'S','east':'E','north':'N','west':'W',
            'south-east':'SE','north-east':'NE','north-west':'NW','south-west':'SW'
        };
        Object.entries(dirs8).forEach(([d, k]) => {
            this.load.image(`faz_${k}`, `assets/pixel_labs/chars/fazendeiro/${d}.png`);
            this.load.image(`ufo_${k}`, `assets/pixel_labs/chars/ufo/${d}.png`);
        });

        // ── LEGACY KEYS (pointam pra direcional sul, compat com código antigo) ──
        this.load.image('vaca_frente',     'assets/pixel_labs/chars/vaca/south.png');
        this.load.image('vaca_cima_sobe',  'assets/pixel_labs/chars/vaca/south.png');
        this.load.image('vaca_cima_desce', 'assets/pixel_labs/chars/vaca/south.png');
        this.load.image('boi_frente',      'assets/pixel_labs/chars/boi/south.png');
        this.load.image('boi_cima_sobe',   'assets/pixel_labs/chars/boi/south.png');
        this.load.image('boi_cima_desce',  'assets/pixel_labs/chars/boi/south.png');
        this.load.image('fazendeiro',      'assets/pixel_labs/chars/fazendeiro/south.png');
        // hambúrguer agora vem do PixelLab (substitui geometria antiga)
        this.load.image('hamburguer',      'assets/pixel_labs/items/burger_classic.png');

        // ── ANIMAÇÕES VACA (4 estados × 4 direções × N frames) ───────
        // walk=4, run=8, eat=7, angry=7 — total 104 frames
        const VACA_ANIMS = { walk: 4, run: 8, eat: 7, angry: 7 };
        ['S','E','N','W'].forEach(d => {
            const longDir = ({S:'south', E:'east', N:'north', W:'west'})[d];
            Object.entries(VACA_ANIMS).forEach(([name, count]) => {
                for (let i = 0; i < count; i++) {
                    const f = String(i).padStart(3, '0');
                    this.load.image(`vaca_${name}_${d}_${i}`,
                        `assets/pixel_labs/chars/vaca/anims/${name}/${d}/frame_${f}.png`);
                }
            });
        });
        // ── HUD PIXELLAB (substitui o antigo) ────────────────────────
        this.load.image('hud_score_frame',       'assets/pixel_labs/hud/score.png');
        this.load.image('hud_cows_box',          'assets/pixel_labs/hud/cows.png');
        this.load.image('hud_burgers_box',       'assets/pixel_labs/hud/burgers.png');
        this.load.image('hud_frame_combustivel', 'assets/pixel_labs/hud/combustivel.png');
        this.load.image('hud_frame_graviton',    'assets/pixel_labs/hud/graviton.png');
        // ── BURGERS (3 variantes) ────────────────────────────────────
        this.load.image('burger_classic', 'assets/pixel_labs/items/burger_classic.png');
        this.load.image('burger_cheese',  'assets/pixel_labs/items/burger_cheese.png');
        this.load.image('burger_double',  'assets/pixel_labs/items/burger_double.png');

        // ── SPLASH ───────────────────────────────────────────────────
        this.load.image('splash', 'splash.png');

        // (Wang tileset PNGs removidos — terreno agora é renderizado pelo
        //  fragment shader cell-shaded em js/13_terrain_shader.js)
    }

});
