// 05_hud.js — HUD: criação e posicionamento dos elementos da interface
Object.assign(Jogo.prototype, {

    _criarHUD() {
        const D = 100, D2 = 101;

        // ── Score ─────────────────────────────────────────────────────
        // frame limpo (sem dígitos baked-in); número sobreposto pelo código
        this.hud.scoreBg   = this.add.image(0,0,'hud_score_frame').setDisplaySize(200,52).setScrollFactor(0).setDepth(D);
        this.hud.scoreText = this.add.text(0,12,'0',{fontSize:'20px',fill:'#00ff55',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.textoScore    = this.hud.scoreText;

        // ── COWS box (vacas + bois abduzidos no feixe) ─────────────────
        this.hud.cowsBox  = this.add.image(0, 0, 'hud_cows_box').setDisplaySize(160, 80).setScrollFactor(0).setDepth(D);
        this.hud.cowsText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);

        // ── BURGERS box (total entregue) ───────────────────────────────
        this.hud.burgersBox  = this.add.image(0, 0, 'hud_burgers_box').setDisplaySize(176, 80).setScrollFactor(0).setDepth(D);
        this.hud.burgersText = this.add.text(0, 0, '0', {fontSize:'22px', fill:'#ffffff', fontStyle:'bold', stroke:'#000000', strokeThickness:3}).setOrigin(0.5).setScrollFactor(0).setDepth(D2);
        this.textoContador   = this.hud.burgersText;  // alias mantido pra _virarBurger

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

        // COWS + BURGERS boxes lado a lado no canto superior esquerdo
        this.hud.cowsBox.setPosition(90, 55);
        this.hud.cowsText.setPosition(122, 62);   // ao lado direito do ícone vaca
        this.hud.burgersBox.setPosition(265, 55);
        this.hud.burgersText.setPosition(300, 62);

        // Barras empilhadas no centro-rodapé com gap visível
        // Graviton em cima (menor), Combustível embaixo (maior, mais importante)
        const ENE_Y = h - 60;
        const PAC_Y = h - 18;
        this.hud.eneImg.setPosition(w/2, ENE_Y);
        this.hud.pacImg.setPosition(w/2, PAC_Y);

        this._eneBar = { x: w/2 - 120, y: ENE_Y + 12, w: 240, h: 16 };
        this._pacBar = { x: w/2 - 165, y: PAC_Y + 12, w: 330, h: 18 };

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }
    }

});
