// 08_curral.js — Currais: drop, processamento, coleta de burgers
Object.assign(Jogo.prototype, {

    _verificarEntrega() {
        for (const c of this.currais) {
            const d = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
            if (d < 90) {
                this._dropCowsAtCurral(c);
                this._coletarDoCurral(c);
            }
        }
    },

    _dropCowsAtCurral(curral) {
        const drop = this.vacas_abduzidas.filter(v => !v.isBurger && !v.isEnemy);
        if (drop.length === 0) return;
        this.vacas_abduzidas = this.vacas_abduzidas.filter(v => !drop.includes(v));
        for (const v of drop) {
            if (!v.scene || !v.body) continue;
            v._inCurral = true;
            // Troca para sprite top-down (vista de cima) dentro do curral
            const base = v.tipo === 'boi' ? 'boi' : 'vaca';
            const cimaTex = Math.random() < 0.5 ? `${base}_cima_sobe` : `${base}_cima_desce`;
            v.setTexture(cimaTex);
            v.setStatic(true).setDepth(2).clearTint();
            if (v.walkTimer) v.walkTimer.paused = true;
            const ang = Math.random() * Math.PI * 2;
            const r = 8 + Math.random() * 22;
            v.x = curral.x + Math.cos(ang) * r;
            v.y = curral.y + Math.sin(ang) * r;
            this.tweens.add({ targets: v, alpha: 0.55, duration: 500, yoyo: true, repeat: -1 });
            curral.processing.push(v);
            this.time.delayedCall(5000, () => this._processarVacaNoCurral(v, curral));
        }
        this.cameras.main.flash(150, 100, 200, 100);
    },

    _processarVacaNoCurral(v, curral) {
        if (!v || !v.scene || v._destroyed) return;
        const yld = v.burgerYield || 1;
        curral.processing = curral.processing.filter(p => p !== v);
        this.vacas = this.vacas.filter(x => x !== v);
        this._destruirVaca(v);
        for (let i = 0; i < yld; i++) {
            const ang = (i / yld) * Math.PI * 2 + Math.random()*0.5;
            const ox = Math.cos(ang) * (8 + Math.random()*14);
            const oy = Math.sin(ang) * (8 + Math.random()*14);
            const b = this.add.image(curral.x + ox, curral.y + oy, 'hamburguer').setDepth(3).setScale(1.1);
            b.valorBurger = 100;
            b._readyBouncer = this.tweens.add({
                targets: b, y: b.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            curral.ready.push(b);
        }
    },

    _coletarDoCurral(curral) {
        if (curral.ready.length === 0) return;
        let pontosBrutos = 0, qtd = 0;
        const colhidos = curral.ready.slice();
        curral.ready = [];
        for (const b of colhidos) {
            pontosBrutos += b.valorBurger || 100;
            qtd++;
            if (b._readyBouncer) b._readyBouncer.stop();
            this.tweens.killTweensOf(b);
            this.tweens.add({
                targets: b,
                x: this.nave.x, y: this.nave.y,
                alpha: 0, scale: 0.4,
                duration: 320, ease: 'Cubic.easeIn',
                onComplete: () => b.destroy()
            });
        }
        const multi = qtd>=4 ? 3 : qtd>=2 ? 2 : 1;
        const pontos = pontosBrutos * multi;
        this.scoreAtual += pontos;
        this.textoScore.setText(this.scoreAtual);
        this.pacienciaAtual = Math.min(this.pacienciaMax, this.pacienciaAtual + 28*qtd);
        this.cameras.main.flash(300, 255, 220, 0);
        const lbl = '+' + pontos + (multi>1 ? ' ×'+multi : '');
        const popup = this.add.text(this.nave.x, this.nave.y-60, lbl, {fontSize:'20px',fill:'#ffcc00',fontStyle:'bold'}).setDepth(50).setOrigin(0.5);
        this.tweens.add({targets:popup, y:popup.y-70, alpha:0, duration:900, onComplete:()=>popup.destroy()});
    },

    _anyCurralReady() {
        for (const c of this.currais) if (c.ready.length > 0) return true;
        return false;
    }

});
