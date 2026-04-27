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

        // ── Barra Combustível ─────────────────────────────────────────
        // Imagem real com gradiente vermelho→laranja + cover escuro pra parte vazia
        this.hud.pacImg   = this.add.image(0,0,'hud_barra_combustivel').setDisplaySize(340,36).setScrollFactor(0).setDepth(D);
        this.hud.pacCover = this.add.rectangle(0,0,0,18,0x060c06).setOrigin(0,0.5).setScrollFactor(0).setDepth(D2);
        this.barraPaciencia = this.hud.pacCover;   // _atualizarPaciencia seta .width e .x

        // ── Barra Graviton ────────────────────────────────────────────
        // Imagem real com gradiente ciano/violeta + cover escuro
        this.hud.eneImg   = this.add.image(0,0,'hud_barra_graviton').setDisplaySize(300,30).setScrollFactor(0).setDepth(D);
        this.hud.eneCover = this.add.rectangle(0,0,0,14,0x060a10).setOrigin(0,0.5).setScrollFactor(0).setDepth(D2);
        this.barraEnergia = this.hud.eneCover;     // update() seta .width e .x

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

        // Barras empilhadas no centro-rodapé com gap visível
        // Combustível em cima, Graviton embaixo
        const PAC_INN = 300, ENE_INN = 258;
        const PAC_Y = h - 56;
        const ENE_Y = h - 22;  // ~34px de espaço entre os centros
        this.hud.pacImg.setPosition(w/2, PAC_Y);
        this._pacLeft = w/2 - PAC_INN/2;
        this._pacW    = PAC_INN;
        this.hud.pacCover.setPosition(this._pacLeft + PAC_INN, PAC_Y);

        this.hud.eneImg.setPosition(w/2, ENE_Y);
        this._eneLeft = w/2 - ENE_INN/2;
        this._eneW    = ENE_INN;
        this.hud.eneCover.setPosition(this._eneLeft + ENE_INN, ENE_Y);

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }
    }

});
