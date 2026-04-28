// 16_fx.js — Efeitos visuais: chuva, neblina, sparks, shockwaves, beam halo dust
// Usa Graphics + tweens (sem textura) pra ficar leve e sem dependências.
Object.assign(Jogo.prototype, {

    _setupFX() {
        const w = this.scale.width, h = this.scale.height;

        // ── CHUVA ──────────────────────────────────────────────────────
        // 80 gotas pré-criadas que loopam. Tween infinito por gota com offset
        // de start aleatório pra desincronizar.
        this.fxRain = this.add.container(0, 0).setScrollFactor(0).setDepth(180).setVisible(false);
        const dropCount = 80;
        for (let i = 0; i < dropCount; i++) {
            const drop = this.add.line(0, 0, 0, 0, -8, 18, 0x88bbff, 0.55).setLineWidth(1.4);
            this.fxRain.add(drop);
            const reset = () => {
                drop.x = Phaser.Math.Between(-50, w + 50);
                drop.y = Phaser.Math.Between(-100, -10);
            };
            reset();
            const fall = () => {
                this.tweens.add({
                    targets: drop,
                    y: h + 30, x: drop.x + 30,
                    duration: Phaser.Math.Between(550, 850),
                    delay: Phaser.Math.Between(0, 600),
                    onComplete: () => { reset(); fall(); }
                });
            };
            fall();
        }

        // ── NEBLINA ────────────────────────────────────────────────────
        // 3 retângulos com alpha baixo e tints diferentes que pulsam de alpha
        this.fxFog = this.add.container(0, 0).setScrollFactor(0).setDepth(170).setVisible(false);
        const fogLayers = [
            { col: 0xeeeeee, a: 0.10, dur: 4000 },
            { col: 0xccddee, a: 0.08, dur: 5500 },
            { col: 0xaaccdd, a: 0.06, dur: 7000 },
        ];
        fogLayers.forEach(({col, a, dur}) => {
            const r = this.add.rectangle(w/2, h/2, w*1.5, h*1.5, col, a);
            this.fxFog.add(r);
            this.tweens.add({
                targets: r,
                alpha: { from: a*0.4, to: a*1.4 },
                duration: dur, yoyo: true, repeat: -1
            });
            this.tweens.add({
                targets: r,
                x: { from: w/2 - 30, to: w/2 + 30 },
                duration: dur*1.3, yoyo: true, repeat: -1
            });
        });

        // Resize: recompõe os tamanhos
        this.scale.on('resize', () => this._fxResize());
    },

    _fxResize() {
        const w = this.scale.width, h = this.scale.height;
        if (this.fxFog) {
            this.fxFog.list.forEach(r => {
                r.setPosition(w/2, h/2);
                r.setSize(w*1.5, h*1.5);
            });
        }
    },

    _applyFXVisibility() {
        const cfg = this.dbg?.fx || {};
        if (this.fxRain) this.fxRain.setVisible(!!cfg.chuva);
        if (this.fxFog)  this.fxFog.setVisible(!!cfg.neblina);
    },

    // ── ATALHOS DE EFEITO ─────────────────────────────────────────────
    _spawnSpark(x, y, opts = {}) {
        const { color = 0xffee88, size = 3, dur = 350, dist = 28 } = opts;
        const ang = Math.random() * Math.PI * 2;
        const tx = x + Math.cos(ang) * dist;
        const ty = y + Math.sin(ang) * dist;
        const s = this.add.circle(x, y, size, color, 0.95).setDepth(50);
        this.tweens.add({
            targets: s, x: tx, y: ty, alpha: 0, scale: 0.3,
            duration: dur, onComplete: () => s.destroy()
        });
    },

    _spawnShockwave(x, y, opts = {}) {
        const { color = 0xff8800, startR = 6, endR = 60, dur = 380 } = opts;
        const ring = this.add.circle(x, y, startR, color, 0).setStrokeStyle(3, color, 0.9).setDepth(50);
        this.tweens.add({
            targets: ring, radius: endR, alpha: 0,
            duration: dur, ease: 'Cubic.easeOut',
            onUpdate: (t) => ring.setRadius(Phaser.Math.Linear(startR, endR, t.progress)),
            onComplete: () => ring.destroy()
        });
    },

    _spawnExplosao(x, y, color = 0xff8800, intensity = 1) {
        // Shockwave + sparks + flash branco curto
        this._spawnShockwave(x, y, { color, endR: 70 * intensity });
        for (let i = 0; i < Math.round(8 * intensity); i++) {
            this._spawnSpark(x, y, {
                color: i % 2 ? color : 0xffeecc,
                size: 2 + Math.random()*2,
                dur: 300 + Math.random()*300,
                dist: 30 + Math.random()*30 * intensity
            });
        }
        // Flash branco no centro
        const flash = this.add.circle(x, y, 14 * intensity, 0xffffff, 0.85).setDepth(51);
        this.tweens.add({ targets: flash, alpha: 0, scale: 2.2,
            duration: 260, onComplete: () => flash.destroy() });
    },

    // Sparkles orbitando dentro do beam quando ativo (chamado a cada N frames)
    _emitBeamSparkle() {
        if (!this.nave) return;
        const r = (this.raioCone || 100) * Phaser.Math.FloatBetween(0.3, 0.95);
        const ang = Math.random() * Math.PI * 2;
        const x = this.nave.x + Math.cos(ang) * r;
        const y = this.nave.y + Math.sin(ang) * r;
        const dot = this.add.circle(x, y, 2.5, 0xaaffcc, 0.95).setDepth(8);
        // Move em direção ao centro da nave (efeito de absorção)
        this.tweens.add({
            targets: dot,
            x: this.nave.x, y: this.nave.y,
            scale: 0.3, alpha: 0,
            duration: 500 + Math.random()*250,
            ease: 'Cubic.easeIn',
            onComplete: () => dot.destroy()
        });
    },

});
