// 15_debug_menu.js — Painel DOM com toggles e sliders pra tunar o jogo sem editar código
// Aparece com a pausa (ESC). Salva em localStorage. Aplica live quando possível;
// outras coisas exigem reiniciar (botão APLICAR + REINICIAR).
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
        vaca: 1.0,
        boi:  3.0,   // user pediu 3x default
        faz:  2.0,   // user pediu 2x default
        beam: 1.0,
    },
    behavior: {
        danoAtirador: 1.0,
        velFaz:       1.0,
        velVaca:      1.0,
        pullBeam:     0.5,   // reduzido — beam estava arremessando bichos contra obstáculos
        discoRot:     0.0,   // velocidade angular da nave (rad/s)
    },
    counts: {
        vacas:       100,   // mapa 2.5x maior — era 40
        fazendeiros: 20,    // mapa 2.5x maior — era 8
    },
    fx: {
        chuva:        false,
        neblina:      false,
        beamSparks:   true,
        beamShake:    true,
        explosaoBoa:  true,
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
        if (document.getElementById('debug-menu')) return;  // idempotente

        const css = `
            #debug-menu { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
                background:rgba(0,16,8,0.94); border:2px solid #00ff55; color:#aaffcc;
                padding:18px 22px; font-family:'Courier New',monospace; font-size:12px;
                z-index:9999; display:none; max-height:88vh; overflow-y:auto;
                min-width:340px; box-shadow:0 0 24px rgba(0,255,85,0.25); }
            #debug-menu h2 { color:#00ff55; margin:0 0 6px 0; font-size:15px; letter-spacing:2px; }
            #debug-menu .sub { color:#558877; font-size:10px; margin-bottom:12px; }
            #debug-menu fieldset { border:1px solid #224433; margin:0 0 10px 0; padding:8px 10px; }
            #debug-menu legend { color:#00ff55; padding:0 6px; font-size:11px; letter-spacing:1px; }
            #debug-menu label { display:flex; align-items:center; justify-content:space-between;
                margin:3px 0; gap:10px; cursor:pointer; }
            #debug-menu label:hover { color:#ffffff; }
            #debug-menu input[type=range] { flex:1; max-width:140px; accent-color:#00ff55; }
            #debug-menu input[type=number] { width:50px; background:#001a08; color:#aaffcc;
                border:1px solid #224433; padding:2px 4px; }
            #debug-menu .val { min-width:38px; text-align:right; color:#00ff55; font-weight:bold; }
            #debug-menu .btn-row { display:flex; gap:6px; margin-top:10px; }
            #debug-menu button { flex:1; background:#00aa44; color:#001a08; border:none;
                padding:8px 10px; font-family:inherit; font-weight:bold; cursor:pointer;
                font-size:11px; letter-spacing:1px; }
            #debug-menu button:hover { background:#22cc66; }
            #debug-menu button.secondary { background:#332211; color:#aa6644; }
            #debug-menu button.secondary:hover { background:#553322; color:#ffaa66; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const html = `
            <div id="debug-menu">
                <h2>⚙ DEBUG MENU</h2>
                <div class="sub">Toggles e escalas aplicam ao reiniciar. Comportamento aplica live.</div>

                <fieldset>
                    <legend>ENTIDADES (ON/OFF)</legend>
                    <label><span>Vacas</span><input type="checkbox" data-cfg="enabled.vacas"></label>
                    <label><span>Bois</span><input type="checkbox" data-cfg="enabled.bois"></label>
                    <label><span>Fazendeiros</span><input type="checkbox" data-cfg="enabled.fazendeiros"></label>
                    <label><span>Atiradores (torres)</span><input type="checkbox" data-cfg="enabled.atiradores"></label>
                    <label><span>Beam visual</span><input type="checkbox" data-cfg="enabled.beam"></label>
                    <label><span>Cenário (cercas/moitas)</span><input type="checkbox" data-cfg="enabled.cenario"></label>
                </fieldset>

                <fieldset>
                    <legend>ESCALAS (visual) — 0 a 10</legend>
                    <label><span>Vaca</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="scale.vaca">
                        <span class="val" data-show="scale.vaca"></span></label>
                    <label><span>Boi</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="scale.boi">
                        <span class="val" data-show="scale.boi"></span></label>
                    <label><span>Fazendeiro</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="scale.faz">
                        <span class="val" data-show="scale.faz"></span></label>
                    <label><span>Beam radius</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="scale.beam">
                        <span class="val" data-show="scale.beam"></span></label>
                </fieldset>

                <fieldset>
                    <legend>COMPORTAMENTO (live) — 0 a 10</legend>
                    <label><span>Dano atiradores</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="behavior.danoAtirador">
                        <span class="val" data-show="behavior.danoAtirador"></span></label>
                    <label><span>Velocidade fazendeiros</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="behavior.velFaz">
                        <span class="val" data-show="behavior.velFaz"></span></label>
                    <label><span>Velocidade vacas/bois</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="behavior.velVaca">
                        <span class="val" data-show="behavior.velVaca"></span></label>
                    <label><span>Força do beam (pull)</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="behavior.pullBeam">
                        <span class="val" data-show="behavior.pullBeam"></span></label>
                    <label><span>Velocidade rotação disco</span>
                        <input type="range" min="0" max="10" step="0.1" data-cfg="behavior.discoRot">
                        <span class="val" data-show="behavior.discoRot"></span></label>
                </fieldset>

                <fieldset>
                    <legend>EFEITOS (live)</legend>
                    <label><span>Chuva</span><input type="checkbox" data-cfg="fx.chuva"></label>
                    <label><span>Neblina</span><input type="checkbox" data-cfg="fx.neblina"></label>
                    <label><span>Sparkles no beam</span><input type="checkbox" data-cfg="fx.beamSparks"></label>
                    <label><span>Shake/flash ao ligar beam</span><input type="checkbox" data-cfg="fx.beamShake"></label>
                    <label><span>Explosão fancy</span><input type="checkbox" data-cfg="fx.explosaoBoa"></label>
                </fieldset>

                <fieldset>
                    <legend>QUANTIDADES</legend>
                    <label><span>Vacas spawn</span>
                        <input type="number" min="0" max="200" step="1" data-cfg="counts.vacas"></label>
                    <label><span>Fazendeiros spawn</span>
                        <input type="number" min="0" max="50" step="1" data-cfg="counts.fazendeiros"></label>
                </fieldset>

                <div class="btn-row">
                    <button id="dbg-apply">APLICAR + REINICIAR</button>
                    <button id="dbg-reset" class="secondary">RESET</button>
                </div>
                <div style="text-align:center; margin-top:8px; font-size:10px; color:#446655;">
                    ESC fecha • salvo em localStorage
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        const root = document.getElementById('debug-menu');

        // Bind inputs aos valores atuais e listeners
        root.querySelectorAll('input[data-cfg]').forEach(input => {
            const [section, key] = input.dataset.cfg.split('.');
            const v = this.dbg[section][key];
            if (input.type === 'checkbox') {
                input.checked = !!v;
            } else {
                input.value = v;
            }
            // Atualiza display de valor inicial
            const display = root.querySelector(`[data-show="${input.dataset.cfg}"]`);
            if (display) display.textContent = (typeof v === 'number') ? v.toFixed(1) + 'x' : v;

            input.addEventListener('input', () => {
                let val;
                if (input.type === 'checkbox') val = input.checked;
                else if (input.type === 'number') val = Math.max(0, parseInt(input.value, 10) || 0);
                else val = parseFloat(input.value);

                this.dbg[section][key] = val;
                this._saveDebugCfg();

                if (display && typeof val === 'number') display.textContent = val.toFixed(1) + 'x';

                // Live-apply: efeitos visuais (chuva/neblina) atualizam na hora
                if (section === 'fx' && this._applyFXVisibility) this._applyFXVisibility();
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
