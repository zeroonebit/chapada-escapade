// 02_preload.js — Carregamento de assets (PNGs)
Object.assign(Jogo.prototype, {

    preload() {
        // Error handler: avisa no console when asset 404 (default Phaser falha silente)
        this.load.on('loaderror', (file) => {
            console.warn('[ASSET 404]', file.src || file.url || file.key);
        });

        // Pre-loader DOM bar — atualiza during carregamento + fade out ao end
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
                if (window.__MOBILE_MODE) {
                    // Mantem titulo CHAPADA ESCAPADE persistente sobre o jogo:
                    // bg transparente + pointer-events none (UFO passa por baixo)
                    preLoader.style.background = 'transparent';
                    preLoader.style.pointerEvents = 'none';
                    const barBg = document.getElementById('pre-loader-bar-bg');
                    const pctEl = document.getElementById('pre-loader-pct');
                    if (barBg) barBg.style.display = 'none';
                    if (pctEl) pctEl.style.display = 'none';
                } else {
                    preLoader.classList.add('fade');
                    setTimeout(() => preLoader.remove(), 500);
                }
            });
        }

        // ── ATLASES PIXELLAB (4 sprite atlases, gerados via tools/pack_atlas.py) ──
        // Substituem 389 PNGs individuais (32 static + 357 anim frames) por 4 atlases
        // de ~70-125kb cada (-95% requests, -70% bytes graças a pngquant).
        // Frame names DENTRO do atlas seguem keys legacy: cow_S, cow_walk_S_0,
        // farmer_NE, ox_idle_W_5, ufo_hover_NW_2 etc — ver tools/pack_atlas.py.
        // 01_scene.js _registerAtlasFrameTextures() faz aliasing automático
        // pra setTexture('cow_S') continuar funcionando sem rewrite massivo.
        this.load.atlas('cow_atlas',    'assets/atlases/cow.png',    'assets/atlases/cow.json');
        this.load.atlas('ox_atlas',     'assets/atlases/ox.png',     'assets/atlases/ox.json');
        this.load.atlas('farmer_atlas', 'assets/atlases/farmer.png', 'assets/atlases/farmer.json');
        this.load.atlas('ufo_atlas',    'assets/atlases/ufo.png',    'assets/atlases/ufo.json');

        // Hero assets (1 sprite cada, fora dos atlases) — beam_halo é PNG fora dos chars
        this.load.image('beam_halo', 'assets/fx/beam.png');
        // burger (item — fica fora pois pode evoluir pra item atlas)
        this.load.image('burger',         'assets/pixel_labs/items/burger_classic.png');

        // ── NATURE POOL (rocks + bushes/cactus to scenery) ──────────
        const NATURE_PEDRAS = ['boulder_red_cluster','rock_small_smooth','rock_pillar_tall'];
        const NATURE_VEGE   = ['bush_round_dense','cactus_saguaro_tall','cactus_medium',
                               'cactus_dead_dry','cactus_branching','cactus_cluster_low',
                               'cactus_saguaro_2','cactus_dead_vine','bush_round',
                               'patch_cluster','bush_dry','agave_dark'];
        const NATURE_CERCAS = ['fence_full_h','fence_normal','fence_long','fence_short',
                               'fence_broken','fence_gate_open','fence_corner',
                               'post_single','post_thin','plank_v'];
        // fences v2 (paleta clara consistente, design ornamental)
        const NATURE_CERCAS_V2 = ['fence_double_short_h','fence_curved_short','fence_curved_long',
                                  'gate_open_double','gate_closed_solid','gate_thin_double',
                                  'post_lantern_low','post_lantern_thin','post_double_rope',
                                  'post_carved','post_thin_simple','tower_ornamental_thin',
                                  'segment_tall_dual','beam_horizontal'];
        NATURE_PEDRAS.forEach(n => this.load.image(`nat_rock_${n}`, `assets/env/rocks/${n}.png`));
        NATURE_VEGE.forEach(n   => this.load.image(`nat_veg_${n}`,  `assets/env/vegetation/${n}.png`));
        NATURE_CERCAS.forEach(n => this.load.image(`nat_fence_${n}`, `assets/env/fences/${n}.png`));
        NATURE_CERCAS_V2.forEach(n => this.load.image(`nat_fence_${n}`, `assets/env/fences_v2/${n}.png`));
        // Outros itens decorativos (feno, pile de toras)
        const NATURE_OUTROS = ['hay_bale', 'pile_logs'];
        NATURE_OUTROS.forEach(n => this.load.image(`nat_misc_${n}`, `assets/env/misc/${n}.png`));
        // Objects v3: landmarks (church, windmill, truck, satellite), props (gas, barrel, buckets), terreno (dry_turf)
        const NATURE_OBJECTS = ['church', 'windmill', 'old_truck', 'satellite_dish_rusty',
                                'gas_can', 'barrel_rusty', 'bucket_empty', 'bucket_milk', 'dry_turf'];
        NATURE_OBJECTS.forEach(n => this.load.image(`nat_obj_${n}`, `assets/env/objects/${n}.png`));
        // Currais V2: 5 sprites 200x200 PixelLab (substituem cercas procedural)
        const CURRAIS = ['curral_01_pequeno', 'curral_02_redondo', 'curral_03_hexagonal',
                         'curral_04_rustico', 'curral_05_abandonado'];
        CURRAIS.forEach(n => this.load.image(`nat_obj_${n}`, `assets/env/objects/${n}.png`));
        this._curralKeys = CURRAIS.map(n => `nat_obj_${n}`);
        // Expor to scenery
        this._natureLandmarkKeys = ['church', 'windmill', 'old_truck', 'satellite_dish_rusty']
            .map(n => `nat_obj_${n}`);
        this._natureIndustrialKeys = ['gas_can', 'barrel_rusty'].map(n => `nat_obj_${n}`);
        // Expor to outros módulos (D+R2: renomeado de _naturePedras/Vege/fences)
        this._natureRocksKeys  = NATURE_PEDRAS.map(n => `nat_rock_${n}`);
        this._natureVegKeys    = NATURE_VEGE.map(n   => `nat_veg_${n}`);
        this._natureFencesKeys = NATURE_CERCAS.map(n => `nat_fence_${n}`);
        // ── HUD PIXELLAB ──────────────────────────────────────────
        // Layout final (limpo): 6 boxes nameless + bars combinadas + radar v2
        // Score boxes (top): label PT/EN overlay via Phaser
        this.load.image('hud_score_v2',          'assets/pixel_labs/hud/score_v2.png');
        this.load.image('hud_burgers_v2',        'assets/pixel_labs/hud/burgers_v2.png');
        this.load.image('hud_cows_v2',           'assets/pixel_labs/hud/cows_v2.png');
        this.load.image('hud_bulls_v2',           'assets/pixel_labs/hud/bulls_v2.png');
        this.load.image('hud_farmers_v2',        'assets/pixel_labs/hud/farmers_v2.png');
        this.load.image('hud_shooters_v2',       'assets/pixel_labs/hud/shooters_v2.png');
        // Radar v2 (sandwich: ring base + dome glass top)
        this.load.image('hud_radar_dome_v2',     'assets/pixel_labs/hud/radar_dome_v2.png');
        this.load.image('hud_radar_ring_v2',     'assets/pixel_labs/hud/radar_ring_v2.png');
        // Bars combinadas (FUEL+GRAVITON num PNG so) — _empty_nameless = mascara
        // preta + _full-nameless = barras coloridas cropadas pelo pct
        this.load.image('hud_combined_empty',    'assets/pixel_labs/hud/combustivel-graviton_empty_nameless.png');
        this.load.image('hud_combined_full',     'assets/pixel_labs/hud/combustivel-graviton_full-nameless.png');
        // Bars individuais (fallback antigo, mantido pra cobrir caminhos legados)
        this.load.image('hud_combustivel_full',  'assets/pixel_labs/hud/combustivel_full.png');
        this.load.image('hud_graviton_full',     'assets/pixel_labs/hud/graviton_full.png');
        // ── BURGERS (3 variantes) ────────────────────────────────────
        this.load.image('burger_classic', 'assets/pixel_labs/items/burger_classic.png');
        this.load.image('burger_cheese',  'assets/pixel_labs/items/burger_cheese.png');
        this.load.image('burger_double',  'assets/pixel_labs/items/burger_double.png');

        // ── SPLASH + ICON ────────────────────────────────────────────
        this.load.image('splash', 'splashv4.png');
        this.load.image('game_icon', 'icon.png');

        // ── WANG TILES — LAZY LOADING (só estilo ativo carrega no boot) ──
        // 'test' = paleta sólida cr31 placeholder
        // 'dirt_grass_32', 'ocean_sand_32', 'mapa1_*', 'mapa2_*' = transitions PixelLab
        // Antes: carregava 11 styles × 16 = 176 PNGs (mas só 1 é usado por sessão).
        // Agora: lê tileStyle do localStorage e carrega só esse + 'test' (fallback).
        // Se user trocar style live no menu CONFIGS, _ensureWangStyleLoaded() em
        // 15_debug_menu.js dispara load assíncrono.
        this._allWangStyles = ['test', 'dirt_grass_32', 'ocean_sand_32',
            'mapa1_ocean_dirt', 'mapa1_ocean_grass', 'mapa1_sand_dirt', 'mapa1_sand_grass',
            'mapa2_ocean_dirt', 'mapa2_ocean_grass', 'mapa2_sand_dirt', 'mapa2_sand_grass'];
        let activeStyle = 'dirt_grass_32';   // default (matches DBG_DEFAULTS)
        try {
            const raw = JSON.parse(localStorage.getItem('chapEscapadeDebug') || '{}');
            if (raw?.fx?.tileStyle) activeStyle = raw.fx.tileStyle;
        } catch(e) {}
        // Conjunto de styles a carregar agora (active + test fallback, dedupe)
        this._loadedWangStyles = new Set([activeStyle, 'test']);
        this._loadedWangStyles.forEach(style => {
            for (let i = 0; i < 16; i++) {
                const f = String(i).padStart(2, '0');
                this.load.image(`wang_${style}_${f}`, `assets/terrain/${style}/wang_${f}.png`);
            }
        });
        // Aliases legacy wang_NN — pointam pro 'test' (mesmo comportamento de antes)
        for (let i = 0; i < 16; i++) {
            const f = String(i).padStart(2, '0');
            this.load.image(`wang_${f}`, `assets/terrain/test/wang_${f}.png`);
        }

        // (Wang tileset PNGs removidos — terreno now is renderizado pelo
        //  fragment shader cell-shaded em js/13_terrain_shader.js)
    }

});
