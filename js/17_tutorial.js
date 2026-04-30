// 17_tutorial.js — Tutorial guiado passo a passo
// Ativado when tutorialMode=true (botão TUTORIAL na splash).
// 8 etapas sequenciais with hint overlay + setas + condições de avanço.

const TUT_STEPS = [
    {
        key: 'MOVE',
        shortLabel: 'MOVER',
        title: '01. MOVER A NAVE',
        text: 'Use o mouse (clique e arraste) ou joystick para mover a nave pela tela.',
        note: 'Mova pelo menos 200 pixels.',
        highlight: ['nave'],
    },
    {
        key: 'BEAM_VISUAL',
        shortLabel: 'FEIXE (visual)',
        title: '02. ATIVAR O FEIXE',
        text: 'Segure o botão pra ativar o feixe gravitacional. Por enquanto ele NÃO puxa nada — só sente a ativação.',
        note: 'Ative o feixe ao menos uma vez.',
        highlight: ['nave'],
    },
    {
        key: 'GRAVITON_BAR',
        shortLabel: 'GRAVITON',
        title: '03. ENERGIA GRAVITON',
        text: 'A barra azul no rodapé é o GRAVITON. Segurar o feixe drena (2x neste tutorial). Soltar recarrega.',
        note: 'Drene <50%, solte e espere 100%.',
        highlight: ['graviton'],
    },
    {
        key: 'ABDUCT',
        shortLabel: 'ABDUZIR VACA',
        title: '04. ABDUZIR UMA VACA',
        text: 'O feixe agora puxa de verdade! Posicione a nave sobre uma vaca e ative o feixe.',
        note: 'Abduza pelo menos 1 vaca.',
        highlight: ['cows'],
    },
    {
        key: 'DELIVER',
        shortLabel: 'ENTREGAR',
        title: '05. LEVAR AO CURRAL',
        text: 'Com a vaca no feixe, leve até o curral. A seta verde indica o caminho.',
        note: 'Entregue a vaca no curral.',
        highlight: ['curral'],
    },
    {
        key: 'BURGER',
        shortLabel: 'COLETAR BURGER',
        title: '06. COLETAR O HAMBÚRGUER',
        text: 'Aguarde a vaca virar burger (3s), depois ative o feixe perto dele pra absorver. Sua barra de COMBUSTÍVEL está em 15% — cada burger reabastece.',
        note: 'Colete um burger pra reabastecer.',
        highlight: ['burger_pronto', 'combustivel'],
    },
    {
        key: 'TAKE_DAMAGE',
        shortLabel: 'TOMAR DANO',
        title: '07. TOMAR DANO',
        text: 'Um fazendeiro apareceu e vai atirar! Sua nave está CONGELADA até tomar um hit — pra você ver o combustível cair em ação.',
        note: 'Aguarde levar um tiro.',
        highlight: ['farmer', 'combustivel'],
    },
    {
        key: 'FARMER',
        shortLabel: 'CAPTURAR FAZENDEIRO',
        title: '08. CAPTURAR FAZENDEIROS',
        text: 'Fazendeiros patrulham o mapa. Use o FEIXE GRAVITON sobre eles igual numa vaca — o feixe os arrasta.',
        note: 'Capture um fazendeiro no feixe.',
        highlight: ['farmer'],
    },
    {
        key: 'FARMER_KILL',
        shortLabel: 'ARREMESSAR NA PEDRA',
        title: '09. ARREMESSAR NAS ROCHAS',
        text: 'Com o fazendeiro preso, voe em alta velocidade em direção a uma PEDRA mantendo o feixe ativo. O impacto elimina o fazendeiro!',
        note: 'Mate um fazendeiro batendo numa pedra.',
        highlight: ['farmer', 'rock'],
    },
];

