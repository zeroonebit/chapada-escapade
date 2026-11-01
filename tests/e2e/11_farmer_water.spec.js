// 11_farmer_water.spec.js — fazendeiro morre na água (Thiago, 01/11: "podemos
// jogar ele no abismo ou na agua pra se afogar tb"). Regra das 3 frentes:
// solto ou arremessado pelo feixe e caiu n'água (lago, rio, oceano — na web o
// oceano da borda faz o papel do abismo) → se debate ~1,2 s e afunda; conta
// igual à morte na pedra. Andando sozinho ele continua nadando de volta, e
// vaca/boi não mudam. Decisões de 01/11: o embalo do feixe afoga (inclusive
// escorregando depois de solto), a pausa congela o afogamento e resgatar com
// o feixe quem se debate salva (conquista Misericórdia, 3 resgates).
const { test, expect } = require('./fixtures');

// Célula de água do grid. kind 'lake' = água fora do oceano; 'ocean' = oceano.
// Prefere célula com os 8 vizinhos também água (longe da margem).
function findWater(s, kind) {
    const g = s.terrainGrid, m = s._oceanMask, C = s.terrainCell || 80;
    if (!g) return null;
    const isW = (x, y) => y >= 0 && y < g.length && x >= 0 && x < g[0].length && g[y][x] === 0;
    let loose = null, deep = null, bestLoose = Infinity, bestDeep = Infinity;
    for (let y = 1; y < g.length - 1; y++) {
        for (let x = 1; x < g[0].length - 1; x++) {
            if (g[y][x] !== 0) continue;
            const ocean = m ? !!m[y][x] : true;
            if ((kind === 'ocean') !== ocean) continue;
            const px = (x + 0.5) * C, py = (y + 0.5) * C;
            const d = Math.hypot(px - s.ufo.x, py - s.ufo.y);
            let all = true;
            for (let dy = -1; dy <= 1 && all; dy++)
                for (let dx = -1; dx <= 1 && all; dx++) if (!isW(x + dx, y + dy)) all = false;
            if (all && d < bestDeep) { bestDeep = d; deep = { x: px, y: py }; }
            if (d < bestLoose) { bestLoose = d; loose = { x: px, y: py }; }
        }
    }
    return deep || loose;
}

// Célula de terra com 2 de água a leste e terra a oeste: a beira de uma praia
function findShore(s) {
    const g = s.terrainGrid, C = s.terrainCell || 80;
    for (let y = 2; y < g.length - 2; y++)
        for (let x = 2; x < g[0].length - 3; x++)
            if (g[y][x] !== 0 && g[y][x - 1] !== 0 && g[y][x + 1] === 0 && g[y][x + 2] === 0 &&
                g[y - 1][x + 1] === 0 && g[y + 1][x + 1] === 0)
                return { x: (x + 0.5) * C, y: (y + 0.5) * C };
    return null;
}

// Beira de lago: 5 células de terra a oeste e 5 de lago a leste; a nave fica
// a 4 células lago adentro (640 px do fazendeiro, dentro dos 690 da caça, e
// longe dos 80 px em que ele para de perseguir)
function findLakeShore(s) {
    const g = s.terrainGrid, m = s._oceanMask, C = s.terrainCell || 80;
    for (let y = 2; y < g.length - 2; y++)
        for (let x = 6; x < g[0].length - 3; x++) {
            let ok = true;
            for (let k = 0; k <= 5 && ok; k++) if (g[y][x - k] === 0) ok = false;
            for (let k = 1; k <= 5 && ok; k++) if (g[y][x + k] !== 0 || (m && m[y][x + k])) ok = false;
            if (ok) return { land: { x: (x - 4 + 0.5) * C, y: (y + 0.5) * C },
                             lake: { x: (x + 4 + 0.5) * C, y: (y + 0.5) * C } };
        }
    return null;
}

async function water(game, kind) {
    return game.scene((s, a) => {
        const find = new Function('return (' + a.src + ')')();
        return find(s, a.kind);
    }, { src: findWater.toString(), kind });
}

// Põe a entidade no feixe sobre (x, y) e solta — o mesmo caminho do soltar o
// botão (_releaseAll). Guarda a entidade em window.__alvo pros asserts.
async function throwAt(game, pick, pt) {
    return game.scene((s, a) => {
        const list = a.pick === 'farmer' ? s.farmers : s.cows;
        const e = list.find(v => v.scene && v.body && !v._dying &&
            (a.pick === 'farmer' || v.tipo === 'holstein'));
        if (!e) return null;
        window.__alvo = e;
        e.setPosition(a.pt.x, a.pt.y);
        e.setVelocity(0, 0);
        s.abductedCows.push(e);
        s._releaseAll();
        return { total: s.farmersTotal || 0, score: s.score || 0 };
    }, { pick, pt });
}

