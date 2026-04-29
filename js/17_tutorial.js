// 17_tutorial.js — Tutorial guiado passo a passo
// Ativado when tutorialMode=true (botão TUTORIAL na splash).
// 8 etapas sequenciais with hint overlay + setas + condições de avanço.

const TUT_STEPS = [
    {
        key: 'MOVE',
        title: '① MOVER A NAVE',
        text: 'Use o mouse (clique e arraste) ou joystick para mover a nave pela tela.',
        note: 'Mova pelo menos 200 pixels para avançar.',
        highlight: ['nave'],
    },
    {
        key: 'BEAM_VISUAL',
        title: '② BEAM (visual only)',
        text: 'Hold the button to activate the gravity beam visually. Right now it does NOT pull anything yet — just feel the activation.',
        note: 'Activate the beam at least once to advance.',
        highlight: ['nave'],
    },
    {
        key: 'GRAVITON_BAR',
        title: '③ GRAVITON BAR',
        text: 'The blue bar at the bottom is your GRAVITON energy. Holding the beam drains it (2x speed in this tutorial). Releasing recharges it.\n\nRun it below 50% then let it recharge fully.',
        note: 'Drain below 50% then release to recharge to 100%.',
        highlight: ['graviton'],
    },
    {
        key: 'ABDUCT',
        title: '④ ABDUCT A COW',
        text: 'Beam now works for real! Position the ship over a cow and activate the beam to lift it up.',
        note: 'Abduct at least 1 cow to advance.',
        highlight: ['vacas'],
    },
    {
        key: 'DELIVER',
        title: '⑤ LEVAR AO CURRAL',
        text: 'Com a vaca no feixe, leve-a até o curral. A seta verde indica o caminho.',
        note: 'Entregue a vaca no curral para avançar.',
        highlight: ['curral'],
    },
    {
        key: 'BURGER',
        title: '⑥ COLLECT THE BURGER',
        text: 'Wait for the cow to become a burger (3 seconds), then activate the beam near it to absorb it.\n\nLook at the YELLOW bar — your FUEL is critically low (15%). Each burger restores fuel.',
        note: 'Collect a burger to refill your fuel.',
        highlight: ['burger_pronto', 'combustivel'],
    },
    {
        key: 'TAKE_DAMAGE',
        title: '⑧ TOMAR DANO',
        text: 'A farmer appeared and will shoot at you! Your ship is FROZEN until you take a hit — so you see fuel decrease in practice.',
        note: 'Wait for a hit to be released.',
        highlight: ['fazendeiro', 'combustivel'],
    },
    {
        key: 'FARMER',
        title: '⑨ FAZENDEIROS',
        text: 'Fazendeiros são inimigos que patrulham o mapa.\n\nUse o FEIXE GRAVITON sobre eles igual abduz uma vaca — o feixe os arrasta junto.',
        note: 'Capture um fazendeiro com o feixe para avançar.',
        highlight: ['fazendeiro'],
    },
    {
        key: 'FARMER_KILL',
        title: '⑩ ARREMESSAR NAS ROCHAS',
        text: 'Com o fazendeiro preso ao feixe, voe em direção a uma PEDRA mantendo o feixe ativo.\n\nA colisão em alta speed elimina o fazendeiro!',
        note: 'Mate um fazendeiro batendo em uma pedra para concluir.',
        highlight: ['fazendeiro', 'rocha'],
    },
];

