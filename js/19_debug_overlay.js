// 19_debug_overlay.js — Overlay de debug toggleable com F3
// Mostra: FPS, heap (Chrome only), counts de entidades/tweens, últimos erros.
// Console.log estruturado a cada 5s pra você anexar em bug report.
Object.assign(Jogo.prototype, {

    _setupDebugOverlay() {
        // Tecla F3 toggle
        this._keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);

        // Container DOM (mais leve que Phaser text pra atualizar 60x/s)
        const el = document.createElement('div');
        el.id = 'debug-overlay';
        el.style.cssText = `
            position:fixed; top:8px; left:8px;
            background:rgba(0,0,0,0.78); color:#0f0;
            font-family:'Courier New',monospace; font-size:11px;
            padding:8px 12px; border:1px solid #0a4;
            z-index:9998; pointer-events:none;
            white-space:pre; line-height:1.4;
            min-width:240px; max-width:340px;
            display:none;
        `;
        document.body.appendChild(el);
        this._dbgOverlayEl = el;

        // Captura erros globais (pega coisas fora do try/catch do _updateBody)
        this._errorLog = [];   // [{t, msg}]
        this._maxErrors = 6;
        const captureErr = (msg, src) => {
            const t = new Date().toLocaleTimeString();
            this._errorLog.push({ t, msg: `[${src}] ${msg}`.substring(0, 220) });
            if (this._errorLog.length > this._maxErrors) this._errorLog.shift();
        };
        // window.onerror catch errors síncronos
        if (!window._chapDbgWired) {
            window._chapDbgWired = true;
            window.addEventListener('error', (e) => {
                captureErr((e.error?.stack || e.message || String(e)).split('\n').slice(0, 2).join(' | '), 'window');
            });
            window.addEventListener('unhandledrejection', (e) => {
                captureErr(String(e.reason).substring(0, 200), 'promise');
            });
        }
        this._captureErr = captureErr;

        // Console.log estruturado a cada 5s
        this._dbgLogTimer = this.time.addEvent({
            delay: 5000, loop: true,
            callback: () => this._dbgLogSnapshot(),
        });
    },

    // Render overlay (chamado no update body)
    _updateDebugOverlay() {
        // F3 toggle
        if (this._keyF3 && Phaser.Input.Keyboard.JustDown(this._keyF3)) {
            this._dbgOverlayVisible = !this._dbgOverlayVisible;
            if (this._dbgOverlayEl) {
                this._dbgOverlayEl.style.display = this._dbgOverlayVisible ? 'block' : 'none';
            }
        }
        if (!this._dbgOverlayVisible || !this._dbgOverlayEl) return;

        const fps = this.game.loop.actualFps.toFixed(1);
        const tweens = this.tweens.getTweens().length;
        const vacas = (this.vacas || []).length;
        const farmers = (this.fazendeiros || []).length;
        const towers = (this.atiradores || []).length;
        const bullets = (this.balas || []).length;
        const abduzidas = (this.vacas_abduzidas || []).length;
        const radarFades = this._radarBlipFades?.size || 0;

        // Heap (Chrome / Edge / Brave somente)
        let heap = 'N/A';
        if (performance.memory) {
            const mb = performance.memory.usedJSHeapSize / 1024 / 1024;
            const mbLimit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
            heap = `${mb.toFixed(1)}/${mbLimit.toFixed(0)} MB`;
        }

        // Cor do FPS: verde >55, amarelo >30, vermelho abaixo
        const fpsNum = parseFloat(fps);
        const fpsColor = fpsNum > 55 ? '#0f0' : fpsNum > 30 ? '#fa0' : '#f44';

        const errs = this._errorLog.slice(-3).map(e => ` · [${e.t}] ${e.msg}`).join('\n') || '  none';

        this._dbgOverlayEl.innerHTML =
            `<span style="color:#fff">DEBUG (F3 toggle)</span>\n` +
            `FPS:    <span style="color:${fpsColor}">${fps}</span>\n` +
            `Heap:   ${heap}\n` +
            `Tweens: ${tweens}\n` +
            `\n` +
            `Vacas:    ${vacas}\n` +
            `Bois/abd: ${abduzidas}\n` +
            `Farmers:  ${farmers}\n` +
            `Towers:   ${towers}\n` +
            `Bullets:  ${bullets}\n` +
            `RadarFds: ${radarFades}\n` +
            `\n` +
            `<span style="color:#fa0">Last errors:</span>\n${errs}`;
    },

    _dbgLogSnapshot() {
        const fps = this.game.loop.actualFps.toFixed(1);
        const heap = performance.memory
            ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) + ' MB'
            : 'N/A';
        const snap = {
            fps, heap,
            tweens: this.tweens.getTweens().length,
            vacas: (this.vacas || []).length,
            farmers: (this.fazendeiros || []).length,
            towers: (this.atiradores || []).length,
            bullets: (this.balas || []).length,
            abduzidas: (this.vacas_abduzidas || []).length,
            errors: this._errorLog.length,
        };
        console.log('[DBG SNAPSHOT]', snap);
    },

});
