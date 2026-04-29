// 10_colisao.js — Setup do listener de colisões + handler + repovoamento
Object.assign(Jogo.prototype, {

    _setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                let a=pair.bodyA.gameObject, b=pair.bodyB.gameObject;
                if(!a||!b) return;
                let entityKeys = ['vaca','boi','hamburguer','fazendeiro'];
                if(a.scene && a.body && entityKeys.includes(a.body.label)) this._environmentCollision(a, b.body.label, b);
                if(b.scene && b.body && entityKeys.includes(b.body.label)) this._environmentCollision(b, a.body.label, a);
            });
        });
    },

    _environmentCollision(entity, otherLabel, otherEntity) {
        if (entity._dying || entity._destroyed) return;
        // Tutorial: vacas/bois imortais (skip total)
        if (this._tutVacasImortais && (entity.body.label === 'vaca' || entity.body.label === 'boi')) return;

        const entityIsEnemy   = !!entity.isEnemy;
        const entityAbducted  = this.abductedCows.includes(entity);
        const otherAbducted   = otherEntity && this.abductedCows.includes(otherEntity);
        const vel             = entity.body.velocity;
        const speed           = Math.sqrt(vel.x*vel.x + vel.y*vel.y);
        const HIGH_SPEED      = 4.0;
        const isHighImpact    = entityAbducted || otherAbducted || speed > HIGH_SPEED;

        // Debounce: ignora hits no mesmo frame ou < 120ms
        const now = this.time?.now ?? 0;
        if (entity._lastHitT && (now - entity._lastHitT) < 120) return;

        // ROCHA: única forma de morte do fazendeiro. Vaca/boi tem hp 3-5
        if (otherLabel === 'rocha') {
            if (!isHighImpact) return;
            entity._lastHitT = now;
            entity._hp = (entity._hp ?? 1) - 1;
            this._hitFlash(entity, entityIsEnemy ? 0xff8800 : 0xffaa00);
            if (entity._hp <= 0) {
                this._explode(entity, entityIsEnemy ? 0xff8800 : 0xff2222);
            }
        }
        // VACA-VACA / VACA-BOI / BOI-BOI: dano só com impacto de alta velocidade
        else if (otherLabel === 'vaca' || otherLabel === 'boi') {
            if (entityIsEnemy) return;       // fazendeiro: bounce físico, sem dano
            if (!isHighImpact) return;
            entity._lastHitT = now;
            entity._hp = (entity._hp ?? 1) - 1;
            this._hitFlash(entity, 0xffcc44);
            if (entity._hp <= 0) this._explode(entity, 0xff2222);
        }
        // CACTO/MOITA: fazendeiro só quica, sem dano. Vaca/boi também não toma dano.
        else if (otherLabel === 'moita') {
            return;  // bounce já tratado pelo Matter (setBounce na entidade)
        }
        // FAZENDEIRO: cow vs farmer — ninguém toma dano (físico só)
        else if (otherLabel === 'fazendeiro') {
            return;
        }
    },

    _hitFlash(entity, color = 0xffcc00) {
        if (!entity || !entity.scene || entity._dying) return;
        entity.setTint(color);
        this.time.delayedCall(120, () => {
            if (entity.scene && !entity._dying) entity.clearTint();
        });
    },

    _repopulate() {
        if (this.tutorialMode) return;
        const W=8000, H=6000;
        if (this.cows.length >= 20) return;
        let n = Math.min(4, 40 - this.cows.length);
        for (let i=0; i<n; i++) {
            let e = Math.floor(Math.random()*4);
            let x, y;
            if (e===0) { x=Phaser.Math.Between(200, W-200); y=200; }
            else if (e===1) { x=Phaser.Math.Between(200, W-200); y=H-200; }
            else if (e===2) { x=200; y=Phaser.Math.Between(200, H-200); }
            else { x=W-200; y=Phaser.Math.Between(200, H-200); }
            const tipo = Math.random() < 0.20 ? 'boi' : 'holstein';
            this._createCow(x, y, tipo);
        }
    }

});
