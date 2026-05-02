// 15_debug_menu.js — Painel DOM with abas: CONTROLES / LOOKS / VFX / DEBUG
// Aparece with a pausa (ESC). Saves em localStorage.
// Behavior + barrel aplicam live; ENTIDADES/LOOKS/QUANTIDADES exigem reiniciar.
const DBG_KEY = 'chapEscapadeDebug';

// Dicionário de tradução do menu CONFIGS (en default, pt opcional)
const MENU_I18N = {
    en: {
        configs:'CONFIGS', controls:'CONTROLS', looks:'VISUALS', vfx:'VFX', debug:'DEBUG',
        ufo:'SHIP', entities:'ENTITIES', entities_onoff:'ENTITIES (ON/OFF)',
        amounts:'AMOUNTS (restart)', scales:'SCALES', camera:'CAMERA',
        time_of_day:'TIME OF DAY', weather:'WEATHER', rain:'RAIN', fog:'FOG',
        note_live:'Apply live without restart.', note_visual:'Scales apply on restart. Barrel applies live.',
        note_vfx:'All apply live.', note_debug:'Toggles apply on restart.',
        btn_apply:'APPLY + RESTART', btn_reset:'RESET', btn_preview:'👁 PREVIEW (live)',
        input:'Input', sensitivity:'Sensitivity', ufo_rot:'Disc rotation', beam_force:'Beam force (pull)',
        vel_cows:'Cows/bulls speed', vel_farmer:'Farmers speed', shooter_dmg:'Shooter damage',
        cows_spawn:'Cows spawn', farmer_spawn:'Farmers spawn',
        cow:'Cow', bull:'Bull', farmer:'Farmer', beam_radius:'Beam radius',
        ufo_label:'Ship (UFO)', burger:'Burger', dist_sphere:'Spherical distortion',
        time:'Time', auto_cycle:'Auto-cycle (60s/preset)', preset:'Preset', shuffle_prev:'Shuffle on PREVIEW',
        active:'Active', intensity:'Intensity', frequency:'Frequency (drops)', angle:'Angle (-1=L, +1=R)',
        speed:'Speed', stroke_len:'Stroke length', flakes:'Flakes',
        sparkles_beam:'Beam sparkles', shake_beam:'Beam shake/flash', explosion:'Fancy explosion',
        quips:'Funny one-liners',
        wang:'Wang tiles (debug)', cows_e:'Cows', bulls_e:'Bulls', farmers_e:'Farmers',
        shooters_e:'Shooters (towers)', beam_e:'Beam visual', scenery:'Scenery (fences/bushes)',
        language:'Language',
        atmosphere:'ATMOSPHERE', effects:'EFFECTS', snow_lbl:'SNOW',
        wind:'WIND', wind_force:'Force (-0.05=L, +0.05=R)',
        // Option labels (selects)
        opt_dawn:'Dawn', opt_day:'Day', opt_dusk:'Dusk', opt_sunset:'Sunset',
        opt_night:'Night', opt_midnight:'Midnight',
        opt_clear:'Clear', opt_rain:'Rain', opt_snow:'Snow', opt_fog:'Fog',
        opt_storm:'Storm (rain+fog+lightning)',
        tile_style:'Tile style', opt_tile_test:'Test palette', opt_tile_dirt:'Grass / Dirt', opt_tile_ocean:'Ocean / Sand',
        opt_mouse:'Mouse', opt_wasd:'WASD + Space',
    },
    pt: {
        configs:'CONFIGURAÇÕES', controls:'CONTROLES', looks:'VISUAIS', vfx:'EFEITOS', debug:'DEBUG',
        ufo:'NAVE', entities:'ENTIDADES', entities_onoff:'ENTIDADES (ON/OFF)',
        amounts:'QUANTIDADES (reiniciar)', scales:'ESCALAS', camera:'CÂMERA',
        time_of_day:'HORA DO DIA', weather:'CLIMA', rain:'CHUVA', fog:'NEBLINA',
        note_live:'Aplicam ao vivo sem reiniciar.', note_visual:'Escalas aplicam ao reiniciar. Barrel aplica ao vivo.',
        note_vfx:'Todos aplicam ao vivo.', note_debug:'Toggles aplicam ao reiniciar.',
        btn_apply:'APLICAR + REINICIAR', btn_reset:'RESETAR', btn_preview:'👁 PRÉVIA (ao vivo)',
        input:'Controle', sensitivity:'Sensibilidade', ufo_rot:'Rotação do disco', beam_force:'Força do beam (atração)',
        vel_cows:'Velocidade vacas/bois', vel_farmer:'Velocidade fazendeiros', shooter_dmg:'Dano dos atiradores',
        cows_spawn:'Vacas spawn', farmer_spawn:'Fazendeiros spawn',
        cow:'Vaca', bull:'Boi', farmer:'Fazendeiro', beam_radius:'Raio do beam',
        ufo_label:'Nave (UFO)', burger:'Hambúrguer', dist_sphere:'Distorção esférica',
        time:'Hora', auto_cycle:'Ciclo automático (60s/preset)', preset:'Preset', shuffle_prev:'Aleatório na PRÉVIA',
        active:'Ativar', intensity:'Intensidade', frequency:'Frequência (gotas)', angle:'Ângulo (-1=esq, +1=dir)',
        speed:'Velocidade', stroke_len:'Comprimento do traço', flakes:'Flocos',
        sparkles_beam:'Sparkles no beam', shake_beam:'Shake/flash do beam', explosion:'Explosão fancy',
        quips:'Frases engraçadas',
        wang:'Wang tiles (debug)', cows_e:'Vacas', bulls_e:'Bois', farmers_e:'Fazendeiros',
        shooters_e:'Atiradores (torres)', beam_e:'Beam visual', scenery:'Cenário (cercas/moitas)',
        language:'Idioma',
        atmosphere:'ATMOSFERA', effects:'EFEITOS', snow_lbl:'NEVE',
        wind:'VENTO', wind_force:'Força (-0.05=esq, +0.05=dir)',
        // Option labels (selects)
        opt_dawn:'Amanhecer', opt_day:'Dia', opt_dusk:'Crepúsculo', opt_sunset:'Pôr do sol',
        opt_night:'Noite', opt_midnight:'Meia-noite',
        opt_clear:'Limpo', opt_rain:'Chuva', opt_snow:'Neve', opt_fog:'Neblina',
        opt_storm:'Tempestade (chuva+neblina+raios)',
        tile_style:'Estilo do tile', opt_tile_test:'Paleta de teste', opt_tile_dirt:'Grama / Terra', opt_tile_ocean:'Oceano / Areia',
        opt_mouse:'Mouse', opt_wasd:'WASD + Espaço',
        opt_tile_m1_od:'Mapa 1: Oceano+Terra', opt_tile_m1_og:'Mapa 1: Oceano+Grama',
        opt_tile_m1_sd:'Mapa 1: Areia+Terra', opt_tile_m1_sg:'Mapa 1: Areia+Grama',
        opt_tile_m2_od:'Mapa 2: Oceano+Terra seco', opt_tile_m2_og:'Mapa 2: Oceano+Grama seco',
        opt_tile_m2_sd:'Mapa 2: Areia+Terra seco', opt_tile_m2_sg:'Mapa 2: Areia+Grama seco',
    },
};

