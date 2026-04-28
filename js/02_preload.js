// 02_preload.js — Carregamento de assets (PNGs)
Object.assign(Jogo.prototype, {

    preload() {
        // ── HERO ASSETS 200×200 (single sprite usado em algumas situações) ──
        // Nave aponta pra UFO south (versão dome opaca, sem alien visível dentro)
        this.load.image('nave',      'assets/pixel_labs/chars/ufo/south.png');
        this.load.image('beam_halo', 'assets/pixel_labs/beam.png');

        // ── DIRECTIONAL SPRITES PIXELLAB ─────────────────────────────
        // Vaca (chubby holstein, 8-dir), Boi, Fazendeiro, UFO: 8 direções
        const dirs8 = {
            'south':'S','east':'E','north':'N','west':'W',
            'south-east':'SE','north-east':'NE','north-west':'NW','south-west':'SW'
        };
        Object.entries(dirs8).forEach(([d, k]) => {
            this.load.image(`vaca_${k}`, `assets/pixel_labs/chars/vaca/${d}.png`);
            this.load.image(`boi_${k}`,  `assets/pixel_labs/chars/boi/${d}.png`);
            this.load.image(`faz_${k}`,  `assets/pixel_labs/chars/fazendeiro/${d}.png`);
            this.load.image(`ufo_${k}`,  `assets/pixel_labs/chars/ufo/${d}.png`);
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

        // ── ANIMAÇÕES 8-DIR ──────────────────────────────────────────
        // Mapping: <prefixo do texture key> ← <pasta de anim no disk> × N frames
        const D8 = ['S','E','N','W','SE','NE','NW','SW'];
        const ANIM8 = [
            // Vaca chubby (8d) — walk + idle_head_shake (eat) + lie_down (angry-ish)
            { char: 'vaca',       prefix: 'vaca_walk',  anim: 'walk',            frames: 4 },
            { char: 'vaca',       prefix: 'vaca_eat',   anim: 'idle_head_shake', frames: 11 },
            { char: 'vaca',       prefix: 'vaca_angry', anim: 'lie_down',        frames: 8 },
            // Fazendeiro running, Boi walk
            { char: 'fazendeiro', prefix: 'faz_run',    anim: 'running',         frames: 4 },
            { char: 'boi',        prefix: 'boi_walk',   anim: 'walk',            frames: 4 },
        ];
        ANIM8.forEach(({char, prefix, anim, frames}) => {
            D8.forEach(d => {
                for (let i = 0; i < frames; i++) {
                    const f = String(i).padStart(3, '0');
                    this.load.image(`${prefix}_${d}_${i}`,
                        `assets/pixel_labs/chars/${char}/anims/${anim}/${d}/frame_${f}.png`);
                }
            });
        });

        // ── NATURE POOL (rocks + bushes/cactus pra cenário) ──────────
        const NATURE_PEDRAS = ['boulder_red_cluster','rock_small_smooth','rock_pillar_tall'];
        const NATURE_VEGE   = ['bush_round_dense','cactus_saguaro_tall','cactus_medium',
                               'cactus_dead_dry','cactus_branching','cactus_cluster_low',
                               'cactus_saguaro_2','cactus_dead_vine','bush_round',
                               'patch_cluster','bush_dry','agave_dark'];
        NATURE_PEDRAS.forEach(n => this.load.image(`nat_pedra_${n}`, `assets/pixel_labs/chars/nature/pedras/${n}.png`));
        NATURE_VEGE.forEach(n   => this.load.image(`nat_vege_${n}`,  `assets/pixel_labs/chars/nature/vegetacao/${n}.png`));
        // Expor pra outros módulos (cenário usa pra spawn random)
        this._naturePedrasKeys = NATURE_PEDRAS.map(n => `nat_pedra_${n}`);
        this._natureVegeKeys   = NATURE_VEGE.map(n   => `nat_vege_${n}`);
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

        // ── SPLASH + ICON ────────────────────────────────────────────
        this.load.image('splash', 'splashv3.png');
        this.load.image('game_icon', 'icon.png');

        // (Wang tileset PNGs removidos — terreno agora é renderizado pelo
        //  fragment shader cell-shaded em js/13_terrain_shader.js)
    }

});
