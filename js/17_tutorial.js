// 17_tutorial.js — Tutorial guiado passo a passo
// Ativado quando tutorialMode=true (botão TUTORIAL na splash).
// 8 etapas sequenciais com hint overlay + setas + condições de avanço.

const TUT_STEPS = [
    {
        key: 'MOVE',
        title: '① MOVER A NAVE',
        text: 'Use o mouse (clique e arraste) ou joystick para mover a nave pela tela.',
        note: 'Mova pelo menos 200 pixels para avançar.',
    },
    {
        key: 'BEAM',
        title: '② FEIXE GRAVITON',
        text: 'Segure o botão do mouse (ou botão direito no mobile) para ativar o feixe graviton.',
        note: 'Ative o feixe para avançar.',
    },
    {
        key: 'ABDUCT',
        title: '③ ABDUZIR UMA VACA',
        text: 'Posicione a nave sobre uma vaca ou boi e ative o feixe. O animal será atraído.',
        note: 'Abduzir pelo menos 1 animal para avançar.',
    },
    {
        key: 'DELIVER',
        title: '④ LEVAR AO CURRAL',
        text: 'Com a vaca no feixe, leve-a até o curral. A seta verde indica o caminho.',
        note: 'Entregue a vaca no curral para avançar.',
    },
    {
        key: 'BURGER',
        title: '⑤ COLETAR HAMBÚRGUER',
        text: 'Aguarde a vaca se transformar em hambúrguer e passe sobre ele para coletar.',
        note: 'Colete o hambúrguer para avançar.',
    },
    {
        key: 'BARS',
        title: '⑥ BARRAS DE ENERGIA',
        text: 'COMBUSTÍVEL (baixo): depleta quando você é atingido pelo campo de força inimigo. Se esvaziar, game over!\n\nGRAVITON (baixo): depleta ao usar o feixe e regenera sozinho quando inativo.',
        note: 'Ative e desative o feixe para ver o graviton oscilar.',
    },
    {
        key: 'FARMER',
        title: '⑦ FAZENDEIROS',
        text: 'Fazendeiros são inimigos perigosos: patrulham o mapa e disparam no seu campo de força.\n\nUse o FEIXE GRAVITON sobre eles do mesmo jeito que abduz uma vaca — o feixe os arrasta junto.',
        note: 'Capture um fazendeiro com o feixe para avançar.',
    },
    {
        key: 'FARMER_KILL',
        title: '⑧ ARREMESSAR NAS ROCHAS',
        text: 'Com o fazendeiro preso ao feixe, voe em direção a uma PEDRA grande e mantenha o feixe ativo enquanto avança.\n\nA colisão em alta velocidade elimina o fazendeiro instantaneamente!',
        note: 'Mate um fazendeiro batendo em uma pedra para concluir.',
    },
];

