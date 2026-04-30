// 08_corrals.js — Corral with slots fixos: 3 cows max, 3 burgers max
// Slot 0=classic, 1=cheese, 2=double. Coleta via beam graviton.
// Constantes BURGER_TEXTURES, SLOT_value, SLOT_FUEL vêm de 00_constants.js
// (alias local to keep o código antigo lendo BURGER_SLOTS)
const BURGER_SLOTS = BURGER_TEXTURES;

Object.assign(Jogo.prototype, {

    _checkDelivery() {
        for (const c of this.corrals) {
            // Drop by proximidade do corral
            const d = Phaser.Math.Distance.Between(this.ufo.x, this.ufo.y, c.x, c.y);
            if (d < 110) this._dropCowsAtCorral(c);
            // Coleta via beam (atrai burgers ready)
            this._attractBurgersBeam(c);
        }
    },

    // Cow chubby representativa with anims rotativas + counter "xN"
    _ensureCowMascot(curral) {
        if (curral.mascot && curral.mascot.scene) {
            curral.mascot.setVisible(true);
            curral.mascotCountTxt.setVisible(true);
            if (curral.mascotHay) curral.mascotHay.setVisible(true);
            return curral.mascot;
        }
        // mascotCfg controla tipo/anim/posicao por variante (vem do _buildCorral V2).
        // Fallback (sem cfg): cow eat_S no canto esquerdo (comportamento antigo).
        const cfg = curral.mascotCfg || { tipo: 'cow', anim: 'cow_eat_S', dx: -14, dy: 0 };
        const tipo = cfg.tipo || 'cow';
        const SIZE_BASE = tipo === 'ox' ? 84 : 68;
        const SIZE = SIZE_BASE * (this.dbg?.scale?.[tipo === 'ox' ? 'bull' : 'cow'] ?? 1.0);

        // Texture initial: tenta primeiro frame da anim, senao sprite static do tipo
        const animKey = cfg.anim || (tipo === 'ox' ? 'ox_walk_S' : 'cow_eat_S');
        const firstFrame = `${animKey}_0`;
        const fallbackStatic = tipo === 'ox' ? 'ox_S' : 'cow_S';
        const initTex = this.textures.exists(firstFrame) ? firstFrame
                       : (this.textures.exists(animKey + '_0_0') ? animKey + '_0_0' : fallbackStatic);
        const m = this.add.sprite(curral.x + (cfg.dx ?? -14), curral.y + (cfg.dy ?? 0), initTex)
            .setDisplaySize(SIZE, SIZE).setDepth(2);
        if (this.anims.exists(animKey)) m.play(animKey, true);

        // Fardo de feno ao lado direito (cow olha to ele e come)
        let feno = null;
        if (this.textures.exists('nat_misc_hay_bale')) {
            feno = this.add.image(curral.x + 42, curral.y + 8, 'nat_misc_hay_bale')
                .setDisplaySize(84, 76).setDepth(1.9);
        }
        // Balde ao lado esquerdo da cow — random between full (leite) e empty
        let balde = null;
        const baldeKey = Math.random() < 0.5 ? 'nat_obj_bucket_milk' : 'nat_obj_bucket_empty';
        if (this.textures.exists(baldeKey)) {
            balde = this.add.image(curral.x - 44, curral.y + 14, baldeKey)
                .setDisplaySize(28, 32).setDepth(1.9);
        }

        const txt = this.add.text(curral.x, curral.y - 48, 'x0', {
            fontSize: '22px', fill: '#ffee88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(40);

        curral.mascot = m;
        curral.mascotHay = feno;
        curral.mascotBucket = balde;
        curral.mascotCount = 0;
        curral.mascotCountTxt = txt;
        m.setVisible(false);
        txt.setVisible(false);
        if (feno) feno.setVisible(false);
        if (balde) balde.setVisible(false);
        return m;
    },

    _updateMascoteVisibilidade(curral) {
        if (!curral.mascot) return;
        // Cenografico (V2): cow + bucket SEMPRE visiveis. Counter+feno so com delivery.
        const isCenografico = !!curral.mascotCenografico;
        const hasDelivery = curral.mascotCount > 0;
        curral.mascot.setVisible(isCenografico || hasDelivery);
        if (curral.mascotBucket) curral.mascotBucket.setVisible(isCenografico || hasDelivery);
        if (curral.mascotCountTxt) curral.mascotCountTxt.setVisible(hasDelivery);
        if (curral.mascotHay) curral.mascotHay.setVisible(hasDelivery);
    },

    // Position do slot fixo (0/1/2) below do gate sul do corral
    _slotPos(curral, slotIdx) {
        const SLOT_W = 32;
        const baseY = curral.y + (curral.slotOffsetY ?? 110);  // V2 sprites tem gateY variavel
        const startX = curral.x - SLOT_W;
        return { x: startX + slotIdx * SLOT_W, y: baseY };
    },

    _ensureSlots(curral) {
        if (!curral.slots) curral.slots = [null, null, null];
    },

    // Conta slots free (null) — limita aceitação de cows
    _freeSlots(curral) {
        this._ensureSlots(curral);
        return curral.slots.filter(s => s === null).length;
    },

    _dropCowsAtCorral(curral) {
        this._ensureSlots(curral);
        const candidates = this.abductedCows.filter(v => !v.isBurger && !v.isEnemy);
        if (candidates.length === 0) return;

        const free = this._freeSlots(curral);
        if (free === 0) return;  // corral full — cows continuam abduzidas

        const accepted = candidates.slice(0, free);
        // Removes only as accepted das abduzidas; restantes continuam no beam
        this.abductedCows = this.abductedCows.filter(v => !accepted.includes(v));
        if (this._updateBeamCounters) this._updateBeamCounters();

        this._ensureCowMascot(curral);

        for (const v of accepted) {
            if (!v.scene || !v.body) continue;
            v._inCurral = true;

            // Acha primeiro slot livre e ocupa
            const slotIdx = curral.slots.findIndex(s => s === null);
            if (slotIdx === -1) break;  // sanity check

            // Counter +1 (curral) + cumulativo HUD coluna left
            curral.mascotCount += 1;
            curral.mascotCountTxt.setText('x' + curral.mascotCount);
            if (v.tipo === 'bull') {
                this.bullsTotal = (this.bullsTotal || 0) + 1;
                if (this.hud?.bullsText) this.hud.bullsText.setText(this.bullsTotal);
            } else {
                this.cowsTotal = (this.cowsTotal || 0) + 1;
                if (this.hud?.cowsText) this.hud.cowsText.setText(this.cowsTotal);
            }
            this._updateMascoteVisibilidade(curral);
            this.tweens.add({
                targets: curral.mascotCountTxt, scale: { from: 1.6, to: 1 },
                duration: 320, ease: 'Back.easeOut'
            });

            // Spawns burger LOADING já with a textura final do slot (não cicla more)
            const tex = BURGER_SLOTS[slotIdx];
            const pos = this._slotPos(curral, slotIdx);
            const icon = this.add.image(pos.x, pos.y, tex)
                .setDepth(40).setScale(0.45).setAlpha(0.4);
            const pisca = this.tweens.add({
                targets: icon, alpha: 0.95, duration: 280, yoyo: true, repeat: -1
            });
            curral.slots[slotIdx] = { state: 'loading', icon, pisca, vaca: v, slotIdx };

            // Removes a cow real do world (mascot representa)
            this.cows = this.cows.filter(x => x !== v);
            this._destroyCow(v);

            // Após 3s vira ready
            this.time.delayedCall(3000, () => this._processSlot(curral, slotIdx));
        }
        this.cameras.main.flash(150, 100, 200, 100);
    },

    // M3: cleanup completo de um slot (tweens + icon)
    // used no _collectSlot e em qualquer destrução prematura do corral
    _cleanSlot(curral, slotIdx) {
        const slot = curral?.slots?.[slotIdx];
        if (!slot) return;
        if (slot.pisca && slot.pisca.stop) slot.pisca.stop();
        if (slot.bounce && slot.bounce.stop) slot.bounce.stop();
        if (slot.icon) {
            this.tweens.killTweensOf(slot.icon);
            if (slot.icon.scene) slot.icon.destroy();
        }
        curral.slots[slotIdx] = null;
    },

    _processSlot(curral, slotIdx) {
        this._ensureSlots(curral);
        const slot = curral.slots[slotIdx];
        if (!slot || slot.state !== 'loading' || !slot.icon || !slot.icon.scene) {
            // Slot inválido (corral destruído mid-process?) → limpa to avoid leak
            if (curral && curral.slots) this._cleanSlot(curral, slotIdx);
            return;
        }

        // Decrementa counter (cow "saiu" do estoque)
        curral.mascotCount = Math.max(0, curral.mascotCount - 1);
        if (curral.mascotCountTxt) {
            curral.mascotCountTxt.setText('x' + curral.mascotCount);
        }
        this._updateMascoteVisibilidade(curral);

        // Stops piscar e fixa burger ready with bounce sutil
        if (slot.pisca) slot.pisca.stop();
        slot.icon.setAlpha(1);
        slot.bounce = this.tweens.add({
            targets: slot.icon,
            y: slot.icon.y - 3,
            duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        slot.state = 'ready';
    },

    // Atrai burgers ready em direction à ship when o beam is ativo e burger no coneRadius
    _attractBurgersBeam(curral) {
        this._ensureSlots(curral);
        const beamOn = this.isMobile ? !!this._beamHeld : this.input.activePointer.isDown;
        if (!beamOn || this.energiaLed <= 0) return;
        const r2 = (this.coneRadius || 100) * (this.coneRadius || 100);
        for (let i = 0; i < curral.slots.length; i++) {
            const slot = curral.slots[i];
            if (!slot || slot.state !== 'ready' || slot._sendoColetado) continue;
            const icon = slot.icon;
            if (!icon || !icon.scene) continue;
            const dx = icon.x - this.ufo.x, dy = icon.y - this.ufo.y;
            if (dx*dx + dy*dy > r2) continue;
            // inside do beam: dispara coleta
            this._collectSlot(curral, i);
        }
    },

    _collectSlot(curral, slotIdx) {
        const slot = curral.slots[slotIdx];
        if (!slot || slot._sendoColetado) return;
        slot._sendoColetado = true;
        const icon = slot.icon;
        const points = SLOT_VALOR[slotIdx] || 100;
        const fuel   = SLOT_FUEL[slotIdx] || 28;
        if (slot.bounce) slot.bounce.stop();
        this.tweens.killTweensOf(icon);
        // Tween de atração to ship (efeito beam)
        this.tweens.add({
            targets: icon,
            x: this.ufo.x, y: this.ufo.y,
            scale: 0.25, alpha: 0,
            duration: 380, ease: 'Cubic.easeIn',
            onUpdate: () => {
                // Updates to acompanhar movement da ship
                if (icon.scene && this.ufo) {
                    // segue dinamicamente o destino
                }
            },
            onComplete: () => {
                if (icon.scene) icon.destroy();
                // Applies recompensa ao chegar
                this.score += points;
                this.scoreText.setText(this.score);
                this.fuelCurrent = Math.min(this.fuelMax, this.fuelCurrent + fuel);
                this.cameras.main.flash(140, 255, 220, 0);
                const lbl = `+${points}`;
                const popup = this.add.text(this.ufo.x, this.ufo.y - 50, lbl, {
                    fontSize: '18px', fill: '#ffcc00', fontStyle: 'bold'
                }).setDepth(50).setOrigin(0.5);
                this.tweens.add({
                    targets: popup, y: popup.y - 60, alpha: 0,
                    duration: 700, onComplete: () => popup.destroy()
                });
                // M3: libera slot via _cleanSlot (null-safe + para tweens órfãos
                // se algo travar between o stop manual above e o complete callback)
                this._cleanSlot(curral, slotIdx);
                // Quip ao entregar burger
                if (this._showQuip) this._showQuip({ x: this.ufo.x, y: this.ufo.y }, 'burger');
            }
        });
    },

    // Compat with tutorial e radar (checks se has burger ready to coletar)
    _anyCorralReady() {
        for (const c of this.corrals) {
            if (!c.slots) continue;
            if (c.slots.some(s => s && s.state === 'ready' && !s._sendoColetado)) return true;
        }
        return false;
    },

});
