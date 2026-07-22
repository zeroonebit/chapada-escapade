// 22_meta.js — F6 backport: SAVE (localStorage) + 50 ACHIEVEMENTS + QUESTS
// Port de Bevy save.rs / achievements_table.rs / quests.rs. O save é o
// espelho do save.json (coins, totais lifetime, vitórias, conquistas,
// contratos, itens raros). Toasts verdes top-right. 3 contratos por
// partida do pool de 10; Contract Sweep (3/3) paga +50% do pot.
// Conquistas sem sinal no Phaser ficam dormentes (igual à wave-1 do Bevy).

const META_ACH = [
    ['first_moo', 'First Contact', 'Primeiro Contato', 'Abduct your first cow', 'bronze'],
    ['full_house', 'Full House', 'Casa Cheia', 'Carry 5 animals at once', 'bronze'],
    ['bull_market', 'Bull Market', 'Alta do Boi', 'Abduct 10 bulls (lifetime)', 'silver'],
    ['century_herd', 'Century Herd', 'Rebanho Centenário', 'Abduct 100 cows (lifetime)', 'gold'],
    ['unplanned_flight', 'Unplanned Flight', 'Voo Não Planejado', 'Abduct a farmer', 'bronze'],
    ['catch_release', 'Catch & Release', 'Pesca Esportiva', 'Release a farmer mid-air and watch him spin', 'bronze'],
    ['yoink', 'Yoink!', 'Yoink!', 'Snatch a cow hiding in tall grass', 'hidden'],
    ['drive_thru', 'Drive-Thru', 'Drive-Thru', 'Abduct and deliver a cow in under 20s', 'silver'],
    ['noahs_saucer', "Noah's Saucer", 'Arca de Nave', 'Carry a cow, a bull and a farmer in one match', 'silver'],
    ['gentle_giant', 'Gentle Giant', 'Gigante Gentil', 'Finish a match without hurting a single animal', 'gold'],
    ['alien_chef', 'Alien Chef', 'Chef Alienígena', 'Collect your first burger', 'bronze'],
    ['cheese_please', 'Cheese, Please', 'Queijo, Por Favor', 'Collect 10 cheeseburgers (lifetime)', 'silver'],
    ['double_trouble', 'Double Trouble', 'Dose Dupla', 'Collect 10 double burgers (lifetime)', 'silver'],
    ['burger_baron', 'Burger Baron', 'Barão do Burger', 'Collect 100 burgers (lifetime)', 'gold'],
    ['combo_platter', 'Combo Platter', 'Combo Completo', 'Collect all 3 burger types in one match', 'silver'],
    ['hot_delivery', 'Hot Off The Grill', 'Saiu do Forno', 'Collect a burger within 3s of it being ready', 'silver'],
    ['tank_gourmet', 'Tank Gourmet', 'Tanque Gourmet', 'Refuel from below 10% with a burger', 'silver'],
    ['assembly_line', 'Assembly Line', 'Linha de Montagem', 'Have all 3 slots of one corral loaded at once', 'silver'],
    ['scarecrow_down', 'Mecha Down', 'Mecha Abatido', 'Destroy your first mecha', 'bronze'],
    ['clean_sweep', 'Clean Sweep', 'Faxina Completa', 'Destroy every mecha on the island', 'silver'],
    ['david_goliath', 'David & Goliath', 'Davi & Golias', 'Destroy a mecha by throwing a farmer at it', 'silver'],
    ['cow_cannon', 'Cow Cannon', 'Canhão de Vaca', 'Destroy a mecha by throwing a cow at it', 'hidden'],
    ['neo_of_the_backlands', 'Neo of the Backlands', 'Neo da Roça', 'Stay inside mecha range 60s without being hit', 'gold'],
    ['lead_sponge', 'Lead Sponge', 'Esponja de Chumbo', 'Survive 20 bullet hits in one match', 'silver'],
    ['pacifist', 'Pacifist', 'Pacifista', 'Win without killing a single farmer', 'gold'],
    ['untouchable', 'Untouchable', 'Intocável', 'Win without taking a single bullet', 'gold'],
    ['mountaineer', 'Mountaineer', 'Alpinista', 'Fly up to the snowy peak', 'bronze'],
    ['edge_lord', 'Edge Lord', 'Na Beirada', "Enter a black hole's gravity well and escape", 'silver'],
    ['crater_tourist', 'Crater Tourist', 'Turista de Cratera', 'Descend into a lowland basin', 'bronze'],
    ['cartographer', 'Cartographer', 'Cartógrafo', 'Visit all four corners of the island', 'silver'],
    ['night_owl', 'Night Owl', 'Coruja', 'Win a match at night', 'silver'],
    ['storm_chaser', 'Storm Chaser', 'Caçador de Tempestade', 'Win during a storm', 'silver'],
    ['snow_day', 'Snow Day', 'Dia de Neve', 'Play a full match in the snow', 'bronze'],
    ['lake_gazer', 'Lake Gazer', 'Contemplador de Lagos', 'Hover over an inland lake for 10s', 'hidden'],
    ['event_horizon', 'Event Horizon', 'Horizonte de Eventos', 'Get swallowed by a black hole', 'bronze'],
    ['gravity_student', 'Gravity Student', 'Aluno de Gravidade', 'Fall into black holes 3 times (lifetime)', 'silver'],
    ['dry_tank', 'Running on Fumes', 'Pane Seca', 'Run out of fuel', 'bronze'],
    ['icarus', 'Cerrado Icarus', 'Ícaro do Cerrado', 'Lose with 9 of 10 mecha down', 'hidden'],
    ['butterfingers', 'Butterfingers', 'Mão de Manteiga', 'Drop 10 animals without delivering (lifetime)', 'bronze'],
    ['cow_overboard', 'Cow Overboard!', 'Vaca ao Mar!', 'Drop a cow into the water', 'hidden'],
    ['insurance_claim', 'Insurance Claim', 'Sinistro Total', 'Lose 50%+ fuel to bullets in one match', 'silver'],
    ['second_wind', 'Second Wind', 'Segunda Chance', 'Win after dropping below 5% fuel', 'gold'],
    ['graduate', 'Graduate', 'Formado', 'Complete the tutorial', 'bronze'],
    ['one_more_run', 'Just One More', 'Só Mais Uma', 'Play 10 matches in one session', 'silver'],
    ['audiophile', 'Audiophile', 'Audiófilo', 'Change the music track in the player', 'hidden'],
    ['high_plains', 'High Score Drifter', 'Fora de Série', 'Score 5000 in one match', 'gold'],
    ['curator', 'The Curator', 'O Curador', 'Ban an asset with the B key', 'hidden'],
    ['polyglot', 'Polyglot', 'Poliglota', 'Switch the game language', 'hidden'],
    ['full_fleet', 'Full Fleet', 'Frota Completa', 'Unlock every saucer variant', 'gold'],
    ['small_step', 'One Small Step', 'Um Pequeno Passo', 'Fly your first match', 'bronze'],
];

