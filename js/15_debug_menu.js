// 15_debug_menu.js — Painel DOM com abas: CONTROLES / LOOKS / VFX / DEBUG
// Aparece com a pausa (ESC). Salva em localStorage.
// Behavior + barrel aplicam live; ENTIDADES/LOOKS/QUANTIDADES exigem reiniciar.
const DBG_KEY = 'chapEscapadeDebug';

// Dicionário de tradução do menu CONFIGS (en default, pt opcional)
const MENU_I18N = {
    en: {
        configs:'CONFIGS', controles:'CONTROLS', looks:'VISUALS', vfx:'VFX', debug:'DEBUG',
        nave:'SHIP', entidades:'ENTITIES', entidades_onoff:'ENTITIES (ON/OFF)',
        quantidades:'AMOUNTS (restart)', escalas:'SCALES', camera:'CAMERA',
        time_of_day:'TIME OF DAY', weather:'WEATHER', chuva:'RAIN', neblina:'FOG',
        note_live:'Apply live without restart.', note_visual:'Scales apply on restart. Barrel applies live.',
        note_vfx:'All apply live.', note_debug:'Toggles apply on restart.',
        btn_apply:'APPLY + RESTART', btn_reset:'RESET', btn_preview:'👁 PREVIEW (live)',
        input:'Input', sensibilidade:'Sensitivity', rot_disco:'Disc rotation', forca_beam:'Beam force (pull)',
        vel_vacas:'Cows/oxen speed', vel_faz:'Farmers speed', dano_at:'Shooter damage',
        vacas_spawn:'Cows spawn', faz_spawn:'Farmers spawn',
        vaca:'Cow', boi:'Ox', fazendeiro:'Farmer', beam_radius:'Beam radius',
        nave_ufo:'Ship (UFO)', burger:'Burger', dist_esf:'Spherical distortion',
        time:'Time', auto_cycle:'Auto-cycle (60s/preset)', preset:'Preset', shuffle_prev:'Shuffle on PREVIEW',
        ativar:'Active', intensidade:'Intensity', frequencia:'Frequency (drops)', angulo:'Angle (-1=L, +1=R)',
        velocidade:'Speed', comp_traco:'Stroke length', flocos:'Flakes',
        sparkles_beam:'Beam sparkles', shake_beam:'Beam shake/flash', explosao:'Fancy explosion',
        wang:'Wang tiles (debug)', vacas_e:'Cows', bois_e:'Oxen', fazendeiros_e:'Farmers',
        atiradores_e:'Shooters (towers)', beam_e:'Beam visual', cenario:'Scenery (fences/bushes)',
        language:'Language',
        atmosfera:'ATMOSPHERE', efeitos:'EFFECTS', neve:'SNOW',
    },
    pt: {
        configs:'CONFIGURAÇÕES', controles:'CONTROLES', looks:'VISUAIS', vfx:'EFEITOS', debug:'DEBUG',
        nave:'NAVE', entidades:'ENTIDADES', entidades_onoff:'ENTIDADES (ON/OFF)',
        quantidades:'QUANTIDADES (reiniciar)', escalas:'ESCALAS', camera:'CÂMERA',
        time_of_day:'HORA DO DIA', weather:'CLIMA', chuva:'CHUVA', neblina:'NEBLINA',
        note_live:'Aplicam ao vivo sem reiniciar.', note_visual:'Escalas aplicam ao reiniciar. Barrel aplica ao vivo.',
        note_vfx:'Todos aplicam ao vivo.', note_debug:'Toggles aplicam ao reiniciar.',
        btn_apply:'APLICAR + REINICIAR', btn_reset:'RESETAR', btn_preview:'👁 PRÉVIA (ao vivo)',
        input:'Controle', sensibilidade:'Sensibilidade', rot_disco:'Rotação do disco', forca_beam:'Força do beam (atração)',
        vel_vacas:'Velocidade vacas/bois', vel_faz:'Velocidade fazendeiros', dano_at:'Dano dos atiradores',
        vacas_spawn:'Vacas spawn', faz_spawn:'Fazendeiros spawn',
        vaca:'Vaca', boi:'Boi', fazendeiro:'Fazendeiro', beam_radius:'Raio do beam',
        nave_ufo:'Nave (UFO)', burger:'Hambúrguer', dist_esf:'Distorção esférica',
        time:'Hora', auto_cycle:'Ciclo automático (60s/preset)', preset:'Preset', shuffle_prev:'Aleatório na PRÉVIA',
        ativar:'Ativar', intensidade:'Intensidade', frequencia:'Frequência (gotas)', angulo:'Ângulo (-1=esq, +1=dir)',
        velocidade:'Velocidade', comp_traco:'Comprimento do traço', flocos:'Flocos',
        sparkles_beam:'Sparkles no beam', shake_beam:'Shake/flash do beam', explosao:'Explosão fancy',
        wang:'Wang tiles (debug)', vacas_e:'Vacas', bois_e:'Bois', fazendeiros_e:'Fazendeiros',
        atiradores_e:'Atiradores (torres)', beam_e:'Beam visual', cenario:'Cenário (cercas/moitas)',
        language:'Idioma',
        atmosfera:'ATMOSFERA', efeitos:'EFEITOS', neve:'NEVE',
    },
};