Object.assign(Jogo.prototype, {

    _setupTutorial() {
        this.tutorialMode = true;
        this._tutStepIdx   = 0;
        this._tutStartPos  = { x: this.ufo.x, y: this.ufo.y };
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

        const cx = this.ufo.x, cy = this.ufo.y;
        // Ensures 1 corral near
        if (!this.corrals || this.corrals.length === 0) {
            this._buildCorral(cx + 480, cy + 300);
        }

        // Estado initial: barras escondidas, beam visual only desligado, drains normal
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
                const tipo = Math.random() < 0.20 ? 'ox' : 'holstein';
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

        // Pulse no ◉ da etapa atual no quest log
        this._tutPulseQuestIcon();

        // Time mínimo de leitura — não avança before do usuário ler
        const elapsed = (this.time?.now ?? 0) - (this._tutStepShownAt || 0);
        const canAdvance = elapsed >= (this._tutMinReadMs || 5000);

        const nave = this.ufo;

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
                // Trava ship + spawn 1 farmer atirando then (cooldown 400ms)
                this._tutFreezeNave = true;
                if (!this._tutAtiradorSpawned) {
                    this._tutSpawnFazendeiroAtirando();
                    this._tutAtiradorSpawned = true;
                    this._tutCombustivelAntes = this.fuelCurrent;
                    this._tutCombustivelCongelado = true;
                }
                // Hit detectado -> descongela ufo + mensagem de sucesso + auto-avanca em 1.5s
                if (this.fuelCurrent < (this._tutCombustivelAntes - 0.5) && !this._tutDamageTaken) {
                    this._tutDamageTaken = true;
                    this._tutFreezeNave = false;
                    this._tutShowSuccess('TIRO RECEBIDO');
                    this.time.delayedCall(1500, () => {
                        if (this._tutStepIdx !== null && TUT_STEPS[this._tutStepIdx]?.key === 'TAKE_DAMAGE') {
                            this._tutAdvance();
                        }
                    });
                }
                break;
            }

            case 'FARMER': {
                if (!this.farmers || this.farmers.length === 0) {
                    this._tutSpawnFazendeiro();
                }
                // Seta apontando pro farmer vivo mais perto
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
                // Seta to rocha mais perto do farmer abduzido
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

    // Toast verde rapido no centro da screen ("✓ TIRO RECEBIDO" etc) — feedback
    // de objetivo cumprido before do _tutAdvance disparar
    _tutShowSuccess(text) {
        const w = this.scale.width, h = this.scale.height;
        const bg = this.add.rectangle(w/2, h/2, 280, 50, 0x002211, 0.92)
            .setScrollFactor(0).setDepth(515).setStrokeStyle(2, 0x00ff55, 1);
        const txt = this.add.text(w/2, h/2, '✓ ' + text, {
            fontSize: '16px', fill: '#aaffcc', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(516);
        this.tweens.add({
            targets: [bg, txt], alpha: { from: 1, to: 0 },
            duration: 1300, delay: 800,
            onComplete: () => { bg.destroy(); txt.destroy(); }
        });
    },

    _tutSpawnFazendeiro() {
        if (!this._createFarmer) return;
        const cx = this.ufo.x, cy = this.ufo.y;
        this._createFarmer(cx + 350, cy - 150);
    },

    // Spawns N cows em circulo ao redor da ship (raios variados)
    _tutSpawnVacas(n) {
        const cx = this.ufo.x, cy = this.ufo.y;
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
        const cx = this.ufo.x + 280, cy = this.ufo.y - 60;
        this._createFarmer(cx, cy);
        // Pega ref do farmer recém-criado e force cooldown curto to atacar then
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
                    if (this.ufo) this._tutGlowAt(this.ufo.x, this.ufo.y, 38);
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
                case 'cows': {
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
                case 'farmer': {
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
                case 'rock': {
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
            if (b.label !== 'rock') continue;
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
        // BURGER: fuel starts em 15%, barra fuel aparece, fuel DESCONGELA
        // (player needs ver drain to entender que needs coletar burger)
        if (nextKey === 'BURGER') {
            this.fuelCurrent = this.fuelMax * 0.15;
            this._setBarsVisibility(true, true);
            this._tutCombustivelCongelado = false;
            this._tutScoreBurgerAntes = this.score || 0;
        }
        if (nextKey === 'TAKE_DAMAGE') {
            this._tutAtiradorSpawned = false;
            this._tutVacasImortais = false;     // dano normal volta
            this._tutDamageTaken    = false;    // reset toast trigger
            this._tutCombustivelCongelado = true;  // congela durante freeze to hit ser unico decremento visivel
        }
        this._tutStepIdx = nextIdx;
        this._tutShowStep(nextIdx);
    },

    // Quest log no canto superior direito — estetica de radar/console (verde
    // fosforico, monospace, brackets). Lista todas as etapas; current expandida
    // com texto + note; concluidas ●; pendentes ○; current ◉ pulsante.
    _tutShowStep(idx) {
        // Destroi quest log anterior
        if (this._tutBox) {
            this._tutBox.forEach(o => { if (o && o.scene) o.destroy(); });
        }
        const step = TUT_STEPS[idx];
        if (!step) return;

        // Reset do timer de leitura minima (5s to each nova etapa)
        this._tutStepShownAt = this.time?.now ?? 0;

        const w = this.scale.width;
        const BOX_W  = 280;
        const PAD_X  = 16;
        const PAD_Y  = 60;  // 60px do topo (above do score)
        const bx = w - BOX_W - 16;  // alinha right edge

        // Calcula altura dinamica: header + N etapas + bloco expandido current
        const LINE_H = 14;
        const HEADER_H = 22;
        const EXPANDED_LINES = Math.ceil(step.text.length / 36) + 2;  // text + note
        const totalH = HEADER_H + (TUT_STEPS.length * LINE_H) + (EXPANDED_LINES * 12) + 18;
        const by = PAD_Y;

        const FONT = '"Courier New", monospace';

        // Background semi-transparente verde-escuro
        const bg = this.add.rectangle(bx, by, BOX_W, totalH, 0x001a08, 0.85)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(508);
        // Border verde fosforico
        const border = this.add.rectangle(bx, by, BOX_W, totalH, 0, 0)
            .setOrigin(0, 0).setStrokeStyle(1.5, 0x00ff55, 0.9)
            .setScrollFactor(0).setDepth(509);
        // Header com brackets
        const header = this.add.text(bx + PAD_X, by + 6, '[ MISSION LOG ]', {
            fontSize: '11px', fill: '#66ff99', fontStyle: 'bold',
            fontFamily: FONT, letterSpacing: 2
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(510);
        // Linha divisoria
        const sep = this.add.rectangle(bx + 8, by + HEADER_H, BOX_W - 16, 1, 0x00ff55, 0.4)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(510);

        const items = [bg, border, header, sep];

        // Lista de etapas
        let cursorY = by + HEADER_H + 6;
        for (let i = 0; i < TUT_STEPS.length; i++) {
            const s = TUT_STEPS[i];
            const isCurrent = i === idx;
            const isDone    = i < idx;
            const icon = isDone ? '●' : (isCurrent ? '◉' : '○');
            const color = isDone ? '#446655' : (isCurrent ? '#aaffcc' : '#447766');
            const num   = String(i + 1).padStart(2, '0');
            const label = `${icon} ${num}. ${s.shortLabel}`;
            const t = this.add.text(bx + PAD_X, cursorY, label, {
                fontSize: '11px', fill: color,
                fontStyle: isCurrent ? 'bold' : 'normal',
                fontFamily: FONT
            }).setOrigin(0, 0).setScrollFactor(0).setDepth(510);
            items.push(t);
            cursorY += LINE_H;

            // Etapa atual: expande com texto + note
            if (isCurrent) {
                const tBody = this.add.text(bx + PAD_X + 14, cursorY + 2, step.text, {
                    fontSize: '10px', fill: '#88ddaa',
                    fontFamily: FONT,
                    wordWrap: { width: BOX_W - PAD_X*2 - 14 }
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(510);
                items.push(tBody);
                cursorY += tBody.height + 4;

                const tNote = this.add.text(bx + PAD_X + 14, cursorY, '▸ ' + step.note, {
                    fontSize: '10px', fill: '#66aa88', fontStyle: 'italic',
                    fontFamily: FONT,
                    wordWrap: { width: BOX_W - PAD_X*2 - 14 }
                }).setOrigin(0, 0).setScrollFactor(0).setDepth(510);
                items.push(tNote);
                cursorY += tNote.height + 8;
                // Guarda ref to pulse anim do icon current
                this._tutCurrentIconText = t;
            }
        }

        // Recalcula altura real do bg/border (textos podem ter wrap maior que estimado)
        const realH = cursorY - by + 8;
        bg.height = realH;
        border.height = realH;

        this._tutBox = items;
    },

    // Pulse no icon ◉ da etapa atual — chamado do _updateTutorial loop
    _tutPulseQuestIcon() {
        if (!this._tutCurrentIconText || !this._tutCurrentIconText.scene) return;
        const pulse = 0.7 + 0.3 * Math.sin((this._tutAngle || 0) * 2.5);
        this._tutCurrentIconText.setAlpha(pulse);
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