// Pool de 10 contratos (Bevy quests.rs QUEST_POOL) — 3 sorteados por partida
const META_QUESTS = [
    { id: 'milk_run',       en: 'Milk Run',        pt: 'Corrida do Leite',   coins: 20, kind: 'cows_timed', n: 3, secs: 90 },
    { id: 'beef_baron',     en: 'Beef Baron',      pt: 'Barão da Carne',     coins: 25, kind: 'bulls',      n: 2 },
    { id: 'gold_rush',      en: 'Gold Rush',       pt: 'Corrida do Ouro',    coins: 50, kind: 'rare', item: 'golden_burger' },
    { id: 'archaeologist',  en: 'Archaeologist',   pt: 'Arqueólogo',         coins: 40, kind: 'rare', item: 'alien_artifact' },
    { id: 'demolition_day', en: 'Demolition Day',  pt: 'Dia de Demolição',   coins: 30, kind: 'towers', n: 1 },
    { id: 'cattle_drive',   en: 'Cattle Drive',    pt: 'Boiada',             coins: 35, kind: 'cows_timed', n: 5, secs: 120 },
    { id: 'quick_milk',     en: 'Express Dairy',   pt: 'Laticínio Expresso', coins: 30, kind: 'cows_timed', n: 2, secs: 40 },
    { id: 'herd_master',    en: 'Herd Master',     pt: 'Mestre do Rebanho',  coins: 55, kind: 'cows_timed', n: 8, secs: 180 },
    { id: 'prime_cuts',     en: 'Prime Cuts',      pt: 'Cortes Nobres',      coins: 45, kind: 'bulls', n: 3 },
    { id: 'clean_sweep',    en: 'Clean Sweep',     pt: 'Faxina Total',       coins: 70, kind: 'towers', n: 3 },
];

