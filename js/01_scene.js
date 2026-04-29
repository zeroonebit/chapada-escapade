// 01_scene.js — Classe principal e orquestração de create() / update()
// Os métodos da Scene estão distribuídos nos arquivos js/0X_*.js seguintes,
// each um adicionado via Object.assign(Game.prototype, {...}).

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
        // Map 2.5× maior (was 3200x2400) — more espaço to scenery, corrals, exploração
        const W = 8000, H = 6000;
        this.matter.world.setBounds(0, 0, W, H);
        this.cameras.main.setBounds(0, 0, W, H);

        // EXPERIMENT_MODE forçado OFF (debug — shader patch tava travando)
        this.EXPERIMENT_MODE = false;
        localStorage.setItem('experimentMode', '0');

        // Loads config de debug ANTES de qualquer spawn (afeta scales/counts)
        this._loadDebugCfg();

        // MOBILE_MODE: override pra experiencia atmosferica — cap 5 cows,
        // sem inimigos. Beam visual sem pull (so muda cone, nao puxa nada).
        if (window.__MOBILE_MODE && this.dbg) {
            this.dbg.enabled.fazendeiros = false;
            this.dbg.enabled.atiradores  = false;
            this.dbg.enabled.vacas       = true;
            this.dbg.enabled.bois        = false;
            this.dbg.counts.vacas        = 5;
            this.dbg.fx.weather          = 'storm';
            this.dbg.fx.timeOfDay        = 'midnight';
            this.dbg.fx.chuva            = true;
            this.dbg.fx.chuvaIntensidade = 1.0;
            this.dbg.fx.chuvaCount       = 450;   // mais densidade
            this.dbg.fx.chuvaVelocidade  = 1.4;   // um pouco mais lenta -> visivel mais tempo
            this.dbg.fx.chuvaTamanho     = 2.2;   // gotas maiores
            this.dbg.fx.chuvaAngulo      = 0.04;
            this.dbg.fx.neblina          = true;
            this.dbg.fx.neblinaIntensidade = 1.0;
            this.dbg.fx.vento            = true;
            this.dbg.fx.ventoForca       = 0.04;
            // Sem game over no teaser — fuel congelado, sem drain
            this._tutCombustivelCongelado = true;
            // Beam visual SEM pull (igual etapa BEAM_VISUAL do tutorial):
            // cone aparece ao tocar mas nao abduz/arrasta cows
            this._tutBeamNoPull  = true;
            this._tutBeamNoDrain = true;
        }

        this._setupGeometricTextures();   // 03_textures.js (textura 'ship' usada below)

        // ── REGISTRA ANIMS 8-DIR (cow chubby, faz, ox) ─────────────
        // Cow chubby: walk(4f), idle_head_shake→eat(11f), lie_down→angry(8f).
        // "run" reusa walk with fps maior (anim chubby não has run dedicado).
        const DIRS8 = ['S','E','N','W','SE','NE','NW','SW'];
        const ANIM8 = [
            { prefix: 'cow_walk',  frames: 4,  fps: 6  },
            { prefix: 'cow_eat',   frames: 11, fps: 4  },
            { prefix: 'cow_angry', frames: 8,  fps: 8  },
            { prefix: 'farmer_run',    frames: 4,  fps: 10 },
            { prefix: 'ox_walk',   frames: 4,  fps: 6  },
            { prefix: 'ufo_hover',  frames: 4,  fps: 8  },
            // ox_idle: 7 dirs (without N) — fallback to static em N
            { prefix: 'ox_idle',   frames: 11, fps: 4,  dirs: ['S','E','W','SE','NE','NW','SW'] },
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
            // cow_run is cow_walk em fps×2 — registra as anim separado
            const runKey = `cow_run_${d}`;
            if (!this.anims.exists(runKey)) {
                const fr = [];
                for (let i = 0; i < 4; i++) fr.push({ key: `cow_walk_${d}_${i}` });
                this.anims.create({ key: runKey, frames: fr, frameRate: 12, repeat: -1 });
            }
        });

        if (this.EXPERIMENT_MODE) {
            // Fundo neutro escuro + nada de obstáculos/NPCs
            this.add.rectangle(W/2, H/2, W, H, 0x1a1a1a).setDepth(0);
            this.farmers = [];
            this.cows = [];
            this.abductedCows = [];
            this.corrals = [];
            this.grassPatches = [];
            this.terrainGrid = null;
            this._setupGrassPatch(W, H);    // 14_grass_patch.js
        } else {
            // Scenery always roda (terreno/grass base); fences/moitas opcionais via cfg.cenario
            this._setupScenery(W, H);
            if (this.dbg.enabled.atiradores) this._setupShooters();
            else { this.bullets = []; this.shooters = []; }
            this.farmers = [];
            if (this.dbg.enabled.fazendeiros) this._spawnFarmers(this.dbg.counts.fazendeiros);
        }

        // ── NAVE ─────────────────────────────────────────────────────
        // Sombra blur fake (3 elipses stacked) — substituiu o tinted ship clone
        this.shipShadow = this.add.container(0, 0);
        this.shipShadow.add(this.add.ellipse(0, 0, 110, 38, 0x000000, 0.10));
        this.shipShadow.add(this.add.ellipse(0, 0, 80, 28, 0x000000, 0.20));
        this.shipShadow.add(this.add.ellipse(0, 0, 56, 20, 0x000000, 0.32));
        this.shipShadow.setDepth(1);
        const beamScale = this.dbg.scale.beam;
        const CONE_R = (40*5.55/2) * beamScale;
        this.coneRadius = CONE_R;
        // Beam: Graphics with círculos concêntricos de alpha variável (without PNG → without
        // artefato de mask). Desenhado em _desenharCone(raio) chamado em _updateBody.
        this.lightCone = this.add.graphics().setDepth(2).setVisible(false);
        this._desenharCone(CONE_R);
        if (!this.dbg.enabled.beam) this.lightCone.setAlpha(0);  // beam invisível se OFF
        // matter.add.SPRITE (not image) — sprite suporta .anims to hovering_idle 8-dir
        this.ship = this.matter.add.sprite(W/2, H/2, 'nave', null, {shape:{type:'circle',radius:20}});
        this.ship.setFrictionAir(0.04).setMass(5).setDepth(10).setCollisionCategory(4).setCollidesWith([1]);
        const shipScale = this.dbg?.scale?.nave ?? 1.0;
        this.ship.setDisplaySize(80 * shipScale, 80 * shipScale);
        // MOBILE_MODE: nave com inercia alta (frictionAir baixo) + bounce
        // total nas bordas (matter combina restitution via Math.max — walls
        // default=0, ship=1 -> bounce sem perda de energia).
        if (window.__MOBILE_MODE) {
            this.ship.setFrictionAir(0.005).setBounce(1.0);
        }
        // Lock rotação física — disco não gira by colisão; rotação is feita manualmente
        // via discoRot slider no _updateBody
        this.ship.setFixedRotation();
        this._naveDir8 = 'S';
        if (this.anims.exists('ufo_hover_S')) this.ship.play('ufo_hover_S');

        this._setupLEDs();                  // 06_nave.js — LEDs animados ao redor da ship

        // ── VACAS ────────────────────────────────────────────────────
        if (!this.EXPERIMENT_MODE) {
            this.cows = [];
            this.abductedCows = [];
            // Só spawns se cow OU ox tá habilitado — _spawnVacas filtra by tipo internamente
            if (this.dbg.enabled.vacas || this.dbg.enabled.bois) {
                this._spawnVacas(this.dbg.counts.vacas);
            }
        }

        // ── ESTADO ───────────────────────────────────────────────────
        this.burgerCount = 0;
        this.score = 0;
        this.fuelMax   = 100;
        this.fuelCurrent = 100;
        this.difficulty = 1;
        this.gameOver = false;
        this.energiaMax = 100;
        this.energiaLed = 100;
        this.energiaDrain = 5;
        this.energiaRegen = 30;

        // ── HUD ──────────────────────────────────────────────────────
        this.isMobile = this.sys.game.device.input.touch;
        this.input.addPointer(1);
        this.hud = {};
        this._createHUD();
        this._positionHUD();
        this.scale.on('resize', () => this._positionHUD());

        // MOBILE_MODE teaser: esconde HUD inteiro pra player ver so terreno +
        // ship + beam + smoke + weather (experiencia atmosferica pura).
        if (window.__MOBILE_MODE) {
            for (const k of Object.keys(this.hud)) {
                const o = this.hud[k];
                if (o && o.setVisible) o.setVisible(false);
            }
        }

        // ── CURSOR VIRTUAL ───────────────────────────────────────────
        this.virtualX = this.scale.width / 2;
        this.virtualY = this.scale.height / 2;
        this.input.on('pointermove', (p) => {
            if (this.isMobile && p !== this.input.pointer1) return;
            this.virtualX = p.x;
            this.virtualY = p.y;
        });
        this.input.on('pointerdown', (p) => {
            if(!this.gameStarted) return;   // splash still visível
            if(this.gameOver) return;
            if(this.isMobile && p !== this.input.pointer1) return;
            if(this.hud.hint) { this.hud.hint.destroy(); this.hud.hint = null; }
            if(this.hud.hintBg) { this.hud.hintBg.destroy(); this.hud.hintBg = null; }
        });

        this.cameras.main.startFollow(this.ship, true, 0.05, 0.05);

        // Repovoamento periódico (desabilitado em experiment mode)
        if (!this.EXPERIMENT_MODE) {
            this.time.addEvent({delay:6000, loop:true, callback:()=>{ if(!this.gameOver) this._repopulate(); }});
        }

        this._setupPause();                 // 11_gameflow.js
        this._setupDebugMenu();             // 15_debug_menu.js — DOM debug panel
        this._setupFX();                    // 16_fx.js — rain, fog, helpers
        this._setupAtmosphere();            // 18_atmosphere.js — TOD overlay + weather
        this._setupDebugOverlay();          // 19_debug_overlay.js — F3 overlay (FPS, heap, counts)
        this._setupQuips();                 // 20_quips.js — random funny one-liners
        this._setupBarrel();                // post-fx esférico
        this._applyFXVisibility();
        this._setupCollisions();              // 10_colisao.js
        this._setupMobileControls();        // 12_mobile.js — joystick + botão (only mobile)

        // MOBILE_MODE: dark vignette overlay (canvas radial preto) — mais
        // forte que o vignette branco do fog. Depth 190 -> acima das FX
        // mas abaixo do HUD (que ja esta escondido em mobile).
        if (window.__MOBILE_MODE) {
            const SZ = 512;
            const c = document.createElement('canvas'); c.width = c.height = SZ;
            const ctx = c.getContext('2d');
            const grad = ctx.createRadialGradient(SZ/2, SZ/2, SZ*0.18, SZ/2, SZ/2, SZ*0.55);
            grad.addColorStop(0.0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.6, 'rgba(0,0,0,0.55)');
            grad.addColorStop(1.0, 'rgba(0,0,0,0.95)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, SZ, SZ);
            if (this.textures.exists('mobile_vignette')) this.textures.remove('mobile_vignette');
            this.textures.addCanvas('mobile_vignette', c);
            this.fxMobileVignette = this.add.image(this.scale.width/2, this.scale.height/2, 'mobile_vignette')
                .setScrollFactor(0).setDepth(190);
            // Vignette fixa centralizada (tamanho exato pra cobrir tela)
            this.fxMobileVignette.setDisplaySize(this.scale.width, this.scale.height);
            this.scale.on('resize', () => {
                if (this.fxMobileVignette?.scene) {
                    this.fxMobileVignette.setPosition(this.scale.width/2, this.scale.height/2);
                    this.fxMobileVignette.setDisplaySize(this.scale.width, this.scale.height);
                }
            });

            // Shuffle atmosferico recorrente: a cada 30-50s troca weather+TOD
            const TODs = ['dusk','sunset','night','midnight'];   // sempre escuros
            const WTHs = ['rain','fog','storm','snow'];          // sempre macabros
            const shuffleAtmosphere = () => {
                if (!this.dbg?.fx) return;
                this.dbg.fx.timeOfDay = TODs[Math.floor(Math.random()*TODs.length)];
                this.dbg.fx.weather   = WTHs[Math.floor(Math.random()*WTHs.length)];
                if (this._applyAtmosphere) this._applyAtmosphere();
                const next = Phaser.Math.Between(30000, 50000);
                this.time.delayedCall(next, shuffleAtmosphere);
            };
            this.time.delayedCall(Phaser.Math.Between(30000, 50000), shuffleAtmosphere);
        }

        // ── Tecla T: toggle EXPERIMENT_MODE (recarrega a página)
        // Phaser key listener + fallback nativo no window (caso Phaser perca foco)
        this.teclaT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        this._keysWASD = this.input.keyboard.addKeys('W,A,S,D,SPACE');
        const toggleExperimentMode = () => {
            const cur = localStorage.getItem('experimentMode') === '1';
            localStorage.setItem('experimentMode', cur ? '0' : '1');
            window.location.reload();
        };
        // H1: listener leak — guarda referência to remover no shutdown
        // (each scene.restart adicionava novo listener without limpar o anterior)
        if (!this._tHandler) {
            this._tHandler = (e) => {
                if (e.key === 't' || e.key === 'T') toggleExperimentMode();
            };
            window.addEventListener('keydown', this._tHandler);
        }
        this._toggleExperimentMode = toggleExperimentMode;

        // ── Em debug mode: hides HUD e shows badge "DEBUG"
        if (this.EXPERIMENT_MODE) {
            const hudKeys = ['scoreBg','scoreText','cowsBox','cowsText','burgersBox','burgersText',
                             'combImg','combFill','eneImg','eneFill','hint','hintBg'];
            for (const k of hudKeys) if (this.hud[k]) this.hud[k].setVisible(false);
            // Badge debug
            const w = this.scale.width;
            this.add.text(w - 90, 20, '🧪 DEBUG  [T off]', {
                fontSize: '11px', fill: '#ffaa44', fontStyle: 'bold',
                backgroundColor: '#000000', padding: { x: 6, y: 3 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        }

        this._setupSplash();               // 11_gameflow.js — by último (sobrepõe tudo)

        // M4: shutdown handler centralizado (cleanup ao restart de scene)
        this.events.once('shutdown', () => this._sceneCleanup());
    }

    // M4: chamado em scene.shutdown — limpa listeners globais, timers DOM,
    // graphics persistentes que sobreviveriam ao restart
    _sceneCleanup() {
        // H1: removes listener global do keydown
        if (this._tHandler) {
            window.removeEventListener('keydown', this._tHandler);
            this._tHandler = null;
        }
        // M7: cancela debounce timers do save de localStorage
        if (this._saveDbgTimer)    { clearTimeout(this._saveDbgTimer);    this._saveDbgTimer = null; }
        if (this._rainRebuildTimer){ clearTimeout(this._rainRebuildTimer);this._rainRebuildTimer = null; }
        if (this._snowRebuildTimer){ clearTimeout(this._snowRebuildTimer);this._snowRebuildTimer = null; }
        // M2: graphics persistentes
        if (this._atmoGfx?.destroy)       this._atmoGfx.destroy();
        if (this._atmoFlashGfx?.destroy)  this._atmoFlashGfx.destroy();
        if (this._tutGfx?.destroy)        this._tutGfx.destroy();
        if (this._tutGlowWorld?.destroy)  this._tutGlowWorld.destroy();
        // H2: reset flags de tutorial to nao vazar
        this._tutBeamNoDrain = false;
        this._tutBeamNoPull  = false;
        this._tutVacasImortais = false;
        this._tutFreezeNave = false;
        this._tutCombustivelCongelado = false;
        this._tutGravitonDrain2x = false;
    }

    update(time, delta) {
        // F3 + debug overlay funcionam desde o splash
        if (this._updateDebugOverlay) this._updateDebugOverlay();

        // ESC funciona desde o splash to abrir CONFIGS before do game iniciar
        if (!this.gameStarted) {
            if (this.teclaEsc && Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
                this._splashConfigsOpen = !this._splashConfigsOpen;
                this._toggleDebugMenu(this._splashConfigsOpen);
            }
            return;
        }
        if (this.gameOver) return;
        try { this._updateBody(time, delta); }
        catch (e) {
            // Captura no debug overlay (without suprimir após o primeiro)
            const msg = (e?.message || String(e)).substring(0, 200);
            if (this._captureErr) this._captureErr(msg, 'update');
            console.error('[UPDATE ERR]', e);
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
            this.paused = !this.paused;
            this.matter.world.enabled = !this.paused;
            this.pauseOverlay.setVisible(this.paused);
            this.pauseGrafico.setVisible(this.paused);
            this.pauseLabel.setVisible(this.paused);
            this.pauseHint.setVisible(this.paused);
            this._toggleDebugMenu(this.paused);
        }
        if (this.paused) return;

        this.difficulty += 0.000018 * delta;

        if (!this._tutCombustivelCongelado) this._updateFuel(delta);
        if (!this.EXPERIMENT_MODE) this._updateCowsAI();
        if (this.tutorialMode && this._updateTutorial) this._updateTutorial(time, delta);

        // COWS counter: usa _cowsInBeamCount mantido by _updateBeamCounters
        // (was for-loop by frame before — H5 do audit)
        this.hud.cowsText.setText(this._cowsInBeamCount || 0);
        this.hud.burgersText.setText(this.burgerCount);

        const cam = this.cameras.main;
        let cursor;
        const inputMode = this.dbg?.behavior?.inputMode ?? 'mouse';
        // Modo WASD: monta vetor das teclas + Space to beam
        if (inputMode === 'wasd' && this._keysWASD) {
            let dx = 0, dy = 0;
            if (this._keysWASD.W.isDown) dy -= 1;
            if (this._keysWASD.S.isDown) dy += 1;
            if (this._keysWASD.A.isDown) dx -= 1;
            if (this._keysWASD.D.isDown) dx += 1;
            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                const REACH = 220;
                cursor = {
                    x: this.ship.x + (dx/len) * REACH,
                    y: this.ship.y + (dy/len) * REACH
                };
            } else {
                // Sem input: cursor na ship (não move)
                cursor = { x: this.ship.x, y: this.ship.y };
            }
            // Beam via Space (sobrescreve _beamHeld pro código de beam pegar)
            this._beamHeld = this._keysWASD.SPACE.isDown;
        } else if (this.isMobile && this._joyVec && this._joyVec.active) {
            // Joystick — vetor vira "alvo virtual" 220px à frente da ship
            const REACH = 220;
            cursor = {
                x: this.ship.x + this._joyVec.x * REACH,
                y: this.ship.y + this._joyVec.y * REACH
            };
        } else {
            const wp = cam.getWorldPoint(this.virtualX, this.virtualY);
            cursor = { x: wp.x, y: wp.y };
        }

        this._updateTrail(cursor);
        this._moveShip(cursor);
        this._updateArrow();

        this.shipShadow.setPosition(this.ship.x+8, this.ship.y+24);
        this._updateShadows();
        this.lightCone.setPosition(this.ship.x, this.ship.y);

        // Disco: rotação base (slider) + tilt baseado em mudança de speed lateral
        const discoRot = this.dbg?.behavior?.discoRot ?? 0;
        this._discoBaseAngle = (this._discoBaseAngle ?? 0) + discoRot * (delta / 1000);
        const navVx = this.ship.body.velocity.x;
        const navVy = this.ship.body.velocity.y;
        const vAxDelta = navVx - (this._lastNavVx ?? navVx);
        this._lastNavVx = navVx;
        const tiltTarget = Phaser.Math.Clamp(-vAxDelta * 8, -0.4, 0.4);
        this._tiltCurrent = (this._tiltCurrent ?? 0) * 0.88 + tiltTarget * 0.12;
        this.ship.rotation = this._discoBaseAngle + this._tiltCurrent;

        // ── UFO directional hover anim ───────────────────────────────
        // Acima de threshold, escolhe dir8 do vetor speed; below, mantém última dir
        const navSpeedAnim = Math.sqrt(navVx*navVx + navVy*navVy);
        if (navSpeedAnim > 0.5) {
            const deg = (Math.atan2(navVy, navVx) * 180 / Math.PI + 360) % 360;
            const i = Math.round(deg / 45) % 8;
            this._naveDir8 = ['E','SE','S','SW','W','NW','N','NE'][i];
        }
        const hoverKey = `ufo_hover_${this._naveDir8 || 'S'}`;
        if (this.ship.anims && this.anims.exists(hoverKey) && this.ship.anims.currentAnim?.key !== hoverKey) {
            this.ship.play(hoverKey, true);
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
                const px = this.ship.x + ux * 30;
                const py = this.ship.y + uy * 30;
                this._spawnSmoke(px, py, {
                    color: 0xbbbbcc, alpha: 0.75, size: 4,
                    dur: 1400, drift: 26
                });
                // Partícula colorida ocasional (substitui o LED rotativo)
                if (Math.random() < 0.55) {
                    const colors = [0x33aaff, 0xff4466, 0xffcc33, 0x44ff88, 0xcc66ff];
                    const col = colors[Math.floor(Math.random() * colors.length)];
                    // Offset radial to parecer que sai de points diferentes do disco
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
        this._atmoUpdate(delta);
        this._updateLEDs(delta);
        if (this._updateWind) this._updateWind(delta);
        if (this._quipProximityCheck) this._quipProximityCheck(delta);

        const wantBeam = (inputMode === 'wasd' || this.isMobile)
            ? !!this._beamHeld
            : this.input.activePointer.isDown;
        // Tutorial flags:
        //  _tutBeamNoDrain: cone aparece, NÃO consome graviton (etapa BEAM_VISUAL)
        //  _tutBeamNoPull:  cone aparece, NÃO atrai entidades (BEAM_VISUAL + GRAVITON_BAR)
        const noDrain = !!this._tutBeamNoDrain;
        const beamActive = wantBeam && (noDrain || this.energiaLed > 0);

        if (wantBeam && !noDrain && this.energiaLed > 0) {
            const drainMul = this._tutGravitonDrain2x ? 2.0 : 1.0;
            this.energiaLed -= this.energiaDrain * drainMul * (delta/1000);
            if (this.energiaLed < 0) this.energiaLed = 0;
        } else if (!wantBeam && !noDrain) {
            this.energiaLed = Math.min(this.energiaMax, this.energiaLed + this.energiaRegen * (delta/1000));
        }

        const enePct = this.energiaLed / this.energiaMax;
        // V2: setCrop no fillImg
        if (this.hud.eneFillImg && this._updateFillCrop) {
            this._updateFillCrop(this.hud.eneFillImg, enePct);
        }
        // Legacy fallback (Graphics gradient)
        if (this.hud.eneFill) {
            const eb = this._eneBar || { x: 0, y: 0, w: 0, h: 0 };
            const eFill = Math.max(0, eb.w * enePct);
            this.hud.eneFill.clear();
            if (eFill > 0) {
                this.hud.eneFill.fillGradientStyle(0x3399ff, 0xaa44ff, 0x1166cc, 0x7722cc, 1);
                this.hud.eneFill.fillRect(eb.x, eb.y, eFill, eb.h);
            }
        }

        if (beamActive) {
            // FX: detecta transição off→on to dar shake/flash uma vez
            if (!this._beamWasOn) {
                this._beamWasOn = true;
                if (this.dbg?.fx?.beamShake) {
                    this.cameras.main.shake(120, 0.004);
                    this.cameras.main.flash(120, 80, 200, 120, false);
                }
            }
            // Sparkles emitidos a each ~80ms enquanto o beam is ativo
            if (this.dbg?.fx?.beamSparks) {
                this._beamSparkleTimer = (this._beamSparkleTimer ?? 0) + delta;
                if (this._beamSparkleTimer > 80) {
                    this._beamSparkleTimer = 0;
                    this._emitBeamSparkle();
                }
            }
            this.lightCone.setVisible(true);
            this.lightCone.setAlpha(1);
            // Tutorial BEAM_VISUAL e GRAVITON_BAR: cone aparece mas zero pull
            const noPull = !!this._tutBeamNoPull;
            if (!noPull) {
                if (this.abductedCows.length < 5) this._tryAbduct();
                this.abductedCows.forEach(v => this._basinPhysics(v));
            }
        } else if (wantBeam) {
            this._dropNonBurgers();
            this.lightCone.setVisible(true);
            this.lightCone.setAlpha(0.35);
            this.abductedCows.forEach(v => this._basinPhysics(v));
        } else {
            this._beamWasOn = false;
            this._releaseAll();
            this.lightCone.setVisible(false);
        }

        if (!this.EXPERIMENT_MODE) {
            this._checkDelivery();
            this._updateShooters(delta);
            this._updateFarmers(delta);
        } else {
            this._updateGrassMouse();
        }

        this._updateMinimap();
    }
}
