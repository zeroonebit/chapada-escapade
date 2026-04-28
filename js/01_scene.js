// 01_scene.js — Classe principal e orquestração de create() / update()
// Os métodos da Scene estão distribuídos nos arquivos js/0X_*.js seguintes,
// cada um adicionado via Object.assign(Jogo.prototype, {...}).

class Jogo extends Phaser.Scene {
    constructor() { super('Jogo'); }

    create() {
        try { this._createBody(); }
        catch(e) {
            const msg = (e?.stack || e?.message || String(e)).substring(0, 800);
            this.add.text(20, 100, 'CREATE ERR:\n' + msg, {
                fontSize: '12px', fill: '#ff6666', backgroundColor:'#000', padding:{x:6,y:6}, wordWrap:{width:800}
            }).setScrollFactor(0).setDepth(9999);
            console.error('[CREATE ERR]', e);
        }
    }

    _createBody() {
        // Mapa 2.5× maior (era 3200x2400) — mais espaço pra cenário, currais, exploração
        const W = 8000, H = 6000;
        this.matter.world.setBounds(0, 0, W, H);
        this.cameras.main.setBounds(0, 0, W, H);

        // EXPERIMENT_MODE forçado OFF (debug — shader patch tava travando)
        this.EXPERIMENT_MODE = false;
        localStorage.setItem('experimentMode', '0');

        // Carrega config de debug ANTES de qualquer spawn (afeta scales/counts)
        this._loadDebugCfg();

        this._setupTexturasGeometricas();   // 03_textures.js (textura 'nave' usada abaixo)

        // ── REGISTRA ANIMS 8-DIR (vaca chubby, faz, boi) ─────────────
        // Vaca chubby: walk(4f), idle_head_shake→eat(11f), lie_down→angry(8f).
        // "run" reusa walk com fps maior (anim chubby não tem run dedicado).
        const DIRS8 = ['S','E','N','W','SE','NE','NW','SW'];
        const ANIM8 = [
            { prefix: 'vaca_walk',  frames: 4,  fps: 6  },
            { prefix: 'vaca_eat',   frames: 11, fps: 4  },
            { prefix: 'vaca_angry', frames: 8,  fps: 8  },
            { prefix: 'faz_run',    frames: 4,  fps: 10 },
            { prefix: 'boi_walk',   frames: 4,  fps: 6  },
            { prefix: 'ufo_hover',  frames: 4,  fps: 8  },
            // boi_idle: 7 dirs (sem N) — fallback pra static em N
            { prefix: 'boi_idle',   frames: 11, fps: 4,  dirs: ['S','E','W','SE','NE','NW','SW'] },
        ];
        DIRS8.forEach(d => {
            ANIM8.forEach(({prefix, frames, fps, dirs}) => {
                if (dirs && !dirs.includes(d)) return;  // pula dirs não disponíveis
                const key = `${prefix}_${d}`;
                if (this.anims.exists(key)) return;
                const fr = [];
                for (let i = 0; i < frames; i++) fr.push({ key: `${prefix}_${d}_${i}` });
                this.anims.create({ key, frames: fr, frameRate: fps, repeat: -1 });
            });
            // vaca_run é vaca_walk em fps×2 — registra como anim separado
            const runKey = `vaca_run_${d}`;
            if (!this.anims.exists(runKey)) {
                const fr = [];
                for (let i = 0; i < 4; i++) fr.push({ key: `vaca_walk_${d}_${i}` });
                this.anims.create({ key: runKey, frames: fr, frameRate: 12, repeat: -1 });
            }
        });

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
            // Cenário sempre roda (terreno/grama base); cercas/moitas opcionais via cfg.cenario
            this._setupCenario(W, H);
            if (this.dbg.enabled.atiradores) this._setupAtiradores();
            else { this.balas = []; this.atiradores = []; }
            this.fazendeiros = [];
            if (this.dbg.enabled.fazendeiros) this._spawnFazendeiros(this.dbg.counts.fazendeiros);
        }

