// 08_curral.js — Currais: 1 vaca representativa com counter + fila de burgers fora
Object.assign(Jogo.prototype, {

    _verificarEntrega() {
        for (const c of this.currais) {
            const d = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, c.x, c.y);
            // Drop ainda usa proximidade do curral (sentido: vc voa pro curral entregar)
            if (d < 110) this._dropCowsAtCurral(c);
            // Coleta agora é por proximidade do burger (não do curral)
            this._coletarBurgersPerto(c);
        }
    },

    // Coleta burgers individuais que estão a < PICKUP px da nave (não exige estar em cima do curral)
    _coletarBurgersPerto(curral) {
        const PICKUP = 60;
        if (!curral.readyIcons || curral.readyIcons.length === 0) return;
        const colhidos = [];
        const restantes = [];
        for (const r of curral.readyIcons) {
            if (!r.icon || !r.icon.scene) continue;
            const dx = r.icon.x - this.nave.x, dy = r.icon.y - this.nave.y;
            if (dx*dx + dy*dy <= PICKUP * PICKUP) colhidos.push(r);
            else                                  restantes.push(r);
        }
        if (colhidos.length === 0) return;

        curral.readyIcons = restantes;
        // Mantém compat com array `ready` (icons brutos)
        const colhidosIcons = colhidos.map(r => r.icon);
        curral.ready = (curral.ready || []).filter(b => !colhidosIcons.includes(b));

        let pontosBrutos = 0, qtd = 0;
        for (const r of colhidos) {
            const b = r.icon;
            pontosBrutos += b.valorBurger || 100;
            qtd++;
            if (r.bounce) r.bounce.stop();
            this.tweens.killTweensOf(b);
            this.tweens.add({
                targets: b,
                x: this.nave.x, y: this.nave.y,
                alpha: 0, scale: 0.4,
                duration: 320, ease: 'Cubic.easeIn',
                onComplete: () => { if (b.scene) b.destroy(); }
            });
        }
        this._reflowFila(curral);

        const multi = qtd>=4 ? 3 : qtd>=2 ? 2 : 1;
        const pontos = pontosBrutos * multi;
        this.scoreAtual += pontos;
        this.textoScore.setText(this.scoreAtual);
        this.combustivelAtual = Math.min(this.combustivelMax, this.combustivelAtual + 28*qtd);
        this.cameras.main.flash(220, 255, 220, 0);
        const lbl = '+' + pontos + (multi>1 ? ' x'+multi : '');
        const popup = this.add.text(this.nave.x, this.nave.y-60, lbl, {
            fontSize:'20px',fill:'#ffcc00',fontStyle:'bold'
        }).setDepth(50).setOrigin(0.5);
        this.tweens.add({targets:popup, y:popup.y-70, alpha:0, duration:900, onComplete:()=>popup.destroy()});
    },

    // Vaca chubby representativa no centro do curral, com anims rotativas
    // (eat 60% / walk 30% / lie 10%). Counter "xN" maior acima.
    // Só renderiza se mascoteCount > 0; esconde quando zera.
    _ensureCowMascote(curral) {
        if (curral.mascote && curral.mascote.scene) {
            curral.mascote.setVisible(true);
            curral.mascoteCountTxt.setVisible(true);
            return curral.mascote;
        }
        // Sprite com .anims (puro add.sprite, sem física)
        const m = this.add.sprite(curral.x, curral.y, 'vaca_S')
            .setDisplaySize(64, 64).setDepth(2);

        // State machine de idle (anim aleatória 2-4s, depois sorteia próxima)
        const dirs = ['S','SE','E','SW','W'];
        const pickAnim = () => {
            const r = Math.random();
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            let key;
            if (r < 0.60) key = `vaca_eat_${dir}`;       // 60% comendo
            else if (r < 0.90) key = `vaca_walk_${dir}`; // 30% andando
            else key = `vaca_angry_${dir}`;              // 10% deitada (lie_down)
            if (this.anims.exists(key)) m.play(key, true);
        };
        pickAnim();
        // Roda nova anim a cada 3-5s
        m._animTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000),
            loop: true,
            callback: () => {
                if (!m.scene) return;
                pickAnim();
                m._animTimer.delay = Phaser.Math.Between(3000, 5000);
            }
        });

        // Counter "xN" MAIOR (20px) com stroke grosso
        const txt = this.add.text(curral.x, curral.y - 48, 'x0', {
            fontSize: '22px', fill: '#ffee88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(40);

        curral.mascote = m;
        curral.mascoteCount = 0;
        curral.mascoteCountTxt = txt;
        // Começa invisível (count=0)
        m.setVisible(false);
        txt.setVisible(false);
        return m;
    },

    // Atualiza visibilidade da mascote baseado no counter (esconde se 0)
    _updateMascoteVisibilidade(curral) {
        if (!curral.mascote) return;
        const visible = curral.mascoteCount > 0;
        curral.mascote.setVisible(visible);
        if (curral.mascoteCountTxt) curral.mascoteCountTxt.setVisible(visible);
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

            // Incrementa counter da mascote
            curral.mascoteCount += 1;
            curral.mascoteCountTxt.setText('x' + curral.mascoteCount);
            this._updateMascoteVisibilidade(curral);
            this.tweens.add({
                targets: curral.mascoteCountTxt, scale: { from: 1.6, to: 1 },
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
            curral.mascoteCountTxt.setText('x' + curral.mascoteCount);
        }
        this._updateMascoteVisibilidade(curral);

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

    // DEPRECATED — substituído por _coletarBurgersPerto (coleta in-place por proximidade)
    // Mantido como no-op pra compat caso seja chamado de algum lugar.
    _coletarDoCurral(curral) { /* no-op */ },

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
