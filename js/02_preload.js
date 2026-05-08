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
        // 7 atlases via tools/pack_atlas.py (chars + hud + nature + items)
        // - chars (cow/ox/farmer/ufo): static dirs + anim frames
        // - hud: score boxes + small bars + radar (4 PNGs gigantes ficam fora)
        // - nature: rocks + veg + fences + misc + objects (~55 frames)
        // - items: 3 burger variantes
        this.load.atlas('cow_atlas',    'assets/atlases/cow.png',    'assets/atlases/cow.json');
        this.load.atlas('ox_atlas',     'assets/atlases/ox.png',     'assets/atlases/ox.json');
        this.load.atlas('farmer_atlas', 'assets/atlases/farmer.png', 'assets/atlases/farmer.json');
        this.load.atlas('ufo_atlas',    'assets/atlases/ufo.png',    'assets/atlases/ufo.json');
        this.load.atlas('hud_atlas',    'assets/atlases/hud.png',    'assets/atlases/hud.json');
        this.load.atlas('nature_atlas', 'assets/atlases/nature.png', 'assets/atlases/nature.json');
        this.load.atlas('items_atlas',  'assets/atlases/items.png',  'assets/atlases/items.json');

        // Beam halo (single PNG fora de atlas — usado em FX layer separada)
        this.load.image('beam_halo', 'assets/fx/beam.png');

        // 4 HUD bars 1536x1024 — ficam individuais (atlas com eles desperdiça espaço)
        this.load.image('hud_combined_empty',    'assets/pixel_labs/hud/combustivel-graviton_empty_nameless.png');
        this.load.image('hud_combined_full',     'assets/pixel_labs/hud/combustivel-graviton_full-nameless.png');
        this.load.image('hud_combustivel_full',  'assets/pixel_labs/hud/combustivel_full.png');
        this.load.image('hud_graviton_full',     'assets/pixel_labs/hud/graviton_full.png');

        // ── EXPÕE keys de nature pra outros módulos consumirem ────────
        // (mantém API legacy: _natureRocksKeys, _natureVegKeys etc são consumidos
        //  por 04_scenery.js — apontam pros mesmos texture keys, agora aliases
        //  do atlas via _registerAtlasFrameTextures em 01_scene.js)
        const NATURE_PEDRAS  = ['boulder_red_cluster','rock_small_smooth','rock_pillar_tall'];
        const NATURE_VEGE    = ['bush_round_dense','cactus_saguaro_tall','cactus_medium',
                                'cactus_dead_dry','cactus_branching','cactus_cluster_low',
                                'cactus_saguaro_2','cactus_dead_vine','bush_round',
                                'patch_cluster','bush_dry','agave_dark'];
        const NATURE_CERCAS  = ['fence_full_h','fence_normal','fence_long','fence_short',
                                'fence_broken','fence_gate_open','fence_corner',
                                'post_single','post_thin','plank_v'];
        const CURRAIS = ['curral_01_pequeno','curral_02_redondo','curral_03_hexagonal',
                         'curral_04_rustico','curral_05_abandonado'];
        this._natureRocksKeys      = NATURE_PEDRAS.map(n => `nat_rock_${n}`);
        this._natureVegKeys        = NATURE_VEGE.map(n   => `nat_veg_${n}`);
        this._natureFencesKeys     = NATURE_CERCAS.map(n => `nat_fence_${n}`);
        this._curralKeys           = CURRAIS.map(n => `nat_obj_${n}`);
        this._natureLandmarkKeys   = ['church','windmill','old_truck','satellite_dish_rusty']
                                       .map(n => `nat_obj_${n}`);
        this._natureIndustrialKeys = ['gas_can','barrel_rusty'].map(n => `nat_obj_${n}`);

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
