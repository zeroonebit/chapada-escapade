// 12_mobile.js — Cockpit de toque: o painel (05_hud) vira o controle.
// Dedo na BOLA VERMELHA do joystick (esquerda) move a nave; dedo na LENTE do
// emissor (direita) liga o feixe. Toque no mapa não faz nada (user, 30/10).
// Ativo quando this.touchCockpit (tela de toque no jogo completo, ex. tablet).
// O teaser do celular (MOBILE_MODE) continua com o dedo direto no mapa.
//
// As zonas são em px da ARTE do dash (2056×541) convertidas pelo _ckScale /
// _ckMin do 05_hud — por isso não precisam de listener de resize.
Object.assign(Jogo.prototype, {

    _setupMobileControls() {
        if (window.__MOBILE_MODE) return;          // teaser: dedo direto
        if (!this.touchCockpit || !this._cockpit) return;

        this._joyVec = { x: 0, y: 0, active: false };
        this._beamHeld = false;
        this._joyPointerId = null;
        this._beamPointerId = null;

        // Zonas (px da arte): bola do joystick em (137,229), lente em (1912,284).
        // Raio de toque generoso (130 art px ≈ 65px na tela a s=0.5); o curso
        // útil do joystick é 90 art px = velocidade cheia.
        const JOY_C   = { x: 137,  y: 229 };
        const LENS_C  = { x: 1912, y: 284 };
        const JOY_R   = 130, LENS_R = 130, JOY_MAX = 90;
        const s   = () => this._ckScale || 0.3;
        const art = (p) => ({ x: this._ckMin.x + p.x * s(), y: this._ckMin.y + p.y * s() });
        this._ckJoyCenter  = () => art(JOY_C);
        this._ckLensCenter = () => art(LENS_C);

        const updateJoy = (p) => {
            const c = this._ckJoyCenter();
            const max = JOY_MAX * s();
            let dx = p.x - c.x, dy = p.y - c.y;
            const d = Math.hypot(dx, dy);
            if (d > max) { dx = dx / d * max; dy = dy / d * max; }
            this._joyVec = { x: dx / max, y: dy / max, active: d > 4 };
        };

        this.input.on('pointerdown', (p) => {
            if (!this.gameStarted || this.gameOver || this.paused || !this._ckMin) return;
            // O Phaser reaproveita o objeto pointer pra um dedo novo: se o
            // pointerup do anterior se perdeu, o id velho não pode prender a zona
            if (p.id === this._joyPointerId)  { this._joyPointerId = null;  this._joyVec = { x: 0, y: 0, active: false }; }
            if (p.id === this._beamPointerId) { this._beamPointerId = null; this._beamHeld = false; }
            const c = this._ckJoyCenter(), l = this._ckLensCenter();
            if (this._joyPointerId === null &&
                Phaser.Math.Distance.Between(p.x, p.y, c.x, c.y) < JOY_R * s()) {
                this._joyPointerId = p.id;
                updateJoy(p);
                return;
            }
            if (this._beamPointerId === null &&
                Phaser.Math.Distance.Between(p.x, p.y, l.x, l.y) < LENS_R * s()) {
                this._beamPointerId = p.id;
                this._beamHeld = true;
            }
        });

        this.input.on('pointermove', (p) => {
            if (p.id === this._joyPointerId) updateJoy(p);
        });

        const release = (p) => {
            if (p.id === this._joyPointerId) {
                this._joyPointerId = null;
                this._joyVec = { x: 0, y: 0, active: false };
            }
            if (p.id === this._beamPointerId) {
                this._beamPointerId = null;
                this._beamHeld = false;
            }
        };
        this.input.on('pointerup', release);
        this.input.on('pointerupoutside', release);
    }

});