        // ── NAVE ─────────────────────────────────────────────────────
        // Sombra blur fake (3 elipses stacked) — substituiu o tinted nave clone
        this.sombraNave = this.add.container(0, 0);
        this.sombraNave.add(this.add.ellipse(0, 0, 110, 38, 0x000000, 0.10));
        this.sombraNave.add(this.add.ellipse(0, 0, 80, 28, 0x000000, 0.20));
        this.sombraNave.add(this.add.ellipse(0, 0, 56, 20, 0x000000, 0.32));
        this.sombraNave.setDepth(1);
        const beamScale = this.dbg.scale.beam;
        const CONE_R = (40*5.55/2) * beamScale;
        this.raioCone = CONE_R;
        // Beam: Graphics com círculos concêntricos de alpha variável (sem PNG → sem
        // artefato de mask). Desenhado em _desenharCone(raio) chamado em _updateBody.
        this.coneLuz = this.add.graphics().setDepth(2).setVisible(false);
        this._desenharCone(CONE_R);
        if (!this.dbg.enabled.beam) this.coneLuz.setAlpha(0);  // beam invisível se OFF
        // matter.add.SPRITE (não image) — sprite suporta .anims pra hovering_idle 8-dir
        this.nave = this.matter.add.sprite(W/2, H/2, 'nave', null, {shape:{type:'circle',radius:20}});
        this.nave.setFrictionAir(0.04).setMass(5).setDepth(10).setCollisionCategory(4).setCollidesWith([1]);
        const naveScale = this.dbg?.scale?.nave ?? 1.0;
        this.nave.setDisplaySize(80 * naveScale, 80 * naveScale);
        // Lock rotação física — disco não gira por colisão; rotação é feita manualmente
        // via discoRot slider no _updateBody
        this.nave.setFixedRotation();
        this._naveDir8 = 'S';
        if (this.anims.exists('ufo_hover_S')) this.nave.play('ufo_hover_S');

        this._setupLEDs();                  // 06_nave.js — LEDs animados ao redor da nave

