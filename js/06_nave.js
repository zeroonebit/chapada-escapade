// 06_nave.js — Nave: cone do feixe, LEDs, rastro do cursor, movimento, paciência
Object.assign(Jogo.prototype, {

    _setupLEDs() {
        // LEDs desativados (giroflex era distrativo) — efeito agora vem de partículas
        // coloridas saindo no escapamento. Mantém arrays vazios pra compat com o picker.
        this.leds = [];
        this.ledHalos = [];
        this._ledHead = 0;
        this._ledRotMs = 900;
    },

    _desenharCone(r) {
        this.coneLuz.clear();
        // Camadas concêntricas, alpha crescente do exterior pro centro — gera halo suave
        this.coneLuz.fillStyle(0x66ff99, 0.05); this.coneLuz.fillCircle(0, 0, r * 1.10);
        this.coneLuz.fillStyle(0x66ff99, 0.08); this.coneLuz.fillCircle(0, 0, r * 0.92);
        this.coneLuz.fillStyle(0x88ffaa, 0.12); this.coneLuz.fillCircle(0, 0, r * 0.72);
        this.coneLuz.fillStyle(0xaaffcc, 0.16); this.coneLuz.fillCircle(0, 0, r * 0.50);
        this.coneLuz.fillStyle(0xddffee, 0.22); this.coneLuz.fillCircle(0, 0, r * 0.28);
    },

    _atualizarLEDs(delta) {
        const N = this.leds.length;
        // Raio do anel = ~48% do displayWidth da nave (borda visual exterior)
        // setDisplaySize(80,80) → LED_R ≈ 38. Ajusta automático se nave escalar.
        const LED_R = (this.nave?.displayWidth || 80) * 0.48;
        this._ledHead += (N / this._ledRotMs) * delta;
        const fullRevs = Math.floor(this._ledHead / N);
        const corBase = (fullRevs % 2 === 0)
            ? { r: 0x33, g: 0x66, b: 0xff }   // azul
            : { r: 0xff, g: 0x33, b: 0x33 };  // vermelho
        const head = this._ledHead % N;
        const TRAIL = 5;

        for (let i = 0; i < N; i++) {
            const led = this.leds[i];
            const halo = this.ledHalos[i];
            const x = this.nave.x + Math.cos(led._ang) * LED_R;
            const y = this.nave.y + Math.sin(led._ang) * LED_R;
            led.setPosition(x, y);
            halo.setPosition(x, y);

            let d = (head - i + N) % N;
            if (d < TRAIL) {
                const t = 1 - d / TRAIL;
                const r = Math.round(corBase.r * t + 18 * (1 - t));
                const gC = Math.round(corBase.g * t + 18 * (1 - t));
                const b = Math.round(corBase.b * t + 18 * (1 - t));
                led.fillColor = (r << 16) | (gC << 8) | b;
                led.setScale(0.8 + t * 0.7);
                halo.fillColor = led.fillColor;
                halo.fillAlpha = 0.5 * t;
                halo.setScale(0.6 + t * 1.2);
            } else {
                led.fillColor = 0x141414;
                led.setScale(0.8);
                halo.fillAlpha = 0;
            }
        }
    },

    // Cursor laser vermelho — ponto teleguiado seguindo o mouse/joystick
    _atualizarRastro(c) {
        this.graficoRastro.clear();
        // Halo externo (sutil)
        this.graficoRastro.fillStyle(0xff2222, 0.18);
        this.graficoRastro.fillCircle(c.x, c.y, 9);
        // Halo médio
        this.graficoRastro.fillStyle(0xff4444, 0.4);
        this.graficoRastro.fillCircle(c.x, c.y, 5);
        // Núcleo vermelho intenso
        this.graficoRastro.fillStyle(0xff1111, 1);
        this.graficoRastro.fillCircle(c.x, c.y, 2.5);
        // Pequeno reflexo branco no centro (efeito laser)
        this.graficoRastro.fillStyle(0xffffff, 0.85);
        this.graficoRastro.fillCircle(c.x, c.y, 1);
    },

    _moverNave(c) {
        if (this._tutFreezeNave) return;
        let dist = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
        if (dist > 50) {
            const sens = this.dbg?.behavior?.sensibilidade ?? 1.0;
            // Carga: -10% velocidade por vaca/boi abduzido (max -50% com 5 animais)
            // Fazendeiros NÃO desaceleram a nave
            const cargaVacas = (this.vacas_abduzidas || [])
                .filter(v => !v.isBurger && !v.isEnemy).length;
            const cargaMul = Math.max(0.5, 1 - 0.10 * cargaVacas);
            const ang = Phaser.Math.Angle.Between(this.nave.x, this.nave.y, c.x, c.y);
            const mag = Math.min(dist*0.0001, 0.0035) * sens * cargaMul;
            this.nave.applyForce({
                x: Math.cos(ang) * mag,
                y: Math.sin(ang) * mag,
            });
        }
    },

    _atualizarSeta() {
        this.setaIndicadora.clear();
        let cowsInBeam = 0;
        for (const v of this.vacas_abduzidas) if (!v.isBurger && !v.isEnemy) cowsInBeam++;

        let alvo = null, dMin = Infinity, cor = 0xffcc00;
        if (cowsInBeam > 0) {
            for (const c of this.currais) {
                const d = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
                if (d < dMin) { dMin = d; alvo = c; }
            }
        } else if (this._anyCurralReady && this._anyCurralReady()) {
            cor = 0xff8800;
            for (const c of this.currais) {
                // Estrutura nova (slots fixos): checa se algum slot tem burger ready
                const hasReady = c.slots && c.slots.some(s => s && s.state === 'ready' && !s._sendoColetado);
                if (!hasReady) continue;
                const d = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
                if (d < dMin) { dMin = d; alvo = c; }
            }
        }
        if (!alvo) return;

        const cam = this.cameras.main;
        if (cam.worldView.contains(alvo.x, alvo.y)) return;
        const cx = this.scale.width/2, cy = this.scale.height/2;
        const ang = Phaser.Math.Angle.Between(cam.midPoint.x, cam.midPoint.y, alvo.x, alvo.y);
        const radius = Math.min(cx, cy) - 30;
        const sx = cx + Math.cos(ang)*radius, sy = cy + Math.sin(ang)*radius;
        this.setaIndicadora.fillStyle(cor, 1);
        this.setaIndicadora.fillTriangle(
            sx + Math.cos(ang)*16, sy + Math.sin(ang)*16,
            sx + Math.cos(ang+2.5)*10, sy + Math.sin(ang+2.5)*10,
            sx + Math.cos(ang-2.5)*10, sy + Math.sin(ang-2.5)*10
        );
    },

    // Sombra com blur fake (3 elipses stackadas com alpha decrescente)
    // Container atrelado à entidade — posição sincronizada no _atualizarSombras
    _attachSombra(entity, opts = {}) {
        // Tamanho proporcional ao displayWidth da entidade (pega no momento da criação).
        // Se a entidade escalar depois, sombra fica fixa no tamanho inicial — ok pra MVP.
        const dw = entity.displayWidth || 60;
        const dh = entity.displayHeight || 60;
        const {
            rx = dw * 0.36, ry = dh * 0.14,
            alpha = 0.40, color = 0x000000,
            offY = dh * 0.30, offX = dw * 0.06
        } = opts;
        const c = this.add.container(entity.x + offX, entity.y + offY);
        c.add(this.add.ellipse(0, 0, rx*2.6, ry*2.6, color, alpha*0.18));
        c.add(this.add.ellipse(0, 0, rx*1.8, ry*1.8, color, alpha*0.40));
        c.add(this.add.ellipse(0, 0, rx*1.0, ry*1.0, color, alpha));
        c.setDepth(0.5);
        entity.shadow = c;
        entity.shadowOff = { x: offX, y: offY };
        if (!this._allShadows) this._allShadows = [];
        this._allShadows.push(entity);
        return c;
    },

    _atualizarSombras() {
        if (!this._allShadows) return;
        // Filtra entidades destruídas e sincroniza posição
        this._allShadows = this._allShadows.filter(e => {
            if (!e.scene || !e.shadow || !e.shadow.scene) {
                if (e.shadow && e.shadow.scene) e.shadow.destroy();
                return false;
            }
            const o = e.shadowOff || { x: 0, y: 14 };
            e.shadow.setPosition(e.x + o.x, e.y + o.y);
            e.shadow.setVisible(e.visible !== false);
            return true;
        });
    },

    _spawnSmoke(x, y, opts = {}) {
        const {
            color = 0xccddee, alpha = 0.45, size = 6, dur = 600, drift = 0,
            growTo = 3.5, easing = 'Quad.easeOut'
        } = opts;
        const s = this.add.circle(x, y, size, color, alpha).setDepth(8);
        const dx = (Math.random() - 0.5) * drift;
        const dy = (Math.random() - 0.5) * drift;
        this.tweens.add({
            targets: s,
            scale: growTo,
            alpha: 0,
            x: x + dx,
            y: y + dy,
            duration: dur,
            ease: easing,
            onComplete: () => s.destroy()
        });
    },

    _atualizarCombustivel(delta) {
        this.combustivelAtual -= 2.2 * this.dificuldade * (delta/1000);
        if (this.combustivelAtual <= 0) { this.combustivelAtual = 0; this._gameOver(); }
        const pct = this.combustivelAtual / this.combustivelMax;

        // V2: setCrop no fillImg (preferido)
        if (this.hud.combFillImg && this._updateFillCrop) {
            this._updateFillCrop(this.hud.combFillImg, pct);
        }
        // Legacy: gradient via Graphics (fallback se v2 não carregou)
        if (this.hud.combFill) {
            const b = this._combBar || { x: 0, y: 0, w: 0, h: 0 };
            const filledW = Math.max(0, b.w * pct);
            this.hud.combFill.clear();
            if (filledW > 0) {
                this.hud.combFill.fillGradientStyle(0xffdd44, 0xff3322, 0xffaa22, 0xcc1100, 1);
                this.hud.combFill.fillRect(b.x, b.y, filledW, b.h);
            }
        }
    }

});
