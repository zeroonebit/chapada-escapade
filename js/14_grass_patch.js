// 14_grass_patch.js — Patch de grama interativo via Verlet integration (cloth sim).
// Cada blade é uma string vertical de pontos conectados por constraints rígidas.
// Mouse aplica força com falloff por distância. Vento global oscila no tempo.
// Roda em JS puro (CPU) — performance ok até ~400 blades em 60fps.

class GrassBlade {
    constructor(rootX, rootY, height, segments) {
        this.points = [];
        this.prev = [];
        this.segLen = height / segments;
        for (let i = 0; i <= segments; i++) {
            const x = rootX;
            const y = rootY - i * this.segLen;
            this.points.push({ x, y, pinned: i === 0 });
            this.prev.push({ x, y });
        }
        // Variação por blade pra não ficar uniforme
        this.stiffness = 0.85 + Math.random() * 0.10;
        this.colorTint = Math.random() * 0.25;  // 0..0.25 lerp pra cor mais clara
        this.thickness = 1.5 + Math.random() * 0.5;
    }

    update(dt, gravity, windX, mouse) {
        const damping = 0.92;
        // ── Verlet step
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            if (p.pinned) continue;
            const pr = this.prev[i];
            const vx = (p.x - pr.x) * damping;
            const vy = (p.y - pr.y) * damping;
            this.prev[i] = { x: p.x, y: p.y };
            // Wind cresce com a altura do ponto (top sente mais)
            const heightFactor = i / (this.points.length - 1);
            p.x += vx + windX * dt * heightFactor;
            p.y += vy + gravity * dt * heightFactor;
            // Mouse force
            if (mouse.active) {
                const dx = p.x - mouse.x, dy = p.y - mouse.y;
                const dist2 = dx * dx + dy * dy;
                const r2 = mouse.radius * mouse.radius;
                if (dist2 < r2 && dist2 > 0.01) {
                    const dist = Math.sqrt(dist2);
                    const falloff = 1 - dist / mouse.radius;
                    const force = falloff * falloff * mouse.strength * heightFactor;
                    p.x += (dx / dist) * force;
                    p.y += (dy / dist) * force;
                }
            }
        }
        // ── Constraint relaxation (segment lengths fixos)
        const ITER = 6;
        for (let iter = 0; iter < ITER; iter++) {
            for (let i = 1; i < this.points.length; i++) {
                const a = this.points[i - 1];
                const b = this.points[i];
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                const diff = (this.segLen - dist) / dist;
                const off = diff * 0.5 * this.stiffness;
                if (!a.pinned) { a.x -= dx * off; a.y -= dy * off; }
                if (!b.pinned) { b.x += dx * off; b.y += dy * off; }
            }
        }
    }
}

Object.assign(Jogo.prototype, {

    _setupGrassPatch(W, H) {
        const cx = W / 2, cy = H / 2;
        const PATCH_R = 280;
        const N_BLADES = 900;

        this.grassBlades = [];
        const noise2 = (x, y) =>
              Math.sin(x * 1.7 + y * 2.3) * 0.5
            + Math.sin(x * 3.1 - y * 1.3) * 0.3
            + Math.sin(x * 5.5 + y * 4.7) * 0.2;

        let attempts = 0;
        while (this.grassBlades.length < N_BLADES && attempts < N_BLADES * 8) {
            attempts++;
            const a = Math.random() * Math.PI * 2;
            const rNorm = Math.sqrt(Math.random());
            const x = cx + Math.cos(a) * rNorm * PATCH_R;
            const y = cy + Math.sin(a) * rNorm * PATCH_R;
            const dx = (x - cx) / PATCH_R, dy = (y - cy) / PATCH_R;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const n = noise2(dx, dy) * 0.20;
            if (dist + n > 1.0) continue;
            // Edge thinning suave
            if (dist > 0.78 && Math.random() < (dist - 0.78) * 2.8) continue;
            const height = 55 + Math.random() * 30;
            this.grassBlades.push(new GrassBlade(x, y, height, 7));
        }

        // Graphics layers: dark base + light overlay
        this.grassGfxDark  = this.add.graphics().setDepth(5);
        this.grassGfxLight = this.add.graphics().setDepth(5.1);
        this._grassWindTime = 0;
    },

    _updateGrassMouse() {
        if (!this.grassBlades) return;
        const delta = this.game.loop.delta;
        const dt = Math.min(delta / 1000, 0.033);
        this._grassWindTime += dt;

        // Mouse em world coords
        const cam = this.cameras.main;
        const wp = cam.getWorldPoint(this.virtualX, this.virtualY);
        const mouse = {
            active: true,
            x: wp.x,
            y: wp.y,
            radius: 90,
            strength: 6
        };

        // Vento global (mistura 2 frequências)
        const t = this._grassWindTime;
        const windX = Math.sin(t * 1.4) * 22 + Math.sin(t * 0.6 + 1.7) * 14;
        const gravity = 8;  // suave — blades não caem, só pesam

        // Atualiza física
        for (let i = 0; i < this.grassBlades.length; i++) {
            this.grassBlades[i].update(dt, gravity, windX, mouse);
        }

        // ── Render: pass 1 (dark thick base "shadow") + pass 2 (light thinner overlay)
        this.grassGfxDark.clear();
        this.grassGfxDark.lineStyle(5, 0x1a3308, 0.95);
        this.grassGfxDark.beginPath();
        for (const blade of this.grassBlades) {
            const pts = blade.points;
            this.grassGfxDark.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                this.grassGfxDark.lineTo(pts[i].x, pts[i].y);
            }
        }
        this.grassGfxDark.strokePath();

        this.grassGfxLight.clear();
        for (const blade of this.grassBlades) {
            const pts = blade.points;
            // Cor lerp entre verde médio e claro
            const r = Math.round(0x82 * (1 - blade.colorTint) + 0xb5 * blade.colorTint);
            const g = Math.round(0xb0 * (1 - blade.colorTint) + 0xd4 * blade.colorTint);
            const b = Math.round(0x48 * (1 - blade.colorTint) + 0x72 * blade.colorTint);
            const color = (r << 16) | (g << 8) | b;
            this.grassGfxLight.lineStyle(blade.thickness + 1.5, color, 1);
            this.grassGfxLight.beginPath();
            this.grassGfxLight.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                this.grassGfxLight.lineTo(pts[i].x, pts[i].y);
            }
            this.grassGfxLight.strokePath();
        }
    }

});
