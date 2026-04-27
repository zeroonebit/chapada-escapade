// 11_gameflow.js — Fluxo de jogo: splash, pausa (ESC), game over, vitória
Object.assign(Jogo.prototype, {

    // ── SPLASH ────────────────────────────────────────────────────────────
    _setupSplash() {
        this.gameStarted = false;
        this.matter.world.enabled = false; // congela física até o primeiro clique

        const w = this.scale.width, h = this.scale.height;

        // Fundo escuro
        this.splashBg = this.add.rectangle(w/2, h/2, w, h, 0x000a03, 1)
            .setScrollFactor(0).setDepth(500);

        // Logo splash.png (imagem circular com título, alien, vaca, chapada...)
        const imgSz = Math.min(w * 0.70, h * 0.78);
        this.splashImg = this.add.image(w/2, h/2 - 18, 'splash')
            .setDisplaySize(imgSz, imgSz)
            .setScrollFactor(0).setDepth(501);

        // Hint piscando abaixo da imagem
        const hintTxt = this.sys.game.device.input.touch
            ? '[ TOQUE PARA COMEÇAR ]' : '[ CLIQUE PARA COMEÇAR ]';
        this.splashHint = this.add.text(w/2, h/2 + imgSz/2 + 14, hintTxt, {
            fontSize: '17px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(501);

        this.tweens.add({
            targets: this.splashHint, alpha: 0.1, duration: 620, yoyo: true, repeat: -1
        });

        // Dismiss no primeiro clique/toque
        this.input.once('pointerdown', () => {
            this.gameStarted = true;
            this.matter.world.enabled = true;
            [this.splashBg, this.splashImg, this.splashHint].forEach(o => o.destroy());
        });

        // Resize
        this.scale.on('resize', () => {
            if (this.gameStarted) return;
            const w2 = this.scale.width, h2 = this.scale.height;
            const sz = Math.min(w2 * 0.70, h2 * 0.78);
            this.splashBg.setPosition(w2/2, h2/2).setSize(w2, h2);
            this.splashImg.setPosition(w2/2, h2/2 - 18).setDisplaySize(sz, sz);
            this.splashHint.setPosition(w2/2, h2/2 + sz/2 + 14);
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

        this.add.rectangle(w/2, h/2, w, h, 0x001a08, 0.90)
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

        this.add.rectangle(w/2, h/2, w, h, 0x050000, 0.88)
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