const DBG_DEFAULTS = {
    enabled: {
        vacas:       true,
        bois:        true,
        fazendeiros: true,
        atiradores:  true,
        beam:        true,
        cenario:     true,
    },
    scale: {
        vaca:   1.0,
        boi:    3.0,
        faz:    2.0,
        beam:   1.0,
        nave:   1.0,
        burger: 1.0,
    },
    behavior: {
        sensibilidade: 1.0,  // multiplicador da força da nave (live)
        pullBeam:      0.5,
        velVaca:       1.0,
        velFaz:        1.0,
        danoAtirador:  1.0,
        discoRot:      0.0,
        barrel:        0.15,
        inputMode:     'mouse',  // 'mouse' | 'wasd'
        lang:          'en',     // 'en' | 'pt' (escolhido na splash via PLAY > ENG/PTBR)
    },
    counts: {
        vacas:       100,
        fazendeiros: 20,
    },
    fx: {
        chuva:              false,
        chuvaIntensidade:   0.5,
        chuvaAngulo:        0.3,   // -1..1 (negativo = pra esquerda)
        chuvaVelocidade:    1.0,   // 0.2..3 multiplicador
        chuvaTamanho:       1.0,   // 0.3..3 mult. do comprimento da gota
        chuvaCount:         80,    // 0..400 frequência (qtd de gotas)
        neblina:            false,
        neblinaIntensidade: 0.5,
        beamSparks:         true,
        beamShake:          true,
        explosaoBoa:        true,
        wangtiles:          false,
        timeOfDay:          'day',     // dawn|day|dusk|sunset|night|midnight
        timeAutoCycle:      false,     // ciclo auto a cada 60s
        weather:            'clear',   // clear|rain|snow|fog|storm
        weatherShuffle:     false,     // PREVIEW aleatoriza weather+TOD a cada click
        snow:               false,
        snowCount:          100,       // 0..400 flocos
        snowIntensidade:    0.85,      // 0..1 alpha
    },
};

