// 11_farmer_water.spec.js — fazendeiro morre na água (Thiago, 01/11: "podemos
// jogar ele no abismo ou na agua pra se afogar tb"). Regra das 3 frentes:
// solto ou arremessado pelo feixe e caiu n'água (lago, rio, oceano — na web o
// oceano da borda faz o papel do abismo) → se debate ~1,2 s e afunda; conta
// igual à morte na pedra. Andando sozinho ele continua nadando de volta, e
// vaca/boi não mudam.
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

            // Debate: já saiu da lista de vivos (IA parada), mas ainda aparece
            await page.waitForTimeout(400);
            const mid = await game.scene(s => ({
                inList: s.farmers.includes(window.__alvo),
                dying: !!window.__alvo._dying, onScreen: !!window.__alvo.scene,
            }));
            expect(mid.inList, 'saiu da lista de vivos (não nada de volta)').toBe(false);
            expect(mid.dying).toBe(true);
            expect(mid.onScreen, 'ainda se debatendo aos 0,4 s').toBe(true);

            // Afunda e some entre 1 e 1,5 s (+ folga)
            expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'afundou e sumiu').toBe(true);
            const after = await game.scene(s => ({
                total: s.farmersTotal || 0, score: s.score || 0,
                hud: s.hud?.farmersText ? s.hud.farmersText.text : null,
            }));
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
