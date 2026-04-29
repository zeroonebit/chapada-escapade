// 07_vacas.js — Cows/oxen: criação, IA, abdução, física no beam, virar burger
Object.assign(Jogo.prototype, {

    _createCow(x, y, tipo = 'holstein') {
        const label = tipo === 'ox' ? 'ox' : 'cow';
        const tex   = tipo === 'ox' ? 'ox_S' : 'cow_S';
        // matter.add.SPRITE (not image) — sprite supports .anims, image does not
        let v = this.matter.add.sprite(x, y, tex);
        v.setFixedRotation();  // without isso, colisão with beam/shooter deita o bicho de lado
        // setDisplaySize força size visual fixo (anim frames 68px e static 180px viram mesma scale)
        const baseSize = tipo === 'ox' ? 78 : 68;
        const sizeScale = tipo === 'ox' ? ((this.dbg?.scale?.boi) ?? 3.0) : ((this.dbg?.scale?.cow) ?? 1.0);
        const size = baseSize * sizeScale;
        v.setDisplaySize(size, size);
        const mass = tipo === 'ox' ? 3.2 : 2;
        v.setFrictionAir(0.08).setMass(mass).setDepth(5).setCollisionCategory(2);
        v.body.label = label;
        v.isBurger = false;
        v.stuckInBush = false;
        v.stuckInGrass = false;
        v.gaiolaSprite = null;
        v._dying = false;
        v.tipo = tipo;
        v.valorBurger = 100;
        v.tempoAbducao = tipo === 'ox' ? 4500 : 3000;
        v.burgerYield = tipo === 'ox' ? (Math.random() < 0.5 ? 2 : 3) : 1;
        v.wanderAngle = Math.random() * Math.PI * 2;
        v._wandering = true;
        // Sistema de saúde colisional: 3-5 hits before de explodir
        v._hpMax = Phaser.Math.Between(3, 5);
        v._hp    = v._hpMax;
        v.setBounce(0.5);  // bola que quica e perde energia (matter handles decay)

        v.walkTimer = this.time.addEvent({
            delay: Phaser.Math.Between(1200, 2800),
            loop: true,
            callback: () => {
                if (!v.scene || !v.body || v._dying) return;
                if (this.abductedCows.includes(v) || v.isBurger || v.stuckInBush || v.stuckInGrass || v._inCurral) return;
                // 20% de chance de parar to "pastar", senão escolhe novo rumo
                if (Math.random() < 0.2) { v._wandering = false; return; }
                v.wanderAngle = Math.random() * Math.PI * 2;
                v._wandering = true;
            }
        });

        // Sombra blur below
        const shRx = tipo === 'ox' ? 28 : 22;
        const shRy = tipo === 'ox' ? 10 : 8;
        this._attachSombra(v, { rx: shRx, ry: shRy, alpha: 0.42, offY: shRy*1.6, offX: 4 });

        this.cows.push(v);
        return v;
    },

    _createBurgerEntity(x, y) {
        // Variantes random: classic, cheese, double — ponderado to classic more comum
        const variants = ['burger_classic','burger_classic','burger_cheese','burger_double'];
        const tex = variants[Phaser.Math.Between(0, variants.length-1)];
        const b = this.matter.add.image(x, y, tex, null, { shape: { type: 'circle', radius: 10 } });
        const burgerScale = this.dbg?.scale?.burger ?? 1.0;
        b.setDisplaySize(28 * burgerScale, 28 * burgerScale);
        b.setFrictionAir(0.015).setMass(0.5).setDepth(3).setCollisionCategory(2);
        b.isBurger = true;
        b.valorBurger = 100;
        b.stuckInBush = false;
        b.stuckInGrass = false;
        b.gaiolaSprite = null;
        b._dying = false;
        b._destroyed = false;
        b.tipo = 'burger';
        b.tempoAbducao = 0;
        b.burgerYield = 1;
        b.body.label = 'burger';
        return b;
    },

    _spawnVacas(n) {
        const W=8000, H=6000;
        const okVaca = this.dbg?.enabled?.vacas !== false;
        const okBoi  = this.dbg?.enabled?.bois  !== false;
        for(let i=0; i<n; i++) {
            let tipo;
            if (okVaca && okBoi) {
                const r = Math.random();
                if (r < 0.20) tipo = 'ox';
                else          tipo = 'holstein';
            } else if (okVaca) tipo = 'holstein';
            else if (okBoi)    tipo = 'ox';
            else return;
            this._createCow(Phaser.Math.Between(300,W-300), Phaser.Math.Between(300,H-300), tipo);
        }
    },

    // Idempotente — seguro chamar múltiplas vezes
    _destroyCow(v) {
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
        if (v.shadow && v.shadow.scene) { v.shadow.destroy(); v.shadow = null; }
        this.tweens.killTweensOf(v);
        if (v.scene) v.destroy();
    },

    // Animation + cleanup unificado de explosão (cow, ox, farmer)
    _explode(entity, color = 0xff2222) {
        if (!entity || entity._dying || entity._destroyed) return;
        entity._dying = true;
        if (this.abductedCows.includes(entity)) this._releaseCow(entity);
        // H4: limpa _timer/walkTimer to evitar timer orphan referenciando dead farmer
        if (entity._timer && entity._timer.remove) { entity._timer.remove(); entity._timer = null; }
        if (entity.walkTimer && entity.walkTimer.remove) { entity.walkTimer.remove(); entity.walkTimer = null; }
        if (entity.isEnemy) {
            this.farmers = this.farmers.filter(f => f !== entity);
        } else {
            this.cows = this.cows.filter(v => v !== entity);
        }
        if (entity.body) entity.setStatic(true);
        entity.setTint(color);
        if (this.cameras.main.worldView.contains(entity.x, entity.y)) {
            this.cameras.main.shake(120, 0.007);
        }
        // FX upgrade: shockwave + sparks (toggle via dbg.fx.explosaoBoa)
        if (this.dbg?.fx?.explosaoBoa && this._spawnExplosao) {
            this._spawnExplosao(entity.x, entity.y, color, 1.0);
        }
        this.tweens.add({
            targets: entity,
            scale: 2.2,
            alpha: 0,
            duration: 220,
            onComplete: () => {
                const wasEnemy = entity.isEnemy;
                this._destroyCow(entity);
                if (wasEnemy) this._checkVictory();
            }
        });
    },

    // ── GRAMA ────────────────────────────────────────────────────────
    _isOverGrass(x, y) {
        if (!this.terrainGrid) return false;
        const CELL = this.terrainCell;
        const cx = Math.floor(x / CELL);
        const cy = Math.floor(y / CELL);
        if (cy < 0 || cy >= this.terrainGrid.length) return false;
        const row = this.terrainGrid[cy];
        if (cx < 0 || cx >= row.length) return false;
        return row[cx] === 2; // 2 = grass
    },

    // 1 = cell de grass with 4 cardinais also grass (deep grass)
    // 0.5 = grass de borda (1+ cardinal não-grass)
    // 0 = não is grass
    _grassDepth(x, y) {
        if (!this._isOverGrass(x, y)) return 0;
        const CELL = this.terrainCell;
        const cx = Math.floor(x / CELL);
        const cy = Math.floor(y / CELL);
        const g = this.terrainGrid;
        const ROWS = g.length, COLS = g[0].length;
        const isGrass = (xx, yy) => yy >= 0 && yy < ROWS && xx >= 0 && xx < COLS && g[yy][xx] === 2;
        const allCardinals = isGrass(cx-1,cy) && isGrass(cx+1,cy) && isGrass(cx,cy-1) && isGrass(cx,cy+1);
        return allCardinals ? 1 : 0.5;
    },

    _prenderNaGrama(v) {
        if (!v || !v.scene || v._dying || v.stuckInGrass) return;
        v.stuckInGrass = true;
        this._releaseCow(v);
        if (v.scene && v.body) {
            v.setStatic(true);
            v.setDepth(4);
            v.setTint(0xddffaa);
        }
    },

    // ── ABDUÇÃO E FÍSICA NO FEIXE ────────────────────────────────────
    _tryAbduct() {
        // Conta carga atual usando contador (em vez de filter — perf)
        const carryingCows    = this._cowsInBeamCount  || 0;
        const carryingFarmers  = this._farmersInBeamCount || 0;
        // Mutex via constants
        const canCarryCows    = carryingFarmers === 0 && carryingCows < BEAM_CAP_VACAS;
        const canCarryFarmers  = carryingCows === 0 && carryingFarmers < BEAM_CAP_FARMERS;

        const r2 = this.coneRadius * this.coneRadius;  // squared to evitar sqrt
        const tryAbduct = (v) => {
            if (v._dying || v._destroyed || v.stuckInBush || v._inCurral || this.abductedCows.includes(v)) return;
            if (v.isEnemy && !canCarryFarmers) return;
            if (!v.isEnemy && !canCarryCows) return;
            if (distSq(this.ship.x, this.ship.y, v.x, v.y) > r2) return;
            if (v.stuckInGrass) {
                v.stuckInGrass = false;
                if (v.scene && v.body) {
                    v.setStatic(false);
                    v.clearTint();
                }
            }
            this.abductedCows.push(v);
            v.setFrictionAir(0.015).setDepth(3);
            v.setAngularVelocity((Math.random() - 0.5) * 0.4);
            if (v.walkTimer) v.walkTimer.paused = true;
            if (this._spawnCaptureRings) this._spawnCaptureRings(v);
        };
        this.cows.forEach(tryAbduct);
        this.farmers.forEach(tryAbduct);
        this._updateBeamCounters();
    },

    // H5: reconciler — updates _cowsInBeamCount / _farmersInBeamCount após mutação
    // Eliminou o filter() by frame em _updateBody (was 2 iter by update tick)
    _updateBeamCounters() {
        let cows = 0, farmers = 0;
        for (const v of this.abductedCows) {
            if (v.isEnemy) farmers++;
            else if (!v.isBurger) cows++;
        }
        this._cowsInBeamCount    = cows;
        this._farmersInBeamCount = farmers;
    },

    _basinPhysics(v) {
        if (!v.scene || !v.body || v._dying) return;
        // Não re-prende em grass enquanto abduzida (bug: cow grudava de novo no frame seguinte)
        // Atrito low enquanto no beam — to deslizar livre até a ship
        if (!v.isBurger && !v.isEnemy) {
            v.setFrictionAir(0.015);
        }
        const pullMul = this.dbg?.behavior?.pullBeam ?? 1.0;
        let dx = this.ship.x-v.x, dy = this.ship.y-v.y;
        let dist = Math.sqrt(dx*dx+dy*dy), ang = Math.atan2(dy, dx);
        v.applyForce({x: Math.cos(ang)*0.0008*pullMul, y: Math.sin(ang)*0.0008*pullMul});
        if (dist > this.coneRadius*0.7) v.applyForce({x: Math.cos(ang)*0.003*pullMul, y: Math.sin(ang)*0.003*pullMul});
        if (dist > 10) v.applyForce({x: (Math.random()-0.5)*0.001, y: (Math.random()-0.5)*0.001});
        // without reset de angular velocity — deixa girar with a física to dar glissagem
    },

    _turnIntoBurger(v) {
        if (!v.scene || v._destroyed || v.isBurger) return;

        if (v.tipo === 'ox') {
            // Ox vira 2-3 burgers (spawns entidades extras)
            const yld = v.burgerYield || 2;
            const px = v.x, py = v.y;
            this.abductedCows = this.abductedCows.filter(x => x !== v);
            this._updateBeamCounters();
            this.cows = this.cows.filter(x => x !== v);
            this._destroyCow(v);
            for (let i = 0; i < yld; i++) {
                const ang = (i / yld) * Math.PI * 2;
                const ox = Math.cos(ang) * 14, oy = Math.sin(ang) * 14;
                const b = this._createBurgerEntity(px + ox, py + oy);
                this.cows.push(b);
                this.abductedCows.push(b);
            }
            this.burgerCount += yld;
            this.counterText.setText(this.burgerCount);
            return;
        }

        v.setBody({type:'circle', radius:10});
        const variants = ['burger_classic','burger_classic','burger_cheese','burger_double'];
        const tex = variants[Phaser.Math.Between(0, variants.length-1)];
        v.setTexture(tex);
        const burgerScale = this.dbg?.scale?.burger ?? 1.0;
        v.setDisplaySize(28 * burgerScale, 28 * burgerScale);
        v.isBurger = true;
        v.setMass(0.5).setDepth(3);
        this.burgerCount++;
        this.counterText.setText(this.burgerCount);
    },

    _directionalTexture(v) {
        // State machine + animation: cows têm walk/run/eat/angry × 4 dir.
        // Oxen têm walk × 8 dir (anim) + rotations estáticas (when parado).
        if (v.isBurger || v._inCurral) return;

        const body = v.body;
        const vx = body?.velocity?.x || 0;
        const vy = body?.velocity?.y || 0;
        const speed = Math.sqrt(vx*vx + vy*vy);

        // Direction 8-dir (cow chubby now is 8-dir as o ox)
        // Durante janela de 3s pós-abdução, força south (independe de speed/wander)
        const now = this.time?.now ?? 0;
        const returningSouth = v._returnSouthUntil && now < v._returnSouthUntil;
        let angRad = null;
        if (speed > 0.08) angRad = Math.atan2(vy, vx);
        else if (typeof v.wanderAngle === 'number') angRad = v.wanderAngle;
        let dir8 = v._lastDir8 || 'S';
        if (angRad !== null && !returningSouth) {
            const deg = (angRad * 180 / Math.PI + 360) % 360;
            const i = Math.round(deg / 45) % 8;
            dir8 = ['E','SE','S','SW','W','NW','N','NE'][i];
            v._lastDir8 = dir8;
        }
        if (returningSouth) dir8 = 'S';

        // Ox: walk when movendo, idle_head_shake when parado (fallback static se N)
        if (v.tipo === 'ox') {
            const moving = speed > 0.08;
            if (moving) {
                const animKey = `ox_walk_${dir8}`;
                if (v.anims.currentAnim?.key !== animKey && this.anims.exists(animKey)) {
                    v.play(animKey, true);
                }
            } else {
                const idleKey = `ox_idle_${dir8}`;
                if (this.anims.exists(idleKey)) {
                    if (v.anims.currentAnim?.key !== idleKey) v.play(idleKey, true);
                } else {
                    // dir without idle (ex: N) — usa frame estático
                    if (v.anims?.isPlaying) v.anims.stop();
                    const key = `ox_${dir8}`;
                    if (v.texture.key !== key) v.setTexture(key);
                }
            }
            return;
        }

        // Cow chubby: state machine 4 estados × 8 dir
        let state;
        if (this.abductedCows.includes(v))     state = 'angry';
        else if (v._fleeing)                       state = 'run';
        else if (v._eating)                        state = 'eat';
        else                                       state = 'walk';

        const animKey = `cow_${state}_${dir8}`;
        const cur = v.anims.currentAnim?.key;
        if (cur !== animKey && this.anims.exists(animKey)) {
            v.play(animKey, true);
        }
    },

    _updateCowsAI() {
        // FLEE_DIST/FLEE_DIST_SQ vêm de 00_constants.js
        const velMul = this.dbg?.behavior?.velVaca ?? 1.0;
        const now = this.time?.now ?? 0;
        for (let i = 0; i < this.cows.length; i++) {
            const v = this.cows[i];
            if (!v.scene || !v.body || v._dying) continue;
            if (v.isBurger || v.stuckInBush || v.stuckInGrass || v._inCurral) continue;
            // Abduzidas tocam anim "angry" mas não rodam IA de movimento (beam controla)
            if (this.abductedCows.includes(v)) {
                this._directionalTexture(v);
                continue;
            }
            // Janela pós-soltar: trava IA, deixa atrito high frear, força south
            if (v._returnSouthUntil && now < v._returnSouthUntil) {
                this._directionalTexture(v);
                continue;
            }
            // Saiu da janela: restaura atrito padrão se still estiver high
            if (v._returnSouthUntil && now >= v._returnSouthUntil && v.body) {
                v.setFrictionAir(0.08);
                v._returnSouthUntil = 0;
            }

            const dx = v.x - this.ship.x, dy = v.y - this.ship.y;
            const distSq = dx*dx + dy*dy;
            // Bumpou o ox to 0.0030 (was 0.0010) — before força/mass não vencia atrito,
            // ox parecia preso e picker caía no wanderAngle (random) em vez do vetor speed
            const baseF = (v.tipo === 'ox' ? 0.0030 : 0.0016) * velMul;

            if (distSq >= FLEE_DIST_SQ) {
                // Far do player: alterna between comer e andar with timer
                v._fleeing = false;
                if (v._eatTimer === undefined) v._eatTimer = 0;
                v._eatTimer -= 16; // ~16ms by frame approx
                if (v._eatTimer <= 0) {
                    // 60% chance de comer, 40% de andar
                    v._eating = Math.random() < 0.60;
                    v._eatTimer = v._eating
                        ? Phaser.Math.Between(2500, 5000)   // come 2.5-5s
                        : Phaser.Math.Between(1500, 3500);  // anda 1.5-3.5s
                }
                if (!v._eating && v._wandering) {
                    const idleF = baseF * 0.6;
                    v.applyForce({ x: Math.cos(v.wanderAngle) * idleF, y: Math.sin(v.wanderAngle) * idleF });
                }
                this._directionalTexture(v);
                continue;
            }
            // Dentro do raio de fuga: corre
            v._fleeing = true;
            v._eating = false;
            this._directionalTexture(v);

            // Fuga — quanto more perto a ship, more forte (fade-in suave)
            const intensidade = 1 - Math.sqrt(distSq) / FLEE_DIST;
            // Mira grass; without grass, vai pro lado oposto da ship
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

    _releaseCow(vaca) {
        this.abductedCows = this.abductedCows.filter(v => v !== vaca);
        this._updateBeamCounters();
        if (vaca.scene && vaca.body && !vaca._dying) vaca.setFrictionAir(0.08).setDepth(5);
        if (vaca.timer) { vaca.timer.remove(); vaca.timer = null; }
        // Janela de 3s onde a cow/ox força orientação south e atrito high to parar
        // Picker e IA respeitam essa flag to ignorar wandering during esse período
        vaca._lastDir8 = 'S';
        vaca._returnSouthUntil = (this.time?.now ?? 0) + 3000;
        if (vaca.scene && vaca.body && !vaca._dying) vaca.setFrictionAir(0.4); // freia rapido
        if (vaca.scene && vaca.tipo === 'ox' && this.textures.exists('ox_S')) {
            if (vaca.anims?.isPlaying) vaca.anims.stop();
            vaca.setTexture('ox_S');
        }
    },

    _releaseAll() {
        this.abductedCows.forEach(v => {
            this._releaseCow(v);
            if (v.walkTimer) v.walkTimer.paused = false;
        });
        this.abductedCows = [];
        this._updateBeamCounters();
    },

    _dropNonBurgers() {
        const dropped = this.abductedCows.filter(v => !v.isBurger);
        this.abductedCows = this.abductedCows.filter(v => v.isBurger);
        for (const v of dropped) {
            if (v.scene && v.body && !v._dying) v.setFrictionAir(0.08).setDepth(5);
            if (v.timer) { v.timer.remove(); v.timer = null; }
            if (v.walkTimer) v.walkTimer.paused = false;
        }
    }

});
