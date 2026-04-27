// 10_colisao.js — Setup do listener de colisões + handler + repovoamento
Object.assign(Jogo.prototype, {

    _setupColisoes() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                let a=pair.bodyA.gameObject, b=pair.bodyB.gameObject;
                if(!a||!b) return;
                let entityKeys = ['vaca','boi','hamburguer','fazendeiro'];
                if(a.scene && a.body && entityKeys.includes(a.body.label)) this._colisaoAmbiente(a, b.body.label, b);
                if(b.scene && b.body && entityKeys.includes(b.body.label)) this._colisaoAmbiente(b, a.body.label, a);
            });
        });
    },

    _colisaoAmbiente(entity, otherLabel, otherEntity) {
        if (entity._dying || entity._destroyed) return;

        const entityIsEnemy   = !!entity.isEnemy;
        const entityAbducted  = this.vacas_abduzidas.includes(entity);
        const otherAbducted   = otherEntity && this.vacas_abduzidas.includes(otherEntity);
        const colorEnemy      = 0xff8800;
        const colorRock       = 0xff2222;

        if (otherLabel === 'rocha') {
            // Só explode se foi arremessado pelo beam (alta velocidade) OU está abduzido
            // Andar autônomo contra pedra apenas colide (Matter empurra naturalmente)
            const vel = entity.body.velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            const HIGH_SPEED = 4.0;
            if (entityAbducted || speed > HIGH_SPEED) {
                this._explodir(entity, entityIsEnemy ? colorEnemy : colorRock);
            }
        }
        else if (otherLabel === 'fazendeiro') {
            // Algo bateu num fazendeiro — só mata se um dos dois foi arremessado
            if (entityAbducted || otherAbducted) {
                this._explodir(entity, colorEnemy);
                this._explodir(otherEntity, colorEnemy);
            }
        }
        else if ((otherLabel === 'vaca' || otherLabel === 'boi') && entityIsEnemy) {
            // Fazendeiro encostou numa vaca/boi arremessado — fazendeiro morre
            if (entityAbducted || otherAbducted) {
                this._explodir(entity, colorEnemy);
            }
        }
    },

    _repovoar() {
        const W=3200, H=2400;
        if (this.vacas.length >= 20) return;
        let n = Math.min(4, 40 - this.vacas.length);
        for (let i=0; i<n; i++) {
            let e = Math.floor(Math.random()*4);
            let x, y;
            if (e===0) { x=Phaser.Math.Between(200, W-200); y=200; }
            else if (e===1) { x=Phaser.Math.Between(200, W-200); y=H-200; }
            else if (e===2) { x=200; y=Phaser.Math.Between(200, H-200); }
            else { x=W-200; y=Phaser.Math.Between(200, H-200); }
            const tipo = Math.random() < 0.20 ? 'boi' : 'branca';
            this._criarVaca(x, y, tipo);
        }
    }

});