async function startPlaying(game, page) {
    // Sem mechas: torpedo não entra na conta de mortes do teste
    await game.presetConfig({ enabled: { shooters: false } });
    await page.goto('/');
    await game.waitForScene();
    await game.startDirect({ tutorial: false, input: 'mouse' });
    expect(await game.waitFor(s => s.farmers.some(f => f.scene && !f._dying), { timeout: 5000 }),
        'tem fazendeiro vivo').toBe(true);
}

test.describe('fazendeiro solto pelo feixe na água se afoga (Thiago 01/11)', () => {
    for (const kind of ['lake', 'ocean']) {
        test(`solto sobre ${kind === 'lake' ? 'o lago' : 'o oceano'}: se debate, afunda, some e conta como morte`, async ({ game, page }) => {
            await startPlaying(game, page);
            const pt = await water(game, kind);
            expect(pt, `o mapa da seed tem ${kind}`).not.toBeNull();
            const before = await throwAt(game, 'farmer', pt);
            expect(before, 'jogou um fazendeiro').not.toBeNull();

            // Debate: se afogando (dá pra resgatar), a morte ainda não contou
            await page.waitForTimeout(400);
            const mid = await game.scene(s => ({
                drowning: !!window.__alvo._drowning, total: s.farmersTotal || 0,
                dying: !!window.__alvo._dying, onScreen: !!window.__alvo.scene,
            }));
            expect(mid.drowning, 'se afogando (não nada de volta)').toBe(true);
            expect(mid.dying).toBe(false);
            expect(mid.total, 'a morte só conta quando afunda').toBe(before.total);
            expect(mid.onScreen, 'ainda se debatendo aos 0,4 s').toBe(true);

            // Afunda e some entre 1 e 1,5 s (+ folga)
            expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'afundou e sumiu').toBe(true);
            const after = await game.scene(s => ({
                inList: s.farmers.includes(window.__alvo),
                total: s.farmersTotal || 0, score: s.score || 0,
                hud: s.hud?.farmersText ? s.hud.farmersText.text : null,
            }));
            expect(after.inList, 'saiu da lista de vivos').toBe(false);
            expect(after.total, 'entra no total de fazendeiros').toBe(before.total + 1);
            // Mesma pontuação da morte na pedra: na web a pedra paga 0
            expect(after.score, 'mesma pontuação da pedra (0 na web)').toBe(before.score);
            if (after.hud !== null) expect(after.hud).toBe(String(after.total));
            expect(game.realErrors).toEqual([]);
        });
    }

    // Achado do Ensaio Geral (01/11): com o botão apertado e o graviton em 0 o
    // feixe larga a carga pelo _dropNonBurgers, que não passava pelo
    // _releaseCow — sem a marca, o fazendeiro nadava de volta. No Bevy todo
    // fazendeiro fora do feixe na água morre (regra combinada).
    test('graviton zerado com o botão apertado: o fazendeiro cai do feixe na água e se afoga', async ({ game, page }) => {
        await startPlaying(game, page);
        const pt = await water(game, 'lake') || await water(game, 'ocean');
        await game.beamOn();
        try {
            const base = await game.scene((s, p) => {
                const f = s.farmers.find(v => v.scene && v.body && !v._dying);
                window.__alvo = f;
                s.energiaLed = 0;
                f.setPosition(p.x, p.y); f.setVelocity(0, 0);
                s.abductedCows.push(f);
                return s.farmersTotal || 0;
            }, pt);
            expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'caiu do feixe e afundou').toBe(true);
            expect(await game.scene(s => s.farmersTotal || 0)).toBe(base + 1);
        } finally {
            await game.beamOff();
        }
        expect(game.realErrors).toEqual([]);
    });

    // Thiago 01/11 ("Embalo da praia afoga"): largado pelo graviton zerado na
    // praia, ele escorrega pra água no embalo; antes a marca saía no 1º frame
    // em terra (sem giro) e ele nadava de volta
    test('graviton zerado na praia com embalo pra água: escorrega e se afoga', async ({ game, page }) => {
        await startPlaying(game, page);
        const shore = await game.scene((s, a) => new Function('return (' + a + ')')()(s), findShore.toString());
        expect(shore, 'o mapa da seed tem praia').not.toBeNull();
        await game.beamOn();
        try {
            const base = await game.scene((s, p) => {
                const f = s.farmers.find(v => v.scene && v.body && !v._dying);
                window.__alvo = f;
                s.energiaLed = 0;
                f.setPosition(p.x, p.y); f.setVelocity(12, 0);   // embalo pra leste (água)
                s.abductedCows.push(f);
                return s.farmersTotal || 0;
            }, shore);
            expect(await game.waitFor(() => !!window.__alvo._drowning || !window.__alvo.scene, { timeout: 3000 }),
                'escorregou pra água e começou a se afogar').toBe(true);
            expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'afundou').toBe(true);
            expect(await game.scene(s => s.farmersTotal || 0)).toBe(base + 1);
        } finally {
            await game.beamOff();
        }
        expect(game.realErrors).toEqual([]);
    });

    // Thiago 01/11 ("Afogamento pausa"): pausado, o debate e o afundar congelam
    test('a pausa congela o afogamento e ele continua ao despausar', async ({ game, page }) => {
        await startPlaying(game, page);
        const pt = await water(game, 'lake') || await water(game, 'ocean');
        const before = await throwAt(game, 'farmer', pt);
        await page.waitForTimeout(300);
        const p0 = await game.scene(s => { s._setPaused(true); const f = window.__alvo;
            return { t: f._drownT, a: f.alpha, sc: f.scale, on: !!f.scene }; });
        expect(p0.on).toBe(true);
        await page.waitForTimeout(2500);
        const p1 = await game.scene(s => { const f = window.__alvo;
            return { t: f._drownT, a: f.alpha, sc: f.scale, on: !!f.scene, total: s.farmersTotal || 0 }; });
        expect(p1.on, 'ainda na tela depois de 2,5 s pausado').toBe(true);
        expect(p1.t, 'o relógio do afogamento parou').toBe(p0.t);
        expect(p1.sc).toBe(p0.sc);
        expect(p1.total).toBe(before.total);
        await game.scene(s => s._setPaused(false));
        expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'despausado, afundou').toBe(true);
        expect(await game.scene(s => s.farmersTotal || 0)).toBe(before.total + 1);
        expect(game.realErrors).toEqual([]);
    });

    // Thiago 01/11 ("achievment de misericordia ao resgatar uns afogados"):
    // pegar com o feixe quem se debate salva; 3 resgates = Misericórdia, e o
    // mesmo fazendeiro só conta uma vez
    test('resgatar com o feixe quem se debate: sobrevive, não é morte; 3 resgates dão Misericórdia', async ({ game, page }) => {
        test.setTimeout(120_000);
        await startPlaying(game, page);
        const pt = await water(game, 'lake');
        expect(pt, 'o mapa da seed tem lago (a nave voa sobre ele)').not.toBeNull();
        const rescue = async (pickNew) => {
            await game.scene((s, a) => {
                const f = a.pickNew
                    ? s.farmers.find(v => v.scene && v.body && !v._dying && !v._drowning && !v._rescued)
                    : window.__alvo;
                window.__alvo = f;
                f.setPosition(a.pt.x, a.pt.y); f.setVelocity(0, 0);
                s.abductedCows.push(f);
                s._releaseAll();
            }, { pt, pickNew });
            expect(await game.waitFor(() => !!window.__alvo._drowning, { timeout: 2000 }), 'começou a se afogar').toBe(true);
            await game.scene((s, p) => { s.ufo.setPosition(p.x, p.y); s.ufo.setVelocity(0, 0);
                s.cameras.main.centerOn(p.x, p.y); s.energiaLed = s.energiaMax; }, pt);
            await game.hover();
            await game.beamOn();
            const got = await game.waitFor(s => s.abductedCows.includes(window.__alvo), { timeout: 1200 });
            const st = await game.scene(s => ({
                drowning: !!window.__alvo._drowning, dying: !!window.__alvo._dying,
                inList: s.farmers.includes(window.__alvo), onScreen: !!window.__alvo.scene,
                total: s.farmersTotal || 0, rescued: s.save.farmersRescued || 0,
                mercy: s.save.achievements.includes('mercy'),
                inertia: window.__alvo.body ? window.__alvo.body.inertia : null,
            }));
            // Solta em terra firme pra não afogar de novo (fora do feixe e longe d'água)
            await game.beamOff();
            await game.scene(s => { const f = window.__alvo; const l = s._randLandPos();
                if (f.scene && !f._dying) { f._drowning = false; f._thrown = false;
                    if (f.body) { f.setStatic(false); f.setSensor(false); }
                    f.setPosition(l.x, l.y); f.setVelocity(0, 0); } });
            return { got, ...st };
        };
        const r1 = await rescue(true);
        expect(r1.got, 'o feixe pegou quem se debatia').toBe(true);
        expect(r1.drowning, 'parou de se afogar').toBe(false);
        expect(r1.dying).toBe(false);
        expect(r1.inList, 'continua vivo').toBe(true);
        expect(r1.total, 'resgate não é morte').toBe(0);
        expect(r1.rescued).toBe(1);
        expect(r1.inertia, 'rotação fixa de volta (inércia infinita)').toBe(Infinity);
        const r1b = await rescue(false);          // o mesmo fazendeiro de novo
        expect(r1b.got).toBe(true);
        expect(r1b.rescued, 'o mesmo fazendeiro conta uma vez só').toBe(1);
        expect((await rescue(true)).rescued).toBe(2);
        const r3 = await rescue(true);
        expect(r3.rescued).toBe(3);
        expect(r3.mercy, 'conquista Misericórdia').toBe(true);
        expect(r3.total, 'nenhuma morte nos resgates').toBe(0);
        expect(game.realErrors).toEqual([]);
    });

    // Combinado com o Bevy (01/11): resgate só nos 1,2 s de debate; no afundar
    // final (0,3 s) o feixe não pega mais
    test('afundando (0,3 s finais) o feixe não resgata mais', async ({ game, page }) => {
        await startPlaying(game, page);
        const pt = await water(game, 'lake');
        const before = await throwAt(game, 'farmer', pt);
        expect(await game.waitFor(() => !!window.__alvo._drowning, { timeout: 2000 })).toBe(true);
        // Pula pro começo do afundar e põe a nave em cima, feixe cheio
        await game.scene((s, p) => { window.__alvo._drownT = 1230; s.ufo.setPosition(p.x, p.y);
            s.ufo.setVelocity(0, 0); s.cameras.main.centerOn(p.x, p.y); s.energiaLed = s.energiaMax; }, pt);
        await game.hover();
        await game.beamOn();
        try {
            expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'afundou mesmo com o feixe').toBe(true);
            const st = await game.scene(s => ({ total: s.farmersTotal || 0, rescued: s.save.farmersRescued || 0 }));
            expect(st.total).toBe(before.total + 1);
            expect(st.rescued, 'afundando não conta resgate').toBe(0);
        } finally {
            await game.beamOff();
        }
        expect(game.realErrors).toEqual([]);
    });

    // Achado do Ensaio (01/11): depois do giro o atrito fica 0,08 e ele corre
    // até ~7,1 px/frame perseguindo; com o limite em 6 a marca não saía e ele
    // afogava correndo por conta própria pra nave sobre o lago
    test('solto, o giro acaba com embalo e ele corre sozinho pra nave sobre o lago: nada de volta', async ({ game, page }) => {
        await startPlaying(game, page);
        const sh = await game.scene((s, a) => new Function('return (' + a + ')')()(s), findLakeShore.toString());
        expect(sh, 'o mapa da seed tem beira de lago').not.toBeNull();
        const base = await game.scene((s, p) => {
            const f = s.farmers.find(v => v.scene && v.body && !v._dying);
            window.__alvo = f;
            s.ufo.setPosition(p.lake.x, p.lake.y); s.ufo.setVelocity(0, 0);
            s.cameras.main.centerOn(p.lake.x, p.lake.y);
            f.setPosition(p.land.x, p.land.y);
            f._thrown = true; f._releaseSpinUntil = 0; f.setFrictionAir(0.08);
            f.wanderAngle = 0; f._wandering = true; if (f._timer) f._timer.paused = true;
            f.setVelocity(10, 0);   // fim do giro, ainda no embalo, rumo à nave
            return s.farmersTotal || 0;
        }, sh);
        await game.hover();
        await page.waitForTimeout(2500);
        const st = await game.scene(s => { const a = window.__alvo;
            return { alive: !!(a.scene && a.body), drowning: !!a._drowning, dying: !!a._dying,
                     thrown: !!a._thrown, total: s.farmersTotal || 0 }; });
        expect(st.alive, 'correndo por conta própria não afoga (segue vivo)').toBe(true);
        expect(st.drowning, 'correndo por conta própria não afoga').toBe(false);
        expect(st.dying).toBe(false);
        expect(st.thrown, 'a marca saiu quando ele voltou à velocidade de correr').toBe(false);
        expect(st.total).toBe(base);
        expect(game.realErrors).toEqual([]);
    });

    test('andando sozinho e entrando na água ele nada de volta (não morre)', async ({ game, page }) => {
        await startPlaying(game, page);
        const pt = await water(game, 'lake') || await water(game, 'ocean');
        const base = await game.scene((s, p) => {
            const f = s.farmers.find(v => v.scene && v.body && !v._dying);
            window.__alvo = f;
            f.setPosition(p.x, p.y); f.setVelocity(0, 0);
            return s.farmersTotal || 0;
        }, pt);
        await page.waitForTimeout(2500);
        const st = await game.scene(s => ({
            inList: s.farmers.includes(window.__alvo), dying: !!window.__alvo._dying,
            total: s.farmersTotal || 0,
        }));
        expect(st.inList).toBe(true);
        expect(st.dying).toBe(false);
        expect(st.total).toBe(base);
        expect(game.realErrors).toEqual([]);
    });

    test('solto em terra, passada a janela do arremesso, entrar na água não mata', async ({ game, page }) => {
        await startPlaying(game, page);
        const land = await game.scene(s => s._randLandPos());
        await throwAt(game, 'farmer', land);
        // Isola o arremesso do passeio: no giro o atrito cai pra 0,01 e o
        // passeio acelera até ~6 px/frame (escorrega pra água ou bate em pedra)
        await game.scene(s => { const f = window.__alvo; f._wandering = false; if (f._timer) f._timer.paused = true; });
        // Janela do arremesso = giro de 3 s do _releaseCow
        await page.waitForTimeout(3400);
        expect(await game.scene(() => !!window.__alvo._thrown), 'marca de arremesso saiu em terra').toBe(false);
        const pt = await water(game, 'lake') || await water(game, 'ocean');
        const base = await game.scene((s, p) => {
            const f = window.__alvo;
            f.setPosition(p.x, p.y); f.setVelocity(0, 0);
            return s.farmersTotal || 0;
        }, pt);
        await page.waitForTimeout(2500);
        const st = await game.scene(s => ({
            inList: s.farmers.includes(window.__alvo), dying: !!window.__alvo._dying,
            total: s.farmersTotal || 0,
        }));
        expect(st.inList, 'pousou em terra: voltou a ser pedestre').toBe(true);
        expect(st.dying).toBe(false);
        expect(st.total).toBe(base);
    });

    test('vaca solta sobre a água continua nadando de volta', async ({ game, page }) => {
        await startPlaying(game, page);
        const pt = await water(game, 'lake') || await water(game, 'ocean');
        const before = await throwAt(game, 'cow', pt);
        expect(before, 'jogou uma vaca').not.toBeNull();
        await page.waitForTimeout(2500);
        const st = await game.scene(s => ({
            inList: s.cows.includes(window.__alvo), dying: !!window.__alvo._dying,
            total: s.farmersTotal || 0,
        }));
        expect(st.inList).toBe(true);
        expect(st.dying).toBe(false);
        expect(st.total).toBe(before.total);
        expect(game.realErrors).toEqual([]);
    });

    test('no passo FARMER_KILL do tutorial, afogar o fazendeiro fecha o passo', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        // MOVE → … → FARMER_KILL (8º passo)
        await game.scene(s => { s._tutMinReadMs = 300; for (let i = 0; i < 7; i++) s._tutAdvance(); });
        expect(await game.scene(s => TUT_STEPS[s._tutStepIdx].key)).toBe('FARMER_KILL');
        expect(await game.waitFor(s => s.farmers.some(f => f.scene && !f._dying), { timeout: 5000 }),
            'o passo repôs o fazendeiro').toBe(true);
        await page.waitForTimeout(400);   // leitura mínima do passo
        const pt = await water(game, 'lake') || await water(game, 'ocean');
        expect(await throwAt(game, 'farmer', pt)).not.toBeNull();
        const next = await game.waitFor(s => TUT_STEPS[s._tutStepIdx]?.key === 'DODGE_TORPEDOS', { timeout: 5000 });
        expect(next, 'afogar conta como o kill do passo').toBe(true);
        expect(game.realErrors).toEqual([]);
    });
});