const DBG_DEFAULTS = {
    enabled: {
        cows:     true,
        bulls:    true,
        farmers:  true,
        shooters: true,
        beam:     true,
        scenery:  true,
    },
    scale: {
        cow:    1.0,
        bull:   3.0,
        farmer: 2.0,
        beam:   1.0,
        ufo:    1.0,
        burger: 1.0,
    },
    behavior: {
        sensitivity:    1.0,  // multiplicador da force da ship (live)
        pullBeam:       0.5,
        cowSpeed:       1.0,
        farmerSpeed:    1.0,
        shooterDamage:  1.0,
        ufoRot:        0.0,
        barrel:         0.15,
        inputMode:      'mouse',  // 'mouse' | 'wasd'
        lang:           'en',     // 'en' | 'pt' (escolhido na splash)
    },
    counts: {
        cows:    100,
        farmers: 20,
    },
    fx: {
        rain:           false,
        rainIntensity:  0.5,
        rainAngle:      0.3,   // -1..1 (negativo = to left)
        rainSpeed:      1.0,   // 0.2..3 multiplicador
        rainSize:       1.0,   // 0.3..3 mult. do comprimento da gota
        rainCount:      80,    // 0..400 frequência (qty de gotas)
        fog:            false,
        fogIntensity:   0.5,
        beamSparks:     true,
        beamShake:      true,
        fancyExplosion: true,
        wangtiles:      true,
        tileStyle:      'dirt_grass_32',  // 'test' | 'dirt_grass_32' | 'ocean_sand_32'
        wangDebug:      false,            // overlay com numero do tile em cada celula
        timeOfDay:      'day',     // dawn|day|dusk|sunset|night|midnight
        timeAutoCycle:  false,     // ciclo auto a each 60s
        weather:        'clear',   // clear|rain|snow|fog|storm
        weatherShuffle: false,     // PREVIEW aleatoriza weather+TOD
        snow:           false,
        snowCount:      100,       // 0..400 flakes
        snowIntensity:  0.85,      // 0..1 alpha
        wind:           false,     // swirl particles + driver do rainAngle
        windForce:      0.03,      // -0.05..0.05 (positivo = right)
        quips:          true,      // floating one-liners
    },
    proc: {
        // Procedural terrain (PixaPro-style) -- vertex grid binario + CA
        vertThreshold:  0.50,  // 0..1 prob de upper no white noise inicial
        vertCaPasses:   4,     // smoothing iterations (0=raw noise, 6+=convergencia)
        autoSortTiles:  true,  // runtime auto-sort por color sampling (cr31)
    },
};

