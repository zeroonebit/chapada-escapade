// 05_hud.js — HUD: criação e posicionamento dos elementos da interface
Object.assign(Jogo.prototype, {

    _criarHUD() {
        const D = 100, D2 = 101;

        // ── Score ─────────────────────────────────────────────────────
        // frame limpo (sem dígitos baked-in); número sobreposto pelo código
        this.hud.scoreBg   = this.add.image(0,0,'hud_score_frame').setDisplaySize(200,52).setScrollFactor(0).setDepth(D);
        this.hud.scoreText = this.add.text(0,12,'0',{fontSize:'20px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.textoScore    = this.hud.scoreText;

        // ── Burger ────────────────────────────────────────────────────
        // frame limpo; contador no lado direito (ícone preservado à esq)
        this.hud.burgerBg   = this.add.image(0,0,'hud_burger_frame').setDisplaySize(150,68).setScrollFactor(0).setDepth(D);
        this.hud.burgerText = this.add.text(0,0,'0',{fontSize:'24px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.textoContador  = this.hud.burgerText;

        // ── Mini-contadores de vaca/boi abduzidos (anexados à direita do burger) ─
        this.hud.vacaIcon = this.add.image(0, 0, 'vaca_frente').setDisplaySize(30, 30).setScrollFactor(0).setDepth(D2);
        this.hud.vacaText = this.add.text(0, 0, '0', {fontSize:'18px', fill:'#ffffff', fontStyle:'bold', stroke:'#001a08', strokeThickness:3}).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D2);
        this.hud.boiIcon  = this.add.image(0, 0, 'boi_frente').setDisplaySize(34, 34).setScrollFactor(0).setDepth(D2);
        this.hud.boiText  = this.add.text(0, 0, '0', {fontSize:'18px', fill:'#ffffff', fontStyle:'bold', stroke:'#001a08', strokeThickness:3}).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D2);

        // ── Barra Combustível ─────────────────────────────────────────
        // Frame com label "COMBUSTÍVEL" + Graphics dentro pra desenhar gradiente amarelo→vermelho
        this.hud.pacImg  = this.add.image(0,0,'hud_frame_combustivel').setDisplaySize(380,68).setScrollFactor(0).setDepth(D);
        this.hud.pacFill = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.barraPaciencia = this.hud.pacFill;   // _atualizarPaciencia redesenha

        // ── Barra Graviton ────────────────────────────────────────────
        // Frame com label "GRAVITON" + Graphics dentro pra desenhar gradiente azul→roxo
        this.hud.eneImg  = this.add.image(0,0,'hud_frame_graviton').setDisplaySize(290,72).setScrollFactor(0).setDepth(D);
        this.hud.eneFill = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.barraEnergia = this.hud.eneFill;     // update redesenha

        // ── Hint inicial ──────────────────────────────────────────────
        const hintMsg = this.isMobile
            ? 'Joystick à esquerda  •  Botão à direita pra abduzir'
            : 'CLIQUE E SEGURE para abduzir';
        this.hud.hintBg = this.add.rectangle(0,0,490,46,0x000000,0.7).setScrollFactor(0).setDepth(105);
        this.hud.hint   = this.add.text(0,0,hintMsg,{fontSize:'13px',fill:'#dddddd',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(106);

        // ── Seta indicadora e rastro ──────────────────────────────────
        this.setaIndicadora = this.add.graphics().setScrollFactor(0).setDepth(101);
        this.rastroMouse    = [];
        this.graficoRastro  = this.add.graphics().setDepth(9);
    },

    _posicionarHUD() {
        const w = this.scale.width, h = this.scale.height;

        // Score — centro-topo
        this.hud.scoreBg.setPosition(w/2, 28);
        this.hud.scoreText.setPosition(w/2, 32);

        // Burger — canto superior esquerdo
        this.hud.burgerBg.setPosition(75, 50);
        this.hud.burgerText.setPosition(118, 52);

        // Mini-contadores anexados à borda direita do burger box
        // Vaca em cima, Boi embaixo
        this.hud.vacaIcon.setPosition(160, 36);
        this.hud.vacaText.setPosition(180, 36);
        this.hud.boiIcon.setPosition(160, 66);
        this.hud.boiText.setPosition(182, 66);

        // Barras empilhadas no centro-rodapé com gap visível
        // Combustível em cima (mais largo), Graviton embaixo
        // Frames têm header + corpo; fill (gradiente) vai dentro do corpo
        const PAC_Y = h - 60;
        const ENE_Y = h - 18;
        this.hud.pacImg.setPosition(w/2, PAC_Y);
        this.hud.eneImg.setPosition(w/2, ENE_Y);

        // Geometria da área interna onde o gradiente é desenhado:
        // pacImg display = 380x68; corpo do frame começa abaixo do header
        this._pacBar = { x: w/2 - 165, y: PAC_Y + 12, w: 330, h: 18 };
        this._eneBar = { x: w/2 - 120, y: ENE_Y + 12, w: 240, h: 16 };

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }
    }

});
