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
            ? 'Arraste para mover  •  2° dedo para abduzir'
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
        const Y = h - 30;  // linha base do rodapé

        // Burger — canto inferior esquerdo
        this.hud.burgerBg.setPosition(80, Y);
        this.hud.burgerText.setPosition(115, Y + 2);

        // Score — canto inferior direito
        this.hud.scoreBg.setPosition(w - 110, Y);
        this.hud.scoreText.setPosition(w - 110, Y + 4);

        // Barras lado a lado no centro do rodapé
        const PAC_DISP = 340, PAC_INN = 300;
        const ENE_DISP = 300, ENE_INN = 258;
        const GAP = 20;
        const totalW = PAC_DISP + GAP + ENE_DISP;
        const startX = (w - totalW) / 2;
        const PAC_X = startX + PAC_DISP/2;
        const ENE_X = startX + PAC_DISP + GAP + ENE_DISP/2;

        this.hud.pacImg.setPosition(PAC_X, Y);
        this._pacLeft = PAC_X - PAC_INN/2;
        this._pacW    = PAC_INN;
        this.hud.pacCover.setPosition(this._pacLeft + PAC_INN, Y);

        this.hud.eneImg.setPosition(ENE_X, Y);
        this._eneLeft = ENE_X - ENE_INN/2;
        this._eneW    = ENE_INN;
        this.hud.eneCover.setPosition(this._eneLeft + ENE_INN, Y);

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }
    }

});
