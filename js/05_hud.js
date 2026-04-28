// 05_hud.js — HUD: criação e posicionamento dos elementos da interface
Object.assign(Jogo.prototype, {

    _criarHUD() {
        // HUD acima do atmosphere overlay (depth 195) e do storm flash (196)
        const D = 200, D2 = 201;

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
        this.hud.combImg  = this.add.image(0,0,'hud_frame_combustivel').setDisplaySize(380,68).setScrollFactor(0).setDepth(D);
        this.hud.combFill = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.barraCombustivel = this.hud.combFill;   // _atualizarPaciencia redesenha

        // ── Barra Graviton ────────────────────────────────────────────
        // Frame com label "GRAVITON" + Graphics dentro pra desenhar gradiente azul→roxo
        this.hud.eneImg  = this.add.image(0,0,'hud_frame_graviton').setDisplaySize(290,72).setScrollFactor(0).setDepth(D);
        this.hud.eneFill = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.barraEnergia = this.hud.eneFill;     // update redesenha

        // ── Hint inicial ──────────────────────────────────────────────
        const hintMsg = this.isMobile
            ? 'Joystick on the left  •  Button on the right to abduct'
            : 'CLICK AND HOLD to abduct';
        this.hud.hintBg = this.add.rectangle(0,0,490,46,0x000000,0.7).setScrollFactor(0).setDepth(205);
        this.hud.hint   = this.add.text(0,0,hintMsg,{fontSize:'13px',fill:'#dddddd',fontStyle:'bold'}).setOrigin(0.5).setScrollFactor(0).setDepth(206);

        // ── Seta indicadora e rastro ──────────────────────────────────
        this.setaIndicadora = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this.rastroMouse    = [];
        this.graficoRastro  = this.add.graphics().setDepth(9);

        // ── Radar (canto inferior esquerdo) ───────────────────────────
        this.hud.miniBg  = this.add.graphics().setScrollFactor(0).setDepth(D);
        this.hud.miniGfx = this.add.graphics().setScrollFactor(0).setDepth(D2);
        this._radarAngle = 0;  // ângulo atual do scan (radianos)
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
        this.hud.combImg.setPosition(w/2, PAC_Y);

        this._eneBar = { x: w/2 - 120, y: ENE_Y + 12, w: 240, h: 16 };
        this._combBar = { x: w/2 - 165, y: PAC_Y + 12, w: 330, h: 18 };

        // Hint inicial
        if (this.hud.hint) {
            this.hud.hintBg.setPosition(w/2, h/2 + 60);
            this.hud.hint.setPosition(w/2, h/2 + 60);
        }

        // Radar — disco circular no canto inferior esquerdo
        const R = 70, PAD = 14;
        // Desce R/2 (metade do raio) em relação ao posicionamento anterior
        const rx = PAD + R, ry = h - R - PAD - 58 + R/2;
        this._mini = { cx: rx, cy: ry, r: R };
        // Redesenha o fundo do radar (estático — só muda no resize)
        this.hud.miniBg.clear();
        // Fundo preenchido
        this.hud.miniBg.fillStyle(0x000a04, 0.82);
        this.hud.miniBg.fillCircle(rx, ry, R);
        // Círculos de referência (crosshair concêntrico)
        [0.33, 0.66, 1.0].forEach(f => {
            this.hud.miniBg.lineStyle(f === 1.0 ? 1.5 : 0.8, 0x00ff55, f === 1.0 ? 0.8 : 0.25);
            this.hud.miniBg.strokeCircle(rx, ry, R * f);
        });
        // Cruz central
        this.hud.miniBg.lineStyle(0.8, 0x00ff55, 0.2);
        this.hud.miniBg.lineBetween(rx - R, ry, rx + R, ry);
        this.hud.miniBg.lineBetween(rx, ry - R, rx, ry + R);
    },

    // Mostra/esconde as barras de combustível e graviton (usado pelo tutorial)
    _setBarrasVisibility(combVisible, gravVisible) {
        if (this.hud.combImg)  this.hud.combImg.setVisible(combVisible);
        if (this.hud.combFill) this.hud.combFill.setVisible(combVisible);
        if (this.hud.eneImg)   this.hud.eneImg.setVisible(gravVisible);
        if (this.hud.eneFill)  this.hud.eneFill.setVisible(gravVisible);
    },

    _atualizarMinimapa() {
        const m = this._mini; if (!m || !this.hud?.miniGfx || !this.nave) return;
        const { cx, cy, r } = m;
        const W = 8000, H = 6000;
        // Posição mundo → radar: centra no nave, escala por raio/alcance
        const RANGE = Math.max(W, H) * 0.6;  // metade do mapa cabe no radar
        const wx = (wx) => cx + (wx - this.nave.x) / RANGE * r;
        const wy = (wy) => cy + (wy - this.nave.y) / RANGE * r;
        // Clamp ao círculo
        const inRadar = (x, y) => (x-cx)*(x-cx)+(y-cy)*(y-cy) <= r*r;

        const g = this.hud.miniGfx;
        g.clear();

        // Sweep scan: linha verde girando (estilo radar)
        this._radarAngle = ((this._radarAngle || 0) + 0.018) % (Math.PI * 2);
        const sa = this._radarAngle;
        // Triângulo de "glow" da varredura (leque de 80°)
        const SWEEP = Math.PI * 0.44;
        g.fillStyle(0x00ff55, 0.07);
        g.beginPath();
        g.moveTo(cx, cy);
        for (let i = 0; i <= 20; i++) {
            const a = sa - SWEEP + (SWEEP / 20) * i;
            g.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
        }
        g.closePath(); g.fillPath();
        // Linha de scan
        g.lineStyle(1.5, 0x00ff55, 0.85);
        g.lineBetween(cx, cy, cx + Math.cos(sa)*r, cy + Math.sin(sa)*r);

        // Currais (azul, quadradinho)
        if (this.currais) {
            g.fillStyle(0x4499ff, 0.95);
            for (const c of this.currais) {
                const bx = wx(c.x), by = wy(c.y);
                if (inRadar(bx, by)) g.fillRect(bx-2.5, by-2.5, 5, 5);
            }
        }
        // Vacas (branco), holstein (branco suave), bois (marrom)
        if (this.vacas) {
            for (const v of this.vacas) {
                if (!v.scene || v._destroyed || v.isBurger) continue;
                const bx = wx(v.x), by = wy(v.y);
                if (!inRadar(bx, by)) continue;
                if (v.tipo === 'boi') g.fillStyle(0xaa7744, 0.95);
                else                  g.fillStyle(0xffffff, 0.90);
                g.fillCircle(bx, by, 1.8);
            }
        }
        // Fazendeiros (amarelo)
        if (this.fazendeiros) {
            g.fillStyle(0xffdd33, 0.95);
            for (const f of this.fazendeiros) {
                if (!f.scene || f._destroyed || f._dying) continue;
                const bx = wx(f.x), by = wy(f.y);
                if (inRadar(bx, by)) g.fillCircle(bx, by, 2);
            }
        }
        // Nave — ponto verde central fixo + pulso
        g.fillStyle(0x66ff99, 1);
        g.fillCircle(cx, cy, 3);
        const pulse = 0.5 + 0.5 * Math.sin(this._radarAngle * 4);
        g.lineStyle(1, 0x66ff99, 0.4 * pulse);
        g.strokeCircle(cx, cy, 6 + pulse * 3);
    }

});