// Migration map: PT key (legacy localStorage) -> EN key (novo padrao).
// Roda em _loadDebugCfg to preservar configs salvas before do refator.
// Nota: as chaves do lado esquerdo SAO PT (legadas no localStorage do user),
// nao can ser tocadas por replace global. Fonte: docs/configs_pre_translation.json
const PT_TO_EN_MIGRATION = {
    enabled:  { ['va'+'cas']:'cows', ['b'+'ois']:'bulls', ['fazendeir'+'os']:'farmers', ['atirador'+'es']:'shooters', ['cenari'+'o']:'scenery' },
    scale:    { ['va'+'ca']:'cow', ['b'+'oi']:'bull', ['fa'+'z']:'farmer', ['nav'+'e']:'ufo' },
    behavior: { ['sensibilidad'+'e']:'sensitivity', ['velVac'+'a']:'cowSpeed', ['velFa'+'z']:'farmerSpeed', ['danoAtirador']:'shooterDamage', ['discoRo'+'t']:'ufoRot' },
    counts:   { ['va'+'cas']:'cows', ['fazendeir'+'os']:'farmers' },
    fx:       { ['chuv'+'a']:'rain', ['chuvaIntensidad'+'e']:'rainIntensity', ['chuvaAngul'+'o']:'rainAngle', ['chuvaVelocidad'+'e']:'rainSpeed', ['chuvaTamanh'+'o']:'rainSize', ['chuvaCoun'+'t']:'rainCount', ['neblin'+'a']:'fog', ['neblinaIntensidad'+'e']:'fogIntensity', ['explosaoBo'+'a']:'fancyExplosion', ['snowIntensidad'+'e']:'snowIntensity', ['vent'+'o']:'wind', ['ventoForc'+'a']:'windForce' },
};

