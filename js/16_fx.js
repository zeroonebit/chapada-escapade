// 16_fx.js — Efeitos visuais: rain, fog, sparks, shockwaves, beam halo dust
// Usa Graphics + tweens (without textura) to ficar leve e without dependências.

// ── BARREL POST-FX (distorção esférica sutil — efeito "superfície curva") ──
// PostFX pipeline GLSL aplicado na camera principal. Strength 0=without efeito,
// 0.3=sutil, 0.6=forte. Controlado via dbg.behavior.barrel slider.
const BARREL_FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform float strength;
varying vec2 outTexCoord;
void main() {
    vec2 uv = outTexCoord;
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    vec2 d = c * (1.0 + strength * r2 * 1.6) + 0.5;
    if (d.x < 0.0 || d.x > 1.0 || d.y < 0.0 || d.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = texture2D(uMainSampler, d);
    }
}`;

if (typeof Phaser !== 'undefined' && Phaser.Renderer?.WebGL?.Pipelines?.PostFXPipeline) {
    window.BarrelPipeline = class BarrelPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
        constructor(game) {
            super({ game, name: 'BarrelPipeline', fragShader: BARREL_FRAG });
            this._strength = 0;
        }
        onPreRender() { this.set1f('strength', this._strength); }
    };
}

Object.assign(Jogo.prototype, {

    _setupFX() {
        const w = this.scale.width, h = this.scale.height;

        // ── rain ──────────────────────────────────────────────────────
        // Gotas with angulo/comprimento/speed controlados live via dbg.fx.
        // Container guarda referência das gotas to recriar when frequencia muda.
        this.fxRain = this.add.container(0, 0).setScrollFactor(0).setDepth(180).setVisible(false);
        this._rainDrops = [];
        this._rainCountAtual = 0;
        this._rebuildRain();

        // ── NEVE ───────────────────────────────────────────────────────
        // Flocos with tamanhos variados (1-4px), queda lenta, drift horizontal
        this.fxSnow = this.add.container(0, 0).setScrollFactor(0).setDepth(181).setVisible(false);
        this._snowFlakes = [];
        this._snowCountAtual = 0;
        this._rebuildSnow();

        // ── fog (vinheta with gradiente radial) ────────────────────
        // Gera uma textura canvas with radial gradient: centro transparente,
        // bordas brancas with alpha médio. same conceito da fumaça (camadas
        // alpha) mas em formato de vinheta full-screen.
        if (!this.textures.exists('vignette_fog')) {
            const SZ = 512;
            const c = document.createElement('canvas');
            c.width = SZ; c.height = SZ;
            const ctx = c.getContext('2d');
            const grad = ctx.createRadialGradient(SZ/2, SZ/2, SZ*0.10, SZ/2, SZ/2, SZ*0.55);
            grad.addColorStop(0.00, 'rgba(255,255,255,0.00)');
            grad.addColorStop(0.40, 'rgba(255,255,255,0.05)');
            grad.addColorStop(0.70, 'rgba(255,255,255,0.18)');
            grad.addColorStop(1.00, 'rgba(255,255,255,0.40)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, SZ, SZ);
            this.textures.addCanvas('vignette_fog', c);
        }
        this.fxFog = this.add.image(w/2, h/2, 'vignette_fog')
            .setScrollFactor(0).setDepth(170).setVisible(false);
        this.fxFog.setDisplaySize(w * 1.05, h * 1.05);
        // Pulsação suave de alpha to dar vida without distrair
        this.tweens.add({
            targets: this.fxFog,
            alpha: { from: 0.85, to: 1.0 },
            duration: 4500, yoyo: true, repeat: -1
        });

        // Resize: recompõe os tamanhos
        this.scale.on('resize', () => this._fxResize());

        // ── wind ──────────────────────────────────────────────────────
        // Particulas de swirl horizontal (curtas, semi-transparentes, drift
        // lateral). _windAngle eh o valor atual used pela rain (lerp suave
        // de fx.windForce). Wind so eh "lateral" — Y nao eh afetado.
        this.fxWind = this.add.container(0, 0).setScrollFactor(0).setDepth(179).setVisible(false);
        this._windParticles = [];
        this._windAngle = 0;
        this._windOscPhase = 0;
        this._buildWindParticles();
    },

    _buildWindParticles() {
        const N = 22;  // qtd de swirls visiveis
        const h = this.scale.height;
        for (let i = 0; i < N; i++) {
            // each swirl eh um Graphics que redesenha uma curva sinuosa each
            // frame -> efeito de "vortex" / wisp horizontal (mais organico
            // que linha reta).
            const g = this.add.graphics();
            g._speedScale = Phaser.Math.FloatBetween(0.7, 1.7);
            g._yBob       = Phaser.Math.FloatBetween(-14, 14);
            g._yOff       = Phaser.Math.Between(0, h);
            g._xPhase     = Math.random() * Math.PI * 2;
            // Comprimento e amplitude da senoide do swirl
            g._len        = Phaser.Math.Between(36, 64);
            g._amp        = Phaser.Math.FloatBetween(2.2, 5.0);
            g._alpha      = Phaser.Math.FloatBetween(0.10, 0.26);
            g._curveSpeed = Phaser.Math.FloatBetween(2.0, 3.5);
            g._curvePhase = Math.random() * Math.PI * 2;
            this.fxWind.add(g);
            this._windParticles.push(g);
        }
    },

    // Update por frame — chamado via 01_scene._updateBody.
    // Lerp _windAngle to fx.windForce + anima as swirl particles.
    _updateWind(delta) {
        const cfg = this.dbg?.fx;
        if (!cfg) return;
        if (!cfg.wind) {
            this.fxWind?.setVisible(false);
            this._windAngle = 0;
            return;
        }
        this.fxWind?.setVisible(true);
        // Lerp suave do angle atual ate windForce
        const target = Phaser.Math.Clamp(cfg.windForce ?? 0.03, -0.05, 0.05);
        this._windAngle = (this._windAngle ?? 0) + (target - (this._windAngle ?? 0)) * 0.04;
        const w = this.scale.width;
        const speed = this._windAngle * 800;  // px/s lateral
        const dt = delta / 1000;
        this._windOscPhase = (this._windOscPhase + dt * 1.4) % (Math.PI * 2);

        // Direcao do swirl segue o wind (positivo = right, espelha curve when neg)
        const dirSign = this._windAngle >= 0 ? 1 : -1;

        for (const g of this._windParticles) {
            if (!g.scene) continue;
            // Avanca posicao + atualiza fase da curva (rotaciona o swirl)
            g.x += speed * dt * g._speedScale;
            g._curvePhase += dt * g._curveSpeed;
            // Wrap horizontal
            if (speed > 0 && g.x > w + g._len + 20)  g.x = -g._len - 20;
            if (speed < 0 && g.x < -g._len - 20)     g.x = w + g._len + 20;
            // Bob vertical (eixo Y oscila no tempo)
            g.y = g._yOff + Math.sin(this._windOscPhase + g._xPhase) * g._yBob;

            // Redraw curva sinuosa usando 6 segmentos: y = amp * sin(t + phase)
            // Resultado: linha ondulada que parece torcer/rolar (vortex feel)
            g.clear();
            g.lineStyle(1.2, 0xddeeff, g._alpha);
            g.beginPath();
            const SEG = 12;
            for (let k = 0; k <= SEG; k++) {
                const t = k / SEG;
                const lx = (t - 0.5) * g._len * dirSign;
                const ly = Math.sin(g._curvePhase + t * Math.PI * 2.2) * g._amp;
                if (k === 0) g.moveTo(lx, ly);
                else         g.lineTo(lx, ly);
            }
            g.strokePath();
        }
    },

    // Recria as gotas with base em dbg.fx.rainCount.
    // each gota reads angulo/comprimento/speed dinamicamente em each ciclo.
    _rebuildRain() {
        if (!this.fxRain) return;
        const w = this.scale.width, h = this.scale.height;
        const cfg = this.dbg?.fx || {};
        const target = Math.max(0, Math.round(cfg.rainCount ?? 80));

        // Stops tweens das gotas existentes
        this._rainDrops.forEach(d => this.tweens.killTweensOf(d));
        // Destrói excesso
        while (this._rainDrops.length > target) {
            const d = this._rainDrops.pop();
            if (d && d.scene) d.destroy();
        }
        // Creates diferença — each drop tem variacao propria (depth fake)
        while (this._rainDrops.length < target) {
            const drop = this.add.line(0, 0, 0, 0, -8, 18, 0x88bbff, 0.55).setLineWidth(1.4);
            // Variacao de comprimento ±25% do base + alpha aleatorio to depth
            drop._lenScale   = Phaser.Math.FloatBetween(0.75, 1.25);
            drop._alphaScale = Phaser.Math.FloatBetween(0.45, 1.0);
            this.fxRain.add(drop);
            this._rainDrops.push(drop);
        }
        this._rainCountAtual = target;

        // (Re)starts ciclo de each gota
        this._rainDrops.forEach(drop => this._startRainDrop(drop));
    },

    _startRainDrop(drop) {
        const w = this.scale.width, h = this.scale.height;
        const reset = () => {
            drop.x = Phaser.Math.Between(-100, w + 100);
            drop.y = Phaser.Math.Between(-120, -10);
        };
        const fall = () => {
            if (!drop || !drop.scene) return;
            const c = this.dbg?.fx || {};
            // wind override: se ativo, angulo da rain eh _windAngle (driven
            // pelo sistema de wind). Senao usa slider rainAngle direto.
            const ang     = (c.wind && this._windAngle !== undefined) ? this._windAngle : (c.rainAngle ?? 0.0);
            const lenMul  = c.rainSize ?? 1.0;   // 0.3..3 (mult. comprimento global)
            const velMul  = c.rainSpeed ?? 1.0; // 0.2..3 (mult. speed)
            // Per-drop variacao: comprimento ±25% individual + alpha 0.45-1.0
            const baseLen = 18 * lenMul * (drop._lenScale || 1.0);
            // FIX: line tilt e drift now usam same multiplicador e same sinal
            // (before: dx negativo + drift positivo = linha tilta to um lado e
            // rain cai pro outro). now a gota cai no sentido do tilt da linha.
            const VISUAL_MUL = 8 * 0.45;  // 3.6
            const dx      = ang * baseLen * VISUAL_MUL;
            drop.setTo(0, 0, dx, baseLen);
            drop.setLineWidth(1.4 * Math.max(0.5, Math.min(2, lenMul)));
            drop.setAlpha((drop._alphaScale || 1.0) * 0.7);
            const dur = Phaser.Math.Between(550, 850) / Math.max(0.2, velMul);
            const driftX = ang * (h + 60) * VISUAL_MUL;
            this.tweens.add({
                targets: drop,
                y: h + 40, x: drop.x + driftX,
                duration: dur,
                onComplete: () => { reset(); fall(); }
            });
        };
        reset();
        // Start desincronizado by delay aleatório
        this.time.delayedCall(Phaser.Math.Between(0, 800), fall);
    },

    _rebuildSnow() {
        if (!this.fxSnow) return;
        const cfg = this.dbg?.fx || {};
        const target = Math.max(0, Math.round(cfg.snowCount ?? 100));
        this._snowFlakes.forEach(d => this.tweens.killTweensOf(d));
        while (this._snowFlakes.length > target) {
            const f = this._snowFlakes.pop();
            if (f && f.scene) f.destroy();
        }
        while (this._snowFlakes.length < target) {
            // Size variado: 1-4px de raio
            const r = Phaser.Math.FloatBetween(1.0, 3.5);
            const flake = this.add.circle(0, 0, r, 0xffffff, 0.85);
            flake._radius = r;
            this.fxSnow.add(flake);
            this._snowFlakes.push(flake);
        }
        this._snowCountAtual = target;
        this._snowFlakes.forEach(f => this._startSnowFlake(f));
    },

    _startSnowFlake(flake) {
        const w = this.scale.width, h = this.scale.height;
        const reset = () => {
            flake.x = Phaser.Math.Between(-30, w + 30);
            flake.y = Phaser.Math.Between(-50, -10);
        };
        const fall = () => {
            if (!flake || !flake.scene) return;
            // Speed: flocos maiores caem more fast (peso visual)
            const baseDur = Phaser.Math.Between(3000, 6000);
            const sizeFactor = 1.0 / Math.max(0.5, flake._radius * 0.6);
            const dur = baseDur * sizeFactor;
            // Drift horizontal sinuoso
            const drift = Phaser.Math.Between(-60, 60);
            this.tweens.add({
                targets: flake,
                y: h + 30,
                x: flake.x + drift,
                duration: dur,
                onComplete: () => { reset(); fall(); }
            });
        };
        reset();
        this.time.delayedCall(Phaser.Math.Between(0, 1500), fall);
    },

    _scheduleRebuildRain() {
        if (this._rainRebuildTimer) clearTimeout(this._rainRebuildTimer);
        this._rainRebuildTimer = setTimeout(() => {
            this._rebuildRain();
            this._rainRebuildTimer = null;
        }, 200);
    },

    _scheduleRebuildSnow() {
        if (this._snowRebuildTimer) clearTimeout(this._snowRebuildTimer);
        this._snowRebuildTimer = setTimeout(() => {
            this._rebuildSnow();
            this._snowRebuildTimer = null;
        }, 200);
    },

    _fxResize() {
        const w = this.scale.width, h = this.scale.height;
        if (this.fxFog && this.fxFog.setDisplaySize) {
            this.fxFog.setPosition(w/2, h/2);
            this.fxFog.setDisplaySize(w * 1.05, h * 1.05);
        }
    },

    _setupBarrel() {
        if (!window.BarrelPipeline || !this.renderer?.pipelines) return;
        try {
            this.renderer.pipelines.addPostPipeline('BarrelPipeline', window.BarrelPipeline);
            this.cameras.main.setPostPipeline('BarrelPipeline');
            this._barrelPipeline = this.cameras.main.getPostPipeline('BarrelPipeline');
            // Applies strength initial JA to efeito esferico aparecer no splash
            // (without this fica zerado ate o gameStarted=true rodar _updateBody/_updateBarrel)
            if (this._barrelPipeline) {
                this._barrelPipeline._strength = this.dbg?.behavior?.barrel ?? 0.15;
            }
        } catch (e) { console.warn('BarrelPipeline failed:', e); }
    },

    _updateBarrel() {
        if (!this._barrelPipeline) return;
        this._barrelPipeline._strength = this.dbg?.behavior?.barrel ?? 0;
    },

    _applyFXVisibility() {
        const cfg = this.dbg?.fx || {};
        if (this.fxWind) {
            this.fxWind.setVisible(!!cfg.wind);
        }
        if (this.fxRain) {
            const visible = !!cfg.rain;
            this.fxRain.setVisible(visible);
            if (visible) this.fxRain.setAlpha(cfg.rainIntensity ?? 0.5);
            // H3: debounce 200ms to evitar churn em slider drag
            const targetCount = Math.max(0, Math.round(cfg.rainCount ?? 80));
            if (targetCount !== this._rainCountAtual) this._scheduleRebuildRain();
        }
        if (this.fxSnow) {
            const visible = !!cfg.snow;
            this.fxSnow.setVisible(visible);
            if (visible) this.fxSnow.setAlpha(cfg.snowIntensity ?? 0.85);
            const targetCount = Math.max(0, Math.round(cfg.snowCount ?? 100));
            if (targetCount !== this._snowCountAtual) this._scheduleRebuildSnow();
        }
        if (this.fxFog) {
            const visible = !!cfg.fog;
            this.fxFog.setVisible(visible);
            if (visible) {
                const intensity = cfg.fogIntensity ?? 0.5;
                // Kill pulsation tween e reaplica with faixa proporcional à intensidade
                this.tweens.killTweensOf(this.fxFog);
                this.tweens.add({
                    targets: this.fxFog,
                    alpha: { from: intensity * 0.85, to: intensity * 1.0 },
                    duration: 4500, yoyo: true, repeat: -1
                });
            }
        }
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

    // 3 anéis verdes que partem do alvo e sobem até a ship (efeito de captura)
    _spawnCaptureRings(target) {
        if (!target || !target.scene || !this.ufo) return;
        const sx = target.x, sy = target.y;
        const baseR = Math.max(20, (target.displayWidth || 60) * 0.5);
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 120, () => {
                if (!this.ufo || !this.ufo.scene) return;
                const ring = this.add.circle(sx, sy, baseR, 0, 0)
                    .setStrokeStyle(2.5, 0xaaffcc, 0.9).setDepth(11);
                this.tweens.add({
                    targets: ring,
                    x: this.ufo.x, y: this.ufo.y,
                    alpha: 0,
                    duration: 620,
                    ease: 'Cubic.easeIn',
                    onUpdate: (t) => ring.setRadius(Phaser.Math.Linear(baseR, baseR * 0.25, t.progress)),
                    onComplete: () => ring.destroy()
                });
            });
        }
    },

    // Sparkles orbitando inside do beam when ativo (chamado a each N frames)
    _emitBeamSparkle() {
        if (!this.ufo) return;
        const r = (this.coneRadius || 100) * Phaser.Math.FloatBetween(0.3, 0.95);
        const ang = Math.random() * Math.PI * 2;
        const x = this.ufo.x + Math.cos(ang) * r;
        const y = this.ufo.y + Math.sin(ang) * r;
        const dot = this.add.circle(x, y, 2.5, 0xaaffcc, 0.95).setDepth(8);
        // Move em direction ao centro da ship (efeito de absorção)
        this.tweens.add({
            targets: dot,
            x: this.ufo.x, y: this.ufo.y,
            scale: 0.3, alpha: 0,
            duration: 500 + Math.random()*250,
            ease: 'Cubic.easeIn',
            onComplete: () => dot.destroy()
        });
    },

});
