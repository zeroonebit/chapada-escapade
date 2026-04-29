// 20_quips.js — Random funny one-liners que aparecem como floating text
// quando player abduz/mata/passa perto de coisas. Toggle em dbg.fx.quips.

const QUIP_POOLS = {
    en: {
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
    },
    pt: {
        farmer: [
            'Mais um feixe e tô falido.',
            'Tinha vaca. Agora só pergunta.',
            'Isso escalou rápido.',
            'Seu gado não tá no seguro.',
            'Mantenha a calma e olhe pra cima.',
        ],
        ufo: [
            'Vieram em paz. Saíram com o gado.',
            'Primeiro contato, pior hora.',
            'Alien não dá gorjeta.',
            'Gestão intergaláctica da fome.',
            'O céu tá com fome.',
            'Zona de abdução.',
            'Fique aqui pra ter problemas.',
            'Sem reembolso.',
            'Olha pra cima.',
            'Você é o próximo.',
        ],
        cow: [
            'Vacas pra cima. Hambúrguer pra baixo.',
            'Não dá pra grelhar o que você não segura.',
            'Do pasto pro prato… via espaço sideral.',
            'Leite hoje, sumido amanhã.',
            'Não tá no cardápio.',
        ],
        dairy: [
            'Leite hoje, sumido amanhã.',
            'Suprimento fresco interrompido.',
            'Situação láctea instável.',
            'Conteúdo pode sumir.',
            'Não pasteurizado. Não seguro.',
        ],
        fence: [
            'É por isso que você cerca o gado.',
            'Limite não respeitado.',
            'Não atravesse. Sério.',
            'A gente tentou.',
            'Próximo upgrade: teto.',
        ],
        burger: [
            'Não tá no cardápio.',
            'Carne fresca, origem duvidosa.',
            'Não dá pra grelhar o que você não segura.',
            'Servindo agora: confusão.',
            'Pedido cancelado.',
        ],
        church: [
            'Reze pelo gado.',
            'Tem algo errado.',
            'Até Deus viu isso.',
            'Precisamos de ajuda.',
            'Isso não tava na Bíblia.',
        ],
        cactus: [
            'Já vi pior.',
            'Não é meu problema.',
            'Ainda de pé.',
            'Acontece toda semana.',
            'Turistas…',
        ],
        generic: [
            'Ninguém pediu isso.',
            'Mantenha a calma e olhe pra cima.',
            'Bem-vindo à cadeia alimentar.',
            'Criado local. Roubado global.',
            'Carne fresca, origem duvidosa.',
            'Viram vacas. Viram potencial.',
            'Abduz primeiro. Cozinha depois.',
            'Feixa. Grelha. Se arrepende.',
            'A colheita foi sequestrada.',
        ],
    },
};

// Cooldowns (ms): por categoria de source + global
const QUIP_COOLDOWN_SOURCE = {
    cow: 8000, farmer: 0, dairy: 12000, fence: 15000,
    burger: 6000, church: 30000, cactus: 25000, generic: 0,
};
const QUIP_GLOBAL_COOLDOWN = 3000;

// Quips exclusivos do mobile teaser (saem do disco voador)
const MOBILE_QUIPS = {
    en: [
        'Martians don\'t have phones. Only PCs',
        'Venusians tried mobile. It didn\'t work.',
        'No signal on Mercury.',
        'Aliens don\'t text. They click.',
        'PC only. Even off-world.',
        'Mobile users were abducted first.',
        'The Aliens from Jupiter prefer ultra settings.',
        'Touchscreens don\'t survive reentry.',
        'They crossed galaxies. Not platforms.',
    ],
    pt: [
        'Marciano não tem celular. Só PC.',
        'Venusiano tentou mobile. Não rolou.',
        'Sem sinal em Mercúrio.',
        'Alien não digita. Clica.',
        'Só PC. Até fora do planeta.',
        'Os do celular foram abduzidos primeiro.',
        'Os de Júpiter jogam no ultra.',
        'Touchscreen não sobrevive reentrada.',
        'Cruzaram galáxias. Não plataformas.',
    ],
};