Object.assign(Jogo.prototype, {

    // ── SAVE (espelho do save.json do Bevy, em localStorage) ──────────
    _metaLoad() {
        let s = {};
        try { s = JSON.parse(localStorage.getItem('chapEscapadeSave') || '{}'); } catch (e) {}
        this.save = Object.assign({
            coins: 0, cowsTotal: 0, bullsTotal: 0, burgersTotal: 0,
            burgersByType: { classic: 0, cheese: 0, double: 0 },
            farmersTotal: 0, shootersTotal: 0,
            matches: 0, victories: 0, tutorialDone: false,
            achievements: [], questsCompleted: [], rareItems: [],
        }, s);
    },

    _metaPersist() {
        try { localStorage.setItem('chapEscapadeSave', JSON.stringify(this.save)); } catch (e) {}
    },

    // Setup por partida: load + matches++ + rola 3 contratos + spawna raros
    _metaSetup() {
        this._metaLoad();
        this.save.matches += 1;
        this._metaT0 = this.time.now;
        this._matchBurgerTypes = new Set();

        // Roll 3 do pool (shuffle Fisher-Yates)
        const pool = META_QUESTS.slice();
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        this.quests = pool.slice(0, 3).map(def => ({ def, done: false, progress: 0 }));
        this._rareItems = [];
        for (const q of this.quests) {
            if (q.def.kind === 'rare') this._spawnRareItem(q.def.item);
        }

        // Quest log (canto sup-ESQ, estilo console verde)
        if (this._questTexts) for (const t of this._questTexts) t.destroy();
        this._questTexts = [];
        const mk = (y, size, color) => this.add.text(14, y, '', {
            fontFamily: '"VT323", "Courier New", monospace',
            fontSize: size + 'px', fill: color,
            stroke: '#001a08', strokeThickness: 3,
        }).setScrollFactor(0).setDepth(206);
        this._questTexts.push(mk(10, 18, '#00ff55'));   // header + coins
        for (let i = 0; i < 3; i++) this._questTexts.push(mk(34 + i * 20, 16, '#aaffcc'));

        // Conquistas de boot
        this._metaAch('small_step');
        if (this.save.matches >= 10) this._metaAch('one_more_run');
        if (localStorage.getItem('cep_tutorial_done') === '1' || this.save.tutorialDone) {
            this._metaAch('graduate');
        }
        this._metaPersist();
    },

    _spawnRareItem(item) {
        const key = 'rare_' + item;
        if (!this.textures.exists(key)) return;
        const p = this._randLandPos ? this._randLandPos() : { x: 4000, y: 3000 };
        const spr = this.add.image(p.x, p.y, key).setDepth(3).setScale(0.9);
        this.tweens.add({ targets: spr, y: p.y - 8, duration: 900,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this._rareItems.push({ sprite: spr, item });
    },

    // Toast verde (achievements/quests), empilha no top-right
    _metaToast(title, sub) {
        const w = this.scale.width;
        this._toastN = (this._toastN || 0) % 4;
        const y = 90 + this._toastN * 58;
        this._toastN++;
        const bg = this.add.rectangle(w - 12, y, 280, 50, 0x002211, 0.94)
            .setOrigin(1, 0).setScrollFactor(0).setDepth(520)
            .setStrokeStyle(2, 0x00ff55, 1);
        const t1 = this.add.text(w - 24, y + 8, title, {
            fontFamily: '"VT323", "Courier New", monospace',
            fontSize: '17px', fill: '#00ff55',
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(521);
        const t2 = this.add.text(w - 24, y + 28, sub, {
            fontSize: '11px', fill: '#aaffcc',
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(521);
        this.tweens.add({ targets: [bg, t1, t2], alpha: 0, delay: 4200, duration: 600,
            onComplete: () => { bg.destroy(); t1.destroy(); t2.destroy(); } });
        if (this._sfx) this._sfx('burger_ready', 0.7);
    },

    // Desbloqueia conquista (uma vez, persistida)
    _metaAch(id) {
        if (!this.save || this.save.achievements.includes(id)) return;
        const def = META_ACH.find(a => a[0] === id);
        if (!def) return;
        this.save.achievements.push(id);
        const lang = this.dbg?.behavior?.lang || 'en';
        this._metaToast('🏆 ' + (lang === 'pt' ? def[2] : def[1]), def[3]);
        this._metaPersist();
    },

    _questComplete(q) {
        if (q.done) return;
        q.done = true;
        this.save.coins += q.def.coins;
        if (!this.save.questsCompleted.includes(q.def.id)) {
            this.save.questsCompleted.push(q.def.id);
        }
        const lang = this.dbg?.behavior?.lang || 'en';
        this._metaToast('📜 ' + (lang === 'pt' ? q.def.pt : q.def.en),
            '+' + q.def.coins + ' coins');
        // CONTRACT SWEEP (Bevy): 3/3 = +50% do pot
        if (this.quests.every(x => x.done)) {
            const pot = this.quests.reduce((a, x) => a + x.def.coins, 0);
            const bonus = Math.round(pot * 0.5);
            this.save.coins += bonus;
            this._metaToast('📜 CONTRACT SWEEP!', '+' + bonus + ' coins (50% do pot)');
        }
        this._metaPersist();
    },

    // ── Hooks de evento (chamados dos módulos de gameplay) ────────────
    _metaOnDeliver(tipo) {
        if (!this.save) return;
        if (tipo === 'bull') {
            this.save.bullsTotal += 1;
            if (this.save.bullsTotal >= 10) this._metaAch('bull_market');
        } else {
            this.save.cowsTotal += 1;
            if (this.save.cowsTotal >= 100) this._metaAch('century_herd');
        }
        const elapsed = (this.time.now - (this._metaT0 || 0)) / 1000;
        for (const q of (this.quests || [])) {
            if (q.done) continue;
            if (q.def.kind === 'cows_timed' && tipo !== 'bull') {
                if (elapsed <= q.def.secs) {
                    q.progress += 1;
                    if (q.progress >= q.def.n) this._questComplete(q);
                }
            } else if (q.def.kind === 'bulls' && tipo === 'bull') {
                q.progress += 1;
                if (q.progress >= q.def.n) this._questComplete(q);
            }
        }
    },

    _metaOnBurger(slotIdx) {
        if (!this.save) return;
        this.save.burgersTotal += 1;
        const type = ['classic', 'cheese', 'double'][slotIdx] || 'classic';
        this.save.burgersByType[type] = (this.save.burgersByType[type] || 0) + 1;
        this._matchBurgerTypes.add(type);
        this._metaAch('alien_chef');
        if (this.save.burgersTotal >= 100) this._metaAch('burger_baron');
        if (this.save.burgersByType.cheese >= 10) this._metaAch('cheese_please');
        if (this.save.burgersByType.double >= 10) this._metaAch('double_trouble');
        if (this._matchBurgerTypes.size >= 3) this._metaAch('combo_platter');
        this._metaPersist();
    },

    _metaOnShooterDown(hitter) {
        if (!this.save) return;
        this.save.shootersTotal += 1;
        this._metaAch('scarecrow_down');
        if (hitter && hitter.isEnemy) this._metaAch('david_goliath');
        else if (hitter && !hitter.isEnemy && !hitter.isBurger) this._metaAch('cow_cannon');
        if (this.shooters && this.shooters.filter(s2 => s2.sprite?.scene).length <= 1) {
            this._metaAch('clean_sweep');
        }
        for (const q of (this.quests || [])) {
            if (!q.done && q.def.kind === 'towers') {
                q.progress += 1;
                if (q.progress >= q.def.n) this._questComplete(q);
            }
        }
        this._metaPersist();
    },

    _metaOnAbduct(v) {
        if (!this.save) return;
        if (v.isEnemy) this._metaAch('unplanned_flight');
        else if (v.tipo !== 'pig') this._metaAch('first_moo');
        if ((this._cowsInBeamCount || 0) >= 5) this._metaAch('full_house');
    },

    _metaOnVictory() {
        if (!this.save) return;
        this.save.victories += 1;
        const tod = this._atmoCurrent || 'day';
        if (tod === 'night' || tod === 'midnight') this._metaAch('night_owl');
        if (this.dbg?.fx?.weather === 'storm') this._metaAch('storm_chaser');
        if (this.score >= 5000) this._metaAch('high_plains');
        this._metaPersist();
    },

    _metaOnGameOver() {
        if (!this.save) return;
        if ((this.fuelCurrent || 0) <= 0) this._metaAch('dry_tank');
        this._metaPersist();
    },

    // ── Por frame: raros (atração via beam) + quest log ───────────────
    _metaUpdate() {
        if (!this.save) return;
        // Raros: dentro do cone com o beam ligado → puxa 1.4× e coleta
        if (this._rareItems && this._rareItems.length) {
            const beamOn = this.isMobile ? !!this._beamHeld : this.input?.activePointer?.isDown;
            const r2 = (this.coneRadius || 100) * (this.coneRadius || 100);
            for (let i = this._rareItems.length - 1; i >= 0; i--) {
                const it = this._rareItems[i];
                const spr = it.sprite;
                if (!spr || !spr.scene) { this._rareItems.splice(i, 1); continue; }
                const dx = this.ufo.x - spr.x, dy = this.ufo.y - spr.y;
                const d2 = dx * dx + dy * dy;
                if (beamOn && d2 < r2) {
                    const d = Math.sqrt(d2) || 1;
                    spr.x += (dx / d) * 4.2;   // beam_pull × 1.4 (Bevy)
                    spr.y += (dy / d) * 4.2;
                    if (d < 42) {
                        this.save.rareItems.push(it.item);
                        for (const q of (this.quests || [])) {
                            if (!q.done && q.def.kind === 'rare' && q.def.item === it.item) {
                                this._questComplete(q);
                            }
                        }
                        this.tweens.killTweensOf(spr);
                        spr.destroy();
                        this._rareItems.splice(i, 1);
                        if (this._sfx) this._sfx('collect');
                        this._metaPersist();
                    }
                }
            }
        }
        // Quest log (throttle ~250ms)
        this._metaLogT = (this._metaLogT || 0) + 1;
        if (this._metaLogT % 15 !== 0 || !this._questTexts) return;
        const lang = this.dbg?.behavior?.lang || 'en';
        this._questTexts[0].setText(
            (lang === 'pt' ? 'CONTRATOS' : 'CONTRACTS') + '   🪙 ' + this.save.coins);
        (this.quests || []).forEach((q, i) => {
            const t = this._questTexts[i + 1];
            if (!t) return;
            const name = lang === 'pt' ? q.def.pt : q.def.en;
            let prog = '';
            if (q.def.kind === 'cows_timed') prog = ` ${q.progress}/${q.def.n} (${q.def.secs}s)`;
            else if (q.def.kind === 'bulls' || q.def.kind === 'towers') prog = ` ${q.progress}/${q.def.n}`;
            t.setText((q.done ? '✓ ' : '· ') + name + (q.done ? '' : prog));
            t.setColor(q.done ? '#00ff55' : '#aaffcc');
        });
    },

});