Object.assign(Jogo.prototype, {

    _loadDebugCfg() {
        try {
            const raw = JSON.parse(localStorage.getItem(DBG_KEY) || '{}');
            this.dbg = {
                enabled:  Object.assign({}, DBG_DEFAULTS.enabled,  raw.enabled),
                scale:    Object.assign({}, DBG_DEFAULTS.scale,    raw.scale),
                behavior: Object.assign({}, DBG_DEFAULTS.behavior, raw.behavior),
                counts:   Object.assign({}, DBG_DEFAULTS.counts,   raw.counts),
                fx:       Object.assign({}, DBG_DEFAULTS.fx,       raw.fx),
            };
        } catch (e) {
            this.dbg = JSON.parse(JSON.stringify(DBG_DEFAULTS));
        }
    },

    // M7: debounce 500ms — slider drag dispara setItem ~10x/s sem isso
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
                    <button class="tab-btn active" data-tab="controles" data-i18n="controles">CONTROLS</button>
                    <button class="tab-btn" data-tab="looks" data-i18n="looks">VISUALS</button>
                    <button class="tab-btn" data-tab="vfx" data-i18n="vfx">VFX</button>
                    <button class="tab-btn" data-tab="debug" data-i18n="debug">DEBUG</button>
                </div>

                <!-- ABA: CONTROLES -->
                <div class="tab-panel" id="tab-controles">
                    <div class="note" data-i18n="note_live">Apply live without restart.</div>
                    <fieldset>
                        <legend data-i18n="nave">SHIP</legend>
                        <label><span data-i18n="language">Language</span>
                            <select data-cfg="behavior.lang" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="en">ENG</option>
                                <option value="pt">PTBR</option>
                            </select></label>
                        <label><span data-i18n="input">Input</span>
                            <select data-cfg="behavior.inputMode" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="mouse">Mouse</option>
                                <option value="wasd">WASD + Space</option>
                            </select></label>
                        <label><span>Sensibilidade</span>
                            <input type="range" min="1" max="1.5" step="0.25" data-cfg="behavior.sensibilidade" list="sens-ticks">
                            <datalist id="sens-ticks"><option value="1"></option><option value="1.25"></option><option value="1.5"></option></datalist>
                            <input type="number" class="val" data-show="behavior.sensibilidade" /></label>
                        <label><span>Força beam (pull)</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.pullBeam">
                            <input type="number" class="val" data-show="behavior.pullBeam" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="entidades">ENTIDADES</legend>
                        <label><span>Velocidade vacas/bois</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.velVaca">
                            <input type="number" class="val" data-show="behavior.velVaca" /></label>
                        <label><span>Velocidade fazendeiros</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.velFaz">
                            <input type="number" class="val" data-show="behavior.velFaz" /></label>
                        <label><span>Dano atiradores</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.danoAtirador">
                            <input type="number" class="val" data-show="behavior.danoAtirador" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="quantidades">QUANTIDADES (reiniciar)</legend>
                        <label><span>Vacas spawn</span>
                            <input type="number" min="0" max="200" step="1" data-cfg="counts.vacas"></label>
                        <label><span>Fazendeiros spawn</span>
                            <input type="number" min="0" max="50" step="1" data-cfg="counts.fazendeiros"></label>
                    </fieldset>
                </div>

                <!-- ABA: LOOKS -->
                <div class="tab-panel" id="tab-looks" style="display:none">
                    <div class="note" data-i18n="note_visual">Escalas aplicam ao reiniciar. Barrel aplica live.</div>
                    <fieldset>
                        <legend data-i18n="escalas">ESCALAS</legend>
                        <label><span>Vaca</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.vaca">
                            <input type="number" class="val" data-show="scale.vaca" /></label>
                        <label><span>Boi</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.boi">
                            <input type="number" class="val" data-show="scale.boi" /></label>
                        <label><span>Fazendeiro</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.faz">
                            <input type="number" class="val" data-show="scale.faz" /></label>
                        <label><span>Beam radius</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="scale.beam">
                            <input type="number" class="val" data-show="scale.beam" /></label>
                        <label><span>Nave (UFO)</span>
                            <input type="range" min="0.3" max="6" step="0.01" data-cfg="scale.nave">
                            <input type="number" class="val" data-show="scale.nave" /></label>
                        <label><span>Hambúrguer</span>
                            <input type="range" min="0.3" max="6" step="0.01" data-cfg="scale.burger">
                            <input type="number" class="val" data-show="scale.burger" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="camera">CÂMERA</legend>
                        <label><span>Distorção esférica</span>
                            <input type="range" min="0" max="0.8" step="0.01" data-cfg="behavior.barrel">
                            <input type="number" class="val" data-show="behavior.barrel" /></label>
                    </fieldset>
                </div>

                <!-- ABA: VFX -->
                <div class="tab-panel" id="tab-vfx" style="display:none">
                    <div class="note" data-i18n="note_vfx">Todos aplicam live.</div>
                    <fieldset>
                        <legend data-i18n="time_of_day">TIME OF DAY</legend>
                        <label><span>Time</span>
                            <select data-cfg="fx.timeOfDay" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="dawn">Dawn</option>
                                <option value="day">Day</option>
                                <option value="dusk">Dusk</option>
                                <option value="sunset">Sunset</option>
                                <option value="night">Night</option>
                                <option value="midnight">Midnight</option>
                            </select></label>
                        <label><span>Auto-cycle (60s/preset)</span><input type="checkbox" data-cfg="fx.timeAutoCycle"></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="weather">WEATHER</legend>
                        <label><span>Preset</span>
                            <select data-cfg="fx.weather" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="clear">Clear</option>
                                <option value="rain">Rain</option>
                                <option value="snow">Snow</option>
                                <option value="fog">Fog</option>
                                <option value="storm">Storm (rain+fog+lightning)</option>
                            </select></label>
                        <label><span>Shuffle on PREVIEW</span><input type="checkbox" data-cfg="fx.weatherShuffle"></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="chuva">CHUVA</legend>
                        <label><span>Ativar</span><input type="checkbox" data-cfg="fx.chuva"></label>
                        <label><span>Intensidade (alpha)</span>
                            <input type="range" min="0" max="1" step="0.01" data-cfg="fx.chuvaIntensidade">
                            <input type="number" class="val" data-show="fx.chuvaIntensidade" /></label>
                        <label><span>Frequência (gotas)</span>
                            <input type="range" min="0" max="400" step="5" data-cfg="fx.chuvaCount">
                            <input type="number" class="val" data-show="fx.chuvaCount" /></label>
                        <label><span>Ângulo (-1=esq, +1=dir)</span>
                            <input type="range" min="-1" max="1" step="0.01" data-cfg="fx.chuvaAngulo">
                            <input type="number" class="val" data-show="fx.chuvaAngulo" /></label>
                        <label><span>Velocidade</span>
                            <input type="range" min="0.2" max="3" step="0.01" data-cfg="fx.chuvaVelocidade">
                            <input type="number" class="val" data-show="fx.chuvaVelocidade" /></label>
                        <label><span>Comprimento traço</span>
                            <input type="range" min="0.3" max="3" step="0.01" data-cfg="fx.chuvaTamanho">
                            <input type="number" class="val" data-show="fx.chuvaTamanho" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="neblina">NEBLINA</legend>
                        <label><span>Ativar</span><input type="checkbox" data-cfg="fx.neblina"></label>
                        <label><span>Intensidade</span>
                            <input type="range" min="0" max="1" step="0.01" data-cfg="fx.neblinaIntensidade">
                            <input type="number" class="val" data-show="fx.neblinaIntensidade" /></label>
                    </fieldset>
                    <fieldset>
                        <legend data-i18n="efeitos">EFEITOS</legend>
                        <label><span>Sparkles no beam</span><input type="checkbox" data-cfg="fx.beamSparks"></label>
                        <label><span>Shake/flash beam</span><input type="checkbox" data-cfg="fx.beamShake"></label>
                        <label><span>Explosão fancy</span><input type="checkbox" data-cfg="fx.explosaoBoa"></label>
                        <label><span>Wang tiles (debug)</span><input type="checkbox" data-cfg="fx.wangtiles"></label>
                    </fieldset>
                </div>

                <!-- ABA: DEBUG -->
                <div class="tab-panel" id="tab-debug" style="display:none">
                    <div class="note" data-i18n="note_debug">Toggles aplicam ao reiniciar.</div>
                    <fieldset>
                        <legend data-i18n="entidades_onoff">ENTIDADES (ON/OFF)</legend>
                        <label><span>Vacas</span><input type="checkbox" data-cfg="enabled.vacas"></label>
                        <label><span>Bois</span><input type="checkbox" data-cfg="enabled.bois"></label>
                        <label><span>Fazendeiros</span><input type="checkbox" data-cfg="enabled.fazendeiros"></label>
                        <label><span>Atiradores (torres)</span><input type="checkbox" data-cfg="enabled.atiradores"></label>
                        <label><span>Beam visual</span><input type="checkbox" data-cfg="enabled.beam"></label>
                        <label><span>Cenário (cercas/moitas)</span><input type="checkbox" data-cfg="enabled.cenario"></label>
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

        // Bind inputs (range / checkbox / number sem .val)
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
                // Copia step/min/max do slider pro number input pra UX consistente
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
            });
        });

        // Bind dos number inputs editaveis (.val) — usuario digita -> atualiza slider + dbg
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
            numInp.addEventListener('change', apply);  // confirma com Enter ou blur
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

        // Aplica i18n inicial baseado no lang salvo
        if (this._applyMenuI18n) this._applyMenuI18n();

        // PREVIEW: 5s timeslice — esconde menu + inimigos pra você ver o mood escolhido
        // Shuffle ON: aleatoriza weather + TOD a cada click. Após 5s, restaura tudo e reabre menu.
        document.getElementById('dbg-preview').addEventListener('click', () => {
            this._tutPreviewActive = true;
            // Safety: reset flag depois de 6s mesmo que algo falhe
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

            // Snapshot do estado atual pra restaurar depois
            const inSplash = !this.gameStarted;
            const snap = {
                inSplash,
                pausadoBefore: this.pausado,
                matterBefore:  this.matter.world.enabled,
                splash:  inSplash ? (this._splashElements || []).slice() : [],
                farmers: (this.fazendeiros || []).slice(),
                towers:  (this.atiradores  || []).slice(),
                bullets: (this.balas       || []).slice(),
            };
            // Hide
            this._toggleDebugMenu(false);
            this._splashConfigsOpen = false;
            snap.splash.forEach(o  => o && o.scene && o.setVisible(false));
            snap.farmers.forEach(f => f && f.scene && f.setVisible(false));
            snap.towers.forEach(t  => t && t.sprite && t.sprite.scene && t.sprite.setVisible(false));
            snap.bullets.forEach(b => b && b.sprite && b.sprite.scene && b.sprite.setVisible(false));
            // Despausa pra atmosfera/chuva animarem
            this.pausado = false;
            this.matter.world.enabled = true;
            if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
            if (this.pauseGrafico) this.pauseGrafico.setVisible(false);
            if (this.pauseLabel)   this.pauseLabel.setVisible(false);
            if (this.pauseHint)    this.pauseHint.setVisible(false);

            // 5s depois: restaura
            this.time.delayedCall(5000, () => {
                this._tutPreviewActive = false;
                snap.splash.forEach(o  => o && o.scene && o.setVisible(true));
                snap.farmers.forEach(f => f && f.scene && f.setVisible(true));
                snap.towers.forEach(t  => t && t.sprite && t.sprite.scene && t.sprite.setVisible(true));
                snap.bullets.forEach(b => b && b.sprite && b.sprite.scene && b.sprite.setVisible(true));
                this.pausado = snap.pausadoBefore;
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

    // Atualiza textos do menu pelo lang escolhido (data-i18n="key")
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
