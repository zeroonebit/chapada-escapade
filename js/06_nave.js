// 06_nave.js — Nave: cone do feixe, LEDs, rastro do cursor, movimento, paciência
Object.assign(Jogo.prototype, {

    _setupLEDs() {
        // 12 LEDs em torno da nave, gradiente "cometa", alterna azul/vermelho
        this.leds = [];
        this.ledHalos = [];
        const N_LEDS = 12;
        for (let i = 0; i < N_LEDS; i++) {
            const ang = (i / N_LEDS) * Math.PI * 2 - Math.PI/2;
            const halo = this.add.circle(0, 0, 6, 0x000000, 0).setDepth(9);
            const led  = this.add.circle(0, 0, 2.2, 0x222222).setDepth(11);
            led._ang = ang; halo._ang = ang;
            this.leds.push(led); this.ledHalos.push(halo);
        }
        this._ledHead = 0;
        this._ledRotMs = 900;
    },

    _desenharCone(r) {
        this.coneLuz.clear();
        this.coneLuz.fillStyle(0x66ff99, 0.06); this.coneLuz.fillCircle(0, 0, r);
        this.coneLuz.fillStyle(0x66ff99, 0.10); this.coneLuz.fillCircle(0, 0, r * 0.78);
        this.coneLuz.fillStyle(0x88ffaa, 0.14); this.coneLuz.fillCircle(0, 0, r * 0.45);
    },

    _atualizarLEDs(delta) {
        const N = this.leds.length;
        const LED_R = 22;
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

    _atualizarRastro(c) {
        this.rastroMouse.unshift({x:c.x, y:c.y});
        if (this.rastroMouse.length>18) this.rastroMouse.pop();
        this.graficoRastro.clear();
        for (let i=0; i<this.rastroMouse.length; i+=2) {
            let f = 1-(i/18);
            this.graficoRastro.fillStyle(0x001a00, f*0.6);
            this.graficoRastro.fillRect(this.rastroMouse[i].x-3, this.rastroMouse[i].y-3, 6, 6);
        }
        this.graficoRastro.lineStyle(1.5, 0x001a00, 0.8);
        this.graficoRastro.strokeRect(c.x-5, c.y-5, 10, 10);
    },

    _moverNave(c) {
        let dist = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
        if (dist > 50) {
            let ang = Phaser.Math.Angle.Between(this.nave.x, this.nave.y, c.x, c.y);
            this.nave.applyForce({
                x: Math.cos(ang) * Math.min(dist*0.0001, 0.0035),
                y: Math.sin(ang) * Math.min(dist*0.0001, 0.0035)
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
        } else if (this._anyCurralReady()) {
            cor = 0xff8800;
            for (const c of this.currais) {
                if (c.ready.length === 0) continue;
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

    _atualizarPaciencia(delta) {
        this.pacienciaAtual -= 2.2 * this.dificuldade * (delta/1000);
        if (this.pacienciaAtual <= 0) { this.pacienciaAtual = 0; this._gameOver(); }
        const pct = this.pacienciaAtual / this.pacienciaMax;

        // Redesenha gradiente amarelo→vermelho na largura proporcional
        const b = this._pacBar || { x: 0, y: 0, w: 0, h: 0 };
        const filledW = Math.max(0, b.w * pct);
        this.hud.pacFill.clear();
        if (filledW > 0) {
            this.hud.pacFill.fillGradientStyle(0xffdd44, 0xff3322, 0xffaa22, 0xcc1100, 1);
            this.hud.pacFill.fillRect(b.x, b.y, filledW, b.h);
        }
    }

});
