// 01_scene.js — Classe principal e orquestração de create() / update()
// Os métodos da Scene estão distribuídos nos arquivos js/0X_*.js seguintes,
// cada um adicionado via Object.assign(Jogo.prototype, {...}).

class Jogo extends Phaser.Scene {
    constructor() { super('Jogo'); }

    create() {
        const W = 3200, H = 2400;
        this.matter.world.setBounds(0, 0, W, H);
        this.cameras.main.setBounds(0, 0, W, H);

        this._setupTexturasGeometricas();   // 03_textures.js
        this._setupCenario(W, H);           // 04_cenario.js
        this._setupAtiradores();            // 09_inimigos.js
        this.fazendeiros = [];
        this._spawnFazendeiros(8);

        // ── NAVE ─────────────────────────────────────────────────────
        this.sombraNave = this.add.image(0,0,'nave').setTint(0x000000).setAlpha(0.15).setDepth(1);
        const CONE_R = 40*5.55/2;
        this.raioCone = CONE_R;
        this.coneLuz = this.add.graphics().setDepth(2).setVisible(false);
        this._desenharCone(CONE_R);
        this.nave = this.matter.add.image(W/2, H/2, 'nave', null, {shape:{type:'circle',radius:20}});
        this.nave.setFrictionAir(0.04).setMass(5).setDepth(10).setCollisionCategory(4).setCollidesWith([1]);

        this._setupLEDs();                  // 06_nave.js

        // ── VACAS ────────────────────────────────────────────────────
        this.vacas = [];
        this.vacas_abduzidas = [];
        this._spawnVacas(40);

        // ── ESTADO ───────────────────────────────────────────────────
        this.burgerCount = 0;
        this.scoreAtual = 0;
        this.pacienciaMax = 100;
        this.pacienciaAtual = 100;
        this.dificuldade = 1;
        this.gameOver = false;
        this.energiaMax = 100;
        this.energiaLed = 100;
        this.energiaDrain = 5;
        this.energiaRegen = 30;

        // ── HUD ──────────────────────────────────────────────────────
        this.isMobile = this.sys.game.device.input.touch;
        this.input.addPointer(1);
        this.hud = {};
        this._criarHUD();
        this._posicionarHUD();
        this.scale.on('resize', () => this._posicionarHUD());

        // ── CURSOR VIRTUAL ───────────────────────────────────────────
        this.virtualX = this.scale.width / 2;
        this.virtualY = this.scale.height / 2;
        this.input.on('pointermove', (p) => {
            if (this.isMobile && p !== this.input.pointer1) return;
            this.virtualX = p.x;
            this.virtualY = p.y;
        });
        this.input.on('pointerdown', (p) => {
            if(!this.gameStarted) return;   // splash ainda visível
            if(this.gameOver) return;
            if(this.isMobile && p !== this.input.pointer1) return;
            if(this.hud.hint) { this.hud.hint.destroy(); this.hud.hint = null; }
            if(this.hud.hintBg) { this.hud.hintBg.destroy(); this.hud.hintBg = null; }
        });

        this.cameras.main.startFollow(this.nave, true, 0.05, 0.05);

        // Repovoamento periódico
        this.time.addEvent({delay:6000, loop:true, callback:()=>{ if(!this.gameOver) this._repovoar(); }});

        this._setupPausa();                 // 11_gameflow.js
        this._setupColisoes();              // 10_colisao.js
        this._setupMobileControls();        // 12_mobile.js — joystick + botão (só mobile)
        this._setupSplash();               // 11_gameflow.js — por último (sobrepõe tudo)
    }

    update(time, delta) {
        if (!this.gameStarted) return;      // aguarda dismiss do splash
        if (this.gameOver) return;

        // ESC — toggle pausa
        if (Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
            this.pausado = !this.pausado;
            this.matter.world.enabled = !this.pausado;
            this.pauseOverlay.setVisible(this.pausado);
            this.pauseGrafico.setVisible(this.pausado);
            this.pauseLabel.setVisible(this.pausado);
            this.pauseHint.setVisible(this.pausado);
        }
        if (this.pausado) return;

        this.dificuldade += 0.000018 * delta;

        this._atualizarPaciencia(delta);
        this._atualizarIAVacas();

        let cowsInBeam = 0;
        for (const v of this.vacas_abduzidas) if (!v.isBurger && !v.isEnemy) cowsInBeam++;
        this.textoContador.setText(cowsInBeam);

        const cam = this.cameras.main;
        let cursor;
        if (this.isMobile && this._joyVec && this._joyVec.active) {
            // Joystick — vetor vira "alvo virtual" 220px à frente da nave
            const REACH = 220;
            cursor = {
                x: this.nave.x + this._joyVec.x * REACH,
                y: this.nave.y + this._joyVec.y * REACH
            };
        } else {
            const wp = cam.getWorldPoint(this.virtualX, this.virtualY);
            cursor = { x: wp.x, y: wp.y };
        }

        this._atualizarRastro(cursor);
        this._moverNave(cursor);
        this._atualizarSeta();

        this.sombraNave.setPosition(this.nave.x+12, this.nave.y+22);
        this.coneLuz.setPosition(this.nave.x, this.nave.y);
        this._atualizarLEDs(delta);

        const querBeam = this.isMobile
            ? !!this._beamHeld
            : this.input.activePointer.isDown;
        const beamAtivo = querBeam && this.energiaLed > 0;

        if (querBeam && this.energiaLed > 0) {
            this.energiaLed -= this.energiaDrain * (delta/1000);
            if (this.energiaLed < 0) this.energiaLed = 0;
        } else if (!querBeam) {
            this.energiaLed = Math.min(this.energiaMax, this.energiaLed + this.energiaRegen * (delta/1000));
        }

        const enePct = this.energiaLed / this.energiaMax;
        // Cover approach: cobre parte direita (vazia) da imagem de barra graviton
        const EW = this._eneW || 258;
        this.barraEnergia.width = Math.max(0, EW * (1 - enePct));
        this.barraEnergia.x    = (this._eneLeft || 0) + EW * enePct;
        // Tint na imagem quando energia baixa
        if (this.hud && this.hud.eneImg) {
            if (enePct < 0.3) this.hud.eneImg.setTint(0xff3366);
            else              this.hud.eneImg.clearTint();
        }

        if (beamAtivo) {
            this.coneLuz.setVisible(true);
            this.coneLuz.setAlpha(1);
            if (this.vacas_abduzidas.length < 5) this._tentarAbduzir();
            this.vacas_abduzidas.forEach(v => this._fisicaBacia(v));
        } else if (querBeam) {
            this._dropNonBurgers();
            this.coneLuz.setVisible(true);
            this.coneLuz.setAlpha(0.35);
            this.vacas_abduzidas.forEach(v => this._fisicaBacia(v));
        } else {
            this._soltarTodas();
            this.coneLuz.setVisible(false);
        }

        this._verificarEntrega();
        this._atualizarAtiradores(delta);
        this._atualizarFazendeiros(delta);
    }
}
