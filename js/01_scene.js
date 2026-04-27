// 01_scene.js — Classe principal e orquestração de create() / update()
// Os métodos da Scene estão distribuídos nos arquivos js/0X_*.js seguintes,
// cada um adicionado via Object.assign(Jogo.prototype, {...}).

class Jogo extends Phaser.Scene {
    constructor() { super('Jogo'); }

    create() {
        const W = 3200, H = 2400;
        this.matter.world.setBounds(0, 0, W, H);
        this.cameras.main.setBounds(0, 0, W, H);

        // ── EXPERIMENT MODE: cena minimalista com patch de grama interativo ──
        // Desabilita vacas/bois/fazendeiros/atiradores/obstáculos/currais.
        // Volta pra false pra restaurar o jogo completo.
        this.EXPERIMENT_MODE = true;

        this._setupTexturasGeometricas();   // 03_textures.js (textura 'nave' usada abaixo)

        if (this.EXPERIMENT_MODE) {
            // Fundo neutro escuro + nada de obstáculos/NPCs
            this.add.rectangle(W/2, H/2, W, H, 0x1a1a1a).setDepth(0);
            this.fazendeiros = [];
            this.vacas = [];
            this.vacas_abduzidas = [];
            this.currais = [];
            this.grassPatches = [];
            this.terrainGrid = null;
            this._setupGrassPatch(W, H);    // 14_grass_patch.js
        } else {
            this._setupCenario(W, H);
            this._setupAtiradores();
            this.fazendeiros = [];
            this._spawnFazendeiros(8);
        }

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
        if (!this.EXPERIMENT_MODE) {
            this.vacas = [];
            this.vacas_abduzidas = [];
            this._spawnVacas(40);
        }

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

        // Repovoamento periódico (desabilitado em experiment mode)
        if (!this.EXPERIMENT_MODE) {
            this.time.addEvent({delay:6000, loop:true, callback:()=>{ if(!this.gameOver) this._repovoar(); }});
        }

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
        if (!this.EXPERIMENT_MODE) this._atualizarIAVacas();

        // COWS = vacas + bois live no feixe; BURGERS = total entregue
        let cowsInBeam = 0;
        for (const v of this.vacas_abduzidas) {
            if (v.isBurger || v.isEnemy) continue;
            cowsInBeam++;
        }
        this.hud.cowsText.setText(cowsInBeam);
        this.hud.burgersText.setText(this.burgerCount);

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
        // Redesenha gradiente azul→roxo proporcional
        const eb = this._eneBar || { x: 0, y: 0, w: 0, h: 0 };
        const eFill = Math.max(0, eb.w * enePct);
        this.hud.eneFill.clear();
        if (eFill > 0) {
            this.hud.eneFill.fillGradientStyle(0x3399ff, 0xaa44ff, 0x1166cc, 0x7722cc, 1);
            this.hud.eneFill.fillRect(eb.x, eb.y, eFill, eb.h);
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

        if (!this.EXPERIMENT_MODE) {
            this._verificarEntrega();
            this._atualizarAtiradores(delta);
            this._atualizarFazendeiros(delta);
        } else {
            this._updateGrassMouse();
        }
    }
}
