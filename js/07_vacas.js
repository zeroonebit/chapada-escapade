// 07_vacas.js — Vacas/bois: criação, IA, abdução, física no feixe, virar burger
Object.assign(Jogo.prototype, {

    _criarVaca(x, y, tipo = 'branca') {
        const label = tipo === 'boi' ? 'boi' : 'vaca';
        const tex   = tipo === 'boi' ? 'boi_cima_sobe' : 'vaca_cima_sobe';
        let v = this.matter.add.image(x, y, tex);
        const escala = tipo === 'boi' ? 0.22 : 0.18;
        v.setScale(escala);
        const massa = tipo === 'boi' ? 3.2 : 2;
        v.setFrictionAir(0.08).setMass(massa).setDepth(5).setCollisionCategory(2);
        v.body.label = label;
        v.isBurger = false;
        v.presaNaMoita = false;
        v.presaNaGrama = false;
        v.gaiolaSprite = null;
        v._dying = false;
        v.tipo = tipo;
        v.valorBurger = 100;
        v.tempoAbducao = tipo === 'boi' ? 4500 : 3000;
        v.burgerYield = tipo === 'boi' ? (Math.random() < 0.5 ? 2 : 3) : 1;
        v.wanderAngle = Math.random() * Math.PI * 2;
        v._wandering = true;

        v.walkTimer = this.time.addEvent({
            delay: Phaser.Math.Between(1200, 2800),
            loop: true,
            callback: () => {
                if (!v.scene || !v.body || v._dying) return;
                if (this.vacas_abduzidas.includes(v) || v.isBurger || v.presaNaMoita || v.presaNaGrama || v._inCurral) return;
                // 20% de chance de parar pra "pastar", senão escolhe novo rumo
                if (Math.random() < 0.2) { v._wandering = false; return; }
                v.wanderAngle = Math.random() * Math.PI * 2;
                v._wandering = true;
            }
        });

        this.vacas.push(v);
        return v;
    },

    _criarBurgerEntity(x, y) {
        const b = this.matter.add.image(x, y, 'hamburguer', null, { shape: { type: 'circle', radius: 10 } });
        b.setFrictionAir(0.015).setMass(0.5).setDepth(3).setCollisionCategory(2);
        b.isBurger = true;
        b.valorBurger = 100;
        b.presaNaMoita = false;
        b.presaNaGrama = false;
        b.gaiolaSprite = null;
        b._dying = false;
        b._destroyed = false;
        b.tipo = 'burger';
        b.tempoAbducao = 0;
        b.burgerYield = 1;
        return b;
    },

    _spawnVacas(n) {
        const W=3200, H=2400;
        for(let i=0; i<n; i++) {
            const tipo = Math.random() < 0.20 ? 'boi' : 'branca';
            this._criarVaca(Phaser.Math.Between(300,W-300), Phaser.Math.Between(300,H-300), tipo);
        }
    },

    // Idempotente — seguro chamar múltiplas vezes
    _destruirVaca(v) {
        if (!v || v._destroyed) return;
        v._destroyed = true;
        if (v.walkTimer) { v.walkTimer.remove(); v.walkTimer = null; }
        if (v._timer)    { v._timer.remove();    v._timer = null; }
        if (v.timer)     { v.timer.remove();     v.timer = null; }
        if (v.gaiolaSprite) {
            this.tweens.killTweensOf(v.gaiolaSprite);
            v.gaiolaSprite.destroy();
            v.gaiolaSprite = null;
        }
        this.tweens.killTweensOf(v);
        if (v.scene) v.destroy();
    },

    // Animação + cleanup unificado de explosão (vaca, boi, fazendeiro)
    _explodir(entity, color = 0xff2222) {
        if (!entity || entity._dying || entity._destroyed) return;
        entity._dying = true;
        if (this.vacas_abduzidas.includes(entity)) this._soltarVaca(entity);
        if (entity.isEnemy) {
            this.fazendeiros = this.fazendeiros.filter(f => f !== entity);
        } else {
            this.vacas = this.vacas.filter(v => v !== entity);
        }
        if (entity.body) entity.setStatic(true);
        entity.setTint(color);
        if (this.cameras.main.worldView.contains(entity.x, entity.y)) {
            this.cameras.main.shake(120, 0.007);
        }
        this.tweens.add({
            targets: entity,
            scale: 2.2,
            alpha: 0,
            duration: 220,
            onComplete: () => {
                const wasEnemy = entity.isEnemy;
                this._destruirVaca(entity);
                if (wasEnemy) this._checkVitoria();
            }
        });
    },

    // ── GRAMA ────────────────────────────────────────────────────────
    _isOverGrass(x, y) { return this._grassDepth(x, y) > 0; },

    // 0 fora da grama, cresce até 1 no centro
    _grassDepth(x, y) {
        let maxD = 0;
        for (let i = 0; i < this.grassPatches.length; i++) {
            const g = this.grassPatches[i];
            const dx = x - g.x, dy = y - g.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const ang = Math.atan2(dy, dx);
            const rr = g.r * (1 + this._noiseR(ang, g.seed));
            if (dist < rr) {
                const d = 1 - dist / rr;
                if (d > maxD) maxD = d;
            }
        }
        return maxD;
    },

    _prenderNaGrama(v) {
        if (!v || !v.scene || v._dying || v.presaNaGrama) return;
        v.presaNaGrama = true;
        this._soltarVaca(v);
        if (v.scene && v.body) {
            v.setStatic(true);
            v.setDepth(4);
            v.setTint(0xddffaa);
        }
    },

    // ── ABDUÇÃO E FÍSICA NO FEIXE ────────────────────────────────────
    _tentarAbduzir() {
        const tryAbduct = (v) => {
            if (this.vacas_abduzidas.length >= 5) return;
            if (v._dying || v._destroyed || v.presaNaMoita || v.presaNaGrama || v._inCurral || this.vacas_abduzidas.includes(v)) return;
            let d = Phaser.Math.Distance.Between(this.nave.x, this.nave.y, v.x, v.y);
            if (d <= this.raioCone) {
                this.vacas_abduzidas.push(v);
                v.setFrictionAir(0.015).setDepth(3);
                v.setAngularVelocity((Math.random() - 0.5) * 0.4); // spin inicial pra glissagem
                if (v.walkTimer) v.walkTimer.paused = true;
            }
        };
        this.vacas.forEach(tryAbduct);
        this.fazendeiros.forEach(tryAbduct);
    },

    _fisicaBacia(v) {
        if (!v.scene || !v.body || v._dying) return;
        // Inimigos não ficam presos na grama — flutuam livres pra serem arremessados
        if (!v.isBurger && !v.isEnemy) {
            const depth = this._grassDepth(v.x, v.y);
            if (depth > 0.7) { this._prenderNaGrama(v); return; }
            // Atrito progressivo: 0.015 fora, sobe quadraticamente até quase travar
            v.setFrictionAir(0.015 + depth * depth * 2.8);
        }
        let dx = this.nave.x-v.x, dy = this.nave.y-v.y;
        let dist = Math.sqrt(dx*dx+dy*dy), ang = Math.atan2(dy, dx);
        v.applyForce({x: Math.cos(ang)*0.0008, y: Math.sin(ang)*0.0008});
        if (dist > this.raioCone*0.7) v.applyForce({x: Math.cos(ang)*0.003, y: Math.sin(ang)*0.003});
        if (dist > 10) v.applyForce({x: (Math.random()-0.5)*0.001, y: (Math.random()-0.5)*0.001});
        // sem reset de angular velocity — deixa girar com a física pra dar glissagem
    },

    _virarBurger(v) {
        if (!v.scene || v._destroyed || v.isBurger) return;

        if (v.tipo === 'boi') {
            // Boi vira 2-3 burgers (spawna entidades extras)
            const yld = v.burgerYield || 2;
            const px = v.x, py = v.y;
            this.vacas_abduzidas = this.vacas_abduzidas.filter(x => x !== v);
            this.vacas = this.vacas.filter(x => x !== v);
            this._destruirVaca(v);
            for (let i = 0; i < yld; i++) {
                const ang = (i / yld) * Math.PI * 2;
                const ox = Math.cos(ang) * 14, oy = Math.sin(ang) * 14;
                const b = this._criarBurgerEntity(px + ox, py + oy);
                this.vacas.push(b);
                this.vacas_abduzidas.push(b);
            }
            this.burgerCount += yld;
            this.textoContador.setText(this.burgerCount);
            return;
        }

        v.setBody({type:'circle', radius:10});
        v.setTexture('hamburguer');
        v.isBurger = true;
        v.setMass(0.5).setDepth(3);
        this.burgerCount++;
        this.textoContador.setText(this.burgerCount);
    },

    _texturaDirecional(v) {
        // Sempre usa cima_sobe — sprite top-down puro pra rotação física ficar natural
        if (v.isBurger || v._inCurral) return;
        const base = v.tipo === 'boi' ? 'boi' : 'vaca';
        const key = `${base}_cima_sobe`;
        if (v.texture.key !== key) v.setTexture(key);
    },

    _atualizarIAVacas() {
        const FLEE_DIST = 160;
        const FLEE_DIST_SQ = FLEE_DIST * FLEE_DIST;
        for (let i = 0; i < this.vacas.length; i++) {
            const v = this.vacas[i];
            if (!v.scene || !v.body || v._dying) continue;
            if (v.isBurger || v.presaNaMoita || v.presaNaGrama || v._inCurral) continue;
            if (this.vacas_abduzidas.includes(v)) continue;
            this._texturaDirecional(v);

            const dx = v.x - this.nave.x, dy = v.y - this.nave.y;
            const distSq = dx*dx + dy*dy;
            const baseF = v.tipo === 'boi' ? 0.0010 : 0.0016;

            if (distSq >= FLEE_DIST_SQ) {
                // Idle — caminha no rumo do walkTimer com força reduzida (sem rotação manual)
                if (v._wandering) {
                    const idleF = baseF * 0.5;
                    v.applyForce({ x: Math.cos(v.wanderAngle) * idleF, y: Math.sin(v.wanderAngle) * idleF });
                }
                continue;
            }

            // Fuga — quanto mais perto a nave, mais forte (fade-in suave)
            const intensidade = 1 - Math.sqrt(distSq) / FLEE_DIST;
            // Mira grama; sem grama, vai pro lado oposto da nave
            let alvoX = null, alvoY = null, melhor = Infinity;
            for (let j = 0; j < this.grassPatches.length; j++) {
                const g = this.grassPatches[j];
                const gx = g.x - v.x, gy = g.y - v.y;
                const d = gx*gx + gy*gy;
                if (d < melhor) { melhor = d; alvoX = g.x; alvoY = g.y; }
            }
            let ang;
            if (alvoX !== null) ang = Math.atan2(alvoY - v.y, alvoX - v.x);
            else ang = Math.atan2(dy, dx);
            const f = baseF * intensidade;
            v.applyForce({ x: Math.cos(ang)*f, y: Math.sin(ang)*f });
        }
    },

    _soltarVaca(vaca) {
        this.vacas_abduzidas = this.vacas_abduzidas.filter(v => v !== vaca);
        if (vaca.scene && vaca.body && !vaca._dying) vaca.setFrictionAir(0.08).setDepth(5);
        if (vaca.timer) { vaca.timer.remove(); vaca.timer = null; }
    },

    _soltarTodas() {
        this.vacas_abduzidas.forEach(v => {
            this._soltarVaca(v);
            if (v.walkTimer) v.walkTimer.paused = false;
        });
        this.vacas_abduzidas = [];
    },

    _dropNonBurgers() {
        const dropped = this.vacas_abduzidas.filter(v => !v.isBurger);
        this.vacas_abduzidas = this.vacas_abduzidas.filter(v => v.isBurger);
        for (const v of dropped) {
            if (v.scene && v.body && !v._dying) v.setFrictionAir(0.08).setDepth(5);
            if (v.timer) { v.timer.remove(); v.timer = null; }
            if (v.walkTimer) v.walkTimer.paused = false;
        }
    }

});
