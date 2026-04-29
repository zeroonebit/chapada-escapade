// 02_preload.js — Carregamento de assets (PNGs)
Object.assign(Jogo.prototype, {

    preload() {
        // Error handler: avisa no console when asset 404 (default Phaser falha silente)
        this.load.on('loaderror', (file) => {
            console.warn('[ASSET 404]', file.src || file.url || file.key);
        });

        // Pre-loader DOM bar — atualiza durante carregamento + fade out ao terminar
        const preBar = document.getElementById('pre-loader-bar');
        const prePct = document.getElementById('pre-loader-pct');
        const preLoader = document.getElementById('pre-loader');
        if (preBar && prePct) {
            this.load.on('progress', (v) => {
                const pct = Math.round(v * 100);
                preBar.style.width = pct + '%';
                prePct.textContent = pct + '%';
            });
        }
        if (preLoader) {
            this.load.on('complete', () => {
                preLoader.classList.add('fade');
                setTimeout(() => preLoader.remove(), 500);
            });
        }

        // ── HERO ASSETS 200×200 (single sprite usado em algumas situações) ──
        // Ship aponta to UFO south (versão dome opaca, without alien visível inside)
        this.load.image('nave',      'assets/pixel_labs/chars/ufo/south.png');
        this.load.image('beam_halo', 'assets/pixel_labs/beam.png');

        // ── DIRECTIONAL SPRITES PIXELLAB ─────────────────────────────
        // Cow (chubby holstein, 8-dir), Ox, Farmer, UFO: 8 directions
        const dirs8 = {
            'south':'S','east':'E','north':'N','west':'W',
            'south-east':'SE','north-east':'NE','north-west':'NW','south-west':'SW'
        };
        Object.entries(dirs8).forEach(([d, k]) => {
            this.load.image(`cow_${k}`, `assets/pixel_labs/chars/cow/${d}.png`);
            this.load.image(`ox_${k}`,  `assets/pixel_labs/chars/ox/${d}.png`);
            this.load.image(`farmer_${k}`,  `assets/pixel_labs/chars/farmer/${d}.png`);
            this.load.image(`ufo_${k}`,  `assets/pixel_labs/chars/ufo/${d}.png`);
        });

        // ── LEGACY KEYS (pointam to direcional sul, compat with código antigo) ──
        this.load.image('cow_frente',     'assets/pixel_labs/chars/cow/south.png');
        this.load.image('cow_cima_sobe',  'assets/pixel_labs/chars/cow/south.png');
        this.load.image('cow_cima_desce', 'assets/pixel_labs/chars/cow/south.png');
        this.load.image('ox_frente',      'assets/pixel_labs/chars/ox/south.png');
        this.load.image('ox_cima_sobe',   'assets/pixel_labs/chars/ox/south.png');
        this.load.image('ox_cima_desce',  'assets/pixel_labs/chars/ox/south.png');
        this.load.image('farmer',      'assets/pixel_labs/chars/farmer/south.png');
        // burger now vem do PixelLab (substitui geometria antiga)
        this.load.image('burger',      'assets/pixel_labs/items/burger_classic.png');

        // ── ANIMAÇÕES 8-DIR ──────────────────────────────────────────
        // Mapping: <prefixo do texture key> ← <pasta de anim no disk> × N frames
        const D8 = ['S','E','N','W','SE','NE','NW','SW'];
        const ANIM8 = [
            // Cow chubby (8d) — walk + idle_head_shake (eat) + lie_down (angry-ish)
            { char: 'cow',       prefix: 'cow_walk',  anim: 'walk',            frames: 4 },
            { char: 'cow',       prefix: 'cow_eat',   anim: 'idle_head_shake', frames: 11 },
            { char: 'cow',       prefix: 'cow_angry', anim: 'lie_down',        frames: 8 },
            // Farmer running, Ox walk
            { char: 'farmer', prefix: 'farmer_run',    anim: 'running',         frames: 4 },
            { char: 'ox',        prefix: 'ox_walk',   anim: 'walk',            frames: 4 },
            // UFO hovering 8-dir (idle bob/light flicker)
            { char: 'ufo',        prefix: 'ufo_hover',  anim: 'hovering_idle',   frames: 4 },
            // Ox idle_head_shake — without N (7 dirs)
            { char: 'ox', prefix: 'ox_idle', anim: 'idle_head_shake', frames: 11,
              dirs: ['S','E','W','SE','NE','NW','SW'] },
        ];
        ANIM8.forEach(({char, prefix, anim, frames, dirs}) => {
            (dirs || D8).forEach(d => {
                for (let i = 0; i < frames; i++) {
                    const f = String(i).padStart(3, '0');
                    this.load.image(`${prefix}_${d}_${i}`,
                        `assets/pixel_labs/chars/${char}/anims/${anim}/${d}/frame_${f}.png`);
                }
            });
        });

        // ── NATURE POOL (rocks + bushes/cactus to scenery) ──────────
        const NATURE_PEDRAS = ['boulder_red_cluster','rock_small_smooth','rock_pillar_tall'];
        const NATURE_VEGE   = ['bush_round_dense','cactus_saguaro_tall','cactus_medium',
                               'cactus_dead_dry','cactus_branching','cactus_cluster_low',
                               'cactus_saguaro_2','cactus_dead_vine','bush_round',
                               'patch_cluster','bush_dry','agave_dark'];
        const NATURE_CERCAS = ['fence_full_h','fence_normal','fence_long','fence_short',
                               'fence_broken','fence_gate_open','fence_corner',
                               'post_single','post_thin','plank_v'];
        // Cercas v2 (paleta clara consistente, design ornamental)
        const NATURE_CERCAS_V2 = ['fence_double_short_h','fence_curved_short','fence_curved_long',
                                  'gate_open_double','gate_closed_solid','gate_thin_double',
                                  'post_lantern_low','post_lantern_thin','post_double_rope',
                                  'post_carved','post_thin_simple','tower_ornamental_thin',
                                  'segment_tall_dual','beam_horizontal'];
        NATURE_PEDRAS.forEach(n => this.load.image(`nat_rock_${n}`, `assets/pixel_labs/chars/nature/rocks/${n}.png`));
        NATURE_VEGE.forEach(n   => this.load.image(`nat_veg_${n}`,  `assets/pixel_labs/chars/nature/vegetation/${n}.png`));
        NATURE_CERCAS.forEach(n => this.load.image(`nat_fence_${n}`, `assets/pixel_labs/chars/nature/fences/${n}.png`));
        NATURE_CERCAS_V2.forEach(n => this.load.image(`nat_fence_${n}`, `assets/pixel_labs/chars/nature/fences_v2/${n}.png`));
        // Outros itens decorativos (feno, pile de toras)
        const NATURE_OUTROS = ['hay_bale', 'pile_logs'];
        NATURE_OUTROS.forEach(n => this.load.image(`nat_misc_${n}`, `assets/pixel_labs/chars/nature/misc/${n}.png`));
        // Objects v3: landmarks (church, windmill, truck, satellite), props (gas, barrel, buckets), terreno (dry_turf)
        const NATURE_OBJECTS = ['church', 'windmill', 'old_truck', 'satellite_dish_rusty',
                                'gas_can', 'barrel_rusty', 'bucket_empty', 'bucket_milk', 'dry_turf'];
        NATURE_OBJECTS.forEach(n => this.load.image(`nat_obj_${n}`, `assets/pixel_labs/chars/nature/objects/${n}.png`));
        // Expor to cenario
        this._natureLandmarkKeys = ['church', 'windmill', 'old_truck', 'satellite_dish_rusty']
            .map(n => `nat_obj_${n}`);
        this._natureIndustrialKeys = ['gas_can', 'barrel_rusty'].map(n => `nat_obj_${n}`);
        // Expor pra outros módulos (D+R2: renomeado de _naturePedras/Vege/Cercas)
        this._natureRocksKeys  = NATURE_PEDRAS.map(n => `nat_rock_${n}`);
        this._natureVegKeys    = NATURE_VEGE.map(n   => `nat_veg_${n}`);
        this._natureFencesKeys = NATURE_CERCAS.map(n => `nat_fence_${n}`);
        // ── HUD PIXELLAB (substitui o antigo) ────────────────────────
        this.load.image('hud_score_frame',       'assets/pixel_labs/hud/score.png');
        this.load.image('hud_cows_box',          'assets/pixel_labs/hud/cows.png');
        this.load.image('hud_burgers_box',       'assets/pixel_labs/hud/burgers.png');
        this.load.image('hud_frame_combustivel', 'assets/pixel_labs/hud/combustivel.png');
        this.load.image('hud_frame_graviton',    'assets/pixel_labs/hud/graviton.png');
        this.load.image('hud_radar_frame',       'assets/pixel_labs/hud/radar_frame.png');
        this.load.image('hud_combustivel_frame', 'assets/pixel_labs/hud/combustivel_frame.png');
        this.load.image('hud_graviton_frame',    'assets/pixel_labs/hud/graviton_frame.png');
        // v2: full + empty to setCrop dinâmico (fill bakeded, miolo preto)
        this.load.image('hud_comb_full_v2',  'assets/pixel_labs/hud/combustivel_full_v2.png');
        this.load.image('hud_comb_empty_v2', 'assets/pixel_labs/hud/combustivel_empty_v2.png');
        this.load.image('hud_grav_full_v2',  'assets/pixel_labs/hud/graviton_full_v2.png');
        this.load.image('hud_grav_empty_v2', 'assets/pixel_labs/hud/graviton_empty_v2.png');
        // ── BURGERS (3 variantes) ────────────────────────────────────
        this.load.image('burger_classic', 'assets/pixel_labs/items/burger_classic.png');
        this.load.image('burger_cheese',  'assets/pixel_labs/items/burger_cheese.png');
        this.load.image('burger_double',  'assets/pixel_labs/items/burger_double.png');

        // ── SPLASH + ICON ────────────────────────────────────────────
        this.load.image('splash', 'splashv3.png');
        this.load.image('game_icon', 'icon.png');

        // ── WANG TILES (16 tiles cr31 colors sólidas to debug) ──────
        for (let i = 0; i < 16; i++) {
            const f = String(i).padStart(2, '0');
            this.load.image(`wang_${f}`, `assets/terrain/test/wang_${f}.png`);
        }

        // (Wang tileset PNGs removidos — terreno now is renderizado pelo
        //  fragment shader cell-shaded em js/13_terrain_shader.js)
    }

});
