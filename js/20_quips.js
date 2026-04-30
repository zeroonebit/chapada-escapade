// 20_quips.js — Random funny one-liners que aparecem como floating text
// quando player abduz/mata/passa perto de coisas. Toggle em dbg.fx.quips.
//
// Cada linha agora tem mood: r=angry(red) g=funny(green) y=ironic(yellow) b=factual(blue)
// Format: { t: 'texto', m: 'g' }

const TONE_COLORS = {
    r: '#ff5566',  // angry / irritada
    g: '#66ff88',  // funny / engraçada
    y: '#ffdd44',  // ironic / ironica
    b: '#66ccff',  // factual / informativa
};

const QUIP_POOLS = {
    en: {
        farmer: [
            { t: 'One beam away from bankruptcy.', m: 'y' },
            { t: 'We had cows. Now we have questions.', m: 'y' },
            { t: 'This escalated quickly.', m: 'y' },
            { t: 'Your cattle are not insured.', m: 'b' },
            { t: 'Keep calm and watch the sky.', m: 'y' },
        ],
        ufo: [
            { t: 'They came in peace. They left with livestock.', m: 'y' },
            { t: 'First contact, worst timing.', m: 'g' },
            { t: 'Aliens don\'t tip.', m: 'g' },
            { t: 'Intergalactic hunger management.', m: 'y' },
            { t: 'The sky is hungry.', m: 'b' },
            { t: 'Abduction zone.', m: 'b' },
            { t: 'Stand here for problems.', m: 'y' },
            { t: 'No refunds.', m: 'g' },
            { t: 'Look up.', m: 'b' },
            { t: 'You\'re next.', m: 'r' },
        ],
        cow: [
            { t: 'Cows up. Burgers down.', m: 'b' },
            { t: 'You can\'t grill what you can\'t keep.', m: 'y' },
            { t: 'From pasture to platter… via outer space.', m: 'y' },
            { t: 'Milk today, gone tomorrow.', m: 'y' },
            { t: 'Not on the menu.', m: 'r' },
        ],
        dairy: [
            { t: 'Milk today, gone tomorrow.', m: 'y' },
            { t: 'Fresh supply interrupted.', m: 'b' },
            { t: 'Dairy situation unstable.', m: 'b' },
            { t: 'Contents may vanish.', m: 'b' },
            { t: 'Not pasteurized. Not safe.', m: 'b' },
        ],
        fence: [
            { t: 'This is why you fence your cows.', m: 'y' },
            { t: 'Boundary not respected.', m: 'b' },
            { t: 'Do not cross. Seriously.', m: 'r' },
            { t: 'We tried.', m: 'y' },
            { t: 'Next upgrade: roof.', m: 'g' },
        ],
        burger: [
            { t: 'Not on the menu.', m: 'r' },
            { t: 'Fresh beef, questionable origin.', m: 'y' },
            { t: 'You can\'t grill what you can\'t keep.', m: 'y' },
            { t: 'Now serving: confusion.', m: 'g' },
            { t: 'Order canceled.', m: 'b' },
        ],
        church: [
            { t: 'Pray for the cattle.', m: 'b' },
            { t: 'Something\'s not right.', m: 'b' },
            { t: 'Even God saw that.', m: 'y' },
            { t: 'We need help.', m: 'r' },
            { t: 'This wasn\'t in the Bible.', m: 'g' },
        ],
        cactus: [
            { t: 'Seen worse.', m: 'b' },
            { t: 'Not my problem.', m: 'y' },
            { t: 'Still standing.', m: 'b' },
            { t: 'Happens every week.', m: 'b' },
            { t: 'Tourists…', m: 'y' },
        ],
        generic: [
            { t: 'No one ordered this.', m: 'y' },
            { t: 'Keep calm and watch the sky.', m: 'y' },
            { t: 'Welcome to the food chain.', m: 'y' },
            { t: 'Locally raised. Globally stolen.', m: 'g' },
            { t: 'Fresh beef, questionable origin.', m: 'y' },
            { t: 'They saw cows. They saw potential.', m: 'y' },
            { t: 'Abduct first. Cook later.', m: 'g' },
            { t: 'Beam it. Grill it. Regret it.', m: 'g' },
            { t: 'The harvest got hijacked.', m: 'b' },
        ],
    },
    pt: {
        farmer: [
            { t: 'Mais um feixe e tô falido.', m: 'y' },
            { t: 'Tinha vaca. Agora só pergunta.', m: 'y' },
            { t: 'Isso escalou rápido.', m: 'y' },
            { t: 'Seu gado não tá no seguro.', m: 'b' },
            { t: 'Mantenha a calma e olhe pra cima.', m: 'y' },
        ],
        ufo: [
            { t: 'Vieram em paz. Saíram com o gado.', m: 'y' },
            { t: 'Primeiro contato, pior hora.', m: 'g' },
            { t: 'Alien não dá gorjeta.', m: 'g' },
            { t: 'Gestão intergaláctica da fome.', m: 'y' },
            { t: 'O céu tá com fome.', m: 'b' },
            { t: 'Zona de abdução.', m: 'b' },
            { t: 'Fique aqui pra ter problemas.', m: 'y' },
            { t: 'Sem reembolso.', m: 'g' },
            { t: 'Olha pra cima.', m: 'b' },
            { t: 'Você é o próximo.', m: 'r' },
        ],
        cow: [
            { t: 'Vacas pra cima. Hambúrguer pra baixo.', m: 'b' },
            { t: 'Não dá pra grelhar o que você não segura.', m: 'y' },
            { t: 'Do pasto pro prato… via espaço sideral.', m: 'y' },
            { t: 'Leite hoje, sumido amanhã.', m: 'y' },
            { t: 'Não tá no cardápio.', m: 'r' },
        ],
        dairy: [
            { t: 'Leite hoje, sumido amanhã.', m: 'y' },
            { t: 'Suprimento fresco interrompido.', m: 'b' },
            { t: 'Situação láctea instável.', m: 'b' },
            { t: 'Conteúdo pode sumir.', m: 'b' },
            { t: 'Não pasteurizado. Não seguro.', m: 'b' },
        ],
        fence: [
            { t: 'É por isso que você cerca o gado.', m: 'y' },
            { t: 'Limite não respeitado.', m: 'b' },
            { t: 'Não atravesse. Sério.', m: 'r' },
            { t: 'A gente tentou.', m: 'y' },
            { t: 'Próximo upgrade: teto.', m: 'g' },
        ],
        burger: [
            { t: 'Não tá no cardápio.', m: 'r' },
            { t: 'Carne fresca, origem duvidosa.', m: 'y' },
            { t: 'Não dá pra grelhar o que você não segura.', m: 'y' },
            { t: 'Servindo agora: confusão.', m: 'g' },
            { t: 'Pedido cancelado.', m: 'b' },
        ],
        church: [
            { t: 'Reze pelo gado.', m: 'b' },
            { t: 'Tem algo errado.', m: 'b' },
            { t: 'Até Deus viu isso.', m: 'y' },
            { t: 'Precisamos de ajuda.', m: 'r' },
            { t: 'Isso não tava na Bíblia.', m: 'g' },
        ],
        cactus: [
            { t: 'Já vi pior.', m: 'b' },
            { t: 'Não é meu problema.', m: 'y' },
            { t: 'Ainda de pé.', m: 'b' },
            { t: 'Acontece toda semana.', m: 'b' },
            { t: 'Turistas…', m: 'y' },
        ],
        generic: [
            { t: 'Ninguém pediu isso.', m: 'y' },
            { t: 'Mantenha a calma e olhe pra cima.', m: 'y' },
            { t: 'Bem-vindo à cadeia alimentar.', m: 'y' },
            { t: 'Criado local. Roubado global.', m: 'g' },
            { t: 'Carne fresca, origem duvidosa.', m: 'y' },
            { t: 'Viram vacas. Viram potencial.', m: 'y' },
            { t: 'Abduz primeiro. Cozinha depois.', m: 'g' },
            { t: 'Feixa. Grelha. Se arrepende.', m: 'g' },
            { t: 'A colheita foi sequestrada.', m: 'b' },
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
        { t: 'Martians don\'t have phones. Only PCs', m: 'b' },
        { t: 'Venusians tried mobile. It didn\'t work.', m: 'g' },
        { t: 'No signal on Mercury.', m: 'g' },
        { t: 'Aliens don\'t text. They click.', m: 'y' },
        { t: 'PC only. Even off-world.', m: 'b' },
        { t: 'Mobile users were abducted first.', m: 'y' },
        { t: 'The Aliens from Jupiter prefer ultra settings.', m: 'g' },
        { t: 'Touchscreens don\'t survive reentry.', m: 'g' },
        { t: 'They crossed galaxies. Not platforms.', m: 'y' },
    ],
    pt: [
        { t: 'Marciano não tem celular. Só PC.', m: 'b' },
        { t: 'Venusiano tentou mobile. Não rolou.', m: 'g' },
        { t: 'Sem sinal em Mercúrio.', m: 'g' },
        { t: 'Alien não digita. Clica.', m: 'y' },
        { t: 'Só PC. Até fora do planeta.', m: 'b' },
        { t: 'Os do celular foram abduzidos primeiro.', m: 'y' },
        { t: 'Os de Júpiter jogam no ultra.', m: 'g' },
        { t: 'Touchscreen não sobrevive reentrada.', m: 'g' },
        { t: 'Cruzaram galáxias. Não plataformas.', m: 'y' },
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
            const entry = pool[Math.floor(Math.random() * pool.length)];
            const color = TONE_COLORS[entry.m] || TONE_COLORS.y;
            const txt = this.add.text(this.ship.x, this.ship.y - 60, entry.t, {
                fontSize: '24px',
                fill: color,
                fontStyle: 'bold',
                stroke: '#1a0008',
                strokeThickness: 4,
                fontFamily: '"VT323", "Courier New", monospace',
                shadow: { color: color, fill: false, blur: 10 },
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

        const entry = pool[Math.floor(Math.random() * pool.length)];
        const color = TONE_COLORS[entry.m] || TONE_COLORS.y;
        const x = target?.x ?? this.ship?.x ?? 0;
        const y = (target?.y ?? this.ship?.y ?? 0) - 40;

        const txt = this.add.text(x, y, entry.t, {
            fontSize: '26px',
            fill: color,
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
