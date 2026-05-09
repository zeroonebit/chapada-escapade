// 01_scene.js — class principal e orquestração de create() / update()
// Os métodos da Scene are distribuídos nos arquivos js/0X_*.js seguintes,
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

        // ── WANG_DEBUG: ?debug=wang na URL → modo isolado de auditoria ──
        // Renderiza só o wang tile terrain. Sem splash, UFO, NPCs, HUD, FX,
        // atmosphere, tutorial, beam. Só ESC abre o debug menu pra tweakar
        // sliders Wang (threshold, CA passes, tile style).
        // Camera: WASD/arrows pra scroll, [/] pra zoom.
        try {
            const flag = new URLSearchParams(location.search).get('debug');
            this.WANG_DEBUG = flag === 'wang';
        } catch(e) { this.WANG_DEBUG = false; }
        if (this.WANG_DEBUG) return this._createBodyWangDebug(W, H);

        // EXPERIMENT_MODE forçado OFF (debug — shader patch tava travando)
        this.EXPERIMENT_MODE = false;
        localStorage.setItem('experimentMode', '0');

        // Loads config de debug before de qualquer spawn (afeta scales/counts)
        this._loadDebugCfg();

        // MOBILE_MODE: override to experiencia atmosferica — cap 5 cows,
        // without enemies. Beam visual without pull (so muda cone, nao puxa nada).
        if (window.__MOBILE_MODE && this.dbg) {
            this.dbg.enabled.farmers = false;
            this.dbg.enabled.shooters  = false;
            this.dbg.enabled.cows       = true;
            this.dbg.enabled.bulls        = false;
            this.dbg.counts.cows        = 5;
            this.dbg.fx.weather          = 'storm';
            this.dbg.fx.timeOfDay        = 'midnight';
            this.dbg.fx.rain            = true;
            this.dbg.fx.rainIntensity = 1.0;
            this.dbg.fx.rainCount       = 450;   // more densidade
            this.dbg.fx.rainSpeed  = 1.4;   // um pouco more lenta -> visivel more tempo
            this.dbg.fx.rainSize     = 2.2;   // gotas maiores
            this.dbg.fx.rainAngle      = 0.04;
            this.dbg.fx.fog          = true;
            this.dbg.fx.fogIntensity = 1.0;
            this.dbg.fx.wind            = true;
            this.dbg.fx.windForce       = 0.04;
            // without game over no teaser — fuel congelado, without drain
            this._tutCombustivelCongelado = true;
            // Beam visual without pull (equal etapa BEAM_VISUAL do tutorial):
            // cone aparece ao tocar mas nao abduz/arrasta cows
            this._tutBeamNoPull  = true;
            this._tutBeamNoDrain = true;
        }

        this._setupGeometricTextures();   // 03_textures.js (textura 'ship' used below)

        // ── ATLAS FRAME ALIASING ──────────────────────────────────────
        // Atlases carregam frames como cow_S, cow_walk_S_0 etc internamente.
        // Pra manter setTexture('cow_S') funcionando sem rewrite massivo de
        // call sites em 6 arquivos, registra cada frame como texture indep.
        // (extração via canvas — ~40 texturas pequenas, ~5MB GPU adicional, ok)
        this._registerAtlasFrameTextures();

        // ── REGISTRA ANIMS 8-DIR usando frames do atlas ─────────────
        // Antes: cada frame era texture separada, anim.frames[i].key = 'cow_walk_S_0'.
        // Agora: anim.frames[i] = { key: 'cow_atlas', frame: 'cow_walk_S_0' }.
        const DIRS8 = ['S','E','N','W','SE','NE','NW','SW'];
        const ANIM8 = [
            { atlas: 'cow_atlas',    prefix: 'cow_walk',   frames: 4,  fps: 6  },
            { atlas: 'cow_atlas',    prefix: 'cow_eat',    frames: 11, fps: 4  },
            { atlas: 'cow_atlas',    prefix: 'cow_angry',  frames: 8,  fps: 8  },
            { atlas: 'farmer_atlas', prefix: 'farmer_run', frames: 4,  fps: 10 },
            { atlas: 'ox_atlas',     prefix: 'ox_walk',    frames: 4,  fps: 6  },
            { atlas: 'ufo_atlas',    prefix: 'ufo_hover',  frames: 4,  fps: 8  },
            { atlas: 'ox_atlas',     prefix: 'ox_idle',    frames: 11, fps: 4,
              dirs: ['S','E','W','SE','NE','NW','SW'] },
        ];
        DIRS8.forEach(d => {
            ANIM8.forEach(({atlas, prefix, frames, fps, dirs}) => {
                if (dirs && !dirs.includes(d)) return;
                const key = `${prefix}_${d}`;
                if (this.anims.exists(key)) return;
                const fr = [];
                for (let i = 0; i < frames; i++) fr.push({ key: atlas, frame: `${prefix}_${d}_${i}` });
                this.anims.create({ key, frames: fr, frameRate: fps, repeat: -1 });
            });
            // cow_run é cow_walk @ fps×2 — usa mesmas frames do atlas
            const runKey = `cow_run_${d}`;
            if (!this.anims.exists(runKey)) {
                const fr = [];
                for (let i = 0; i < 4; i++) fr.push({ key: 'cow_atlas', frame: `cow_walk_${d}_${i}` });
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
            // Scenery always roda (terreno/grass base); fences/moitas opcionais via cfg.scenery
            this._setupScenery(W, H);
            if (this.dbg.enabled.shooters) this._setupShooters();
            else { this.bullets = []; this.shooters = []; }
            this.farmers = [];
            if (this.dbg.enabled.farmers) this._spawnFarmers(this.dbg.counts.farmers);
        }

        // ── ufo ─────────────────────────────────────────────────────
        // shadow blur fake (3 elipses stacked) — substituiu o tinted ship clone
        this.ufoShadow = this.add.container(0, 0);
        this.ufoShadow.add(this.add.ellipse(0, 0, 110, 38, 0x000000, 0.10));
        this.ufoShadow.add(this.add.ellipse(0, 0, 80, 28, 0x000000, 0.20));
        this.ufoShadow.add(this.add.ellipse(0, 0, 56, 20, 0x000000, 0.32));
        this.ufoShadow.setDepth(1);
        const beamScale = this.dbg.scale.beam;
        const CONE_R = (40*5.55/2) * beamScale;
        this.coneRadius = CONE_R;
        // Beam: Graphics with círculos concêntricos de alpha variável (without PNG → without
        // artefato de mask). Desenhado em _desenharCone(radius) chamado em _updateBody.
        this.lightCone = this.add.graphics().setDepth(2).setVisible(false);
        this._desenharCone(CONE_R);
        if (!this.dbg.enabled.beam) this.lightCone.setAlpha(0);  // beam invisível se OFF
        // matter.add.SPRITE (not image) — sprite suporta .anims to hovering_idle 8-dir
        this.ufo = this.matter.add.sprite(W/2, H/2, 'nave', null, {shape:{type:'circle',radius:20}});
        this.ufo.setFrictionAir(0.04).setMass(5).setDepth(10).setCollisionCategory(4).setCollidesWith([1]);
        const ufoScale = this.dbg?.scale?.ufo ?? 1.0;
        this.ufo.setDisplaySize(80 * ufoScale, 80 * ufoScale);
        // MOBILE_MODE: ufo com inercia alta (frictionAir baixo) + bounce
        // total nas bordas (matter combina restitution via Math.max — walls
        // default=0, ship=1 -> bounce without perda de energia).
        if (window.__MOBILE_MODE) {
            this.ufo.setFrictionAir(0.005).setBounce(1.0);
        }
        // Lock rotação física — ufo não gira by collision; rotação is feita manualmente
        // via ufoRot slider no _updateBody
        this.ufo.setFixedRotation();
        this._ufoDir8 = 'S';
        if (this.anims.exists('ufo_hover_S')) this.ufo.play('ufo_hover_S');

        this._setupLEDs();                  // 06_ufo.js — LEDs animados ao redor da ship

        // ── cows ────────────────────────────────────────────────────
        if (!this.EXPERIMENT_MODE) {
            this.cows = [];
            this.abductedCows = [];
            // Só spawns se cow OU ox tá habilitado — _spawnVacas filtra by tipo internamente
            if (this.dbg.enabled.cows || this.dbg.enabled.bulls) {
                this._spawnVacas(this.dbg.counts.cows);
            }
        }

        // ── ESTADO ───────────────────────────────────────────────────
        this.burgerCount = 0;
        this.score = 0;
        this.fuelMax   = 100;
        this.fuelCurrent = 100;
        // Counters cumulativos pra HUD coluna left
        this.bullsTotal    = 0;  // bois entregues no curral
        this.cowsTotal     = 0;  // vacas entregues no curral
        this.farmersTotal  = 0;  // farmers eliminados (rocha/explosao)
        this.shootersTotal = 0;  // shooters destruidos
        this.difficulty = 1;
        this.gameOver = false;
        // Reset flags do cinematic game over — sem isto, o segundo game over
        // chama _showGameOverUI mas a guard `if (this._gameOverUiShown) return`
        // dispara e a UI nunca aparece. scene.restart() reusa a instancia,
        // entao estes flags persistem se nao forem reaplicados aqui.
        this._gameOverUiShown    = false;
        this._gameOverFx         = null;
        this._gameOverSmokeEvent = null;
        this._gameOverDebrisSmoke = null;
        this.energiaMax = 100;
        this.energiaLed = 100;
        this.energiaDrain = 5;
        this.energiaRegen = 30;

        // ── HUD ──────────────────────────────────────────────────────
        // L5: detection mais conservadora pra evitar false-positive em hybrid
        // (touchscreen laptop, 2-in-1, tablet com mouse). So vira true se for
        // touch-coarse-pointer-pequeno simultaneamente. Hybrid usa desktop mode
        // (mouse default) — pode togglar pra WASD via CONFIGS sem quebrar.
        this.isMobile = !!this.sys.game.device.input.touch
            && window.matchMedia('(pointer: coarse)').matches
            && window.innerWidth < 1024;
        this.input.addPointer(1);
        this.hud = {};
        this._createHUD();
        this._positionHUD();
        // Defensive: chamar _positionHUD novamente no proximo tick. Em algumas
        // sessoes a primeira chamada tava ocorrendo antes de this.textures
        // estar 100% pronto pro radar (ring/dome PNGs nao apareciam ate restart).
        // Re-call cobre o gap sem custo perceptivel.
        this.time.delayedCall(50, () => { if (this._positionHUD) this._positionHUD(); });
        this.scale.on('resize', () => this._positionHUD());

        // MOBILE_MODE teaser: esconde HUD inteiro to player ver so terreno +
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

        this.cameras.main.startFollow(this.ufo, true, 0.05, 0.05);

        // Repovoamento periódico (desabilitado em experiment mode)
        if (!this.EXPERIMENT_MODE) {
            this.time.addEvent({delay:6000, loop:true, callback:()=>{ if(!this.gameOver) this._repopulate(); }});
        }

        this._setupPause();                 // 11_gameflow.js
        this._setupDebugMenu();             // 15_debug_menu.js — DOM debug panel
        this._setupFX();                    // 16_fx.js — rain, fog, helpers
        // ── Shuffle atmosferico em cada restart (desktop, fora do tutorial) ──
        // User pediu: cada partida comeca em condicoes random — clear/rain/snow/
        // storm/fog/wind, TOD variado. Isto roda APOS _loadDebugCfg entao
        // sobrescreve o que tava persistido pra esta sessao (sem salvar de volta).
        if (!window.__MOBILE_MODE && !this.tutorialMode && this.dbg?.fx) {
            const TODs = ['day','dawn','dusk','sunset','night','midnight'];
            const WTHs = ['clear','rain','fog','storm','snow'];
            this.dbg.fx.timeOfDay = TODs[Math.floor(Math.random() * TODs.length)];
            this.dbg.fx.weather   = WTHs[Math.floor(Math.random() * WTHs.length)];
            // Wind: 50/50 ligado/desligado, intensidade random quando ligado
            this.dbg.fx.wind = Math.random() < 0.5;
            if (this.dbg.fx.wind) {
                this.dbg.fx.windForce = Phaser.Math.FloatBetween(-0.045, 0.045);
            }
            // Sync flags individuais (alguns FXs leem rain/snow/fog separado)
            this.dbg.fx.rain  = (this.dbg.fx.weather === 'rain' || this.dbg.fx.weather === 'storm');
            this.dbg.fx.snow  = (this.dbg.fx.weather === 'snow');
            this.dbg.fx.fog   = (this.dbg.fx.weather === 'fog' || this.dbg.fx.weather === 'storm');
        }
        this._setupAtmosphere();            // 18_atmosphere.js — TOD overlay + weather
        this._setupDebugOverlay();          // 19_debug_overlay.js — F3 overlay (FPS, heap, counts)
        this._setupQuips();                 // 20_quips.js — random funny one-liners
        this._setupBarrel();                // post-fx esférico
        this._applyFXVisibility();
        this._setupCollisions();              // 10_colisao.js
        this._setupMobileControls();        // 12_mobile.js — joystick + botão (only mobile)

        // MOBILE_MODE: dark vignette overlay (canvas radial preto) — more
        // forte que o vignette branco do fog. Depth 190 -> above das FX
        // mas below do HUD (que ja esta escondido em mobile).
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
            // Vignette fixa centralizada (size exato to cobrir screen)
            this.fxMobileVignette.setDisplaySize(this.scale.width, this.scale.height);
            this.scale.on('resize', () => {
                if (this.fxMobileVignette?.scene) {
                    this.fxMobileVignette.setPosition(this.scale.width/2, this.scale.height/2);
                    this.fxMobileVignette.setDisplaySize(this.scale.width, this.scale.height);
                }
            });

            // Shuffle atmosferico recorrente: a each 30-50s troca weather+TOD
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
        // H2 + L6: reset flags de tutorial via FSM (TUT_MODES.NONE)
        if (this._tutSetMode) this._tutSetMode('NONE');
        // M3: cleanup todos slots dos currais (pisca/bounce tweens + icons orfãos)
        if (this.corrals && this._cleanSlot) {
            for (const c of this.corrals) {
                if (c?.slots) {
                    for (let i = 0; i < c.slots.length; i++) {
                        if (c.slots[i]) this._cleanSlot(c, i);
                    }
                }
            }
        }
    }

    update(time, delta) {
        // F3 + debug overlay funcionam since o splash
        if (this._updateDebugOverlay) this._updateDebugOverlay();

        // WANG_DEBUG: skip normal update loop, só roda camera scroll
        if (this.WANG_DEBUG) {
            if (this._wangUpdate) this._wangUpdate(time, delta);
            // ESC continua funcionando pra abrir/fechar debug menu
            if (this.teclaEsc && Phaser.Input.Keyboard.JustDown(this.teclaEsc)) {
                this._splashConfigsOpen = !this._splashConfigsOpen;
                this._toggleDebugMenu(this._splashConfigsOpen);
            }
            return;
        }

        // ESC funciona since o splash to abrir CONFIGS before do game iniciar
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
            // Tap responsiveness: ao detectar tecla just-pressed, aplica
            // impulso instantâneo no UFO (kick de velocidade). Sem isso,
            // tap rápido = 1 frame de força = movimento imperceptível.
            if (this.ufo?.body && !this._tutFreezeNave) {
                const KB = Phaser.Input.Keyboard;
                let kx = 0, ky = 0;
                if (KB.JustDown(this._keysWASD.W)) ky -= 1;
                if (KB.JustDown(this._keysWASD.S)) ky += 1;
                if (KB.JustDown(this._keysWASD.A)) kx -= 1;
                if (KB.JustDown(this._keysWASD.D)) kx += 1;
                if (kx !== 0 || ky !== 0) {
                    const klen = Math.hypot(kx, ky);
                    const KICK = 1.8;   // velocidade adicional one-shot (matter units/sec)
                    const sens = this.dbg?.behavior?.sensitivity ?? 1.0;
                    const v = this.ufo.body.velocity;
                    this.ufo.setVelocity(
                        v.x + (kx/klen) * KICK * sens,
                        v.y + (ky/klen) * KICK * sens
                    );
                }
            }
            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                const REACH = 220;
                cursor = {
                    x: this.ufo.x + (dx/len) * REACH,
                    y: this.ufo.y + (dy/len) * REACH
                };
            } else {
                // without input: cursor na ship (não move)
                cursor = { x: this.ufo.x, y: this.ufo.y };
            }
            // Beam via Space (sobrescreve _beamHeld pro código de beam pegar)
            this._beamHeld = this._keysWASD.SPACE.isDown;
        } else if (this.isMobile && this._joyVec && this._joyVec.active) {
            // Joystick — vetor vira "alvo virtual" 220px à front da ship
            const REACH = 220;
            cursor = {
                x: this.ufo.x + this._joyVec.x * REACH,
                y: this.ufo.y + this._joyVec.y * REACH
            };
        } else {
            const wp = cam.getWorldPoint(this.virtualX, this.virtualY);
            cursor = { x: wp.x, y: wp.y };
        }

        this._updateTrail(cursor);
        this._moveShip(cursor);
        this._updateArrow();

        this.ufoShadow.setPosition(this.ufo.x+8, this.ufo.y+24);
        this._updateShadows();
        this.lightCone.setPosition(this.ufo.x, this.ufo.y);

        // ufo: rotação base (slider) + tilt baseado em mudança de speed lateral
        const ufoRot = this.dbg?.behavior?.ufoRot ?? 0;
        this._discoBaseAngle = (this._discoBaseAngle ?? 0) + ufoRot * (delta / 1000);
        const navVx = this.ufo.body.velocity.x;
        const navVy = this.ufo.body.velocity.y;
        const vAxDelta = navVx - (this._lastNavVx ?? navVx);
        this._lastNavVx = navVx;
        const tiltTarget = Phaser.Math.Clamp(-vAxDelta * 8, -0.4, 0.4);
        this._tiltCurrent = (this._tiltCurrent ?? 0) * 0.88 + tiltTarget * 0.12;
        this.ufo.rotation = this._discoBaseAngle + this._tiltCurrent;

        // ── UFO directional hover anim ───────────────────────────────
        // above de threshold, escolhe dir8 do vetor speed; below, mantém última dir
        const navSpeedAnim = Math.sqrt(navVx*navVx + navVy*navVy);
        if (navSpeedAnim > 0.5) {
            const deg = (Math.atan2(navVy, navVx) * 180 / Math.PI + 360) % 360;
            const i = Math.round(deg / 45) % 8;
            this._ufoDir8 = ['E','SE','S','SW','W','NW','N','NE'][i];
        }
        const hoverKey = `ufo_hover_${this._ufoDir8 || 'S'}`;
        if (this.ufo.anims && this.anims.exists(hoverKey) && this.ufo.anims.currentAnim?.key !== hoverKey) {
            this.ufo.play(hoverKey, true);
        }

        // Escapamento: várias nuvenzinhas pequenas e opacas saindo aos poucos,
        // que CRESCEM e ficam transparentes conforme se afastam (estilo escape de carro)
        // + partículas coloridas misturadas (substitui o LED giroflex)
        const navSpeed = Math.sqrt(navVx*navVx + navVy*navVy);
        if (navSpeed > 0.6) {
            this._smokeTimer = (this._smokeTimer ?? 0) + delta;
            if (this._smokeTimer > 100) {
                this._smokeTimer = 0;
                const ux = -navVx/navSpeed, uy = -navVy/navSpeed; // unit vector "back"
                const px = this.ufo.x + ux * 30;
                const py = this.ufo.y + uy * 30;
                this._spawnSmoke(px, py, {
                    color: 0xbbbbcc, alpha: 0.75, size: 4,
                    dur: 1400, drift: 26
                });
                // Partícula colorida ocasional (substitui o LED rotativo)
                if (Math.random() < 0.55) {
                    const colors = [0x33aaff, 0xff4466, 0xffcc33, 0x44ff88, 0xcc66ff];
                    const col = colors[Math.floor(Math.random() * colors.length)];
                    // Offset radial to parecer que sai de points diferentes do ufo
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
        if (this._updateActiveQuips) this._updateActiveQuips();

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
            // Sparkles emitidos a each ~80ms while o beam is ativo
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

    // ─────────────────────────────────────────────────────────────
    // WANG_DEBUG mode — scene isolada só com wang tile terrain.
    // Skip splash, UFO, NPCs, HUD, FX, atmosphere, tutorial, beam.
    // Mantém: terrain rendering, debug menu (ESC), camera scroll WASD/[],
    // wang debug overlay (numero do tile).
    _createBodyWangDebug(W, H) {
        // Stubs vazios pra outros módulos não crasharem ao acessar listas
        this.cows = []; this.abductedCows = []; this.farmers = []; this.bullets = [];
        this.shooters = []; this.corrals = []; this.grassPatches = [];
        this.terrainGrid = null; this._wangIndices = null;
        this.score = 0; this.burgerCount = 0;
        this.fuelMax = 100; this.fuelCurrent = 100;
        this.energiaMax = 100; this.energiaLed = 100;
        this.bullsTotal = this.cowsTotal = this.farmersTotal = this.shootersTotal = 0;
        this.gameStarted = true;   // skip splash
        this.gameOver = false;
        this.tutorialMode = false;
        this.coneRadius = 0;
        this.hud = {};
        // Mata o pre-loader DOM (normalmente é o splash que dispara o fade)
        const preLoader = document.getElementById('pre-loader');
        if (preLoader) preLoader.classList.add('fade');

        this._loadDebugCfg();

        // Background preto pra contraste com tiles
        this.cameras.main.setBackgroundColor('#000000');

        // Render só os wang tiles (cellular automata + cr31 corner grid)
        // Reaproveita o pipeline do _setupScenery mas só a parte wang.
        this._renderWangOnly(W, H);

        // Camera no centro do mapa, zoom inicial confortável (vê ~25% do mapa)
        this.cameras.main.centerOn(W/2, H/2);
        this.cameras.main.setZoom(0.4);
        // roundPixels: evita rendering em subpixels (causa bleeding nas bordas
        // dos tiles em zoom != 1.0). Combinado com NEAREST filter no texture
        // (em _renderWangOnly), elimina o "grid" que aparecia entre tiles.
        this.cameras.main.setRoundPixels(true);

        // Camera controls: WASD/arrows pra scroll + [/] pra zoom
        this._setupWangDebugCamera();

        // Debug menu (ESC) pra tweakar sliders Wang
        this._setupDebugMenu();

        // Pause handler (ESC abre menu)
        this._setupPause();

        // Banner topo informando modo
        const banner = this.add.text(this.scale.width/2, 18,
            '🧪 WANG_DEBUG  ·  WASD/Arrows: scroll  ·  [/] zoom  ·  R: regen  ·  ESC: configs', {
            fontSize: '13px', fill: '#ffaa44', fontStyle: 'bold',
            backgroundColor: '#000000', padding: { x: 10, y: 5 },
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(9999);

        // Atalho R: regenera o terrain (re-roll do CA)
        this.input.keyboard.on('keydown-R', () => {
            this._renderWangOnly(W, H);
        });

        // Tile preview gallery (DOM panel bottom-right) com seleção
        this._buildWangTilePreview();

        console.log('[WANG_DEBUG] Pure terrain mode active. Use ESC pra menu.');
    }

    // Painel DOM bottom-right com os 16 wang tiles. Click pra highlight +
    // dim não-matching no canvas. Click de novo pra deselecionar.
    _buildWangTilePreview() {
        if (this._wangPreviewPanel) {
            this._wangPreviewPanel.remove();
            this._wangPreviewPanel = null;
        }
        const panel = document.createElement('div');
        panel.id = 'wang-tile-preview';
        panel.style.cssText = `
            position: fixed; bottom: 12px; right: 12px;
            background: rgba(8,16,12,0.92);
            border: 1.5px solid #224433;
            border-radius: 6px;
            padding: 8px;
            display: grid; grid-template-columns: repeat(4, 56px); gap: 4px;
            z-index: 9999;
            font-family: 'Courier New', monospace;
            box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        `;
        const header = document.createElement('div');
        header.style.cssText = 'grid-column: 1/-1; font-size:10px; color:#aaffcc; letter-spacing:2px; margin-bottom:2px; text-align:center;';
        header.textContent = 'WANG TILES';
        panel.appendChild(header);

        const style = this.dbg?.fx?.tileStyle;
        const useStyle = (style && style !== 'test' && this.textures.exists(`wang_${style}_00`));

        this._wangPreviewSelected = null;  // null = nenhum selecionado, todos visíveis
        this._wangPreviewCells = [];

        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            const f = String(i).padStart(2, '0');
            const key = useStyle ? `wang_${style}_${f}` : `wang_${f}`;
            // Extrai o canvas da textura (cada wang_NN é um PNG carregado como canvas)
            const tex = this.textures.get(key);
            const src = tex?.getSourceImage?.();
            const dataUrl = (src && src.toDataURL) ? src.toDataURL() :
                            (src && src.src) ? src.src : null;
            cell.style.cssText = `
                width: 56px; height: 56px;
                background: ${dataUrl ? `url(${dataUrl}) center/contain no-repeat #000` : '#222'};
                image-rendering: pixelated;
                border: 2px solid #224433;
                border-radius: 4px;
                cursor: pointer;
                position: relative;
                transition: border-color 0.15s, transform 0.1s;
            `;
            // Label numérico no canto
            const label = document.createElement('div');
            label.textContent = i.toString();
            label.style.cssText = `
                position: absolute; top: 1px; left: 3px;
                font-size: 9px; color: #aaffcc;
                text-shadow: 1px 1px 0 #000, -1px -1px 0 #000;
                pointer-events: none;
            `;
            cell.appendChild(label);

            cell.addEventListener('mouseenter', () => {
                if (this._wangPreviewSelected !== i) cell.style.borderColor = '#88ddaa';
            });
            cell.addEventListener('mouseleave', () => {
                if (this._wangPreviewSelected !== i) cell.style.borderColor = '#224433';
            });
            cell.addEventListener('click', () => {
                this._wangPreviewSelectTile(i);
            });

            this._wangPreviewCells.push(cell);
            panel.appendChild(cell);
        }

        // Botão "Limpar seleção"
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'CLEAR';
        clearBtn.style.cssText = `
            grid-column: 1/-1; margin-top: 4px;
            background: #001a08; color: #aaffcc;
            border: 1px solid #224433; border-radius: 3px;
            padding: 4px; font-family: inherit; font-size: 10px;
            letter-spacing: 1px; cursor: pointer;
        `;
        clearBtn.addEventListener('click', () => this._wangPreviewSelectTile(null));
        panel.appendChild(clearBtn);

        document.body.appendChild(panel);
        this._wangPreviewPanel = panel;
    }

    _wangPreviewSelectTile(idx) {
        // Toggle: clicar no mesmo deseleciona
        if (this._wangPreviewSelected === idx) idx = null;
        this._wangPreviewSelected = idx;

        // Atualiza bordas no painel (aro amarelo no selecionado)
        if (this._wangPreviewCells) {
            this._wangPreviewCells.forEach((cell, i) => {
                if (i === idx) {
                    cell.style.borderColor = '#ffcc00';
                    cell.style.transform = 'scale(1.1)';
                    cell.style.boxShadow = '0 0 8px rgba(255,204,0,0.6)';
                } else {
                    cell.style.borderColor = '#224433';
                    cell.style.transform = 'scale(1)';
                    cell.style.boxShadow = 'none';
                }
            });
        }

        // No canvas: dim não-matching, highlight matching
        if (this._wangTileImages && this._wangIndices) {
            const ROWS = this._wangIndices.length;
            const COLS = this._wangIndices[0]?.length || 0;
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const flatIdx = y * COLS + x;
                    const img = this._wangTileImages[flatIdx];
                    if (!img || !img.scene) continue;
                    const tileIdx = this._wangIndices[y][x];
                    if (idx === null) {
                        img.setAlpha(1).clearTint();
                    } else if (tileIdx === idx) {
                        img.setAlpha(1);
                        img.setTint(0xffeeaa);   // dourado sutil
                    } else {
                        img.setAlpha(0.25);
                        img.clearTint();
                    }
                }
            }
        }
    }

    _renderWangOnly(W, H) {
        // Remove tiles antigos se for regen
        if (this._wangTileImages) {
            this._wangTileImages.forEach(img => img && img.scene && img.destroy());
        }
        this._wangTileImages = [];
        // Remove wang debug overlay antigo
        if (this._wangDebugTexts) {
            this._wangDebugTexts.forEach(t => t && t.scene && t.destroy());
            this._wangDebugTexts = [];
        }

        const CELL = 80;
        const COLS = Math.ceil(W / CELL);
        const ROWS = Math.ceil(H / CELL);
        const proc = this.dbg?.proc || {};
        const VERT_THRESHOLD = proc.vertThreshold ?? 0.50;
        const VERT_CA_PASSES = proc.vertCaPasses ?? 4;

        // Vertex grid binário (cr31 cantos compartilhados)
        const CW = COLS + 1, CH = ROWS + 1;
        let corners = [];
        for (let y = 0; y < CH; y++) {
            corners[y] = [];
            for (let x = 0; x < CW; x++) {
                corners[y][x] = Math.random() < VERT_THRESHOLD ? 1 : 0;
            }
        }
        // CA majoritário no vertex grid
        for (let pass = 0; pass < VERT_CA_PASSES; pass++) {
            const next = [];
            for (let y = 0; y < CH; y++) {
                next[y] = [];
                for (let x = 0; x < CW; x++) {
                    let count = 0, total = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = y+dy, nx = x+dx;
                            if (ny<0||ny>=CH||nx<0||nx>=CW) { count++; total++; continue; }
                            count += corners[ny][nx]; total++;
                        }
                    }
                    next[y][x] = count >= Math.ceil(total/2) ? 1 : 0;
                }
            }
            corners = next;
        }

        // Render
        const style = this.dbg?.fx?.tileStyle;
        const useStyle = (style && style !== 'test' && this.textures.exists(`wang_${style}_00`));
        console.log('[WANG_DEBUG] tileStyle=', style, 'useStyle=', useStyle);
        const remap = (useStyle && this.dbg?.proc?.autoSortTiles && this._autoSortWangTiles)
            ? this._autoSortWangTiles(style) : null;

        // Pre-aplica NEAREST filter em todas as wang textures usadas (one-shot
        // por texture, idempotente) — elimina sampling linear que mistura
        // pixels da borda do tile com transparente/vizinho = "bleeding"
        const filterAppliedKeys = new Set();
        const ensureFilter = (key) => {
            if (filterAppliedKeys.has(key)) return;
            const tex = this.textures.get(key);
            if (tex && tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
            filterAppliedKeys.add(key);
        };

        this._wangIndices = [];
        for (let y = 0; y < ROWS; y++) {
            this._wangIndices[y] = [];
            for (let x = 0; x < COLS; x++) {
                const nw = corners[y][x],     ne = corners[y][x+1];
                const sw = corners[y+1][x],   se = corners[y+1][x+1];
                const idx = nw + ne*2 + se*4 + sw*8;   // cr31
                this._wangIndices[y][x] = idx;
                const srcIdx = remap ? remap[idx] : idx;
                const f = String(srcIdx).padStart(2, '0');
                const key = useStyle ? `wang_${style}_${f}` : `wang_${f}`;
                ensureFilter(key);
                // 2px overlap cobre micro-gaps em zooms patológicos. Com
                // pixelArt:true global + NEAREST filter + roundPixels camera,
                // o overlap só serve pra fechar o último resíduo.
                const img = this.add.image(x*CELL + CELL/2, y*CELL + CELL/2, key)
                    .setDisplaySize(CELL + 2, CELL + 2).setDepth(0);
                this._wangTileImages.push(img);
            }
        }
        // Re-render overlay se debug nº dos tiles tava on
        if (this.dbg?.fx?.wangDebug && this._renderWangDebug) this._renderWangDebug();

        // Reset preview seleção: tiles novos não têm tint, então só zerar state
        // e re-build painel se style mudou (thumbnails refletem o style atual)
        if (this._wangPreviewPanel) {
            const currentStyle = this.dbg?.fx?.tileStyle;
            if (this._wangPreviewLastStyle !== currentStyle) {
                this._wangPreviewLastStyle = currentStyle;
                this._buildWangTilePreview();
            }
            this._wangPreviewSelected = null;
            if (this._wangPreviewCells) {
                this._wangPreviewCells.forEach(c => {
                    c.style.borderColor = '#224433';
                    c.style.transform = 'scale(1)';
                    c.style.boxShadow = 'none';
                });
            }
        }
    }

    _setupWangDebugCamera() {
        const SPEED = 600;   // px/sec
        const ZOOM_STEP = 1.15;
        this._wangKeys = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            upArr: 'UP', downArr: 'DOWN', leftArr: 'LEFT', rightArr: 'RIGHT',
            zoomIn: 'CLOSED_BRACKET', zoomOut: 'OPEN_BRACKET',
        });
        // Override do update loop só pra esse modo (pula _updateBody normal)
        this._wangUpdate = (time, delta) => {
            const k = this._wangKeys;
            const cam = this.cameras.main;
            const dt = delta / 1000;
            let dx = 0, dy = 0;
            if (k.up.isDown    || k.upArr.isDown)    dy -= 1;
            if (k.down.isDown  || k.downArr.isDown)  dy += 1;
            if (k.left.isDown  || k.leftArr.isDown)  dx -= 1;
            if (k.right.isDown || k.rightArr.isDown) dx += 1;
            if (dx || dy) {
                const len = Math.hypot(dx, dy);
                cam.scrollX += (dx/len) * SPEED * dt / cam.zoom;
                cam.scrollY += (dy/len) * SPEED * dt / cam.zoom;
            }
        };
        // Zoom em key down (one-shot)
        this.input.keyboard.on('keydown-CLOSED_BRACKET', () => {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * ZOOM_STEP, 0.1, 3));
        });
        this.input.keyboard.on('keydown-OPEN_BRACKET', () => {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom / ZOOM_STEP, 0.1, 3));
        });
    }

    // Wang style grid — substitui dropdown por row de thumbnails 4x4 mini-composite
    // de cada tilestyle. Click = troca tileStyle + lazy-load se necessário +
    // re-render terrain (em WANG_DEBUG) + atualiza highlight no grid.
    _buildWangStyleGrid() {
        const grid = document.getElementById('wang-style-grid');
        const labelEl = document.getElementById('wang-style-label');
        if (!grid) return;
        grid.innerHTML = '';
        const STYLES = [
            { key: 'test',              short: 'Test'  },
            { key: 'dirt_grass_32',     short: 'D/G 32'},
            { key: 'ocean_sand_32',     short: 'O/S 32'},
            { key: 'mapa1_ocean_dirt',  short: 'M1 OD' },
            { key: 'mapa1_ocean_grass', short: 'M1 OG' },
            { key: 'mapa1_sand_dirt',   short: 'M1 SD' },
            { key: 'mapa1_sand_grass',  short: 'M1 SG' },
            { key: 'mapa2_ocean_dirt',  short: 'M2 OD' },
            { key: 'mapa2_ocean_grass', short: 'M2 OG' },
            { key: 'mapa2_sand_dirt',   short: 'M2 SD' },
            { key: 'mapa2_sand_grass',  short: 'M2 SG' },
        ];
        const current = this.dbg?.fx?.tileStyle || 'dirt_grass_32';
        if (labelEl) {
            const cur = STYLES.find(s => s.key === current);
            labelEl.textContent = cur ? `▸ ${cur.key}` : '—';
        }
        STYLES.forEach(({ key, short }) => {
            const cell = document.createElement('div');
            cell.dataset.style = key;
            cell.style.cssText = `
                position: relative; aspect-ratio: 1;
                background: #001a08;
                border: 2px solid ${key === current ? '#ffcc00' : '#224433'};
                border-radius: 4px;
                cursor: pointer;
                overflow: hidden;
                transition: border-color 0.15s, transform 0.1s;
                ${key === current ? 'transform: scale(1.05); box-shadow: 0 0 6px rgba(255,204,0,0.5);' : ''}
            `;
            const label = document.createElement('div');
            label.textContent = short;
            label.style.cssText = `
                position: absolute; bottom: 1px; left: 0; right: 0;
                font-size: 8px; text-align: center; color: #aaffcc;
                background: rgba(0,16,8,0.8); padding: 1px 0;
                font-family: 'Courier New', monospace; letter-spacing: 0.5px;
                pointer-events: none;
            `;
            cell.appendChild(label);
            // Renderiza thumbnail (composite 4x4 das tiles do style)
            this._renderStyleThumbnail(cell, key);
            // Hover effect (não substitui a borda do selecionado)
            cell.addEventListener('mouseenter', () => {
                if (key !== this.dbg?.fx?.tileStyle) cell.style.borderColor = '#88ddaa';
            });
            cell.addEventListener('mouseleave', () => {
                if (key !== this.dbg?.fx?.tileStyle) cell.style.borderColor = '#224433';
            });
            cell.addEventListener('click', () => this._selectWangStyle(key));
            grid.appendChild(cell);
        });
    }

    _renderStyleThumbnail(cell, style) {
        // Composite 4x4 com os 16 tiles do style. Para styles não-loaded
        // mostra placeholder "?" + dispara load on click.
        const firstKey = style === 'test' ? 'wang_15' : `wang_${style}_15`;
        const isLoaded = this.textures.exists(firstKey);
        if (!isLoaded) {
            cell.style.background = '#001a08 url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><text x=%2224%22 y=%2230%22 font-family=%22monospace%22 font-size=%2222%22 fill=%22%23446655%22 text-anchor=%22middle%22>?</text></svg>") center/contain no-repeat';
            return;
        }
        // Render composite via canvas
        const SIZE = 64;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;  // pixel art
        const cellPx = SIZE / 4;  // 4x4 grid
        for (let i = 0; i < 16; i++) {
            const f = String(i).padStart(2, '0');
            const k = style === 'test' ? `wang_${f}` : `wang_${style}_${f}`;
            const tex = this.textures.get(k);
            const src = tex?.getSourceImage?.();
            if (src && src.width) {
                const col = i % 4, row = Math.floor(i / 4);
                ctx.drawImage(src, col * cellPx, row * cellPx, cellPx, cellPx);
            }
        }
        cell.style.background = `url(${canvas.toDataURL()}) center/cover #001a08`;
        cell.style.imageRendering = 'pixelated';
    }

    _selectWangStyle(style) {
        if (!this.dbg?.fx) return;
        const prev = this.dbg.fx.tileStyle;
        if (prev === style) return;   // já selecionado
        this.dbg.fx.tileStyle = style;
        if (this._saveDebugCfg) this._saveDebugCfg();

        // Atualiza border + label imediatamente (UI feedback antes do load)
        const grid = document.getElementById('wang-style-grid');
        const labelEl = document.getElementById('wang-style-label');
        if (grid) {
            grid.querySelectorAll('[data-style]').forEach(c => {
                const isSel = c.dataset.style === style;
                c.style.borderColor = isSel ? '#ffcc00' : '#224433';
                c.style.transform = isSel ? 'scale(1.05)' : 'scale(1)';
                c.style.boxShadow = isSel ? '0 0 6px rgba(255,204,0,0.5)' : 'none';
            });
        }
        if (labelEl) labelEl.textContent = `▸ ${style}`;

        // Lazy-load + re-render
        if (this._ensureWangStyleLoaded) {
            this._ensureWangStyleLoaded(style, () => {
                // Re-render thumbnail dessa cell agora que carregou
                if (grid) {
                    const cell = grid.querySelector(`[data-style="${style}"]`);
                    if (cell) this._renderStyleThumbnail(cell, style);
                }
                if (this.WANG_DEBUG && this._scheduleWangLiveRender) {
                    this._scheduleWangLiveRender();
                }
            });
        }
    }

    // Debounced live re-render — chamado por sliders Wang em 15_debug_menu.js.
    // 80ms cobre drag rápido sem re-render N vezes. Cada nova chamada reseta
    // o timer (clearTimeout).
    _scheduleWangLiveRender() {
        if (!this.WANG_DEBUG) return;
        if (this._wangLiveRenderTimer) clearTimeout(this._wangLiveRenderTimer);
        this._wangLiveRenderTimer = setTimeout(() => {
            this._wangLiveRenderTimer = null;
            const b = this.cameras.main.getBounds();
            this._renderWangOnly(b.width, b.height);
        }, 80);
    }

    // ─────────────────────────────────────────────────────────────
    // Atlas frame aliasing — extrai static dirs (cow_S, ox_E etc) e legacy
    // keys (nave, farmer, cow_frente etc) do atlas em texturas individuais
    // via canvas. Permite código existente continuar usando setTexture('cow_S')
    // sem rewrite. Anim frames continuam in-atlas (acessadas via {key, frame}).
    _registerAtlasFrameTextures() {
        // Char static dirs (cow_S, ox_E, farmer_NW, ufo_SE etc)
        const ATLAS_STATIC_KEYS = [
            ['cow_atlas',    ['cow_S','cow_E','cow_N','cow_W','cow_SE','cow_NE','cow_NW','cow_SW']],
            ['ox_atlas',     ['ox_S','ox_E','ox_N','ox_W','ox_SE','ox_NE','ox_NW','ox_SW']],
            ['farmer_atlas', ['farmer_S','farmer_E','farmer_N','farmer_W','farmer_SE','farmer_NE','farmer_NW','farmer_SW']],
            ['ufo_atlas',    ['ufo_S','ufo_E','ufo_N','ufo_W','ufo_SE','ufo_NE','ufo_NW','ufo_SW']],
        ];
        ATLAS_STATIC_KEYS.forEach(([atlasKey, frameNames]) => {
            frameNames.forEach(fn => this._aliasAtlasFrame(atlasKey, fn, fn));
        });
        // Char legacy aliases pointing to south frame (compat com código antigo)
        this._aliasAtlasFrame('ufo_atlas',    'ufo_S',    'nave');
        this._aliasAtlasFrame('cow_atlas',    'cow_S',    'cow_frente');
        this._aliasAtlasFrame('cow_atlas',    'cow_S',    'cow_cima_sobe');
        this._aliasAtlasFrame('cow_atlas',    'cow_S',    'cow_cima_desce');
        this._aliasAtlasFrame('ox_atlas',     'ox_S',     'ox_frente');
        this._aliasAtlasFrame('ox_atlas',     'ox_S',     'ox_cima_sobe');
        this._aliasAtlasFrame('ox_atlas',     'ox_S',     'ox_cima_desce');
        this._aliasAtlasFrame('farmer_atlas', 'farmer_S', 'farmer');

        // HUD frames — só os 8 efetivamente usados em add.image() viram textura
        // alias. hud_comb_v2 + hud_grav_v2 não são mais referenciados em código
        // (audit 2026-05-08 — substituídos pelos hud_combined_empty/full bars).
        ['hud_score_v2','hud_burgers_v2','hud_cows_v2','hud_bulls_v2',
         'hud_farmers_v2','hud_shooters_v2',
         'hud_radar_dome_v2','hud_radar_ring_v2'
        ].forEach(fn => this._aliasAtlasFrame('hud_atlas', fn, fn));

        // Items — 3 burgers + legacy 'burger' alias (= burger_classic)
        ['burger_classic','burger_cheese','burger_double'].forEach(
            fn => this._aliasAtlasFrame('items_atlas', fn, fn));
        this._aliasAtlasFrame('items_atlas', 'burger_classic', 'burger');

        // Nature — 55 frames, alias automático lendo o atlas JSON
        const natureAtlas = this.textures.get('nature_atlas');
        if (natureAtlas && natureAtlas.frames) {
            Object.keys(natureAtlas.frames).forEach(fn => {
                if (fn === '__BASE') return;
                this._aliasAtlasFrame('nature_atlas', fn, fn);
            });
        }
    }

    _aliasAtlasFrame(atlasKey, frameName, aliasKey) {
        if (this.textures.exists(aliasKey)) return;
        const atlas = this.textures.get(atlasKey);
        if (!atlas || !atlas.has(frameName)) {
            console.warn('[ATLAS ALIAS] missing frame', atlasKey, frameName);
            return;
        }
        const frame = atlas.get(frameName);
        const canvas = document.createElement('canvas');
        canvas.width = frame.cutWidth;
        canvas.height = frame.cutHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            frame.source.image,
            frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
            0, 0, frame.cutWidth, frame.cutHeight
        );
        this.textures.addCanvas(aliasKey, canvas);
    }

    // ─────────────────────────────────────────────────────────────
    // Lazy loader pra Wang style trocado live no menu CONFIGS.
    // Chamado por 15_debug_menu quando user troca tileStyle no select.

    // Lazy loader pra Wang style trocado live no menu CONFIGS.
    // Chamado por 15_debug_menu quando user troca tileStyle no select.
    _ensureWangStyleLoaded(style, onReady) {
        if (!this._loadedWangStyles) this._loadedWangStyles = new Set();
        if (this._loadedWangStyles.has(style)) {
            onReady && onReady();
            return;
        }
        let queued = 0;
        for (let i = 0; i < 16; i++) {
            const f = String(i).padStart(2, '0');
            const key = `wang_${style}_${f}`;
            if (!this.textures.exists(key)) {
                this.load.image(key, `assets/terrain/${style}/wang_${f}.png`);
                queued++;
            }
        }
        this._loadedWangStyles.add(style);
        if (queued === 0) { onReady && onReady(); return; }
        this.load.once('complete', () => {
            console.log('[WANG LAZY]', style, 'loaded', queued, 'tiles');
            onReady && onReady();
        });
        this.load.start();
    }
}
