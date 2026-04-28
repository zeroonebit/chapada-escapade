// 15_debug_menu.js — Painel DOM com abas: CONTROLES / LOOKS / VFX / DEBUG
// Aparece com a pausa (ESC). Salva em localStorage.
// Behavior + barrel aplicam live; ENTIDADES/LOOKS/QUANTIDADES exigem reiniciar.
const DBG_KEY = 'chapEscapadeDebug';
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

    _saveDebugCfg() {
        if (this.dbg) localStorage.setItem(DBG_KEY, JSON.stringify(this.dbg));
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
                <h2>⚙ DEBUG MENU</h2>
                <div class="tab-bar">
                    <button class="tab-btn active" data-tab="controles">CONTROLES</button>
                    <button class="tab-btn" data-tab="looks">LOOKS</button>
                    <button class="tab-btn" data-tab="vfx">VFX</button>
                    <button class="tab-btn" data-tab="debug">DEBUG</button>
                </div>

                <!-- ABA: CONTROLES -->
                <div class="tab-panel" id="tab-controles">
                    <div class="note">Aplicam live sem reiniciar.</div>
                    <fieldset>
                        <legend>NAVE</legend>
                        <label><span>Input</span>
                            <select data-cfg="behavior.inputMode" style="flex:1;max-width:170px;min-width:130px;background:#001a08;color:#aaffcc;border:1px solid #224433;padding:3px 6px;font-family:inherit;font-size:11px;cursor:pointer;">
                                <option value="mouse">Mouse</option>
                                <option value="wasd">WASD + Space</option>
                            </select></label>
                        <label><span>Sensibilidade</span>
                            <input type="range" min="1" max="1.5" step="0.25" data-cfg="behavior.sensibilidade" list="sens-ticks">
                            <datalist id="sens-ticks"><option value="1"></option><option value="1.25"></option><option value="1.5"></option></datalist>
                            <input type="number" class="val" data-show="behavior.sensibilidade" /></label>
                        <label><span>Rotação disco</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.discoRot">
                            <input type="number" class="val" data-show="behavior.discoRot" /></label>
                        <label><span>Força beam (pull)</span>
                            <input type="range" min="0" max="10" step="0.01" data-cfg="behavior.pullBeam">
                            <input type="number" class="val" data-show="behavior.pullBeam" /></label>
                    </fieldset>
                    <fieldset>
                        <legend>ENTIDADES</legend>
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
                        <legend>QUANTIDADES (reiniciar)</legend>
                        <label><span>Vacas spawn</span>
                            <input type="number" min="0" max="200" step="1" data-cfg="counts.vacas"></label>
                        <label><span>Fazendeiros spawn</span>
                            <input type="number" min="0" max="50" step="1" data-cfg="counts.fazendeiros"></label>
                    </fieldset>
                </div>

                <!-- ABA: LOOKS -->
                <div class="tab-panel" id="tab-looks" style="display:none">
                    <div class="note">Escalas aplicam ao reiniciar. Barrel aplica live.</div>
                    <fieldset>
                        <legend>ESCALAS</legend>
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
                        <legend>CÂMERA</legend>
                        <label><span>Distorção esférica</span>
                            <input type="range" min="0" max="0.8" step="0.01" data-cfg="behavior.barrel">
                            <input type="number" class="val" data-show="behavior.barrel" /></label>
                    </fieldset>
                </div>

                <!-- ABA: VFX -->
                <div class="tab-panel" id="tab-vfx" style="display:none">
                    <div class="note">Todos aplicam live.</div>
                    <fieldset>
                        <legend>CHUVA</legend>
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
                        <legend>NEBLINA</legend>
                        <label><span>Ativar</span><input type="checkbox" data-cfg="fx.neblina"></label>
                        <label><span>Intensidade</span>
                            <input type="range" min="0" max="1" step="0.01" data-cfg="fx.neblinaIntensidade">
                            <input type="number" class="val" data-show="fx.neblinaIntensidade" /></label>
                    </fieldset>
                    <fieldset>
                        <legend>EFEITOS</legend>
                        <label><span>Sparkles no beam</span><input type="checkbox" data-cfg="fx.beamSparks"></label>
                        <label><span>Shake/flash beam</span><input type="checkbox" data-cfg="fx.beamShake"></label>
                        <label><span>Explosão fancy</span><input type="checkbox" data-cfg="fx.explosaoBoa"></label>
                        <label><span>Wang tiles (debug)</span><input type="checkbox" data-cfg="fx.wangtiles"></label>
                    </fieldset>
                </div>

                <!-- ABA: DEBUG -->
                <div class="tab-panel" id="tab-debug" style="display:none">
                    <div class="note">Toggles aplicam ao reiniciar.</div>
                    <fieldset>
                        <legend>ENTIDADES (ON/OFF)</legend>
                        <label><span>Vacas</span><input type="checkbox" data-cfg="enabled.vacas"></label>
                        <label><span>Bois</span><input type="checkbox" data-cfg="enabled.bois"></label>
                        <label><span>Fazendeiros</span><input type="checkbox" data-cfg="enabled.fazendeiros"></label>
                        <label><span>Atiradores (torres)</span><input type="checkbox" data-cfg="enabled.atiradores"></label>
                        <label><span>Beam visual</span><input type="checkbox" data-cfg="enabled.beam"></label>
                        <label><span>Cenário (cercas/moitas)</span><input type="checkbox" data-cfg="enabled.cenario"></label>
                    </fieldset>
                </div>

                <div class="btn-row">
                    <button id="dbg-apply">APLICAR + REINICIAR</button>
                    <button id="dbg-reset" class="secondary">RESET</button>
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

        // Bind <select> (input mode etc)
        root.querySelectorAll('select[data-cfg]').forEach(sel => {
            const [section, key] = sel.dataset.cfg.split('.');
            sel.value = this.dbg[section][key];
            sel.addEventListener('change', () => {
                this.dbg[section][key] = sel.value;
                this._saveDebugCfg();
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

    _toggleDebugMenu(visible) {
        const el = document.getElementById('debug-menu');
        if (el) el.style.display = visible ? 'block' : 'none';
    }

});
