// 09_enemies.js — Shooters fixos (torres) e farmers móveis
Object.assign(Jogo.prototype, {

    _setupShooters() {
        // 6 torres fixas em positions estratégicas
        this.bullets = [];
        this.shooters = [];
        const POSTS = [[480,480],[2720,480],[480,1920],[2720,1920],[1600,280],[1600,2120]];
        for (const [ax,ay] of POSTS) {
            const spr = this.add.image(ax, ay, 'atirador').setDepth(2).setScale(1.4);
            this._attachSombra(spr, { rx: 22, ry: 8, alpha: 0.40, offY: 16, offX: 4 });
            this.shooters.push({ x:ax, y:ay, sprite:spr, cooldown: Phaser.Math.Between(800,3000) });
        }
    },

    _destroyShooter(at, hitter) {
        if (this.cameras.main.worldView.contains(at.x, at.y)) {
            this.cameras.main.shake(180, 0.012);
        }
        // HUD counter: shooter destruido
        this.shootersTotal = (this.shootersTotal || 0) + 1;
        if (this.hud?.shootersText) this.hud.shootersText.setText(this.shootersTotal);
        const flash = this.add.circle(at.x, at.y, 30, 0xff8800, 0.9).setDepth(50);
        this.tweens.add({ targets: flash, scale: 2.6, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
        this.tweens.add({
            targets: at.sprite,
            scale: 2.0, alpha: 0, angle: 90,
            duration: 360,
            onComplete: () => at.sprite.destroy()
        });
        // Sacrifica o projétil (cow/ox/farmer arremessado)
        if (hitter) this._explode(hitter, 0xff8800);
        this._checkVictory();
    },

    _updateShooters(delta) {
        const RANGE = 420;
        const RANGE_SQ = RANGE * RANGE;
        const VEL = 4.5;
        const danoMul = this.dbg?.behavior?.shooterDamage ?? 1.0;
        const DANO = 13 * danoMul;
        const MAX_DIST = 580;

        for (const at of this.shooters) {
            const dx = this.ufo.x - at.x, dy = this.ufo.y - at.y;
            const emRange = (dx*dx + dy*dy) <= RANGE_SQ;

            at.sprite.setTint(emRange ? 0xff4400 : 0xffffff);
            at.cooldown -= delta;
            if (!emRange || at.cooldown > 0) continue;

            at.cooldown = Phaser.Math.Between(2000, 3500);
            // M5: cap rígido de 100 bullets — descarta a more antiga se full
            if (this.bullets.length >= 100) {
                const oldest = this.bullets.shift();
                if (oldest && oldest.sprite && oldest.sprite.scene) oldest.sprite.destroy();
            }
            const ang = Math.atan2(dy, dx);
            const bSprite = this.add.circle(at.x, at.y, 5, 0xff4400).setDepth(8);
            this.bullets.push({ sprite: bSprite, vx: Math.cos(ang)*VEL, vy: Math.sin(ang)*VEL, dist: 0 });

            const flash = this.add.circle(at.x, at.y, 14, 0xffcc00, 0.9).setDepth(9);
            this.tweens.add({ targets: flash, scale: 0.1, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
        }

        // Limites do world + margem to detectar saída de screen
        const W = 8000, H = 6000;
        this.bullets = this.bullets.filter(b => {
            if (!b.sprite || !b.sprite.active) return false;
            b.sprite.x += b.vx;
            b.sprite.y += b.vy;
            b.dist += VEL;

            const dx = b.sprite.x - this.ufo.x, dy = b.sprite.y - this.ufo.y;
            // bullet "armada" only após 25px — avoids hit instantâneo se shooter estiver colado
            if (b.dist >= 25 && dx*dx + dy*dy < 22*22) {
                this.fuelCurrent = Math.max(0, this.fuelCurrent - DANO);
                this.cameras.main.shake(200, 0.013);
                this.cameras.main.flash(160, 255, 80, 0);
                b.sprite.destroy();
                return false;
            }
            // bullet segue até sair dos limites do world (não fade após MAX_DIST)
            if (b.sprite.x < -50 || b.sprite.x > W+50 || b.sprite.y < -50 || b.sprite.y > H+50) {
                b.sprite.destroy();
                return false;
            }
            return true;
        });

        // Slam: entidade arremessada bate na torre → ambos destruídos
        this.shooters = this.shooters.filter(at => {
            for (const v of this.abductedCows) {
                if (!v.scene || !v.body || v.isBurger) continue;
                const ddx = v.x - at.x, ddy = v.y - at.y;
                if (ddx*ddx + ddy*ddy < 35*35) {
                    this._destroyShooter(at, v);
                    return false;
                }
            }
            return true;
        });
    },

    _spawnFarmers(n) {
        const W = 8000, H = 6000;
        for (let i = 0; i < n; i++) {
            const x = Phaser.Math.Between(400, W-400);
            const y = Phaser.Math.Between(400, H-400);
            // matter.add.SPRITE (not image) — sprite suporta .anims to running
            const farmerScale = (this.dbg?.scale?.farmer) ?? 2.0;
            const farmerSize  = 81 * farmerScale;
            const f = this.matter.add.sprite(x, y, 'farmer_S');
            // setBody EXPLÍCITO after — o options no sprite parece ser ignorado em algumas
            // versões do Phaser, deixando body do size da textura (180×180 = bug)
            f.setBody({type:'circle', radius:16});
            f.setDisplaySize(farmerSize, farmerSize);
            // Lock rotação física: without this, collisions with cows (que vêm pelo beam)
            // viravam o sprite de lado e ele aparecia "deitado" as humano de perfil
            f.setFixedRotation();
            f.setFrictionAir(0.1).setMass(2).setDepth(6)
             .setCollisionCategory(8).setCollidesWith([1, 2, 8]);
            f.body.label = 'farmer';
            f.isEnemy = true;
            // HP=1: farmer only morre em pedra with impacto high
            f._hp = 1;
            f.setBounce(0.45);  // bounce more visível ao bater em cow/ox/cacto
            f.wanderAngle = Math.random() * Math.PI * 2;
            f._wandering = true;
            f._cooldown = Phaser.Math.Between(1000, 3500);
            f._timer = this.time.addEvent({
                delay: Phaser.Math.Between(1400, 3000),
                loop: true,
                callback: () => {
                    if (!f.scene || !f.body) return;
                    if (Math.random() < 0.2) { f._wandering = false; return; }
                    f.wanderAngle = Math.random() * Math.PI * 2;
                    f._wandering = true;
                }
            });
            // shadow blur below do farmer
            this._attachSombra(f, { rx: 24, ry: 9, alpha: 0.45, offY: 18, offX: 5 });

            this.farmers.push(f);
        }
    },

    _updateFarmers(delta) {
        const velMul = this.dbg?.behavior?.farmerSpeed ?? 1.0;
        const danoMul = this.dbg?.behavior?.shooterDamage ?? 1.0;
        const IDLE_F   = 0.0008 * velMul; // same ritmo do idle das cows brancas
        const SHOOT_SQ = 420 * 420;
        const VEL      = 4.5;

        for (const f of this.farmers) {
            if (!f.scene || !f.body) continue;

            const isAbducted = this.abductedCows.includes(f);

            // Caminhada idle (não anda nem atira sendo arremessado)
            if (f._wandering && !isAbducted) {
                f.applyForce({ x: Math.cos(f.wanderAngle)*IDLE_F, y: Math.sin(f.wanderAngle)*IDLE_F });
            }
            // Sprite directional ja indica direcao — sem rotation EXCETO se abduzido
            // OU se acabou de ser solto (release-spin window de 3s, mantem inercia + spin).
            const now = this.time?.now ?? 0;
            const inSpin = f._releaseSpinUntil && now < f._releaseSpinUntil;
            if (inSpin) {
                // Spin continuo a _spinRate rad/s (delta em ms -> /1000)
                f.rotation += (f._spinRate || 10) * (delta / 1000);
            } else if (!isAbducted) {
                if (f._releaseSpinUntil) {
                    // Janela acabou — reset rotation + friction normal
                    f._releaseSpinUntil = 0;
                    f.rotation = 0;
                    if (f.scene && f.body) f.setFrictionAir(0.08);
                }
                if (f.rotation !== 0) f.rotation = 0;
                if (Math.abs(f.body.angle) > 0.001 && this.matter?.body) {
                    this.matter.body.setAngle(f.body, 0);
                }
            }
            // Skip IA + sprite update enquanto spinning (inercia leva ele)
            if (inSpin) continue;
            // Sprite direcional 8-dir baseado em speed
            if (!isAbducted) {
                const vx = f.body.velocity.x, vy = f.body.velocity.y;
                const sp = Math.sqrt(vx*vx + vy*vy);
                let dir = f._lastDir || 'S';
                const moving = sp > 0.05;
                if (moving) {
                    const deg = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
                    const i = Math.round(deg / 45) % 8;
                    dir = ['E','SE','S','SW','W','NW','N','NE'][i];
                    // Chapéu de palha cobre o corpo na vista N pura — reroteia to NE/NW
                    if (dir === 'N') dir = (vx >= 0) ? 'NE' : 'NW';
                    f._lastDir = dir;
                }
                if (moving) {
                    const animKey = `farmer_run_${dir}`;
                    if (f.anims.currentAnim?.key !== animKey) f.play(animKey, true);
                } else {
                    if (f.anims.isPlaying) f.anims.stop();
                    const k = `farmer_${dir}`;
                    if (f.texture.key !== k) f.setTexture(k);
                }
            }
            if (isAbducted) continue;

            // Disparo when ship is perto (mas with distance mínima de engajamento)
            const dx = this.ufo.x - f.x, dy = this.ufo.y - f.y;
            const distSq = dx*dx + dy*dy;
            f._cooldown -= delta;
            if (distSq <= SHOOT_SQ && distSq > 80*80 && f._cooldown <= 0) {
                f._cooldown = Phaser.Math.Between(2200, 3800);
                const ang = Math.atan2(dy, dx);
                // Cap rígido (M5)
                if (this.bullets.length >= 100) {
                    const oldest = this.bullets.shift();
                    if (oldest && oldest.sprite && oldest.sprite.scene) oldest.sprite.destroy();
                }
                const bSprite = this.add.circle(f.x, f.y, 4, 0xff4400).setDepth(8);
                this.bullets.push({ sprite: bSprite, vx: Math.cos(ang)*VEL, vy: Math.sin(ang)*VEL, dist: 0 });
                const flash = this.add.circle(f.x, f.y, 11, 0xffcc00, 0.85).setDepth(9);
                this.tweens.add({ targets: flash, scale: 0.1, alpha: 0, duration: 160, onComplete: () => flash.destroy() });
                // Puff de fumaça do disparo (3 nuvenzinhas with offset aleatório)
                const muzzleX = f.x + Math.cos(ang) * 18;
                const muzzleY = f.y + Math.sin(ang) * 18;
                for (let p = 0; p < 3; p++) {
                    this._spawnSmoke(muzzleX, muzzleY, {
                        color: 0xeeeeee, alpha: 0.55, size: 5 + Math.random()*3,
                        dur: 380, drift: 14
                    });
                }
            }
        }
    }

});