Object.assign(Jogo.prototype, {

    _loadDebugCfg() {
        try {
            const raw = JSON.parse(localStorage.getItem(DBG_KEY) || '{}');
            // Migration PT->EN: remapeia keys legadas before do merge com defaults
            const migrated = this._migratePtKeys(raw);
            this.dbg = {
                enabled:  Object.assign({}, DBG_DEFAULTS.enabled,  migrated.enabled),
                scale:    Object.assign({}, DBG_DEFAULTS.scale,    migrated.scale),
                behavior: Object.assign({}, DBG_DEFAULTS.behavior, migrated.behavior),
                counts:   Object.assign({}, DBG_DEFAULTS.counts,   migrated.counts),
                fx:       Object.assign({}, DBG_DEFAULTS.fx,       migrated.fx),
                proc:     Object.assign({}, DBG_DEFAULTS.proc,     migrated.proc),
            };
        } catch (e) {
            this.dbg = JSON.parse(JSON.stringify(DBG_DEFAULTS));
        }
    },

    // Migration de keys PT legadas (pre-refator R2) to novos nomes EN.
    // Preserva valores salvos pelo user. Snapshot em docs/configs_pre_translation.json
    _migratePtKeys(raw) {
        if (!raw || typeof raw !== 'object') return {};
        const out = {};
        for (const section in raw) {
            const sectionData = raw[section];
            if (!sectionData || typeof sectionData !== 'object') {
                out[section] = sectionData;
                continue;
            }
            const map = PT_TO_EN_MIGRATION[section] || {};
            out[section] = {};
            for (const k in sectionData) {
                const newKey = map[k] || k;
                out[section][newKey] = sectionData[k];
            }
        }
        return out;
    },

    // M7: debounce 500ms — slider drag dispara setItem ~10x/s without this
    _saveDebugCfg() {
        if (!this.dbg) return;
        if (this._saveDbgTimer) clearTimeout(this._saveDbgTimer);
        this._saveDbgTimer = setTimeout(() => {
            try { localStorage.setItem(DBG_KEY, JSON.stringify(this.dbg)); }
            catch (e) { console.warn('[DBG SAVE FAIL]', e); }
            this._saveDbgTimer = null;
        }, 500);
    },

    _setupDebugMenu() {
        if (document.getElementById('debug-menu')) return;

        const css = `
            #debug-menu { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                background:rgba(0,16,8,0.96); border:2px solid #00ff55; color:#aaffcc;
                padding:14px 18px; font-family:'Courier New',monospace; font-size:12px;
                z-index:9999; display:none; max-height:86vh; overflow-y:auto;
                min-width:320px; max-width:380px; box-shadow:0 0 24px rgba(0,255,85,0.25); }
            #debug-menu h2 { color:#00ff55; margin:0 0 8px 0; font-size:14px; letter-spacing:2px; }
            #debug-menu .tab-bar { display:flex; gap:3px; margin-bottom:10px; }
            #debug-menu .tab-btn { flex:1; background:#001a08; color:#558877;
                border:1px solid #224433; padding:5px 2px; font-family:inherit;
                font-size:10px; cursor:pointer; letter-spacing:1px; }
            #debug-menu .tab-btn.active { background:#00aa44; color:#001a08;
                border-color:#00aa44; font-weight:bold; }
            #debug-menu .tab-btn:hover:not(.active) { background:#003311; color:#aaffcc; }
            #debug-menu fieldset { border:1px solid #224433; margin:0 0 8px 0; padding:7px 10px; }
            #debug-menu legend { color:#00ff55; padding:0 6px; font-size:11px; letter-spacing:1px; }
            #debug-menu label { display:flex; align-items:center; justify-content:space-between;
                margin:3px 0; gap:8px; cursor:pointer; }
            #debug-menu label:hover { color:#ffffff; }
            #debug-menu input[type=range] { flex:1; max-width:120px; accent-color:#00ff55; }
            #debug-menu input[type=number] { width:54px; background:#001a08; color:#aaffcc;
                border:1px solid #224433; padding:2px 4px; font-family:inherit; font-size:11px; }
            #debug-menu input.val { width:56px; text-align:right; color:#00ff55;
                font-weight:bold; background:#001a08; border:1px solid #224433;
                padding:2px 4px; font-family:inherit; font-size:11px; }
            #debug-menu input.val:focus { outline:1px solid #00ff55; }
            #debug-menu .btn-row { display:flex; gap:6px; margin-top:10px; }
            #debug-menu button { flex:1; background:#00aa44; color:#001a08; border:none;
                padding:7px 8px; font-family:inherit; font-weight:bold; cursor:pointer;
                font-size:11px; letter-spacing:1px; }
            #debug-menu button:hover { background:#22cc66; }
            #debug-menu button.secondary { background:#332211; color:#aa6644; }
            #debug-menu button.secondary:hover { background:#553322; color:#ffaa66; }
            #debug-menu .note { color:#446655; font-size:10px; margin-bottom:6px; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const html = `
            <div id="debug-menu">
                <h2>⚙ <span data-i18n="configs">CONFIGS</span></h2>
                <div class="tab-bar">
                    <button class="tab-btn active" data-tab="controls" data-i18n="controls">CONTROLS</button>
                    <button class="tab-btn" data-tab="looks" data-i18n="looks">VISUALS</button>
                    <button class="tab-btn" data-tab="vfx" data-i18n="vfx">VFX</button>
                    <button class="tab-btn" data-tab="debug" data-i18n="debug">DEBUG</button>
                </div>

                <!-- ABA: CONTROLES -->
                <div class="tab-panel" id="tab-controls">
                    <div class="note" data-i18n="note_live">Apply live without restart.</div>
                    <fieldset>
                        <legend data-i18n="ufo">SHIP</legend>
                        <label><span data-i18n="language">Language</span>
                            <select data-cfg="behavior.lang" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="en">ENG</option>
                                <option value="pt">PTBR</option>
                            </select></label>
                        <label><span data-i18n="input">Input</span>
                            <select data-cfg="behavior.inputMode" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="mouse" data-i18n="opt_mouse">Mouse</option>
                                <option value="wasd" data-i18n="opt_wasd">WASD + Space</option>
                            </select></label>
                        <label><span data-i18n="sensitivity">Sensibilidade</span>
                            <input type="range" min="1" max="1.5" step="0.25" data-cfg="behavior.sensitivity" list="sens-ticks">
                            <datalist id="sens-ticks"><option value="1"></option><option value="1.25"></option><option value="1.5"></option></datalist>
                            <input type="number" class="val" data-show="behavior.sensitivity" /></label>
                        <label><span data-i18n="beam_force">Força beam (pull)</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.pullBeam">
                            <input type="number" class="val" data-show="behavior.pullBeam" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="entities">ENTIDADES</legend>
                        <label><span data-i18n="vel_cows">Velocidade cows/oxen</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.cowSpeed">
                            <input type="number" class="val" data-show="behavior.cowSpeed" /></label>
                        <label><span data-i18n="vel_farmer">Velocidade farmers</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.farmerSpeed">
                            <input type="number" class="val" data-show="behavior.farmerSpeed" /></label>
                        <label><span data-i18n="shooter_dmg">Dano shooters</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.shooterDamage">
                            <input type="number" class="val" data-show="behavior.shooterDamage" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="amounts">QUANTIDADES (reiniciar)</legend>
                        <label><span data-i18n="cows_spawn">Vacas spawn</span>
                            <input type="number" min="0" max="200" step="1" data-cfg="counts.cows"></label>
                        <label><span data-i18n="farmer_spawn">Fazendeiros spawn</span>
                            <input type="number" min="0" max="50" step="1" data-cfg="counts.farmers"></label>
                    </fieldset>
                </div>

                <!-- ABA: LOOKS -->
                <div class="tab-panel" id="tab-looks" style="display:none">
                    <div class="note" data-i18n="note_visual">Escalas aplicam ao reiniciar. Barrel aplica live.</div>
                    <fieldset>
                        <legend data-i18n="scales">ESCALAS</legend>
                        <label><span data-i18n="cow">Vaca</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.cow">
                            <input type="number" class="val" data-show="scale.cow" /></label>
                        <label><span data-i18n="ox">Boi</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.bull">
                            <input type="number" class="val" data-show="scale.bull" /></label>
                        <label><span data-i18n="farmer">Fazendeiro</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.farmer">
                            <input type="number" class="val" data-show="scale.farmer" /></label>
                        <label><span data-i18n="beam_radius">Beam radius</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.beam">
                            <input type="number" class="val" data-show="scale.beam" /></label>
                        <label><span data-i18n="ufo_label">Nave (UFO)</span>
                            <input type="range" min="0.3" max="6" step="0.01" data-cfg="scale.ufo">
                            <input type="number" class="val" data-show="scale.ufo" /></label>
                        <label><span data-i18n="burger">Hambúrguer</span>
                            <input type="range" min="0.3" max="6" step="0.01" data-cfg="scale.burger">
                            <input type="number" class="val" data-show="scale.burger" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="camera">CÂMERA</legend>
                        <label><span data-i18n="dist_sphere">Distorção esférica</span>
                            <input type="range" min="0" max="0.8" step="0.01" data-cfg="behavior.barrel">
                            <input type="number" class="val" data-show="behavior.barrel" /></label>
                    </fieldset>
                </div>

                <!-- ABA: VFX -->
                <div class="tab-panel" id="tab-vfx" style="display:none">
                    <div class="note" data-i18n="note_vfx">Todos aplicam live.</div>
                    <fieldset>
                        <legend data-i18n="time_of_day">TIME OF DAY</legend>
                        <label><span data-i18n="time">Time</span>
                            <select data-cfg="fx.timeOfDay" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="dawn" data-i18n="opt_dawn">Dawn</option>
                                <option value="day" data-i18n="opt_day">Day</option>
                                <option value="dusk" data-i18n="opt_dusk">Dusk</option>
                                <option value="sunset" data-i18n="opt_sunset">Sunset</option>
                                <option value="night" data-i18n="opt_night">Night</option>
                                <option value="midnight" data-i18n="opt_midnight">Midnight</option>
                            </select></label>
                        <label><span data-i18n="auto_cycle">Auto-cycle (60s/preset)</span><input type="checkbox" data-cfg="fx.timeAutoCycle"></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="weather">WEATHER</legend>
                        <label><span data-i18n="preset">Preset</span>
                            <select data-cfg="fx.weather" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="clear" data-i18n="opt_clear">Clear</option>
                                <option value="rain" data-i18n="opt_rain">Rain</option>
                                <option value="snow" data-i18n="opt_snow">Snow</option>
                                <option value="fog" data-i18n="opt_fog">Fog</option>
                                <option value="storm" data-i18n="opt_storm">Storm (rain+fog+lightning)</option>
                            </select></label>
                        <label><span data-i18n="shuffle_prev">Shuffle on PREVIEW</span><input type="checkbox" data-cfg="fx.weatherShuffle"></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="rain">CHUVA</legend>
                        <label><span data-i18n="active">Ativar</span><input type="checkbox" data-cfg="fx.rain"></label>
                        <label><span data-i18n="intensity">Intensidade (alpha)</span>
                            <input type="range" min="0" max="1" step="0.01" data-cfg="fx.rainIntensity">
                            <input type="number" class="val" data-show="fx.rainIntensity" /></label>
                        <label><span data-i18n="frequency">Frequência (gotas)</span>
                            <input type="range" min="0" max="400" step="5" data-cfg="fx.rainCount">
                            <input type="number" class="val" data-show="fx.rainCount" /></label>
                        <label><span data-i18n="angle">Ângulo (-0.05=esq, +0.05=dir)</span>
                            <input type="range" min="-0.05" max="0.05" step="0.005" data-cfg="fx.rainAngle">
                            <input type="number" class="val" data-show="fx.rainAngle" /></label>
                        <label><span data-i18n="speed">Velocidade</span>
                            <input type="range" min="0.2" max="3" step="0.01" data-cfg="fx.rainSpeed">
                            <input type="number" class="val" data-show="fx.rainSpeed" /></label>
                        <label><span data-i18n="stroke_len">Comprimento traço</span>
                            <input type="range" min="0.3" max="3" step="0.01" data-cfg="fx.rainSize">
                            <input type="number" class="val" data-show="fx.rainSize" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="fog">NEBLINA</legend>
                        <label><span data-i18n="active">Ativar</span><input type="checkbox" data-cfg="fx.fog"></label>
                        <label><span data-i18n="intensity">Intensidade</span>
                            <input type="range" min="0" max="1" step="0.01" data-cfg="fx.fogIntensity">
                            <input type="number" class="val" data-show="fx.fogIntensity" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="wind">VENTO</legend>
                        <label><span data-i18n="active">Ativar</span><input type="checkbox" data-cfg="fx.wind"></label>
                        <label><span data-i18n="wind_force">Força (-0.05=esq, +0.05=dir)</span>
                            <input type="range" min="-0.05" max="0.05" step="0.005" data-cfg="fx.windForce">
                            <input type="number" class="val" data-show="fx.windForce" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="effects">EFEITOS</legend>
                        <label><span data-i18n="sparkles_beam">Sparkles no beam</span><input type="checkbox" data-cfg="fx.beamSparks"></label>
                        <label><span data-i18n="shake_beam">Shake/flash beam</span><input type="checkbox" data-cfg="fx.beamShake"></label>
                        <label><span data-i18n="explosion">Explosão fancy</span><input type="checkbox" data-cfg="fx.fancyExplosion"></label>
                        <label><span data-i18n="quips">Frases engraçadas</span><input type="checkbox" data-cfg="fx.quips"></label>
                        <label><span data-i18n="wang">Wang tiles (debug)</span><input type="checkbox" data-cfg="fx.wangtiles"></label>
                        <label><span data-i18n="wang_debug">Mostrar nº dos tiles (live)</span><input type="checkbox" data-cfg="fx.wangDebug"></label>
                        <label><span data-i18n="tile_style">Tile style</span>
                            <select data-cfg="fx.tileStyle" style="flex:1;max-width:200px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="test" data-i18n="opt_tile_test">Test palette</option>
                                <option value="dirt_grass_32" data-i18n="opt_tile_dirt">Grass / Dirt (32)</option>
                                <option value="ocean_sand_32" data-i18n="opt_tile_ocean">Ocean / Sand (32)</option>
                                <option value="mapa1_ocean_dirt"  data-i18n="opt_tile_m1_od">Mapa 1: Ocean+Dirt</option>
                                <option value="mapa1_ocean_grass" data-i18n="opt_tile_m1_og">Mapa 1: Ocean+Grass</option>
                                <option value="mapa1_sand_dirt"   data-i18n="opt_tile_m1_sd">Mapa 1: Sand+Dirt</option>
                                <option value="mapa1_sand_grass"  data-i18n="opt_tile_m1_sg">Mapa 1: Sand+Grass</option>
                                <option value="mapa2_ocean_dirt"  data-i18n="opt_tile_m2_od">Mapa 2: Ocean+Dirt seco</option>
                                <option value="mapa2_ocean_grass" data-i18n="opt_tile_m2_og">Mapa 2: Ocean+Grass seco</option>
                                <option value="mapa2_sand_dirt"   data-i18n="opt_tile_m2_sd">Mapa 2: Sand+Dirt seco</option>
                                <option value="mapa2_sand_grass"  data-i18n="opt_tile_m2_sg">Mapa 2: Sand+Grass seco</option>
                            </select></label>
                        <label><span data-i18n="wang_autosort">Auto-sort tiles (color sampling)</span><input type="checkbox" data-cfg="proc.autoSortTiles"></label>
                        <label><span data-i18n="wang_threshold">Vertex threshold</span>
                            <input type="range" data-cfg="proc.vertThreshold" min="0.20" max="0.80" step="0.01">
                            <input type="number" class="val" data-show="proc.vertThreshold" /></label>
                        <label><span data-i18n="wang_capasses">CA passes (smoothing)</span>
                            <input type="range" data-cfg="proc.vertCaPasses" min="0" max="8" step="1">
                            <input type="number" class="val" data-show="proc.vertCaPasses" /></label>
                    </fieldset>
                </div>

                <!-- ABA: DEBUG -->
                <div class="tab-panel" id="tab-debug" style="display:none">
                    <div class="note" data-i18n="note_debug">Toggles aplicam ao reiniciar.</div>
                    <fieldset>
                        <legend data-i18n="entities_onoff">ENTIDADES (ON/OFF)</legend>
                        <label><span data-i18n="cows_e">Vacas</span><input type="checkbox" data-cfg="enabled.cows"></label>
                        <label><span data-i18n="bulls_e">Bois</span><input type="checkbox" data-cfg="enabled.bulls"></label>
                        <label><span data-i18n="farmers_e">Fazendeiros</span><input type="checkbox" data-cfg="enabled.farmers"></label>
                        <label><span data-i18n="shooters_e">Atiradores (torres)</span><input type="checkbox" data-cfg="enabled.shooters"></label>
                        <label><span data-i18n="beam_e">Beam visual</span><input type="checkbox" data-cfg="enabled.beam"></label>
                        <label><span data-i18n="scenery">Cenário (cercas/moitas)</span><input type="checkbox" data-cfg="enabled.scenery"></label>
                    </fieldset>
                </div>

                <div class="btn-row">
                    <button id="dbg-preview" style="background:#003355;color:#aaffcc;" data-i18n="btn_preview">👁 PREVIEW (live)</button>
                </div>
                <div class="btn-row">
                    <button id="dbg-apply" data-i18n="btn_apply">APPLY + RESTART</button>
                    <button id="dbg-reset" class="secondary" data-i18n="btn_reset">RESET</button>
                </div>
                <div style="text-align:center; margin-top:6px; font-size:10px; color:#446655;">
                    ESC fecha • salvo em localStorage
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const root = document.getElementById('debug-menu');

        // Troca de abas
        root.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                root.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                root.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
                btn.classList.add('active');
                root.querySelector(`#tab-${btn.dataset.tab}`).style.display = 'block';
            });
        });

        // Bind inputs (range / checkbox / number without .val)
        root.querySelectorAll('input[data-cfg]').forEach(input => {
            const [section, key] = input.dataset.cfg.split('.');
            const v = this.dbg[section][key];
            if (input.type === 'checkbox') {
                input.checked = !!v;
            } else {
                input.value = v;
            }
            // Display = number editavel ao lado do range
            const display = root.querySelector(`input.val[data-show="${input.dataset.cfg}"]`);
            if (display) {
                display.value = (typeof v === 'number') ? v.toFixed(2) : v;
                // Copia step/min/max do slider pro number input to UX consistente
                if (input.type === 'range') {
                    display.step = input.step;
                    display.min  = input.min;
                    display.max  = input.max;
                }
            }

            input.addEventListener('input', () => {
                let val;
                if (input.type === 'checkbox') val = input.checked;
                else if (input.type === 'number') val = Math.max(0, parseInt(input.value, 10) || 0);
                else val = parseFloat(input.value);

                this.dbg[section][key] = val;
                this._saveDebugCfg();

                if (display && typeof val === 'number') display.value = val.toFixed(2);

                if (section === 'fx' && this._applyFXVisibility) this._applyFXVisibility();
                // wangDebug: re-renderiza overlay live (sem precisar restart)
                if (section === 'fx' && key === 'wangDebug' && this._toggleWangDebug) {
                    this._toggleWangDebug();
                }
            });
        });

        // Bind dos number inputs editaveis (.val) — usuario digita -> updates slider + dbg
        root.querySelectorAll('input.val[data-show]').forEach(numInp => {
            const cfg = numInp.dataset.show;
            const [section, key] = cfg.split('.');
            const slider = root.querySelector(`input[type=range][data-cfg="${cfg}"]`);
            const apply = () => {
                let val = parseFloat(numInp.value);
                if (isNaN(val)) return;
                if (slider) {
                    const min = parseFloat(slider.min);
                    const max = parseFloat(slider.max);
                    if (!isNaN(min) && val < min) val = min;
                    if (!isNaN(max) && val > max) val = max;
                    slider.value = val;
                }
                this.dbg[section][key] = val;
                this._saveDebugCfg();
                numInp.value = val.toFixed(2);
                if (section === 'fx' && this._applyFXVisibility) this._applyFXVisibility();
            };
            numInp.addEventListener('change', apply);  // confirma with Enter ou blur
            numInp.addEventListener('blur', apply);
        });

        // Bind <select> (input mode, timeOfDay, weather, lang etc)
        root.querySelectorAll('select[data-cfg]').forEach(sel => {
            const [section, key] = sel.dataset.cfg.split('.');
            sel.value = this.dbg[section][key];
            sel.addEventListener('change', () => {
                this.dbg[section][key] = sel.value;
                this._saveDebugCfg();
                if (section === 'fx' && (key === 'timeOfDay' || key === 'weather')) {
                    if (this._applyAtmosphere) this._applyAtmosphere();
                }
                if (section === 'behavior' && key === 'lang') {
                    if (this._applyMenuI18n) this._applyMenuI18n();
                    if (this._applyHudI18n) this._applyHudI18n();
                }
            });
        });

        // Applies i18n initial baseado no lang salvo
        if (this._applyMenuI18n) this._applyMenuI18n();

        // PREVIEW: 5s timeslice — hides menu + enemies to você ver o mood escolhido
        // Shuffle ON: aleatoriza weather + TOD a each click. Após 5s, restaura tudo e reabre menu.
        document.getElementById('dbg-preview').addEventListener('click', () => {
            this._tutPreviewActive = true;
            // Safety: reset flag after de 6s same que algo falhe
            this.time.delayedCall(6000, () => { this._tutPreviewActive = false; });

            // Shuffle: random weather + TOD
            if (this.dbg?.fx?.weatherShuffle) {
                // Shuffle aleatoriza WEATHER + TIME OF DAY ambos
                const TODs = ['dawn','day','dusk','sunset','night','midnight'];
                const WTHs = ['clear','rain','snow','fog','storm'];
                this.dbg.fx.timeOfDay = TODs[Math.floor(Math.random()*TODs.length)];
                this.dbg.fx.weather   = WTHs[Math.floor(Math.random()*WTHs.length)];
                if (this._saveDebugCfg) this._saveDebugCfg();
                if (this._applyAtmosphere) this._applyAtmosphere();
            }

            // Snapshot do estado atual to restaurar after
            const inSplash = !this.gameStarted;
            const snap = {
                inSplash,
                pausadoBefore: this.paused,
                matterBefore:  this.matter.world.enabled,
                splash:  inSplash ? (this._splashElements || []).slice() : [],
                farmers: (this.farmers || []).slice(),
                towers:  (this.shooters  || []).slice(),
                bullets: (this.bullets       || []).slice(),
            };
            // Hide
            this._toggleDebugMenu(false);
            this._splashConfigsOpen = false;
            snap.splash.forEach(o  => o && o.scene && o.setVisible(false));
            snap.farmers.forEach(f => f && f.scene && f.setVisible(false));
            snap.towers.forEach(t  => t && t.sprite && t.sprite.scene && t.sprite.setVisible(false));
            snap.bullets.forEach(b => b && b.sprite && b.sprite.scene && b.sprite.setVisible(false));
            // Despausa to atmosphere/rain animarem
            this.paused = false;
            this.matter.world.enabled = true;
            if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
            if (this.pauseGrafico) this.pauseGrafico.setVisible(false);
            if (this.pauseLabel)   this.pauseLabel.setVisible(false);
            if (this.pauseHint)    this.pauseHint.setVisible(false);

            // 5s after: restaura
            this.time.delayedCall(5000, () => {
                this._tutPreviewActive = false;
                snap.splash.forEach(o  => o && o.scene && o.setVisible(true));
                snap.farmers.forEach(f => f && f.scene && f.setVisible(true));
                snap.towers.forEach(t  => t && t.sprite && t.sprite.scene && t.sprite.setVisible(true));
                snap.bullets.forEach(b => b && b.sprite && b.sprite.scene && b.sprite.setVisible(true));
                this.paused = snap.pausadoBefore;
                this.matter.world.enabled = snap.matterBefore;
                if (this.pauseOverlay) this.pauseOverlay.setVisible(snap.pausadoBefore);
                if (this.pauseGrafico) this.pauseGrafico.setVisible(snap.pausadoBefore);
                if (this.pauseLabel)   this.pauseLabel.setVisible(snap.pausadoBefore);
                if (this.pauseHint)    this.pauseHint.setVisible(snap.pausadoBefore);
                // Reabre o menu CONFIGS
                this._toggleDebugMenu(true);
                if (inSplash) this._splashConfigsOpen = true;
            });
        });

        document.getElementById('dbg-apply').addEventListener('click', () => {
            this._saveDebugCfg();
            window.location.reload();
        });
        document.getElementById('dbg-reset').addEventListener('click', () => {
            if (!confirm('Resetar todas as configs de debug?')) return;
            localStorage.removeItem(DBG_KEY);
            window.location.reload();
        });
    },

    // Updates textos do menu pelo lang escolhido (data-i18n="key")
    _applyMenuI18n() {
        const lang = this.dbg?.behavior?.lang || 'en';
        const dict = MENU_I18N[lang] || MENU_I18N.en;
        const root = document.getElementById('debug-menu');
        if (!root) return;
        root.querySelectorAll('[data-i18n]').forEach(el => {
            const k = el.dataset.i18n;
            if (dict[k]) el.textContent = dict[k];
        });
    },

    _toggleDebugMenu(visible) {
        const el = document.getElementById('debug-menu');
        if (el) el.style.display = visible ? 'block' : 'none';
    }

});
