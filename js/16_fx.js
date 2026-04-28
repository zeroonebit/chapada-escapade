// 16_fx.js — Efeitos visuais: chuva, neblina, sparks, shockwaves, beam halo dust
// Usa Graphics + tweens (sem textura) pra ficar leve e sem dependências.

// ── BARREL POST-FX (distorção esférica sutil — efeito "superfície curva") ──
// PostFX pipeline GLSL aplicado na câmera principal. Strength 0=sem efeito,
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

        // ── CHUVA ──────────────────────────────────────────────────────
        // Gotas com angulo/comprimento/velocidade controlados live via dbg.fx.
        // Container guarda referência das gotas pra recriar quando frequencia muda.
        this.fxRain = this.add.container(0, 0).setScrollFactor(0).setDepth(180).setVisible(false);
        this._rainDrops = [];
        this._rainCountAtual = 0;
        this._rebuildRain();

        // ── NEBLINA (vinheta com gradiente radial) ────────────────────
        // Gera uma textura canvas com radial gradient: centro transparente,
        // bordas brancas com alpha médio. Mesmo conceito da fumaça (camadas
        // alpha) mas em formato de vinheta full-screen.
        if (!this.textures.exists('vignette_neblina')) {
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
            this.textures.addCanvas('vignette_neblina', c);
        }
        this.fxFog = this.add.image(w/2, h/2, 'vignette_neblina')
            .setScrollFactor(0).setDepth(170).setVisible(false);
        this.fxFog.setDisplaySize(w * 1.05, h * 1.05);
        // Pulsação suave de alpha pra dar vida sem distrair
        this.tweens.add({
            targets: this.fxFog,
            alpha: { from: 0.85, to: 1.0 },
            duration: 4500, yoyo: true, repeat: -1
        });

        // Resize: recompõe os tamanhos
        this.scale.on('resize', () => this._fxResize());
    },

    // Recria as gotas com base em dbg.fx.chuvaCount.
    // Cada gota lê angulo/comprimento/velocidade dinamicamente em cada ciclo.
    _rebuildRain() {
        if (!this.fxRain) return;
        const w = this.scale.width, h = this.scale.height;
        const cfg = this.dbg?.fx || {};
        const target = Math.max(0, Math.round(cfg.chuvaCount ?? 80));

        // Para tweens das gotas existentes
        this._rainDrops.forEach(d => this.tweens.killTweensOf(d));
        // Destrói excesso
        while (this._rainDrops.length > target) {
            const d = this._rainDrops.pop();
            if (d && d.scene) d.destroy();
        }
        // Cria diferença
        while (this._rainDrops.length < target) {
            const drop = this.add.line(0, 0, 0, 0, -8, 18, 0x88bbff, 0.55).setLineWidth(1.4);
            this.fxRain.add(drop);
            this._rainDrops.push(drop);
        }
        this._rainCountAtual = target;

        // (Re)inicia ciclo de cada gota
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
            const ang     = c.chuvaAngulo  ?? 0.3;   // -1..1 (incl. horiz por unidade vert)
            const lenMul  = c.chuvaTamanho ?? 1.0;   // 0.3..3 (mult. comprimento)
            const velMul  = c.chuvaVelocidade ?? 1.0; // 0.2..3 (mult. velocidade)
            const baseLen = 18 * lenMul;
            const dx      = -ang * baseLen;
            // Atualiza geometria da linha (direção visual)
            drop.setTo(0, 0, dx, baseLen);
            drop.setLineWidth(1.4 * Math.max(0.5, Math.min(2, lenMul)));
            // Duração base 700ms — velMul maior = duração menor (cai mais rápido)
            const dur = Phaser.Math.Between(550, 850) / Math.max(0.2, velMul);
            // Drift horizontal proporcional ao angulo e altura percorrida
            const driftX = ang * (h + 60) * 0.45;
            this.tweens.add({
                targets: drop,
                y: h + 40, x: drop.x + driftX,
                duration: dur,
                onComplete: () => { reset(); fall(); }
            });
        };
        reset();
        // Start desincronizado por delay aleatório
        this.time.delayedCall(Phaser.Math.Between(0, 800), fall);
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
        } catch (e) { console.warn('BarrelPipeline failed:', e); }
    },

    _updateBarrel() {
        if (!this._barrelPipeline) return;
        this._barrelPipeline._strength = this.dbg?.behavior?.barrel ?? 0;
    },

    _applyFXVisibility() {
        const cfg = this.dbg?.fx || {};
        if (this.fxRain) {
            const visible = !!cfg.chuva;
            this.fxRain.setVisible(visible);
            if (visible) this.fxRain.setAlpha(cfg.chuvaIntensidade ?? 0.5);
            // Frequência (count) mudou? rebuilda
            const targetCount = Math.max(0, Math.round(cfg.chuvaCount ?? 80));
            if (targetCount !== this._rainCountAtual) this._rebuildRain();
        }
        if (this.fxFog) {
            const visible = !!cfg.neblina;
            this.fxFog.setVisible(visible);
            if (visible) {
                const intensity = cfg.neblinaIntensidade ?? 0.5;
                // Kill pulsation tween e reaplica com faixa proporcional à intensidade
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

    // 3 anéis verdes que partem do alvo e sobem até a nave (efeito de captura)
    _spawnCaptureRings(target) {
        if (!target || !target.scene || !this.nave) return;
        const sx = target.x, sy = target.y;
        const baseR = Math.max(20, (target.displayWidth || 60) * 0.5);
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 120, () => {
                if (!this.nave || !this.nave.scene) return;
                const ring = this.add.circle(sx, sy, baseR, 0, 0)
                    .setStrokeStyle(2.5, 0xaaffcc, 0.9).setDepth(11);
                this.tweens.add({
                    targets: ring,
                    x: this.nave.x, y: this.nave.y,
                    alpha: 0,
                    duration: 620,
                    ease: 'Cubic.easeIn',
                    onUpdate: (t) => ring.setRadius(Phaser.Math.Linear(baseR, baseR * 0.25, t.progress)),
                    onComplete: () => ring.destroy()
                });
            });
        }
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
