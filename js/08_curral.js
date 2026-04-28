// 08_curral.js — Curral com slots fixos: 3 vacas max, 3 burgers max
// Slot 0=classic, 1=cheese, 2=double. Coleta via beam graviton.
const BURGER_SLOTS = ['burger_classic', 'burger_cheese', 'burger_double'];
const SLOT_VALOR   = [100, 150, 220];      // pontos por tipo (mais elaborado vale mais)
const SLOT_FUEL    = [22, 28, 36];          // fuel restaurado por tipo

Object.assign(Jogo.prototype, {

    _verificarEntrega() {
        for (const c of this.currais) {
            // Drop por proximidade do curral
            const d = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
            if (d < 110) this._dropCowsAtCurral(c);
            // Coleta via beam (atrai burgers ready)
            this._atrairBurgersBeam(c);
        }
    },

    // Vaca chubby representativa com anims rotativas + counter "xN"
    _ensureCowMascote(curral) {
        if (curral.mascote && curral.mascote.scene) {
            curral.mascote.setVisible(true);
            curral.mascoteCountTxt.setVisible(true);
            return curral.mascote;
        }
        const m = this.add.sprite(curral.x, curral.y, 'vaca_S')
            .setDisplaySize(64, 64).setDepth(2);
        const dirs = ['S','SE','E','SW','W'];
        const pickAnim = () => {
            const r = Math.random();
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            let key;
            if (r < 0.60) key = `vaca_eat_${dir}`;
            else if (r < 0.90) key = `vaca_walk_${dir}`;
            else key = `vaca_angry_${dir}`;
            if (this.anims.exists(key)) m.play(key, true);
        };
        pickAnim();
        m._animTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000),
            loop: true,
            callback: () => {
                if (!m.scene) return;
                pickAnim();
                m._animTimer.delay = Phaser.Math.Between(3000, 5000);
            }
        });
        const txt = this.add.text(curral.x, curral.y - 48, 'x0', {
            fontSize: '22px', fill: '#ffee88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(40);
        curral.mascote = m;
        curral.mascoteCount = 0;
        curral.mascoteCountTxt = txt;
        m.setVisible(false);
        txt.setVisible(false);
        return m;
    },

    _updateMascoteVisibilidade(curral) {
        if (!curral.mascote) return;
        const visible = curral.mascoteCount > 0;
        curral.mascote.setVisible(visible);
        if (curral.mascoteCountTxt) curral.mascoteCountTxt.setVisible(visible);
    },

    // Posição do slot fixo (0/1/2) abaixo do gate sul do curral
    _slotPos(curral, slotIdx) {
        const SLOT_W = 32;
        const baseY = curral.y + 110;  // abaixo da entrada
        const startX = curral.x - SLOT_W;
        return { x: startX + slotIdx * SLOT_W, y: baseY };
    },

    _ensureSlots(curral) {
        if (!curral.slots) curral.slots = [null, null, null];
    },

    // Conta slots livres (null) — limita aceitação de vacas
    _slotsLivres(curral) {
        this._ensureSlots(curral);
        return curral.slots.filter(s => s === null).length;
    },

    _dropCowsAtCurral(curral) {
        this._ensureSlots(curral);
        const candidatas = this.vacas_abduzidas.filter(v => !v.isBurger && !v.isEnemy);
        if (candidatas.length === 0) return;

        const livres = this._slotsLivres(curral);
        if (livres === 0) return;  // curral cheio — vacas continuam abduzidas

        const aceitas = candidatas.slice(0, livres);
        // Remove só as aceitas das abduzidas; restantes continuam no beam
        this.vacas_abduzidas = this.vacas_abduzidas.filter(v => !aceitas.includes(v));

        this._ensureCowMascote(curral);

        for (const v of aceitas) {
            if (!v.scene || !v.body) continue;
            v._inCurral = true;

            // Acha primeiro slot livre e ocupa
            const slotIdx = curral.slots.findIndex(s => s === null);
            if (slotIdx === -1) break;  // sanity check

            // Counter +1
            curral.mascoteCount += 1;
            curral.mascoteCountTxt.setText('x' + curral.mascoteCount);
            this._updateMascoteVisibilidade(curral);
            this.tweens.add({
                targets: curral.mascoteCountTxt, scale: { from: 1.6, to: 1 },
                duration: 320, ease: 'Back.easeOut'
            });

            // Spawna burger LOADING já com a textura final do slot (não cicla mais)
            const tex = BURGER_SLOTS[slotIdx];
            const pos = this._slotPos(curral, slotIdx);
            const icon = this.add.image(pos.x, pos.y, tex)
                .setDepth(40).setScale(0.45).setAlpha(0.4);
            const pisca = this.tweens.add({
                targets: icon, alpha: 0.95, duration: 280, yoyo: true, repeat: -1
            });
            curral.slots[slotIdx] = { state: 'loading', icon, pisca, vaca: v, slotIdx };

            // Remove a vaca real do mundo (mascote representa)
            this.vacas = this.vacas.filter(x => x !== v);
            this._destruirVaca(v);

            // Após 3s vira ready
            this.time.delayedCall(3000, () => this._processarSlot(curral, slotIdx));
        }
        this.cameras.main.flash(150, 100, 200, 100);
    },

    _processarSlot(curral, slotIdx) {
        this._ensureSlots(curral);
        const slot = curral.slots[slotIdx];
        if (!slot || slot.state !== 'loading' || !slot.icon || !slot.icon.scene) return;

        // Decrementa counter (vaca "saiu" do estoque)
        curral.mascoteCount = Math.max(0, curral.mascoteCount - 1);
        if (curral.mascoteCountTxt) {
            curral.mascoteCountTxt.setText('x' + curral.mascoteCount);
        }
        this._updateMascoteVisibilidade(curral);

        // Para piscar e fixa burger pronto com bounce sutil
        if (slot.pisca) slot.pisca.stop();
        slot.icon.setAlpha(1);
        slot.bounce = this.tweens.add({
            targets: slot.icon,
            y: slot.icon.y - 3,
            duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        slot.state = 'ready';
    },

    // Atrai burgers ready em direção à nave quando o beam está ativo e burger no raioCone
    _atrairBurgersBeam(curral) {
        this._ensureSlots(curral);
        const beamOn = this.isMobile ? !!this._beamHeld : this.input.activePointer.isDown;
        if (!beamOn || this.energiaLed <= 0) return;
        const r2 = (this.raioCone || 100) * (this.raioCone || 100);
        for (let i = 0; i < curral.slots.length; i++) {
            const slot = curral.slots[i];
            if (!slot || slot.state !== 'ready' || slot._sendoColetado) continue;
            const icon = slot.icon;
            if (!icon || !icon.scene) continue;
            const dx = icon.x - this.nave.x, dy = icon.y - this.nave.y;
            if (dx*dx + dy*dy > r2) continue;
            // Dentro do beam: dispara coleta
            this._coletarSlot(curral, i);
        }
    },

    _coletarSlot(curral, slotIdx) {
        const slot = curral.slots[slotIdx];
        if (!slot || slot._sendoColetado) return;
        slot._sendoColetado = true;
        const icon = slot.icon;
        const pontos = SLOT_VALOR[slotIdx] || 100;
        const fuel   = SLOT_FUEL[slotIdx] || 28;
        if (slot.bounce) slot.bounce.stop();
        this.tweens.killTweensOf(icon);
        // Tween de atração pra nave (efeito beam)
        this.tweens.add({
            targets: icon,
            x: this.nave.x, y: this.nave.y,
            scale: 0.25, alpha: 0,
            duration: 380, ease: 'Cubic.easeIn',
            onUpdate: () => {
                // Atualiza pra acompanhar movimento da nave
                if (icon.scene && this.nave) {
                    // segue dinamicamente o destino
                }
            },
            onComplete: () => {
                if (icon.scene) icon.destroy();
                // Aplica recompensa ao chegar
                this.scoreAtual += pontos;
                this.textoScore.setText(this.scoreAtual);
                this.combustivelAtual = Math.min(this.combustivelMax, this.combustivelAtual + fuel);
                this.cameras.main.flash(140, 255, 220, 0);
                const lbl = `+${pontos}`;
                const popup = this.add.text(this.nave.x, this.nave.y - 50, lbl, {
                    fontSize: '18px', fill: '#ffcc00', fontStyle: 'bold'
                }).setDepth(50).setOrigin(0.5);
                this.tweens.add({
                    targets: popup, y: popup.y - 60, alpha: 0,
                    duration: 700, onComplete: () => popup.destroy()
                });
                // Libera o slot
                curral.slots[slotIdx] = null;
            }
        });
    },

    // Compat com tutorial e radar (verifica se tem burger pronto pra coletar)
    _anyCurralReady() {
        for (const c of this.currais) {
            if (!c.slots) continue;
            if (c.slots.some(s => s && s.state === 'ready' && !s._sendoColetado)) return true;
        }
        return false;
    },

    // No-op compat
    _coletarDoCurral() { /* substituído por _atrairBurgersBeam */ },
    _coletarBurgersPerto() { /* substituído por _atrairBurgersBeam */ },

});
