// 09_inimigos.js — Atiradores fixos (torres) e fazendeiros móveis
Object.assign(Jogo.prototype, {

    _setupAtiradores() {
        // 6 torres fixas em posições estratégicas
        this.balas = [];
        this.atiradores = [];
        const POSTS = [[480,480],[2720,480],[480,1920],[2720,1920],[1600,280],[1600,2120]];
        for (const [ax,ay] of POSTS) {
            const spr = this.add.image(ax, ay, 'atirador').setDepth(2).setScale(1.4);
            this.atiradores.push({ x:ax, y:ay, sprite:spr, cooldown: Phaser.Math.Between(800,3000) });
        }
    },

    _destruirAtirador(at, hitter) {
        if (this.cameras.main.worldView.contains(at.x, at.y)) {
            this.cameras.main.shake(180, 0.012);
        }
        const flash = this.add.circle(at.x, at.y, 30, 0xff8800, 0.9).setDepth(50);
        this.tweens.add({ targets: flash, scale: 2.6, alpha: 0, duration: 420, onComplete: () => flash.destroy() });
        this.tweens.add({
            targets: at.sprite,
            scale: 2.0, alpha: 0, angle: 90,
            duration: 360,
            onComplete: () => at.sprite.destroy()
        });
        // Sacrifica o projétil (vaca/boi/fazendeiro arremessado)
        if (hitter) this._explodir(hitter, 0xff8800);
        this._checkVitoria();
    },

    _atualizarAtiradores(delta) {
        const RANGE = 420;
        const RANGE_SQ = RANGE * RANGE;
        const VEL = 4.5;
        const danoMul = this.dbg?.behavior?.danoAtirador ?? 1.0;
        const DANO = 13 * danoMul;
        const MAX_DIST = 580;

        for (const at of this.atiradores) {
            const dx = this.nave.x - at.x, dy = this.nave.y - at.y;
            const emRange = (dx*dx + dy*dy) <= RANGE_SQ;

            at.sprite.setTint(emRange ? 0xff4400 : 0xffffff);
            at.cooldown -= delta;
            if (!emRange || at.cooldown > 0) continue;

            at.cooldown = Phaser.Math.Between(2000, 3500);
            const ang = Math.atan2(dy, dx);
            const bSprite = this.add.circle(at.x, at.y, 5, 0xff4400).setDepth(8);
            this.balas.push({ sprite: bSprite, vx: Math.cos(ang)*VEL, vy: Math.sin(ang)*VEL, dist: 0 });

            const flash = this.add.circle(at.x, at.y, 14, 0xffcc00, 0.9).setDepth(9);
            this.tweens.add({ targets: flash, scale: 0.1, alpha: 0, duration: 180, onComplete: () => flash.destroy() });
        }

        // Limites do mundo + margem pra detectar saída de tela
        const W = 8000, H = 6000;
        this.balas = this.balas.filter(b => {
            if (!b.sprite || !b.sprite.active) return false;
            b.sprite.x += b.vx;
            b.sprite.y += b.vy;
            b.dist += VEL;

            const dx = b.sprite.x - this.nave.x, dy = b.sprite.y - this.nave.y;
            // Bala "armada" só após 25px — evita hit instantâneo se atirador estiver colado
            if (b.dist >= 25 && dx*dx + dy*dy < 22*22) {
                this.pacienciaAtual = Math.max(0, this.pacienciaAtual - DANO);
                this.cameras.main.shake(200, 0.013);
                this.cameras.main.flash(160, 255, 80, 0);
                b.sprite.destroy();
                return false;
            }
            // Bala segue até sair dos limites do mundo (não fade após MAX_DIST)
            if (b.sprite.x < -50 || b.sprite.x > W+50 || b.sprite.y < -50 || b.sprite.y > H+50) {
                b.sprite.destroy();
                return false;
            }
            return true;
        });

        // Slam: entidade arremessada bate na torre → ambos destruídos
        this.atiradores = this.atiradores.filter(at => {
            for (const v of this.vacas_abduzidas) {
                if (!v.scene || !v.body || v.isBurger) continue;
                const ddx = v.x - at.x, ddy = v.y - at.y;
                if (ddx*ddx + ddy*ddy < 35*35) {
                    this._destruirAtirador(at, v);
                    return false;
                }
            }
            return true;
        });
    },

    _spawnFazendeiros(n) {
        const W = 8000, H = 6000;
        for (let i = 0; i < n; i++) {
            const x = Phaser.Math.Between(400, W-400);
            const y = Phaser.Math.Between(400, H-400);
            // matter.add.SPRITE (não image) — sprite suporta .anims pra running
            const fazScale = (this.dbg?.scale?.faz) ?? 2.0;
            const fazSize  = 81 * fazScale;
            const f = this.matter.add.sprite(x, y, 'faz_S');
            // setBody EXPLÍCITO depois — o options no sprite parece ser ignorado em algumas
            // versões do Phaser, deixando body do tamanho da textura (180×180 = bug)
            f.setBody({type:'circle', radius:16});
            f.setDisplaySize(fazSize, fazSize);
            // Lock rotação física: sem isso, colisões com vacas (que vêm pelo beam)
            // viravam o sprite de lado e ele aparecia "deitado" como humano de perfil
            f.setFixedRotation();
            f.setFrictionAir(0.1).setMass(2).setDepth(6)
             .setCollisionCategory(8).setCollidesWith([1, 2, 8]);
            f.body.label = 'fazendeiro';
            f.isEnemy = true;
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
            this.fazendeiros.push(f);
        }
    },

    _atualizarFazendeiros(delta) {
        const velMul = this.dbg?.behavior?.velFaz ?? 1.0;
        const danoMul = this.dbg?.behavior?.danoAtirador ?? 1.0;
        const IDLE_F   = 0.0008 * velMul; // mesmo ritmo do idle das vacas brancas
        const SHOOT_SQ = 420 * 420;
        const VEL      = 4.5;

        for (const f of this.fazendeiros) {
            if (!f.scene || !f.body) continue;

            const isAbducted = this.vacas_abduzidas.includes(f);

            // Caminhada idle (não anda nem atira sendo arremessado)
            if (f._wandering && !isAbducted) {
                f.applyForce({ x: Math.cos(f.wanderAngle)*IDLE_F, y: Math.sin(f.wanderAngle)*IDLE_F });
            }
            // Sprite direcional 8-dir baseado em velocidade
            if (!isAbducted) {
                const vx = f.body.velocity.x, vy = f.body.velocity.y;
                const sp = Math.sqrt(vx*vx + vy*vy);
                let dir = f._lastDir || 'S';
                const moving = sp > 0.05;
                if (moving) {
                    const deg = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
                    const i = Math.round(deg / 45) % 8;
                    dir = ['E','SE','S','SW','W','NW','N','NE'][i];
                    // Chapéu de palha cobre o corpo na vista N pura — reroteia pra NE/NW
                    if (dir === 'N') dir = (vx >= 0) ? 'NE' : 'NW';
                    f._lastDir = dir;
                }
                if (moving) {
                    const animKey = `faz_run_${dir}`;
                    if (f.anims.currentAnim?.key !== animKey) f.play(animKey, true);
                } else {
                    if (f.anims.isPlaying) f.anims.stop();
                    const k = `faz_${dir}`;
                    if (f.texture.key !== k) f.setTexture(k);
                }
            }
            if (isAbducted) continue;

            // Disparo quando nave está perto (mas com distância mínima de engajamento)
            const dx = this.nave.x - f.x, dy = this.nave.y - f.y;
            const distSq = dx*dx + dy*dy;
            f._cooldown -= delta;
            if (distSq <= SHOOT_SQ && distSq > 80*80 && f._cooldown <= 0) {
                f._cooldown = Phaser.Math.Between(2200, 3800);
                const ang = Math.atan2(dy, dx);
                const bSprite = this.add.circle(f.x, f.y, 4, 0xff4400).setDepth(8);
                this.balas.push({ sprite: bSprite, vx: Math.cos(ang)*VEL, vy: Math.sin(ang)*VEL, dist: 0 });
                const flash = this.add.circle(f.x, f.y, 11, 0xffcc00, 0.85).setDepth(9);
                this.tweens.add({ targets: flash, scale: 0.1, alpha: 0, duration: 160, onComplete: () => flash.destroy() });
                // Puff de fumaça do disparo (3 nuvenzinhas com offset aleatório)
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
