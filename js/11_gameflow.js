// 11_gameflow.js — Fluxo de game: splash, pausa (ESC), game over, vitória
Object.assign(Jogo.prototype, {

    // ── SPLASH ────────────────────────────────────────────────────────────
    _setupSplash() {
        this.gameStarted  = false;
        this.tutorialMode = false;
        this.matter.world.enabled = false;

        // Mobile mode: pula splash, entra direto em PLAY com touch input.
        // O DOM preloader eh fechado pelo 'complete' do this.load no preload.
        if (window.__MOBILE_MODE) {
            this.gameStarted = true;
            this.matter.world.enabled = true;
            if (this.dbg?.behavior) {
                this.dbg.behavior.inputMode = 'mouse';  // joystick mobile usa mouse path
            }
            return;
        }

        // Sessao anterior ja escolheu lang+input -> pula splash entirely.
        // Tutorial fica disabled (so aparece no primeiro jogo). Pode resetar
        // limpando o localStorage 'cep_played_once'.
        try {
            if (localStorage.getItem('cep_played_once') === '1') {
                this.gameStarted = true;
                this.tutorialMode = false;
                this.matter.world.enabled = true;
                return;
            }
        } catch (e) { /* localStorage indisponivel — segue splash normal */ }

        const w = this.scale.width, h = this.scale.height;

        this.splashBg = this.add.rectangle(w/2, h/2, w, h, 0x000a03, 1)
            .setScrollFactor(0).setDepth(500);

        this.splashImg = this.add.image(w/2, h/2, 'splash')
            .setScrollFactor(0).setDepth(501);
        const tex = this.splashImg.texture.getSourceImage();
        this.splashImg.setScale(Math.min(w / tex.width, h / tex.height));

        // ── 2 BOTÕES: PLAY (esq) / TUTORIAL (dir) — clicar TUTORIAL transforma em MOUSE/WASD ─
        const BTN_W = 180, BTN_H = 46;
        const SIDE_PAD = 150;
        const bY = h - 38;
        const xLeft  = SIDE_PAD + BTN_W/2;
        const xRight = w - SIDE_PAD - BTN_W/2;

        const HIT_PAD_X = 40, HIT_PAD_Y = 20;
        const mkHit = () => new Phaser.Geom.Rectangle(
            -HIT_PAD_X, -HIT_PAD_Y, BTN_W + HIT_PAD_X*2, BTN_H + HIT_PAD_Y*2
        );

        // Botão esquerdo (começa PLAY, vira MOUSE após clicar TUTORIAL)
        const btnL = this.add.rectangle(xLeft, bY, BTN_W, BTN_H, 0x00cc44)
            .setScrollFactor(0).setDepth(502)
            .setInteractive(mkHit(), Phaser.Geom.Rectangle.Contains);
        btnL.input.cursor = 'pointer';
        const lblL = this.add.text(xLeft, bY, 'PLAY', {
            fontSize: '18px', fill: '#001a08', fontStyle: 'bold', letterSpacing: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(503);

        // Botão direito (começa TUTORIAL, vira WASD após clicar TUTORIAL)
        const btnR = this.add.rectangle(xRight, bY, BTN_W, BTN_H, 0x224433)
            .setScrollFactor(0).setDepth(502)
            .setStrokeStyle(2, 0x00ff55, 0.8)
            .setInteractive(mkHit(), Phaser.Geom.Rectangle.Contains);
        btnR.input.cursor = 'pointer';
        const lblR = this.add.text(xRight, bY, 'TUTORIAL', {
            fontSize: '16px', fill: '#00ff55', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(503);

        // Hover handlers (dependem do estado, vão ser re-bound no toggleSelectInputMode)
        const setHoverPlay = () => {
            btnL.removeAllListeners('pointerover');
            btnL.removeAllListeners('pointerout');
            btnL.on('pointerover', () => btnL.setFillStyle(0x44ff88));
            btnL.on('pointerout',  () => btnL.setFillStyle(0x00cc44));
        };
        const setHoverTut = () => {
            btnR.removeAllListeners('pointerover');
            btnR.removeAllListeners('pointerout');
            btnR.on('pointerover', () => btnR.setFillStyle(0x336655));
            btnR.on('pointerout',  () => btnR.setFillStyle(0x224433));
        };
        setHoverPlay(); setHoverTut();

        const allBtns = [this.splashBg, this.splashImg, btnL, lblL, btnR, lblR];
        // Expõe to função PREVIEW poder esconder/mostrar temporariamente
        this._splashElements = allBtns;

        const _startGame = (tutorial, inputMode) => {
            this.gameStarted  = true;
            this.tutorialMode = !!tutorial;
            if (inputMode && this.dbg?.behavior) {
                this.dbg.behavior.inputMode = inputMode;
                if (this._saveDebugCfg) this._saveDebugCfg();
            }
            // Marca pra pular splash em sessoes futuras (lang+input ja escolhidos)
            try { localStorage.setItem('cep_played_once', '1'); } catch (e) {}
            this.matter.world.enabled = true;
            allBtns.forEach(o => o.destroy());
            this._splashStartGame = null;
            if (this.tutorialMode && this._setupTutorial) this._setupTutorial();
        };
        // Expõe pro botão PREVIEW do CONFIGS poder iniciar a partir do splash
        this._splashStartGame = _startGame;

        // Picker state machine
        // home          → PLAY  | TUTORIAL
        //  ├─ click PLAY     → lang     → ENG | PTBR
        //  │   └─ click       → playInput → MOUSE | WASD → start game
        //  └─ click TUT      → tutInput → MOUSE | WASD → start tutorial
        let picker = 'home';
        const _setLang = (lang) => {
            if (this.dbg?.behavior) {
                this.dbg.behavior.lang = lang;
                if (this._saveDebugCfg) this._saveDebugCfg();
            }
        };
        const _toInputPicker = () => {
            lblL.setText('MOUSE'); lblL.setFontSize(16); lblL.setColor('#001a08');
            lblR.setText('WASD');  lblR.setFontSize(16);
        };

        btnL.on('pointerdown', () => {
            if (picker === 'tutInput')  return _startGame(true, 'mouse');
            if (picker === 'playInput') return _startGame(false, 'mouse');
            if (picker === 'lang')      { _setLang('en'); picker = 'playInput'; return _toInputPicker(); }
            // 'home': PLAY → escolhe idioma
            picker = 'lang';
            lblL.setText('ENG');  lblL.setFontSize(20);
            lblR.setText('PTBR'); lblR.setFontSize(20);
        });
        btnR.on('pointerdown', () => {
            if (picker === 'tutInput')  return _startGame(true, 'wasd');
            if (picker === 'playInput') return _startGame(false, 'wasd');
            if (picker === 'lang')      { _setLang('pt'); picker = 'playInput'; return _toInputPicker(); }
            // 'home': TUTORIAL → escolhe input direto
            picker = 'tutInput';
            _toInputPicker();
        });

        // Resize
        this.scale.on('resize', () => {
            if (this.gameStarted) return;
            const w2 = this.scale.width, h2 = this.scale.height;
            this.splashBg.setPosition(w2/2, h2/2).setSize(w2, h2);
            this.splashImg.setPosition(w2/2, h2/2);
            const tex2 = this.splashImg.texture.getSourceImage();
            this.splashImg.setScale(Math.min(w2 / tex2.width, h2 / tex2.height));
            const bY2 = h2 - 38;
            const xL  = SIDE_PAD + BTN_W/2;
            const xR  = w2 - SIDE_PAD - BTN_W/2;
            btnL.setPosition(xL, bY2); lblL.setPosition(xL, bY2);
            btnR.setPosition(xR, bY2); lblR.setPosition(xR, bY2);
        });
    },

    // ── PAUSA ─────────────────────────────────────────────────────────────
    _setupPause() {
        this.paused = false;
        this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        const pw = this.scale.width, ph = this.scale.height;

        // Fundo semi-transparente
        this.pauseOverlay = this.add.rectangle(pw/2, ph/2, pw, ph, 0x000000, 0.72)
            .setScrollFactor(0).setDepth(300).setVisible(false);

        // Símbolo ⏸ — duas barras desenhadas with Graphics
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
    _checkVictory() {
        if (this.gameOver) return;
        if (this.farmers.length === 0 && this.shooters.length === 0) {
            this._victory();
        }
    },

    _victory() {
        this.gameOver = true;
        this._releaseAll();

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

        this.add.text(w/2, h/2 + 56, this.score, {
            fontSize: '52px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        let btn = this.add.rectangle(w/2, h/2 + 120, 220, 42, 0x00dd44)
            .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
        this.add.text(w/2, h/2 + 120, 'JOGAR NOVAMENTE', {
            fontSize: '13px', fill: '#001a08', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        btn.on('pointerover', () => btn.setFillStyle(0x44ff88));
        btn.on('pointerout',  () => btn.setFillStyle(0x00dd44));
        btn.on('pointerdown', () => this._restartTransition('victory'));
    },

    // Transicao estilo pre-loader: tela escura + titulo CHAPADA ESCAPADE
    // VT323 morphing red->green + barra simulando carregamento. Apos ~1.6s
    // chama scene.restart(). Splash eh pulado pq cep_played_once=1.
    _restartTransition(fromState) {
        // Trava input — nada mais clicavel durante a transicao
        if (this.input) this.input.enabled = false;
        const w = this.scale.width, h = this.scale.height;

        // Cor inicial muda baseado no estado: GAME OVER vermelho, VITORIA verde
        const startColor = (fromState === 'victory')
            ? { r: 0x44, g: 0xff, b: 0x66 }
            : { r: 0xff, g: 0x22, b: 0x22 };
        const endColor = { r: 0x00, g: 0xff, b: 0x55 };

        const TRANS_DEPTH = 700;

        // Bg preto-esverdeado fade in
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x050a04, 0)
            .setScrollFactor(0).setDepth(TRANS_DEPTH);
        this.tweens.add({ targets: bg, alpha: 1, duration: 350, ease: 'Cubic.easeIn' });

        // Titulo CHAPADA (menor, 80%)
        const tCha = this.add.text(w/2, h/2 - 50, 'CHAPADA', {
            fontFamily: '"VT323", "Courier New", monospace',
            fontSize: '60px',
            fill: '#ff2222',
            letterSpacing: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(TRANS_DEPTH + 1).setAlpha(0);

        // Titulo ESCAPADE (maior)
        const tEsc = this.add.text(w/2, h/2 + 14, 'ESCAPADE', {
            fontFamily: '"VT323", "Courier New", monospace',
            fontSize: '76px',
            fill: '#ff2222',
            letterSpacing: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(TRANS_DEPTH + 1).setAlpha(0);

        // Barra fake de carregamento
        const BAR_W = 320, BAR_H = 18;
        const barBg = this.add.rectangle(w/2, h/2 + 90, BAR_W, BAR_H, 0x002010, 1)
            .setStrokeStyle(1.5, 0x00aa44, 1)
            .setScrollFactor(0).setDepth(TRANS_DEPTH + 1).setAlpha(0);
        const barFill = this.add.rectangle(w/2 - BAR_W/2, h/2 + 90, 0, BAR_H - 4, 0x66ff99, 1)
            .setOrigin(0, 0.5)
            .setScrollFactor(0).setDepth(TRANS_DEPTH + 2).setAlpha(0);
        const pctText = this.add.text(w/2, h/2 + 118, '0%', {
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            fill: '#00ff55',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(TRANS_DEPTH + 1).setAlpha(0);

        // Fade in dos elementos
        this.tweens.add({
            targets: [tCha, tEsc, barBg, barFill, pctText],
            alpha: 1, duration: 250, delay: 200, ease: 'Cubic.easeOut',
        });

        // Tween principal: cor red->green + barra fill 0->100% over 1400ms
        const FILL_DUR = 1400;
        const obj = { t: 0 };
        this.tweens.add({
            targets: obj,
            t: 1,
            duration: FILL_DUR,
            delay: 350,
            ease: 'Cubic.easeInOut',
            onUpdate: () => {
                const t = obj.t;
                const r = Math.round(Phaser.Math.Linear(startColor.r, endColor.r, t));
                const g = Math.round(Phaser.Math.Linear(startColor.g, endColor.g, t));
                const b = Math.round(Phaser.Math.Linear(startColor.b, endColor.b, t));
                const css = `rgb(${r},${g},${b})`;
                tCha.setColor(css);
                tEsc.setColor(css);
                barFill.width = (BAR_W - 4) * t;
                pctText.setText(Math.round(t * 100) + '%');
            },
            onComplete: () => {
                // Pequeno hold em verde + restart
                this.time.delayedCall(280, () => {
                    if (this.input) this.input.enabled = true;
                    this.scene.restart();
                });
            },
        });
    },

    // ── GAME OVER ─────────────────────────────────────────────────────────
    _gameOver() {
        this.gameOver = true;
        this._releaseAll();

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

        this.add.text(w/2, h/2 + 28, this.score, {
            fontSize: '52px', fill: '#00dd44', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        let btn = this.add.rectangle(w/2, h/2 + 100, 220, 42, 0x00dd44)
            .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });
        this.add.text(w/2, h/2 + 100, 'JOGAR NOVAMENTE', {
            fontSize: '13px', fill: '#001a08', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        btn.on('pointerover', () => btn.setFillStyle(0x44ff88));
        btn.on('pointerout',  () => btn.setFillStyle(0x00dd44));
        btn.on('pointerdown', () => this._restartTransition('gameover'));
    }

});