Object.assign(Jogo.prototype, {

    _setupQuips() {
        this._lastQuipT = 0;          // timestamp do ultimo quip global
        this._quipProxTimer = 0;      // throttle de proximity check (a cada 500ms)
        this._activeQuips = [];       // quips ativos: rastreiam target a cada frame
        // MOBILE_MODE: schedule recursivo de quip do disco a cada 10-15s.
        // Quips normais (proximity, abduct, etc.) ficam silenciados.
        if (window.__MOBILE_MODE) {
            this._scheduleMobileQuip();
        }
    },

    // Registra um quip ativo: txt segue target.x/y + offsetY decrescente,
    // alpha decai linear ate sumir. Chamado por _showQuip e _scheduleMobileQuip.
    _registerQuip(txt, target, baseOffsetY, floatDist, duration) {
        if (!this._activeQuips) this._activeQuips = [];
        const startT = this.time?.now ?? 0;
        this._activeQuips.push({
            txt, target, baseOffsetY, floatDist, duration, startT,
        });
    },

    // Atualiza todos quips ativos a cada frame: reposiciona em target.x/y +
    // offset que sobe ao longo da duracao + alpha decai. Remove os finalizados.
    _updateActiveQuips() {
        const list = this._activeQuips;
        if (!list || !list.length) return;
        const now = this.time?.now ?? 0;
        for (let i = list.length - 1; i >= 0; i--) {
            const q = list[i];
            const elapsed = now - q.startT;
            const t = elapsed / q.duration;
            // Target sumiu (entidade morta) -> destroi quip junto
            if (!q.txt || !q.txt.scene) { list.splice(i, 1); continue; }
            if (!q.target || (q.target.scene === undefined && q.target !== this.ship)) {
                q.txt.destroy(); list.splice(i, 1); continue;
            }
            if (t >= 1) { q.txt.destroy(); list.splice(i, 1); continue; }
            // Ease cubic-out (1 - (1-t)^3)
            const e = 1 - Math.pow(1 - t, 3);
            const yOff = q.baseOffsetY - q.floatDist * e;
            q.txt.x = q.target.x;
            q.txt.y = q.target.y + yOff;
            // Alpha: full ate 60%, depois fade linear
            q.txt.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
        }
    },

    _scheduleMobileQuip() {
        const delay = Phaser.Math.Between(10000, 15000);
        this.time.delayedCall(delay, () => {
            if (!this.ship || !this.ship.scene) return;
            const lang = this.dbg?.behavior?.lang || 'en';
            const pool = MOBILE_QUIPS[lang] || MOBILE_QUIPS.en;
            const line = pool[Math.floor(Math.random() * pool.length)];
            const txt = this.add.text(this.ship.x, this.ship.y - 60, line, {
                fontSize: '24px',
                fill: '#ffaacc',
                fontStyle: 'bold',
                stroke: '#220011',
                strokeThickness: 4,
                fontFamily: '"VT323", "Courier New", monospace',
                shadow: { color: '#ff5566', fill: false, blur: 10 },
            }).setOrigin(0.5).setDepth(195);
            // Segue a nave: baseOffset -60, sobe +80 ao longo de 5500ms
            this._registerQuip(txt, this.ship, -60, 80, 5500);
            this._scheduleMobileQuip();  // re-schedule
        });
    },

    // Mostra quip flutuante acima do target. Retorna true se conseguiu.
    _showQuip(target, category) {
        if (window.__MOBILE_MODE) return false;  // mobile usa MOBILE_QUIPS dedicado
        if (!this.dbg?.fx?.quips) return false;
        const lang = this.dbg?.behavior?.lang || 'en';
        const pool = (QUIP_POOLS[lang] || QUIP_POOLS.en)[category];
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

        // Segue o target: baseOffset -40, sobe +80 ao longo de 4800ms
        this._registerQuip(txt, target, -40, 80, 4800);

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