Object.assign(Jogo.prototype, {

    _setupTutorial() {
        this.tutorialMode = true;
        this._tutStepIdx   = 0;
        this._tutStartPos  = { x: this.ship.x, y: this.ship.y };
        this._tutStepShownAt = this.time?.now ?? 0;
        this._tutMinReadMs   = 5000;  // time mínimo de leitura by etapa
        this._tutHadAbductees = false;
        this._tutDelivered = false;
        this._tutScoreAntes = this.score || 0;
        this._tutFarmerAbducted = false;
        this._tutFarmerKilled   = false;
        this._tutGfx  = this.add.graphics().setScrollFactor(0).setDepth(510);
        this._tutAngle = 0;
        this._tutBox   = null;
        this._tutBarsGravitonWatched = false;

        // Clears entidades inimigas — modo tutorial começa limpo
        (this.farmers || []).slice().forEach(f => {
            if (f && f.scene) { f._destroyed = true; f.destroy(); }
        });
        this.farmers = [];
        (this.shooters || []).slice().forEach(t => { if (t && t.scene) t.destroy(); });
        this.shooters = [];

        // Removes cows existentes — only spawns na etapa ABDUCT (with 50 globais)
        (this.cows || []).slice().forEach(v => {
            if (v && v.scene && !v.isBurger) { v._destroyed = true; v.destroy(); }
        });
        this.cows = [];

        const cx = this.ship.x, cy = this.ship.y;
        // Ensures 1 corral near
        if (!this.corrals || this.corrals.length === 0) {
            this._buildCorral(cx + 480, cy + 300);
        }

        // Estado inicial: barras escondidas, beam visual only desligado, drains normal
        this._tutCombustivelCongelado = true;
        this._tutBeamVisualOnly = false;          // only liga em BEAM_VISUAL
        this._tutGravitonDrain2x  = false;
        this._tutVacasImortais    = false;
        this._setBarsVisibility(false, false);  // ambas escondidas

        this._tutShowStep(0);
    },

    // Spawn de 50 cows espalhadas uniformemente pelo map global (8000x6000)
    _tutSpawnVacasGlobal(n) {
        const W = 8000, H = 6000;
        const PAD = 300;
        // Grid pseudo-uniforme: divide map em cells e spawns 1 by cell + jitter
        const cols = Math.ceil(Math.sqrt(n * (W/H)));
        const rows = Math.ceil(n / cols);
        const cw = (W - PAD*2) / cols;
        const rh = (H - PAD*2) / rows;
        let placed = 0;
        for (let r = 0; r < rows && placed < n; r++) {
            for (let c = 0; c < cols && placed < n; c++) {
                const cx = PAD + cw * c + cw/2;
                const cy = PAD + rh * r + rh/2;
                const jx = (Math.random() - 0.5) * cw * 0.6;
                const jy = (Math.random() - 0.5) * rh * 0.6;
                const tipo = Math.random() < 0.20 ? 'boi' : 'holstein';
                this._createCow(cx + jx, cy + jy, tipo);
                placed++;
            }
        }
    },

    _updateTutorial(time, delta) {
        if (!this.tutorialMode || this._tutStepIdx === null) return;

        const step = TUT_STEPS[this._tutStepIdx];
        if (!step) return;

        this._tutGfx.clear();
        this._tutAngle = (this._tutAngle || 0) + 0.04;

        // Glow amarelo nos elementos relevantes da etapa atual
        if (step.highlight) this._tutDrawHighlights(step.highlight);

        // Time mínimo de leitura — não avança before do usuário ler
        const elapsed = (this.time?.now ?? 0) - (this._tutStepShownAt || 0);
        const canAdvance = elapsed >= (this._tutMinReadMs || 5000);

        const nave = this.ship;

        switch (step.key) {

            case 'MOVE': {
                const dx = nave.x - this._tutStartPos.x;
                const dy = nave.y - this._tutStartPos.y;
                if (canAdvance && Math.sqrt(dx*dx + dy*dy) > 200) this._tutAdvance();
                break;
            }

            case 'BEAM_VISUAL': {
                // Cone aparece, without pull e without drain (flag em scene update)
                const beamOn = (this.dbg?.behavior?.inputMode === 'wasd' || this.isMobile)
                    ? !!this._beamHeld
                    : this.input.activePointer.isDown;
                if (canAdvance && beamOn) this._tutAdvance();
                break;
            }

            case 'GRAVITON_BAR': {
                const beamG = (this.dbg?.behavior?.inputMode === 'wasd' || this.isMobile)
                    ? !!this._beamHeld
                    : this.input.activePointer.isDown;
                if (this.energiaLed <= this.energiaMax * 0.5) this._tutGravitonDrained = true;
                if (canAdvance &&
                    this._tutGravitonDrained &&
                    !beamG &&
                    this.energiaLed >= this.energiaMax * 0.99) {
                    this._tutAdvance();
                }
                break;
            }

            case 'ABDUCT': {
                // Spawn 50 cows globais uma vez ao entrar na etapa
                if (!this._tutVacasGlobalSpawned) {
                    this._tutSpawnVacasGlobal(50);
                    this._tutVacasGlobalSpawned = true;
                }
                if (this.abductedCows.length > 0) {
                    this._tutHadAbductees = true;
                }
                if (canAdvance && this._tutHadAbductees) this._tutAdvance();
                break;
            }

            case 'DELIVER': {
                // Mantém cows disponíveis caso player perca a abduzida
                if (this._tutVacasVivas() + this.abductedCows.length < 2) this._tutSpawnVacas(3);
                if (this.corrals?.length > 0) {
                    const c = this.corrals[0];
                    this._tutDrawArrow(c.x, c.y);
                }
                // Estrutura nova: slots has state 'loading' ou 'ready'
                const dropped = (this.corrals || []).some(c =>
                    (c.slots && c.slots.some(s => s && (s.state === 'loading' || s.state === 'ready')))
                );
                if (canAdvance && dropped) {
                    this._tutDelivered = true;
                    this._tutAdvance();
                }
                break;
            }

            case 'BURGER': {
                // Avança when score sobe (coleta do corral incrementa score)
                if (canAdvance && (this.score || 0) > (this._tutScoreBurgerAntes || 0)) {
                    this._tutAdvance();
                }
                break;
            }

            case 'TAKE_DAMAGE': {
                // Trava ship + spawns 1 farmer perto que atira
                this._tutFreezeNave = true;
                if (!this._tutAtiradorSpawned) {
                    this._tutSpawnFazendeiroAtirando();
                    this._tutAtiradorSpawned = true;
                    this._tutCombustivelAntes = this.fuelCurrent;
                    this._tutCombustivelCongelado = true;
                }
                if (this.fuelCurrent < (this._tutCombustivelAntes - 0.5)) {
                    this._tutFreezeNave = false;
                    if (canAdvance) this._tutAdvance();
                }
                break;
            }

            case 'GRAVITON_BAR': {
                // Player precisa: 1) usar o beam ate cair < 50%; 2) soltar e ver recarregar 100%
                const beamG = this.isMobile ? !!this._beamHeld : this.input.activePointer.isDown;
                if (this.energiaLed <= this.energiaMax * 0.5) this._tutGravitonDrained = true;
                if (canAdvance &&
                    this._tutGravitonDrained &&
                    !beamG &&
                    this.energiaLed >= this.energiaMax * 0.99) {
                    this._tutAdvance();
                }
                break;
            }

            case 'COMBUSTIVEL_BAR': {
                // Apenas shows a barra with glow — avança após canAdvance (5s mínimo)
                if (canAdvance) this._tutAdvance();
                break;
            }

            case 'FARMER': {
                if (!this.farmers || this.farmers.length === 0) {
                    this._tutSpawnFazendeiro();
                }
                // Seta apontando pro farmer vivo more near
                const target = this.farmers.find(f => f.scene && !f._dying && !f._destroyed);
                if (target) this._tutDrawArrow(target.x, target.y);
                const inBeam = this.abductedCows.some(e => e.isEnemy);
                if (inBeam) {
                    this._tutFarmerAbducted = true;
                    if (canAdvance) this._tutAdvance();
                }
                break;
            }

            case 'FARMER_KILL': {
                // Seta to rock more near do farmer abduzido
                const farmer = this.abductedCows.find(e => e.isEnemy);
                if (farmer) {
                    const rocha = this._tutAcharRochaPerto(farmer.x, farmer.y);
                    if (rocha) this._tutDrawArrow(rocha.x, rocha.y);
                }
                const allDead = !this.farmers || this.farmers.every(f => !f.scene || f._dying || f._destroyed);
                if (canAdvance && this._tutFarmerAbducted && allDead && this.farmers.length > 0) {
                    this._tutAdvance();
                } else if (this._tutFarmerAbducted && (!this.farmers || this.farmers.length === 0)) {
                    this._tutSpawnFazendeiro();
                }
                break;
            }
        }
    },

    _tutSpawnFazendeiro() {
        if (!this._createFarmer) return;
        const cx = this.ship.x, cy = this.ship.y;
        this._createFarmer(cx + 350, cy - 150);
    },

    // Spawns N cows em circulo ao redor da ship (raios variados)
    _tutSpawnVacas(n) {
        const cx = this.ship.x, cy = this.ship.y;
        for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2 + Math.random() * 0.4;
            const r   = 200 + Math.random() * 220;
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            this._createCow(x, y, 'holstein');
        }
    },

    // Conta cows "úteis" (vivas, outside do corral, não inimigas, não burger)
    _tutVacasVivas() {
        return (this.cows || []).filter(v =>
            v && v.scene && !v._dying && !v._destroyed &&
            !v.isBurger && !v.isEnemy && !v._inCurral
        ).length;
    },

    // Farmer near da ship que atira (TAKE_DAMAGE step)
    _tutSpawnFazendeiroAtirando() {
        if (!this._createFarmer) return;
        const cx = this.ship.x + 280, cy = this.ship.y - 60;
        this._createFarmer(cx, cy);
        // Pega ref do farmer recém-criado e força cooldown curto to atacar logo
        const f = this.farmers[this.farmers.length - 1];
        if (f) {
            f._cooldown = 400;  // dispara em ~400ms
            this._tutFarmerRef = f;
        }
    },

    // Glow amarelo pulsante ao redor de coords (world ou screen)
    _tutGlowAt(x, y, radius, opts = {}) {
        const { color = 0xffcc33, screen = false } = opts;
        const g = screen ? this._tutGfx : (this._tutGlowWorld || (this._tutGlowWorld = this.add.graphics().setDepth(7)));
        if (!screen) g.clear === undefined ? null : null;  // world is limpo no início
        const pulse = 0.6 + 0.4 * Math.sin(this._tutAngle * 2.5);
        // 3 anéis with alpha decrescente to simular blur/glow
        for (let i = 0; i < 3; i++) {
            const r = radius * (1 + i * 0.35) * pulse;
            const a = 0.55 / (i + 1);
            g.lineStyle(3 - i, color, a);
            g.strokeCircle(x, y, r);
        }
    },

    _tutDrawHighlights(targets) {
        // Inicializa/limpa graphics de glow no world (não-scrollFactor)
        if (!this._tutGlowWorld) {
            this._tutGlowWorld = this.add.graphics().setDepth(7);
        }
        this._tutGlowWorld.clear();

        for (const t of targets) {
            switch (t) {
                case 'nave': {
                    if (this.ship) this._tutGlowAt(this.ship.x, this.ship.y, 38);
                    break;
                }
                case 'graviton': {
                    const eb = this._eneBar;
                    if (eb) this._tutGlowAtScreenRect(eb.x, eb.y, eb.w, eb.h);
                    break;
                }
                case 'combustivel': {
                    const cb = this._combBar;
                    if (cb) this._tutGlowAtScreenRect(cb.x, cb.y, cb.w, cb.h);
                    break;
                }
                case 'vacas': {
                    (this.cows || []).forEach(v => {
                        if (v && v.scene && !v.isBurger && !v.isEnemy && !v._dying) {
                            this._tutGlowAt(v.x, v.y, 26);
                        }
                    });
                    break;
                }
                case 'curral': {
                    (this.corrals || []).forEach(c => this._tutGlowAt(c.x, c.y, 110));
                    break;
                }
                case 'fazendeiro': {
                    (this.farmers || []).forEach(f => {
                        if (f && f.scene && !f._dying && !f._destroyed) {
                            this._tutGlowAt(f.x, f.y, 28);
                        }
                    });
                    break;
                }
                case 'atirador': {
                    (this.shooters || []).forEach(a => {
                        if (a && a.sprite && a.sprite.scene) {
                            this._tutGlowAt(a.x, a.y, 32);
                        }
                    });
                    break;
                }
                case 'rocha': {
                    const farmer = (this.abductedCows || []).find(e => e.isEnemy);
                    if (farmer) {
                        const r = this._tutAcharRochaPerto(farmer.x, farmer.y);
                        if (r) this._tutGlowAt(r.x, r.y, 36);
                    }
                    break;
                }
                case 'burger_pronto': {
                    // Glow em todo slot ready de qualquer corral
                    (this.corrals || []).forEach(c => {
                        (c.slots || []).forEach(s => {
                            if (s && s.state === 'ready' && s.icon && s.icon.scene) {
                                this._tutGlowAt(s.icon.x, s.icon.y, 22);
                            }
                        });
                    });
                    break;
                }
            }
        }
    },

    // Glow retangular to elementos do HUD (em screen, scrollFactor 0)
    _tutGlowAtScreenRect(x, y, w, h) {
        const g = this._tutGfx;
        const pulse = 0.6 + 0.4 * Math.sin(this._tutAngle * 2.5);
        for (let i = 0; i < 3; i++) {
            const pad = 4 + i * 5;
            const a = 0.55 / (i + 1) * pulse;
            g.lineStyle(3 - i, 0xffcc33, a);
            g.strokeRoundedRect(x - pad, y - pad, w + pad*2, h + pad*2, 6);
        }
    },

    // Procura no matter.world all os corpos with label='rock' e retorna o more perto
    _tutAcharRochaPerto(x, y) {
        const bodies = this.matter?.world?.localWorld?.bodies || [];
        let best = null, bestD = Infinity;
        for (const b of bodies) {
            if (b.label !== 'rocha') continue;
            const dx = b.position.x - x, dy = b.position.y - y;
            const d2 = dx*dx + dy*dy;
            if (d2 < bestD) { bestD = d2; best = b.position; }
        }
        return best;
    },

    _tutAdvance() {
        const nextIdx = this._tutStepIdx + 1;
        if (nextIdx >= TUT_STEPS.length) {
            this._tutConcluir();
            return;
        }
        const nextKey = TUT_STEPS[nextIdx].key;

        // Reset de flags by etapa (separadas: NoDrain != NoPull)
        // BEAM_VISUAL: cone aparece, SEM pull, SEM drain
        if (nextKey === 'BEAM_VISUAL') {
            this._tutBeamNoDrain = true;
            this._tutBeamNoPull  = true;
            this._tutGravitonDrain2x = false;
        }
        // GRAVITON_BAR: barra aparece, drain ATIVO (2x), pull AINDA OFF
        if (nextKey === 'GRAVITON_BAR') {
            this._tutBeamNoDrain = false;          // drain liga pro player ver consumo
            this._tutBeamNoPull  = true;           // still without abduzir
            this._tutGravitonDrain2x = true;       // 2x didático
            this._setBarsVisibility(false, true);
            this._tutGravitonDrained = false;
        }
        // ABDUCT: pull liga, drain volta normal, cows imortais, spawns 50 globais
        if (nextKey === 'ABDUCT') {
            this._tutBeamNoDrain = false;
            this._tutBeamNoPull  = false;
            this._tutGravitonDrain2x = false;
            this._tutVacasImortais = true;
            this._tutVacasGlobalSpawned = false;
        }
        // BURGER: fuel starts em 15%, barra fuel aparece
        if (nextKey === 'BURGER') {
            this.fuelCurrent = this.fuelMax * 0.15;
            this._setBarsVisibility(true, true);
            this._tutScoreBurgerAntes = this.score || 0;
        }
        if (nextKey === 'TAKE_DAMAGE') {
            this._tutAtiradorSpawned = false;
            this._tutVacasImortais = false;  // dano normal volta
        }
        this._tutStepIdx = nextIdx;
        this._tutShowStep(nextIdx);
    },

    _tutShowStep(idx) {
        // Destrói hint anterior
        if (this._tutBox) {
            this._tutBox.forEach(o => { if (o && o.scene) o.destroy(); });
        }

        const step = TUT_STEPS[idx];
        if (!step) return;

        // Reset do timer de leitura mínima (5s to each nova etapa)
        this._tutStepShownAt = this.time?.now ?? 0;

        const w = this.scale.width, h = this.scale.height;
        const BOX_W  = Math.min(480, w - 40);
        const isLong = step.text.includes('\n');
        const BOX_H  = isLong ? 148 : 96;
        const bx = w / 2;
        // Subido to ficar above das barras de combustivel/graviton (que ocupam ~80px no rodapé)
        const by = h - BOX_H / 2 - 110;

        const bg = this.add.rectangle(bx, by, BOX_W, BOX_H, 0x000a04, 0.92)
            .setScrollFactor(0).setDepth(508);
        const border = this.add.rectangle(bx, by, BOX_W, BOX_H, 0, 0)
            .setStrokeStyle(2, 0x00ff55, 0.85)
            .setScrollFactor(0).setDepth(509);

        // Barra de progresso (points)
        const totalSteps = TUT_STEPS.length;
        const dots = TUT_STEPS.map((_, i) => (i <= idx ? '●' : '○')).join(' ');
        const progress = this.add.text(bx, by - BOX_H / 2 + 10, dots, {
            fontSize: '10px', fill: '#446655', letterSpacing: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(510);

        const title = this.add.text(bx, by - BOX_H / 2 + 22, step.title, {
            fontSize: '12px', fill: '#00ff55', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(510);

        const body = this.add.text(bx, by - BOX_H / 2 + 40, step.text, {
            fontSize: '11px', fill: '#cceecc', wordWrap: { width: BOX_W - 28 }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(510);

        const note = this.add.text(bx, by + BOX_H / 2 - 14, '▸ ' + step.note, {
            fontSize: '10px', fill: '#558866', fontStyle: 'italic'
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(510);

        this._tutBox = [bg, border, progress, title, body, note];
    },

    _tutDrawArrow(worldX, worldY) {
        const cam = this.cameras.main;
        const sx = (worldX - cam.scrollX) * cam.zoom;
        const sy = (worldY - cam.scrollY) * cam.zoom;
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const ang = Math.atan2(sy - cy, sx - cx);
        const radius = Math.min(cx, cy) - 70;
        const ax = cx + Math.cos(ang) * radius;
        const ay = cy + Math.sin(ang) * radius;

        const pulse = 1 + 0.18 * Math.sin(this._tutAngle * 3);
        const g = this._tutGfx;

        // Triângulo direcional
        g.fillStyle(0x00ff55, 0.92);
        g.fillTriangle(
            ax + Math.cos(ang) * 20 * pulse,  ay + Math.sin(ang) * 20 * pulse,
            ax + Math.cos(ang + 2.3) * 13,    ay + Math.sin(ang + 2.3) * 13,
            ax + Math.cos(ang - 2.3) * 13,    ay + Math.sin(ang - 2.3) * 13
        );
        // Halo pulsante
        g.lineStyle(1.5, 0x00ff55, 0.35 * pulse);
        g.strokeCircle(ax, ay, 16 * pulse);
    },

    _tutConcluir() {
        this._tutStepIdx = null;
        if (this._tutBox) {
            this._tutBox.forEach(o => { if (o && o.scene) o.destroy(); });
            this._tutBox = null;
        }
        this._tutGfx?.clear();
        this._tutGlowWorld?.clear();
        this._tutFreezeNave = false;
        this._tutBeamNoDrain = false;
        this._tutBeamNoPull  = false;
        this._tutGravitonDrain2x = false;
        this._tutVacasImortais = false;
        this._tutCombustivelCongelado = false;
        // Resets visibilidade das barras (game normal always shows)
        if (this._setBarsVisibility) this._setBarsVisibility(true, true);

        const w = this.scale.width, h = this.scale.height;

        const bg = this.add.rectangle(w/2, h/2 - 10, 400, 110, 0x000a04, 0.94)
            .setScrollFactor(0).setDepth(508).setStrokeStyle(2, 0x00ff55, 1);
        const txt = this.add.text(w/2, h/2 - 26, '✓ TUTORIAL CONCLUÍDO!', {
            fontSize: '20px', fill: '#00ff55', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(510);
        const sub = this.add.text(w/2, h/2 + 8, 'Agora você está pronto para jogar.', {
            fontSize: '12px', fill: '#aaffcc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(510);

        const btn = this.add.rectangle(w/2, h/2 + 38, 200, 36, 0x00dd44)
            .setScrollFactor(0).setDepth(509).setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(w/2, h/2 + 38, 'JOGAR AGORA', {
            fontSize: '13px', fill: '#001a08', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(510);
        btn.on('pointerover', () => btn.setFillStyle(0x44ff88));
        btn.on('pointerout',  () => btn.setFillStyle(0x00dd44));
        btn.on('pointerdown', () => {
            this.tutorialMode = false;
            this._tutCombustivelCongelado = false;
            [bg, txt, sub, btn, btnTxt].forEach(o => o.destroy());
            // Spawns enemies normais now
            if (this._createFarmer) {
                for (let i = 0; i < 3; i++) {
                    const x = Phaser.Math.Between(500, 7500);
                    const y = Phaser.Math.Between(500, 5500);
                    this._createFarmer(x, y);
                }
            }
        });
    },

});
