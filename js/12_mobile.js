// 12_mobile.js — Joystick virtual + botão de feixe pra touch screens
// Só ativa em this.isMobile. Joystick à esquerda controla direção da nave;
// botão à direita ativa o feixe enquanto segurado.
Object.assign(Jogo.prototype, {

    _setupMobileControls() {
        if (!this.isMobile) return;

        // Permitir até 3 pointers (joystick + botão + extras)
        this.input.addPointer(2);

        this._joyVec = { x: 0, y: 0, active: false };
        this._beamHeld = false;
        this._joyPointerId = null;
        this._beamPointerId = null;

        const D = 150, D2 = 151;
        const COR_VERDE = 0x00ff55;
        const COR_VERMELHO = 0xff3366;

        // Base do joystick (anel)
        this.joyBase = this.add.circle(0, 0, 60, 0x000000, 0.30)
            .setStrokeStyle(2, COR_VERDE, 0.7).setScrollFactor(0).setDepth(D);
        // Knob (preenchido)
        this.joyKnob = this.add.circle(0, 0, 28, COR_VERDE, 0.55)
            .setScrollFactor(0).setDepth(D2);

        // Botão de feixe (anel + label)
        this.beamBtn = this.add.circle(0, 0, 60, COR_VERMELHO, 0.30)
            .setStrokeStyle(3, COR_VERMELHO, 0.85).setScrollFactor(0).setDepth(D);
        this.beamBtnLabel = this.add.text(0, 0, 'FEIXE', {
            fontSize: '13px', fill: '#ffffff', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(D2);

        this._posicionarMobileControls();

        // ── Pointer handlers ────────────────────────────────────────
        this.input.on('pointerdown', (p) => {
            if (!this.gameStarted || this.gameOver || this.pausado) return;
            // Joystick area (raio expandido pra 1.5x)
            const dj = Phaser.Math.Distance.Between(p.x, p.y, this._joyCx, this._joyCy);
            if (dj < 90 && this._joyPointerId === null) {
                this._joyPointerId = p.id;
                this._atualizarJoy(p);
                return;
            }
            // Botão de feixe
            const db = Phaser.Math.Distance.Between(p.x, p.y, this._beamCx, this._beamCy);
            if (db < 75 && this._beamPointerId === null) {
                this._beamPointerId = p.id;
                this._beamHeld = true;
                this.beamBtn.setFillStyle(COR_VERMELHO, 0.65);
            }
        });

        this.input.on('pointermove', (p) => {
            if (p.id === this._joyPointerId) this._atualizarJoy(p);
        });

        const releaseJoy = () => {
            this._joyPointerId = null;
            this._joyVec = { x: 0, y: 0, active: false };
            this.joyKnob.setPosition(this._joyCx, this._joyCy);
        };
        const releaseBeam = () => {
            this._beamPointerId = null;
            this._beamHeld = false;
            this.beamBtn.setFillStyle(COR_VERMELHO, 0.30);
        };

        this.input.on('pointerup', (p) => {
            if (p.id === this._joyPointerId) releaseJoy();
            if (p.id === this._beamPointerId) releaseBeam();
        });
        this.input.on('pointerupoutside', (p) => {
            if (p.id === this._joyPointerId) releaseJoy();
            if (p.id === this._beamPointerId) releaseBeam();
        });

        // Reposiciona em resize
        this.scale.on('resize', () => this._posicionarMobileControls());
    },

    _atualizarJoy(p) {
        let dx = p.x - this._joyCx;
        let dy = p.y - this._joyCy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const max = 60;
        if (dist > max) { dx = dx/dist * max; dy = dy/dist * max; }
        this.joyKnob.setPosition(this._joyCx + dx, this._joyCy + dy);
        // Vetor normalizado -1..1
        this._joyVec = { x: dx/max, y: dy/max, active: dist > 5 };
    },

    _posicionarMobileControls() {
        if (!this.isMobile || !this.joyBase) return;
        const w = this.scale.width, h = this.scale.height;
        const PAD_X = 95, PAD_Y = 110;

        this._joyCx = PAD_X;
        this._joyCy = h - PAD_Y;
        this.joyBase.setPosition(this._joyCx, this._joyCy);
        this.joyKnob.setPosition(this._joyCx, this._joyCy);

        this._beamCx = w - PAD_X;
        this._beamCy = h - PAD_Y;
        this.beamBtn.setPosition(this._beamCx, this._beamCy);
        this.beamBtnLabel.setPosition(this._beamCx, this._beamCy);
    }

});
