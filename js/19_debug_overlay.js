// 19_debug_overlay.js — Overlay de debug toggleable with F3
// Shows: FPS, heap (Chrome only), counts de entidades/tweens, últimos erros.
// Console.log estruturado a each 5s to você anexar em bug report.
Object.assign(Jogo.prototype, {

    _setupDebugOverlay() {
        // Tecla F3 toggle
        this._keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);

        // Container DOM (more leve que Phaser text to update 60x/s)
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

        // Captura erros globais (pega coisas outside do try/catch do _updateBody)
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

        // Console.log estruturado a each 5s
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
        const cows = (this.cows || []).length;
        const farmers = (this.farmers || []).length;
        const towers = (this.shooters || []).length;
        const bullets = (this.bullets || []).length;
        const abduzidas = (this.abductedCows || []).length;
        const radarFades = this._radarBlipFades?.size || 0;

        // Heap (Chrome / Edge / Brave somente)
        let heap = 'N/A';
        if (performance.memory) {
            const mb = performance.memory.usedJSHeapSize / 1024 / 1024;
            const mbLimit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
            heap = `${mb.toFixed(1)}/${mbLimit.toFixed(0)} MB`;
        }

        // Color do FPS: verde >55, amarelo >30, vermelho below
        const fpsNum = parseFloat(fps);
        const fpsColor = fpsNum > 55 ? '#0f0' : fpsNum > 30 ? '#fa0' : '#f44';

        const errs = this._errorLog.slice(-3).map(e => ` · [${e.t}] ${e.msg}`).join('\n') || '  none';

        this._dbgOverlayEl.innerHTML =
            `<span style="color:#fff">DEBUG (F3 toggle)</span>\n` +
            `FPS:    <span style="color:${fpsColor}">${fps}</span>\n` +
            `Heap:   ${heap}\n` +
            `Tweens: ${tweens}\n` +
            `\n` +
            `Vacas:    ${cows}\n` +
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
            cows: (this.cows || []).length,
            farmers: (this.farmers || []).length,
            towers: (this.shooters || []).length,
            bullets: (this.bullets || []).length,
            abduzidas: (this.abductedCows || []).length,
            errors: this._errorLog.length,
        };
        console.log('[DBG SNAPSHOT]', snap);
    },

});
