// 11_gameflow.js — Fluxo de jogo: splash, pausa (ESC), game over, vitória
Object.assign(Jogo.prototype, {

    // ── SPLASH ────────────────────────────────────────────────────────────
    _setupSplash() {
        this.gameStarted  = false;
        this.tutorialMode = false;
        this.matter.world.enabled = false;

        const w = this.scale.width, h = this.scale.height;

        this.splashBg = this.add.rectangle(w/2, h/2, w, h, 0x000a03, 1)
            .setScrollFactor(0).setDepth(500);

        this.splashImg = this.add.image(w/2, h/2, 'splash')
            .setScrollFactor(0).setDepth(501);
        const tex = this.splashImg.texture.getSourceImage();
        this.splashImg.setScale(Math.min(w / tex.width, h / tex.height));

        // ── 3 BOTÕES: PLAY / TUTORIAL MOUSE / TUTORIAL WASD ─────────────
        const BTN_W = 170, BTN_H = 46;
        const GAP = 16;
        const bY = h - 38;
        const totalW = BTN_W * 3 + GAP * 2;
        const startX = (w - totalW) / 2 + BTN_W / 2;

        const HIT_PAD_X = 40, HIT_PAD_Y = 20;
        const mkHit = () => new Phaser.Geom.Rectangle(
            -HIT_PAD_X, -HIT_PAD_Y, BTN_W + HIT_PAD_X*2, BTN_H + HIT_PAD_Y*2
        );

        // PLAY
        const btnPlay = this.add.rectangle(startX, bY, BTN_W, BTN_H, 0x00cc44)
            .setScrollFactor(0).setDepth(502)
            .setInteractive(mkHit(), Phaser.Geom.Rectangle.Contains);
        btnPlay.input.cursor = 'pointer';
        const lblPlay = this.add.text(startX, bY, 'PLAY', {
            fontSize: '18px', fill: '#001a08', fontStyle: 'bold', letterSpacing: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(503);

        // TUTORIAL MOUSE
        const btnTutMouse = this.add.rectangle(startX + (BTN_W+GAP), bY, BTN_W, BTN_H, 0x224433)
            .setScrollFactor(0).setDepth(502)
            .setStrokeStyle(2, 0x00ff55, 0.8)
            .setInteractive(mkHit(), Phaser.Geom.Rectangle.Contains);
        btnTutMouse.input.cursor = 'pointer';
        const lblTutMouse = this.add.text(startX + (BTN_W+GAP), bY, 'TUTORIAL\nMOUSE', {
            fontSize: '13px', fill: '#00ff55', fontStyle: 'bold', letterSpacing: 1, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(503);

        // TUTORIAL WASD
        const btnTutWasd = this.add.rectangle(startX + (BTN_W+GAP)*2, bY, BTN_W, BTN_H, 0x224433)
            .setScrollFactor(0).setDepth(502)
            .setStrokeStyle(2, 0x00ff55, 0.8)
            .setInteractive(mkHit(), Phaser.Geom.Rectangle.Contains);
        btnTutWasd.input.cursor = 'pointer';
        const lblTutWasd = this.add.text(startX + (BTN_W+GAP)*2, bY, 'TUTORIAL\nWASD', {
            fontSize: '13px', fill: '#00ff55', fontStyle: 'bold', letterSpacing: 1, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(503);

        btnPlay.on('pointerover',     () => btnPlay.setFillStyle(0x44ff88));
        btnPlay.on('pointerout',      () => btnPlay.setFillStyle(0x00cc44));
        btnTutMouse.on('pointerover', () => btnTutMouse.setFillStyle(0x336655));
        btnTutMouse.on('pointerout',  () => btnTutMouse.setFillStyle(0x224433));
        btnTutWasd.on('pointerover',  () => btnTutWasd.setFillStyle(0x336655));
        btnTutWasd.on('pointerout',   () => btnTutWasd.setFillStyle(0x224433));

        const allBtns = [this.splashBg, this.splashImg, btnPlay, lblPlay,
                         btnTutMouse, lblTutMouse, btnTutWasd, lblTutWasd];

        const _startGame = (tutorial, inputMode) => {
            this.gameStarted  = true;
            this.tutorialMode = !!tutorial;
            // Aplica input mode escolhido
            if (inputMode && this.dbg?.behavior) {
                this.dbg.behavior.inputMode = inputMode;
                if (this._saveDebugCfg) this._saveDebugCfg();
            }
            this.matter.world.enabled = true;
            allBtns.forEach(o => o.destroy());
            if (this.tutorialMode && this._setupTutorial) this._setupTutorial();
        };

        btnPlay.on('pointerdown',     () => _startGame(false));
        btnTutMouse.on('pointerdown', () => _startGame(true, 'mouse'));
        btnTutWasd.on('pointerdown',  () => _startGame(true, 'wasd'));

        // Resize
        this.scale.on('resize', () => {
            if (this.gameStarted) return;
            const w2 = this.scale.width, h2 = this.scale.height;
            this.splashBg.setPosition(w2/2, h2/2).setSize(w2, h2);
            this.splashImg.setPosition(w2/2, h2/2);
            const tex2 = this.splashImg.texture.getSourceImage();
            this.splashImg.setScale(Math.min(w2 / tex2.width, h2 / tex2.height));
            const bY2 = h2 - 38;
            const sX  = (w2 - totalW) / 2 + BTN_W / 2;
            btnPlay.setPosition(sX, bY2);
            lblPlay.setPosition(sX, bY2);
            btnTutMouse.setPosition(sX + (BTN_W+GAP), bY2);
            lblTutMouse.setPosition(sX + (BTN_W+GAP), bY2);
            btnTutWasd.setPosition(sX + (BTN_W+GAP)*2, bY2);
            lblTutWasd.setPosition(sX + (BTN_W+GAP)*2, bY2);
        });
    },

    // ── PAUSA ─────────────────────────────────────────────────────────────
    _setupPausa() {
        this.pausado = false;
        this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        const pw = this.scale.width, ph = this.scale.height;

        // Fundo semi-transparente
        this.pauseOverlay = this.add.rectangle(pw/2, ph/2, pw, ph, 0x000000, 0.72)
            .setScrollFactor(0).setDepth(300).setVisible(false);

        // Símbolo ⏸ — duas barras desenhadas com Graphics
        this.pauseGrafico = this.add.graphics()
            .setScrollFactor(0).setDepth(301).setVisible(false);
        this.pauseGrafico.fillStyle(0x00ff55, 1);
        this.pauseGrafico.fillRoundedRect(-26, -45, 18, 90, 5); // barra esquerda
        this.pauseGrafico.fillRoundedRect(8,   -45, 18, 90, 5); // barra direita
        this.pauseGrafico.setPosition(pw/2, ph/2 - 35);

        // Label "PAUSE"
        this.pauseLabel = this.add.text(pw/2, ph/2 + 72, 'PAUSE', {
            fontSize: '28px', fill: '#00ff55', fontStyle: 'bold', letterSpacing: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

        // Hint
        this.pauseHint = this.add.text(pw/2, ph/2 + 112, 'ESC para continuar', {
            fontSize: '13px', fill: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301).setVisible(false);

        this.scale.on('resize', () => {
            const w2 = this.scale.width, h2 = this.scale.height;
            this.pauseOverlay.setPosition(w2/2, h2/2).setSize(w2, h2);
            this.pauseGrafico.setPosition(w2/2, h2/2 - 35);
            this.pauseLabel.setPosition(w2/2, h2/2 + 72);
            this.pauseHint.setPosition(w2/2, h2/2 + 112);
        });
    },

    // ── VITÓRIA ───────────────────────────────────────────────────────────
    _checkVitoria() {
        if (this.gameOver) return;
        if (this.fazendeiros.length === 0 && this.atiradores.length === 0) {
            this._vitoria();
        }
    },

    _vitoria() {
        this.gameOver = true;
        this._soltarTodas();

        const w = this.scale.width, h = this.scale.height;

        // Splash de fundo verde — repete o look do início
        const bgV = this.add.image(w/2, h/2, 'splash')
            .setScrollFactor(0).setDepth(199).setTint(0x114422);
        const texV = bgV.texture.getSourceImage();
        bgV.setScale(Math.max(w / texV.width, h / texV.height));
        bgV.setAlpha(0.55);

        this.add.rectangle(w/2, h/2, w, h, 0x001a08, 0.55)
            .setScrollFactor(0).setDepth(200);

        // Linha decorativa
        this.add.rectangle(w/2, h/2 - 135, 260, 2, 0x00ff55, 0.5)
            .setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 - 105, 'VITÓRIA!', {
            fontSize: '52px', fill: '#00ff66', fontStyle: 'bold',
            stroke: '#003311', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 - 42, 'Cerrado limpo, alien feliz', {
            fontSize: '13px', fill: '#5acc88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.rectangle(w/2, h/2 - 12, 260, 2, 0x00ff55, 0.25)
            .setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 + 18, 'SCORE FINAL', {
            fontSize: '11px', fill: '#555555', fontStyle: 'bold', letterSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 + 56, this.scoreAtual, {
            fontSize: '52px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        let btn = this.add.rectangle(w/2, h/2 + 120, 220, 42, 0x00dd44)
            .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
        this.add.text(w/2, h/2 + 120, 'JOGAR NOVAMENTE', {
            fontSize: '13px', fill: '#001a08', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        btn.on('pointerover', () => btn.setFillStyle(0x44ff88));
        btn.on('pointerout',  () => btn.setFillStyle(0x00dd44));
        btn.on('pointerdown', () => this.scene.restart());
    },

    // ── GAME OVER ─────────────────────────────────────────────────────────
    _gameOver() {
        this.gameOver = true;
        this._soltarTodas();

        const w = this.scale.width, h = this.scale.height;

        // Splash de fundo desaturado em vermelho — repete o look do início
        const bgImg = this.add.image(w/2, h/2, 'splash')
            .setScrollFactor(0).setDepth(199).setTint(0x441111);
        const texGO = bgImg.texture.getSourceImage();
        bgImg.setScale(Math.max(w / texGO.width, h / texGO.height));
        bgImg.setAlpha(0.55);

        this.add.rectangle(w/2, h/2, w, h, 0x050000, 0.55)
            .setScrollFactor(0).setDepth(200);

        // Linha decorativa
        this.add.rectangle(w/2, h/2 - 130, 260, 2, 0xff2222, 0.5)
            .setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 - 96, 'GAME OVER', {
            fontSize: '50px', fill: '#ff2222', fontStyle: 'bold',
            stroke: '#440000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.rectangle(w/2, h/2 - 44, 260, 2, 0xff2222, 0.25)
            .setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 - 14, 'SCORE', {
            fontSize: '11px', fill: '#555555', fontStyle: 'bold', letterSpacing: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2 + 28, this.scoreAtual, {
            fontSize: '52px', fill: '#00dd44', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        let btn = this.add.rectangle(w/2, h/2 + 100, 220, 42, 0x00dd44)
            .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
        this.add.text(w/2, h/2 + 100, 'JOGAR NOVAMENTE', {
            fontSize: '13px', fill: '#001a08', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        btn.on('pointerover', () => btn.setFillStyle(0x44ff88));
        btn.on('pointerout',  () => btn.setFillStyle(0x00dd44));
        btn.on('pointerdown', () => this.scene.restart());
    }

});