Object.assign(Jogo.prototype, {

    _setupTutorial() {
        this.tutorialMode = true;
        this._tutStepIdx   = 0;
        this._tutStartPos  = { x: this.nave.x, y: this.nave.y };
        this._tutStepShownAt = this.time?.now ?? 0;
        this._tutMinReadMs   = 5000;  // tempo mínimo de leitura por etapa
        this._tutHadAbductees = false;
        this._tutDelivered = false;
        this._tutScoreAntes = this.scoreAtual || 0;
        this._tutFarmerAbducted = false;
        this._tutFarmerKilled   = false;
        this._tutGfx  = this.add.graphics().setScrollFactor(0).setDepth(510);
        this._tutAngle = 0;
        this._tutBox   = null;
        this._tutBarsGravitonWatched = false;

        // Limpa entidades inimizas — modo tutorial começa limpo
        (this.fazendeiros || []).slice().forEach(f => {
            if (f && f.scene) { f._destroyed = true; f.destroy(); }
        });
        this.fazendeiros = [];
        (this.atiradores || []).slice().forEach(t => { if (t && t.scene) t.destroy(); });
        this.atiradores = [];

        // Remove vacas existentes, spawna 2 perto da nave (sem lotação confusa)
        (this.vacas || []).slice().forEach(v => {
            if (v && v.scene && !v.isBurger) { v._destroyed = true; v.destroy(); }
        });
        this.vacas = [];

        const cx = this.nave.x, cy = this.nave.y;
        this._criarVaca(cx + 260, cy + 120, 'holstein');
        this._criarVaca(cx - 190, cy + 180, 'holstein');

        // Garante 1 curral próximo
        if (!this.currais || this.currais.length === 0) {
            this._construirCurral(cx + 480, cy + 300);
        }

        // Combustível não drena durante tutorial (exceto na etapa BARS onde mostramos)
        this._tutCombustivelCongelado = true;

        this._tutShowStep(0);
    },

    _updateTutorial(time, delta) {
        if (!this.tutorialMode || this._tutStepIdx === null) return;

        const step = TUT_STEPS[this._tutStepIdx];
        if (!step) return;

        this._tutGfx.clear();
        this._tutAngle = (this._tutAngle || 0) + 0.04;

        // Tempo mínimo de leitura — não avança antes do usuário ler
        const elapsed = (this.time?.now ?? 0) - (this._tutStepShownAt || 0);
        const canAdvance = elapsed >= (this._tutMinReadMs || 5000);

        const nave = this.nave;

        switch (step.key) {

            case 'MOVE': {
                const dx = nave.x - this._tutStartPos.x;
                const dy = nave.y - this._tutStartPos.y;
                if (canAdvance && Math.sqrt(dx*dx + dy*dy) > 200) this._tutAdvance();
                break;
            }

            case 'BEAM': {
                const beamOn = this.isMobile ? !!this._beamHeld : this.input.activePointer.isDown;
                if (canAdvance && beamOn && this.energiaLed > 0) this._tutAdvance();
                break;
            }

            case 'ABDUCT': {
                if (this.vacas_abduzidas.length > 0) {
                    this._tutHadAbductees = true;
                }
                if (canAdvance && this._tutHadAbductees) this._tutAdvance();
                break;
            }

            case 'DELIVER': {
                if (this.currais?.length > 0) {
                    const c = this.currais[0];
                    this._tutDrawArrow(c.x, c.y);
                }
                if (canAdvance && ((this.scoreAtual || 0) > this._tutScoreAntes || this.burgerCount > 0)) {
                    this._tutDelivered = true;
                    this._tutAdvance();
                }
                break;
            }

            case 'BURGER': {
                const atualB = this.burgerCount || 0;
                if (canAdvance && atualB > (this._tutBurgerAntes || 0)) this._tutAdvance();
                break;
            }

            case 'BARS': {
                this._tutCombustivelCongelado = false;
                const beamOn2 = this.isMobile ? !!this._beamHeld : this.input.activePointer.isDown;
                if (beamOn2) this._tutBarsGravitonWatched = true;
                if (canAdvance && this._tutBarsGravitonWatched && !beamOn2 && this.energiaLed >= this.energiaMax * 0.8) {
                    this._tutCombustivelCongelado = true;
                    this._tutAdvance();
                }
                break;
            }

            case 'FARMER': {
                if (!this.fazendeiros || this.fazendeiros.length === 0) {
                    this._tutSpawnFazendeiro();
                }
                // Seta apontando pro fazendeiro vivo mais próximo
                const target = this.fazendeiros.find(f => f.scene && !f._dying && !f._destroyed);
                if (target) this._tutDrawArrow(target.x, target.y);
                const inBeam = this.vacas_abduzidas.some(e => e.isEnemy);
                if (inBeam) {
                    this._tutFarmerAbducted = true;
                    if (canAdvance) this._tutAdvance();
                }
                break;
            }

            case 'FARMER_KILL': {
                // Seta pra rocha mais próxima do fazendeiro abduzido
                const farmer = this.vacas_abduzidas.find(e => e.isEnemy);
                if (farmer) {
                    const rocha = this._tutAcharRochaPerto(farmer.x, farmer.y);
                    if (rocha) this._tutDrawArrow(rocha.x, rocha.y);
                }
                const allDead = !this.fazendeiros || this.fazendeiros.every(f => !f.scene || f._dying || f._destroyed);
                if (canAdvance && this._tutFarmerAbducted && allDead && this.fazendeiros.length > 0) {
                    this._tutAdvance();
                } else if (this._tutFarmerAbducted && (!this.fazendeiros || this.fazendeiros.length === 0)) {
                    this._tutSpawnFazendeiro();
                }
                break;
            }
        }
    },

    _tutSpawnFazendeiro() {
        if (!this._criarFazendeiro) return;
        const cx = this.nave.x, cy = this.nave.y;
        this._criarFazendeiro(cx + 350, cy - 150);
    },

    // Procura no matter.world todos os corpos com label='rocha' e retorna o mais perto
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
        // Dados por etapa
        if (TUT_STEPS[nextIdx].key === 'BURGER') {
            this._tutBurgerAntes = this.burgerCount || 0;
        }
        if (TUT_STEPS[nextIdx].key === 'BARS') {
            this._tutBarsGravitonWatched = false;
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

        // Reset do timer de leitura mínima (5s pra cada nova etapa)
        this._tutStepShownAt = this.time?.now ?? 0;

        const w = this.scale.width, h = this.scale.height;
        const BOX_W  = Math.min(480, w - 40);
        const isLong = step.text.includes('\n');
        const BOX_H  = isLong ? 148 : 96;
        const bx = w / 2;
        const by = h - BOX_H / 2 - 10;

        const bg = this.add.rectangle(bx, by, BOX_W, BOX_H, 0x000a04, 0.92)
            .setScrollFactor(0).setDepth(508);
        const border = this.add.rectangle(bx, by, BOX_W, BOX_H, 0, 0)
            .setStrokeStyle(2, 0x00ff55, 0.85)
            .setScrollFactor(0).setDepth(509);

        // Barra de progresso (pontos)
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
            // Spawna inimigos normais agora
            if (this._criarFazendeiro) {
                for (let i = 0; i < 3; i++) {
                    const x = Phaser.Math.Between(500, 7500);
                    const y = Phaser.Math.Between(500, 5500);
                    this._criarFazendeiro(x, y);
                }
            }
        });
    },

});
