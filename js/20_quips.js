// 20_quips.js — Random funny one-liners que aparecem como floating text
// quando player abduz/mata/passa perto de coisas. Toggle em dbg.fx.quips.

const QUIP_POOLS = {
    farmer: [
        'One beam away from bankruptcy.',
        'We had cows. Now we have questions.',
        'This escalated quickly.',
        'Your cattle are not insured.',
        'Keep calm and watch the sky.',
    ],
    ufo: [
        'They came in peace. They left with livestock.',
        'First contact, worst timing.',
        'Aliens don\'t tip.',
        'Intergalactic hunger management.',
        'The sky is hungry.',
        'Abduction zone.',
        'Stand here for problems.',
        'No refunds.',
        'Look up.',
        'You\'re next.',
    ],
    cow: [
        'Cows up. Burgers down.',
        'You can\'t grill what you can\'t keep.',
        'From pasture to platter… via outer space.',
        'Milk today, gone tomorrow.',
        'Not on the menu.',
    ],
    dairy: [
        'Milk today, gone tomorrow.',
        'Fresh supply interrupted.',
        'Dairy situation unstable.',
        'Contents may vanish.',
        'Not pasteurized. Not safe.',
    ],
    fence: [
        'This is why you fence your cows.',
        'Boundary not respected.',
        'Do not cross. Seriously.',
        'We tried.',
        'Next upgrade: roof.',
    ],
    burger: [
        'Not on the menu.',
        'Fresh beef, questionable origin.',
        'You can\'t grill what you can\'t keep.',
        'Now serving: confusion.',
        'Order canceled.',
    ],
    church: [
        'Pray for the cattle.',
        'Something\'s not right.',
        'Even God saw that.',
        'We need help.',
        'This wasn\'t in the Bible.',
    ],
    cactus: [
        'Seen worse.',
        'Not my problem.',
        'Still standing.',
        'Happens every week.',
        'Tourists…',
    ],
    generic: [
        'No one ordered this.',
        'Keep calm and watch the sky.',
        'Welcome to the food chain.',
        'Locally raised. Globally stolen.',
        'Fresh beef, questionable origin.',
        'They saw cows. They saw potential.',
        'Abduct first. Cook later.',
        'Beam it. Grill it. Regret it.',
        'The harvest got hijacked.',
    ],
};

// Cooldowns (ms): por categoria de source + global
const QUIP_COOLDOWN_SOURCE = {
    cow: 8000, farmer: 0, dairy: 12000, fence: 15000,
    burger: 6000, church: 30000, cactus: 25000, generic: 0,
};
const QUIP_GLOBAL_COOLDOWN = 3000;

// Quips exclusivos do mobile teaser (saem do disco voador, PT-BR, vibe gamer)
const MOBILE_QUIPS = [
    'aliens não usam celular...',
    'aliens preferem computadores, gamer!',
    'WASD foi feito pra isso, parça',
    'tela pequena, abdução pequena',
    'mouse > swipe, sempre',
    'nossa nave não cabe no seu bolso',
    'no Marte, todo mundo joga no PC',
];

Object.assign(Jogo.prototype, {

    _setupQuips() {
        this._lastQuipT = 0;          // timestamp do ultimo quip global
        this._quipProxTimer = 0;      // throttle de proximity check (a cada 500ms)
        // MOBILE_MODE: schedule recursivo de quip do disco a cada 10-15s.
        // Quips normais (proximity, abduct, etc.) ficam silenciados.
        if (window.__MOBILE_MODE) {
            this._scheduleMobileQuip();
        }
    },

    _scheduleMobileQuip() {
        const delay = Phaser.Math.Between(10000, 15000);
        this.time.delayedCall(delay, () => {
            if (!this.ship || !this.ship.scene) return;
            const line = MOBILE_QUIPS[Math.floor(Math.random() * MOBILE_QUIPS.length)];
            const x = this.ship.x;
            const y = this.ship.y - 60;
            const txt = this.add.text(x, y, line, {
                fontSize: '24px',
                fill: '#ffaacc',
                fontStyle: 'bold',
                stroke: '#220011',
                strokeThickness: 4,
                fontFamily: '"VT323", "Courier New", monospace',
                shadow: { color: '#ff5566', fill: false, blur: 10 },
            }).setOrigin(0.5).setDepth(195);
            this.tweens.add({
                targets: txt,
                y: y - 80,
                alpha: { from: 1, to: 0 },
                duration: 5500,
                ease: 'Cubic.easeOut',
                onComplete: () => { if (txt.scene) txt.destroy(); },
            });
            this._scheduleMobileQuip();  // re-schedule
        });
    },

    // Mostra quip flutuante acima do target. Retorna true se conseguiu.
    _showQuip(target, category) {
        if (window.__MOBILE_MODE) return false;  // mobile usa MOBILE_QUIPS dedicado
        if (!this.dbg?.fx?.quips) return false;
        const pool = QUIP_POOLS[category];
        if (!pool || !pool.length) return false;
        const now = this.time?.now ?? 0;

        // Global cooldown — evita spam
        if (now - this._lastQuipT < QUIP_GLOBAL_COOLDOWN) return false;

        // Per-source cooldown (target._lastQuipT)
        const sourceCD = QUIP_COOLDOWN_SOURCE[category] ?? 0;
        if (target && sourceCD > 0) {
            if (target._lastQuipT && (now - target._lastQuipT) < sourceCD) return false;
            target._lastQuipT = now;
        }

        const line = pool[Math.floor(Math.random() * pool.length)];
        const x = target?.x ?? this.ship?.x ?? 0;
        const y = (target?.y ?? this.ship?.y ?? 0) - 40;

        const txt = this.add.text(x, y, line, {
            fontSize: '26px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
            shadow: { color: '#000', fill: true, blur: 6 },
        }).setOrigin(0.5).setDepth(60);

        this.tweens.add({
            targets: txt,
            y: y - 80,
            alpha: { from: 1, to: 0 },
            duration: 4800,
            ease: 'Cubic.easeOut',
            onComplete: () => { if (txt.scene) txt.destroy(); },
        });

        this._lastQuipT = now;
        return true;
    },

    // Proximity check (chamado do _updateBody throttled a 500ms).
    // Dispara quips de church/cactus quando player passa perto.
    _quipProximityCheck(delta) {
        if (window.__MOBILE_MODE) return;  // mobile usa MOBILE_QUIPS dedicado
        if (!this.dbg?.fx?.quips) return;
        this._quipProxTimer = (this._quipProxTimer ?? 0) + delta;
        if (this._quipProxTimer < 500) return;
        this._quipProxTimer = 0;

        const ship = this.ship;
        if (!ship) return;
        const PROX_R2 = 350 * 350;  // raio de 350px

        // Landmarks (church, windmill, etc — todos compartilham pool 'church')
        if (this._landmarkPositions) {
            for (const lm of this._landmarkPositions) {
                const dx = lm.x - ship.x, dy = lm.y - ship.y;
                if (dx*dx + dy*dy < PROX_R2) {
                    if (this._showQuip(lm, lm.key.includes('church') ? 'church' : 'generic')) return;
                }
            }
        }

        // Cactus/vegetacao (sample 1 por proximity check pra performance)
        // Pega aleatorio: itera primeira metade e dispara no primeiro proximo.
        // Nao tem _vegePositions tracked — fallback: 5% chance de generic.
        if (Math.random() < 0.04) {
            // Quip generico aleatorio (sem source) — ancora na ship
            this._showQuip({ x: ship.x, y: ship.y - 30 }, 'cactus');
        }
    },
});
