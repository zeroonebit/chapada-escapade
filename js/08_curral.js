// 08_curral.js — Currais: 1 vaca representativa com counter + fila de burgers fora
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

    // Garante 1 vaca representativa "comendo no feno" no centro do curral.
    // Quando recebe outra, só incrementa o counter "×N" acima dela.
    _ensureCowMascote(curral) {
        if (curral.mascote && curral.mascote.scene) return curral.mascote;
        // Sprite de vaca top-down sem física (puro add.image)
        const tex = Math.random() < 0.5 ? 'vaca_cima_sobe' : 'vaca_cima_desce';
        const m = this.add.image(curral.x, curral.y, tex)
            .setDisplaySize(56, 56).setDepth(2);
        // Pequeno bob suave (vaca "comendo")
        this.tweens.add({
            targets: m, y: m.y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        // Texto contador acima
        const txt = this.add.text(curral.x, curral.y - 38, '×0', {
            fontSize: '14px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(40);
        curral.mascote = m;
        curral.mascoteCount = 0;
        curral.mascoteCountTxt = txt;
        return m;
    },

    _dropCowsAtCurral(curral) {
        const drop = this.vacas_abduzidas.filter(v => !v.isBurger && !v.isEnemy);
        if (drop.length === 0) return;
        this.vacas_abduzidas = this.vacas_abduzidas.filter(v => !drop.includes(v));

        this._ensureCowMascote(curral);

        for (const v of drop) {
            if (!v.scene || !v.body) continue;
            v._inCurral = true;
            const yld = v.burgerYield || 1;

            // Incrementa counter da mascote (mostra quantas vacas estão "no curral")
            curral.mascoteCount += 1;
            curral.mascoteCountTxt.setText('×' + curral.mascoteCount);
            // Pulse no texto pra dar feedback
            this.tweens.add({
                targets: curral.mascoteCountTxt, scale: { from: 1.5, to: 1 },
                duration: 320, ease: 'Back.easeOut'
            });

            // Remove a vaca real do mundo (não polui o curral com vários sprites)
            curral.processing.push(v);
            this._spawnBurgerLoadingFila(v, curral, yld);
            this.time.delayedCall(3000, () => this._processarVacaNoCurral(v, curral));
        }
        this.cameras.main.flash(150, 100, 200, 100);
    },

    // Calcula slot na fila externa (sul do curral, abaixo da porta)
    // Retorna {x, y} no mundo. Slots de 24px de largura, em até 12 colunas; depois quebra linha.
    _filaSlot(curral, idx) {
        const SLOT_W = 24;
        const PER_ROW = 12;
        const ROW_H = 26;
        const baseY = curral.y + 96 + 24;  // H2=96 + offset abaixo do gate
        const col = idx % PER_ROW;
        const row = Math.floor(idx / PER_ROW);
        const startX = curral.x - (PER_ROW * SLOT_W) / 2 + SLOT_W/2;
        return { x: startX + col * SLOT_W, y: baseY + row * ROW_H };
    },

    // Spawna ícones de burger LOADING (piscando) na fila fora do curral.
    // Quando ficarem prontos, _processarVacaNoCurral troca pra fixos.
    _spawnBurgerLoadingFila(v, curral, yld) {
        if (!curral.loadingIcons) curral.loadingIcons = [];
        if (!curral.readyIcons)   curral.readyIcons   = [];
        const variants = ['burger_classic', 'burger_cheese', 'burger_double'];

        // Remove a vaca antes de spawnar pra liberar contagem visual
        if (v && v.scene) {
            this.vacas = this.vacas.filter(x => x !== v);
            this._destruirVaca(v);
        }

        for (let i = 0; i < yld; i++) {
            const slotIdx = curral.loadingIcons.length + curral.readyIcons.length;
            const pos = this._filaSlot(curral, slotIdx);
            const icon = this.add.image(pos.x, pos.y, variants[0])
                .setDepth(40).setScale(0.4).setAlpha(0.95);
            // Piscando enquanto loading
            const pisca = this.tweens.add({
                targets: icon, alpha: 0.35, duration: 220, yoyo: true, repeat: -1
            });
            // Cycle loading sprite a cada 1s
            this.time.delayedCall(1000, () => { if (icon.scene) icon.setTexture(variants[1]); });
            this.time.delayedCall(2000, () => { if (icon.scene) icon.setTexture(variants[2]); });
            curral.loadingIcons.push({ icon, pisca });
        }
    },

    _processarVacaNoCurral(v, curral) {
        if (!v) return;
        const yld = v.burgerYield || 1;
        curral.processing = curral.processing.filter(p => p !== v);

        // Decrementa o counter da mascote (vaca "saiu" do estoque virando burger)
        curral.mascoteCount = Math.max(0, curral.mascoteCount - 1);
        if (curral.mascoteCountTxt) {
            curral.mascoteCountTxt.setText('×' + curral.mascoteCount);
        }

        if (!curral.loadingIcons) curral.loadingIcons = [];
        if (!curral.readyIcons)   curral.readyIcons   = [];

        // Pega os primeiros yld ícones loading e converte em ready (fixos)
        const promote = curral.loadingIcons.splice(0, yld);
        const variants = ['burger_classic', 'burger_cheese', 'burger_double'];
        for (const item of promote) {
            const icon = item.icon;
            if (!icon || !icon.scene) continue;
            // Para o piscar e fixa
            if (item.pisca) item.pisca.stop();
            icon.setAlpha(1);
            icon.setTexture(variants[Phaser.Math.Between(0, 2)]);
            // Bounce sutil pra mostrar que está pronto
            const ready = {
                icon,
                bounce: this.tweens.add({
                    targets: icon, y: icon.y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                })
            };
            ready.icon.valorBurger = 100;
            curral.readyIcons.push(ready);
            curral.ready.push(icon);  // mantém compat com _coletarDoCurral
        }
    },

    _coletarDoCurral(curral) {
        if (!curral.ready || curral.ready.length === 0) return;
        let pontosBrutos = 0, qtd = 0;
        const colhidos = curral.ready.slice();
        curral.ready = [];
        // Limpa também a fila de readyIcons em paralelo
        const readyIcons = (curral.readyIcons || []).slice();
        curral.readyIcons = [];

        for (const b of colhidos) {
            pontosBrutos += b.valorBurger || 100;
            qtd++;
            this.tweens.killTweensOf(b);
            this.tweens.add({
                targets: b,
                x: this.nave.x, y: this.nave.y,
                alpha: 0, scale: 0.4,
                duration: 320, ease: 'Cubic.easeIn',
                onComplete: () => { if (b.scene) b.destroy(); }
            });
        }
        // Mata tweens de bounce também
        for (const r of readyIcons) {
            if (r.bounce) r.bounce.stop();
        }

        // Recompõe a fila visualmente (loading icons que sobraram sobem pra frente)
        this._reflowFila(curral);

        const multi = qtd>=4 ? 3 : qtd>=2 ? 2 : 1;
        const pontos = pontosBrutos * multi;
        this.scoreAtual += pontos;
        this.textoScore.setText(this.scoreAtual);
        this.combustivelAtual = Math.min(this.combustivelMax, this.combustivelAtual + 28*qtd);
        this.cameras.main.flash(300, 255, 220, 0);
        const lbl = '+' + pontos + (multi>1 ? ' ×'+multi : '');
        const popup = this.add.text(this.nave.x, this.nave.y-60, lbl, {fontSize:'20px',fill:'#ffcc00',fontStyle:'bold'}).setDepth(50).setOrigin(0.5);
        this.tweens.add({targets:popup, y:popup.y-70, alpha:0, duration:900, onComplete:()=>popup.destroy()});
    },

    // Repõe os ícones loading restantes pros slots iniciais da fila
    _reflowFila(curral) {
        const all = [...(curral.loadingIcons || [])];
        all.forEach((item, i) => {
            const pos = this._filaSlot(curral, i);
            if (item.icon && item.icon.scene) {
                this.tweens.add({
                    targets: item.icon, x: pos.x, y: pos.y,
                    duration: 240, ease: 'Cubic.easeOut'
                });
            }
        });
    },

    _anyCurralReady() {
        for (const c of this.currais) if (c.ready && c.ready.length > 0) return true;
        return false;
    }

});