        // ── VACAS ────────────────────────────────────────────────────
        if (!this.EXPERIMENT_MODE) {
            this.vacas = [];
            this.vacas_abduzidas = [];
            // Só spawna se vaca OU boi tá habilitado — _spawnVacas filtra por tipo internamente
            if (this.dbg.enabled.vacas || this.dbg.enabled.bois) {
                this._spawnVacas(this.dbg.counts.vacas);
            }
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
        this._setupDebugMenu();             // 15_debug_menu.js — DOM debug panel
        this._setupFX();                    // 16_fx.js — chuva, neblina, helpers
        this._setupBarrel();                // post-fx esférico
        this._applyFXVisibility();
        this._setupColisoes();              // 10_colisao.js
        this._setupMobileControls();        // 12_mobile.js — joystick + botão (só mobile)

        // ── Tecla T: toggle EXPERIMENT_MODE (recarrega a página)
        // Phaser key listener + fallback nativo no window (caso Phaser perca foco)
        this.teclaT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        const toggleExperimentMode = () => {
            const cur = localStorage.getItem('experimentMode') === '1';
            localStorage.setItem('experimentMode', cur ? '0' : '1');
            window.location.reload();
        };
        if (!this._tBound) {
            this._tBound = true;
            window.addEventListener('keydown', (e) => {
                if (e.key === 't' || e.key === 'T') toggleExperimentMode();
            });
        }
        this._toggleExperimentMode = toggleExperimentMode;

        // ── Em debug mode: esconde HUD e mostra badge "DEBUG"
        if (this.EXPERIMENT_MODE) {
            const hudKeys = ['scoreBg','scoreText','cowsBox','cowsText','burgersBox','burgersText',
                             'pacImg','pacFill','eneImg','eneFill','hint','hintBg'];
            for (const k of hudKeys) if (this.hud[k]) this.hud[k].setVisible(false);
            // Badge debug
            const w = this.scale.width;
            this.add.text(w - 90, 20, '🧪 DEBUG  [T off]', {
                fontSize: '11px', fill: '#ffaa44', fontStyle: 'bold',
                backgroundColor: '#000000', padding: { x: 6, y: 3 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        }

        this._setupSplash();               // 11_gameflow.js — por último (sobrepõe tudo)
    }

    update(time, delta) {
        if (!this.gameStarted) return;      // aguarda dismiss do splash
        if (this.gameOver) return;
        // Diagnostic: wrap update body so erros aparecem em tela em vez de travar silencioso
        try { this._updateBody(time, delta); }
        catch (e) {
            if (!this._errShown) {
                this._errShown = true;
                const msg = (e?.stack || e?.message || String(e)).substring(0, 600);
                this.add.text(20, 100, 'UPDATE ERR:\n' + msg, {
                    fontSize: '12px', fill: '#ff6666', backgroundColor:'#000', padding:{x:6,y:6}, wordWrap:{width:600}
                }).setScrollFactor(0).setDepth(9999);
                console.error('[UPDATE ERR]', e);
            }
        }
    }

    _updateBody(time, delta) {

        // T — toggle EXPERIMENT_MODE (recarrega) — fallback Phaser path
        if (this.teclaT && Phaser.Input.Keyboard.JustDown(this.teclaT)) {
            this._toggleExperimentMode();
            return;
        }

        // ESC — toggle pausa + debug menu
        if (Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
            this.pausado = !this.pausado;
            this.matter.world.enabled = !this.pausado;
            this.pauseOverlay.setVisible(this.pausado);
            this.pauseGrafico.setVisible(this.pausado);
            this.pauseLabel.setVisible(this.pausado);
            this.pauseHint.setVisible(this.pausado);
            this._toggleDebugMenu(this.pausado);
        }
        if (this.pausado) return;

        this.dificuldade += 0.000018 * delta;

        if (!this._tutPacienciaCongelada) this._atualizarPaciencia(delta);
        if (!this.EXPERIMENT_MODE) this._atualizarIAVacas();
        if (this.tutorialMode && this._updateTutorial) this._updateTutorial(time, delta);

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

        this.sombraNave.setPosition(this.nave.x+8, this.nave.y+24);
        this._atualizarSombras();
        this.coneLuz.setPosition(this.nave.x, this.nave.y);

        // Disco: rotação base (slider) + tilt baseado em mudança de velocidade lateral
        const discoRot = this.dbg?.behavior?.discoRot ?? 0;
        this._discoBaseAngle = (this._discoBaseAngle ?? 0) + discoRot * (delta / 1000);
        const navVx = this.nave.body.velocity.x;
        const navVy = this.nave.body.velocity.y;
        const vAxDelta = navVx - (this._lastNavVx ?? navVx);
        this._lastNavVx = navVx;
        const tiltTarget = Phaser.Math.Clamp(-vAxDelta * 8, -0.4, 0.4);
        this._tiltCurrent = (this._tiltCurrent ?? 0) * 0.88 + tiltTarget * 0.12;
        this.nave.rotation = this._discoBaseAngle + this._tiltCurrent;

        // ── UFO directional hover anim ───────────────────────────────
        // Acima de threshold, escolhe dir8 do vetor velocidade; abaixo, mantém última dir
        const navSpeedAnim = Math.sqrt(navVx*navVx + navVy*navVy);
        if (navSpeedAnim > 0.5) {
            const deg = (Math.atan2(navVy, navVx) * 180 / Math.PI + 360) % 360;
            const i = Math.round(deg / 45) % 8;
            this._naveDir8 = ['E','SE','S','SW','W','NW','N','NE'][i];
        }
        const hoverKey = `ufo_hover_${this._naveDir8 || 'S'}`;
        if (this.nave.anims && this.anims.exists(hoverKey) && this.nave.anims.currentAnim?.key !== hoverKey) {
            this.nave.play(hoverKey, true);
        }

        // Escapamento: várias nuvenzinhas pequenas e opacas saindo aos poucos,
        // que CRESCEM e ficam transparentes conforme se afastam (estilo escape de carro)
        // + partículas coloridas misturadas (substitui o LED giroflex)
        const navSpeed = Math.sqrt(navVx*navVx + navVy*navVy);
        if (navSpeed > 0.6) {
            this._smokeTimer = (this._smokeTimer ?? 0) + delta;
            if (this._smokeTimer > 100) {
                this._smokeTimer = 0;
                const ux = -navVx/navSpeed, uy = -navVy/navSpeed; // unit vector "atrás"
                const px = this.nave.x + ux * 30;
                const py = this.nave.y + uy * 30;
                this._spawnSmoke(px, py, {
                    color: 0xbbbbcc, alpha: 0.75, size: 4,
                    dur: 1400, drift: 26
                });
                // Partícula colorida ocasional (substitui o LED rotativo)
                if (Math.random() < 0.55) {
                    const colors = [0x33aaff, 0xff4466, 0xffcc33, 0x44ff88, 0xcc66ff];
                    const col = colors[Math.floor(Math.random() * colors.length)];
                    // Offset radial pra parecer que sai de pontos diferentes do disco
                    const radial = (Math.random() - 0.5) * 24;
                    const perpX = -uy * radial, perpY = ux * radial;
                    this._spawnSmoke(px + perpX, py + perpY, {
                        color: col, alpha: 0.95, size: 2.2,
                        dur: 750, drift: 30, growTo: 1.4
                    });
                }
            }
        }

        this._updateBarrel();
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
            // FX: detecta transição off→on pra dar shake/flash uma vez
            if (!this._beamWasOn) {
                this._beamWasOn = true;
                if (this.dbg?.fx?.beamShake) {
                    this.cameras.main.shake(120, 0.004);
                    this.cameras.main.flash(120, 80, 200, 120, false);
                }
            }
            // Sparkles emitidos a cada ~80ms enquanto o beam está ativo
            if (this.dbg?.fx?.beamSparks) {
                this._beamSparkleTimer = (this._beamSparkleTimer ?? 0) + delta;
                if (this._beamSparkleTimer > 80) {
                    this._beamSparkleTimer = 0;
                    this._emitBeamSparkle();
                }
            }
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
            this._beamWasOn = false;
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

        this._atualizarMinimapa();
    }
}
