// 11_farmer_water.spec.js — fazendeiro morre na água (Thiago, 01/11: "podemos
// jogar ele no abismo ou na agua pra se afogar tb"). Regra das 3 frentes:
// solto ou arremessado pelo feixe e caiu n'água (lago, rio, oceano — na web o
// oceano da borda faz o papel do abismo) → se debate ~1,2 s e afunda; conta
// igual à morte na pedra. Andando sozinho ele continua nadando de volta, e
// vaca/boi não mudam. Decisões de 01/11: o embalo do feixe afoga (inclusive
// escorregando depois de solto), a pausa congela o afogamento e resgatar com
// o feixe quem se debate salva (conquista Misericórdia, 3 resgates). Fechamento
// (01/11): afoga só quem para mais perto do meio que da margem do lago ("se ele
// estiver mais perto da borda que do centro ele nada"); no oceano, a mais de 2
// células da praia. Solto em cima do curral fica preso ~3 s.
const { test, expect } = require('./fixtures');

// Oráculo de água do teste (independente do jogo): distância até a borda da
// terra mais perto, centro do maior lago (ponto mais longe da margem, de
// profundidade M), ponto de oceano a uma distância da praia e um laguinho 2×2
// cavado em terra aberta
function WATERLIB() {
    return (s) => {
        const g = s.terrainGrid, m = s._oceanMask, C = s.terrainCell || 80;
        const isW = (x, y) => y < 0 || y >= g.length || x < 0 || x >= g[0].length || g[y][x] === 0;
        const dist = (px, py) => {
            const cx0 = Math.floor(px / C), cy0 = Math.floor(py / C); let best = 1e9, pt = null;
            for (let cy = cy0 - 12; cy <= cy0 + 12; cy++) for (let cx = cx0 - 12; cx <= cx0 + 12; cx++) {
                if (isW(cx, cy)) continue;
                const nx = Math.max(cx * C, Math.min(px, (cx + 1) * C)), ny = Math.max(cy * C, Math.min(py, (cy + 1) * C));
                const d = Math.hypot(px - nx, py - ny);
                if (d < best) { best = d; pt = { x: nx, y: ny }; }
            }
            return { d: best, pt };
        };
        const lakeCenter = () => {
            const seen = g.map(r => r.map(() => false)); let body = null;
            for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
                if (g[y][x] !== 0 || (m && m[y][x]) || seen[y][x]) continue;
                const q = [[y, x]]; seen[y][x] = true;
                for (let i = 0; i < q.length; i++) { const [yy, xx] = q[i];
                    for (const [a2, b2] of [[yy - 1, xx], [yy + 1, xx], [yy, xx - 1], [yy, xx + 1]]) {
                        if (a2 < 0 || a2 >= g.length || b2 < 0 || b2 >= g[0].length) continue;
                        if (g[a2][b2] !== 0 || (m && m[a2][b2]) || seen[a2][b2]) continue;
                        seen[a2][b2] = true; q.push([a2, b2]); } }
                if (!body || q.length > body.length) body = q;
            }
            if (!body) return null;
            let c = null;
            for (const [y, x] of body) { const px = (x + 0.5) * C, py = (y + 0.5) * C, r = dist(px, py);
                if (!c || r.d > c.M) c = { x: px, y: py, M: r.d, n: r.pt }; }
            const k = 0.25 * c.M / Math.hypot(c.x - c.n.x, c.y - c.n.y);
            return { x: c.x, y: c.y, M: c.M, cells: body.length,
                     edge: { x: c.n.x + (c.x - c.n.x) * k, y: c.n.y + (c.y - c.n.y) * k } };
        };
        const oceanAt = (want) => {
            let best = null, bd = Infinity;
            for (let y = 1; y < g.length - 1; y++) for (let x = 1; x < g[0].length - 1; x++) {
                if (g[y][x] !== 0 || !(m && m[y][x])) continue;
                const px = (x + 0.5) * C, py = (y + 0.5) * C, r = dist(px, py);
                if (Math.abs(r.d - want) > 25) continue;
                const du = Math.hypot(px - s.ufo.x, py - s.ufo.y);
                if (du < bd) { bd = du; best = { x: px, y: py, d: r.d }; }
            }
            return best;
        };
        // Laguinho 2×2 (160 px) com 2 células de terra em volta, longe de corpo e
        // de curral; devolve o ponto em terra 40 px a oeste dele, na linha do meio
        const carvePond = () => {
            const bodies = s.matter.world.localWorld.bodies;
            const free = (x0, y0, x1, y1) => !bodies.some(bb => bb !== s.ufo.body &&
                !(bb.bounds.max.x < x0 || bb.bounds.min.x > x1 || bb.bounds.max.y < y0 || bb.bounds.min.y > y1));
            for (let cy = 3; cy < g.length - 7; cy++) for (let cx = 3; cx < g[0].length - 10; cx++) {
                let ok = true;
                for (let yy = cy - 2; yy < cy + 6 && ok; yy++) for (let xx = cx - 2; xx < cx + 9 && ok; xx++) if (isW(xx, yy)) ok = false;
                if (!ok || !free(cx * C, cy * C, (cx + 7) * C, (cy + 4) * C)) continue;
                if ((s.corrals || []).some(c2 => Math.hypot(c2.x - (cx + 4) * C, c2.y - (cy + 2) * C) < 500)) continue;
                for (const [yy, xx] of [[cy + 1, cx + 4], [cy + 1, cx + 5], [cy + 2, cx + 4], [cy + 2, cx + 5]]) g[yy][xx] = 0;
                return { x: (cx + 4) * C - 40, y: (cy + 2) * C, pondX0: (cx + 4) * C };
            }
            return null;
        };
        return { dist: (x, y) => dist(x, y).d, lakeCenter, oceanAt, carvePond };
    };
}

// Praia do OCEANO: célula de terra com 2 de oceano a leste e terra a oeste
function findShore(s) {
    const g = s.terrainGrid, m = s._oceanMask, C = s.terrainCell || 80;
    for (let y = 2; y < g.length - 2; y++)
        for (let x = 2; x < g[0].length - 3; x++)
            if (g[y][x] !== 0 && g[y][x - 1] !== 0 && g[y][x + 1] === 0 && g[y][x + 2] === 0 &&
                g[y - 1][x + 1] === 0 && g[y + 1][x + 1] === 0 && m && m[y][x + 1] && m[y][x + 2])
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

// Laboratório quadro a quadro (o mesmo método do Ensaio de 01/11): o loop do
// jogo dorme e cada frame é um headlessStep com relógio sintético; os outros
// fazendeiros e as vacas ficam parados, a nave presa longe, e cada caso usa
// um fazendeiro novo largado pelo caminho real (graviton 0 com SPACE).
function LAB() {
    const g = window.game, S = () => g.scene.keys.Jogo;
    let T = 0, UFO = null, profile = '60', phase = 0;
    const DT = { '60': [1000 / 60], 'jit': [1000 / 60, 1000 / 30] };
    const pin = () => { const s = S();
        if (UFO && s.ufo && s.ufo.body) { s.ufo.setPosition(UFO.x, UFO.y); s.ufo.setVelocity(0, 0); }
        s.fuelCurrent = s.fuelMax; };
    const step = () => { const a = DT[profile], dt = a[phase++ % a.length]; T += dt; g.headlessStep(T, dt); pin(); return dt; };
    const isW = (cx, cy) => { const gr = S().terrainGrid;
        return cy < 0 || cy >= gr.length || cx < 0 || cx >= gr[0].length || gr[cy][cx] === 0; };
    const bodiesIn = (x0, y0, x1, y1) => { const s = S(); let n = 0;
        for (const b of s.matter.world.localWorld.bodies) { if (b === s.ufo.body) continue; const bb = b.bounds;
            if (bb.max.x < x0 || bb.min.x > x1 || bb.max.y < y0 || bb.min.y > y1) continue; n++; }
        return n; };
    return {
        init() { const s = S(); g.loop.sleep(); T = s.time.now;
            for (const f of s.farmers) { if (f.body) f.setStatic(true); if (f._timer) f._timer.paused = true; f._cooldown = 1e12; }
            s.farmers = [];
            for (const c of s.cows) { if (c.body) c.setStatic(true); if (c.walkTimer) c.walkTimer.paused = true; }
            if (s.dbg && s.dbg.behavior) s.dbg.behavior.inputMode = 'wasd';
            UFO = { x: s.ufo.x, y: s.ufo.y }; },
        setProfile(p) { profile = p; phase = 0; for (let i = 0; i < 70; i++) step(); },
        // Praia reta pro leste: terra em cx-4..cx, água em cx+1..cx+4 (3 linhas), sem corpos
        shore() { const s = S(), C = s.terrainCell || 80, gr = s.terrainGrid;
            for (let cy = 2; cy < gr.length - 2; cy++) for (let cx = 5; cx < gr[0].length - 5; cx++) {
                let ok = true;
                for (let yy = cy - 1; yy <= cy + 1 && ok; yy++) {
                    for (let k = 0; k <= 4 && ok; k++) if (isW(cx - k, yy)) ok = false;
                    for (let k = 1; k <= 4 && ok; k++) if (!isW(cx + k, yy)) ok = false; }
                if (!ok) continue;
                const X = (cx + 1) * C;
                if (bodiesIn(X - 4 * C, (cy - 1) * C, X + 20, (cy + 2) * C)) continue;
                return { X, yc: (cy + 0.5) * C }; }
            return null; },
        // Terra aberta 7×3 células sem corpos (mede o escorregão puro)
        land() { const s = S(), C = s.terrainCell || 80, gr = s.terrainGrid;
            for (let cy = 1; cy < gr.length - 4; cy++) for (let cx = 1; cx < gr[0].length - 8; cx++) {
                let ok = true;
                for (let yy = cy; yy < cy + 3 && ok; yy++) for (let xx = cx; xx < cx + 7 && ok; xx++) if (isW(xx, yy)) ok = false;
                if (!ok || bodiesIn(cx * C, cy * C, (cx + 7) * C, (cy + 3) * C)) continue;
                return { x0: cx * C, y0: cy * C }; }
            return null; },
        // Quique: largado a 140 px da água rumo a ela com embalo de 14; uma moita
        // 14 px ao norte do caminho, a 60 px do ponto de soltura, desvia ele pro
        // sudeste. Devolve a direção do embalo gravada depois do quique (a marca
        // pode sair no mesmo quadro, se o resto do escorregão não chega mais à água)
        bounce() { const s = S(), sh = this.shore(); if (!sh) return null;
            const x = sh.X - 140, y = sh.yc;
            const bush = s.matter.add.circle(x + 60, y - 14, 14, { isStatic: true, label: 'bush' });
            phase = 0; s.burgersCollected = 0; UFO = { x: x - 1200, y }; pin();
            const f = s._createFarmer(x, y);
            f._cooldown = 1e12; if (f._timer) f._timer.paused = true; f._wandering = false;
            f.setFrictionAir(0.015); f.setVelocity(14, 0);
            s.abductedCows.push(f); s._updateBeamCounters();
            s.energiaLed = 0; s._keysWASD.SPACE.isDown = true;
            step();
            s._keysWASD.SPACE.isDown = false;
            const dropDy = f._beamDy || 0;
            let maxDy = 0, maxVyDown = 0;
            for (let i = 0; i < 40; i++) { step(); if (!f.scene || !f.body) break;
                if ((f._beamDy || 0) > maxDy) maxDy = f._beamDy;
                if (f.body.velocity.y > maxVyDown) maxVyDown = f.body.velocity.y; }
            s.matter.world.remove(bush);
            s.farmers = s.farmers.filter(q => q !== f);
            s.abductedCows = s.abductedCows.filter(q => q !== f); s._updateBeamCounters();
            if (f.scene) s._destroyCow(f);
            return { dropDy, maxDy, maxVyDown }; },
        // Largado pelo graviton zerado em (x, y) com embalo v pro leste
        drop(x, y, v) { const s = S(); phase = 0; s.burgersCollected = 0;
            UFO = { x: x - 1200, y }; pin();
            const f = s._createFarmer(x, y);
            f._cooldown = 1e12; if (f._timer) f._timer.paused = true; f._wandering = false;
            f.setFrictionAir(0.015); f.setVelocity(v, 0);            // como no feixe (_tryAbduct)
            s.abductedCows.push(f); s._updateBeamCounters();
            s.energiaLed = 0; s._keysWASD.SPACE.isDown = true;
            step();
            s._keysWASD.SPACE.isDown = false;
            const rec = { drowned: false, maxAlong: 0, thrownEnd: null, entered: false, enteredMarked: false };
            let ms = 4000, n = 0;
            while (ms > 0) {
                if (!f.scene || !f.body) break;
                ms -= step(); n++;
                if (!f.scene || !f.body) break;
                if (f.x - x > rec.maxAlong) rec.maxAlong = f.x - x;
                if (!rec.entered && s._isWaterAt(f.x, f.y)) { rec.entered = true; rec.enteredMarked = !!(f._wetSlide || f._drowning || f._waterVerdict); }
                if (f._drowning) { rec.drowned = true; break; }
                if (!f._thrown && Math.hypot(f.body.velocity.x, f.body.velocity.y) < 0.03 && n > 5) break;
            }
            rec.thrownEnd = !!f._thrown;
            s.farmers = s.farmers.filter(q => q !== f);
            s.abductedCows = s.abductedCows.filter(q => q !== f); s._updateBeamCounters();
            if (f.scene) s._destroyCow(f);
            rec.maxAlong = Math.round(rec.maxAlong * 10) / 10;
            return rec; },
    };
}

// Ponto onde o fazendeiro solto AFOGA: o meio do maior lago, ou o oceano a
// ~4 células da praia (a faixa que nada é de 2)
async function water(game, kind) {
    return game.scene((s, a) => {
        const W = new Function('return (' + a.src + ')')()()(s);
        return a.kind === 'lake' ? W.lakeCenter() : W.oceanAt(320);
    }, { src: WATERLIB.toString(), kind });
}

async function waterLib(game, call, arg) {
    return game.scene((s, a) => {
        const W = new Function('return (' + a.src + ')')()()(s);
        return W[a.call](a.arg);
    }, { src: WATERLIB.toString(), call, arg });
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

    // Thiago 01/11: o embalo do feixe leva o fazendeiro pra água, e onde o
    // escorregão PARA decide ("mais perto da borda que do centro ele nada"; no
    // oceano, faixa de 2 células). Da praia do oceano o escorregão para bem antes
    // de 160 px: entra ainda no embalo (julgado) e nada. Antes ele afogava na
    // entrada. No fim da partida (escalada ~1,5) é igual
    for (const c of [{ esc: 0, v: 12, label: 'começo da partida' }, { esc: 0, v: 8, label: 'começo da partida' },
                     { esc: 29, v: 10, label: 'fim da partida (escalada ~1,5)' }]) {
        test(`graviton zerado na praia do oceano, embalo de ${c.v} px/frame no ${c.label}: entra no embalo, para perto da praia e nada`, async ({ game, page }) => {
            await startPlaying(game, page);
            const shore = await game.scene((s, a) => new Function('return (' + a + ')')()(s), findShore.toString());
            expect(shore, 'o mapa da seed tem praia de oceano').not.toBeNull();
            await game.beamOn();
            try {
                const base = await game.scene((s, a) => {
                    s.burgersCollected = a.esc;          // escalada pela quota (29/30, sem vitória)
                    const f = s.farmers.find(v => v.scene && v.body && !v._dying);
                    window.__alvo = f;
                    window.__wet = false;
                    s.events.on('postupdate', () => { if (window.__alvo._wetSlide || window.__alvo._drowning) window.__wet = true; });
                    s.energiaLed = 0;
                    f.setPosition(a.p.x, a.p.y); f.setVelocity(a.v, 0);   // a 40 px da água, rumo a ela
                    s.abductedCows.push(f);
                    return s.farmersTotal || 0;
                }, { p: shore, esc: c.esc, v: c.v });
                expect(await game.waitFor(() => window.__wet, { timeout: 3000 }),
                    'escorregou pra água ainda no embalo (julgado pela regra da margem)').toBe(true);
                await page.waitForTimeout(2500);
                const st = await game.scene(s => { const a = window.__alvo;
                    return { alive: !!(a.scene && a.body), drowning: !!a._drowning, thrown: !!a._thrown, total: s.farmersTotal || 0 }; });
                expect(st.alive, 'parou a menos de 2 células da praia: nada').toBe(true);
                expect(st.drowning).toBe(false);
                expect(st.thrown, 'julgado: a marca saiu').toBe(false);
                expect(st.total).toBe(base);
            } finally {
                await game.beamOff();
            }
            expect(game.realErrors).toEqual([]);
        });
    }

    // Embalo que leva até o meio de um lago pequeno afoga: laguinho 2×2 (160 px,
    // meio a 80 px da margem) cavado em terra; o escorregão de um embalo de 8
    // para ~58 px pra dentro dele, mais perto do meio que da margem
    test('graviton zerado na beira de um laguinho, embalo de 8 até o meio: afoga', async ({ game, page }) => {
        await startPlaying(game, page);
        const pond = await waterLib(game, 'carvePond');
        expect(pond, 'achou terra aberta pro laguinho').not.toBeNull();
        await game.scene((s, p) => { s.ufo.setPosition(p.x - 1000, p.y); s.ufo.setVelocity(0, 0);
            s.cameras.main.centerOn(p.x - 1000, p.y); }, pond);
        await game.hover();
        await game.beamOn();
        try {
            const base = await game.scene((s, p) => {
                const f = s.farmers.find(v => v.scene && v.body && !v._dying);
                window.__alvo = f;
                f._wandering = false; if (f._timer) f._timer.paused = true; f._cooldown = 1e12;
                s.energiaLed = 0;
                f.setPosition(p.x, p.y); f.setVelocity(8, 0);
                s.abductedCows.push(f);
                return s.farmersTotal || 0;
            }, pond);
            expect(await game.waitFor(() => !!window.__alvo._drowning || !window.__alvo.scene, { timeout: 4000 }),
                'escorregou até o meio do laguinho e afogou').toBe(true);
            expect(await game.waitFor(() => !window.__alvo.scene, { timeout: 3000 }), 'afundou').toBe(true);
            expect(await game.scene(s => s.farmersTotal || 0)).toBe(base + 1);
        } finally {
            await game.beamOff();
        }
        expect(game.realErrors).toEqual([]);
    });

    // Thiago 01/11: "se ele estiver mais perto da borda que do centro ele nada"
    test('solto no lago mais perto da margem que do meio: nada até a margem', async ({ game, page }) => {
        await startPlaying(game, page);
        const lc = await waterLib(game, 'lakeCenter');
        expect(lc, 'o mapa da seed tem lago').not.toBeNull();
        const before = await throwAt(game, 'farmer', lc.edge);
        await game.scene(() => { const f = window.__alvo; f._wandering = false; if (f._timer) f._timer.paused = true; });
        await page.waitForTimeout(600);
        const mid = await game.scene(s => ({ drowning: !!window.__alvo._drowning, thrown: !!window.__alvo._thrown,
            wet: s._isWaterAt(window.__alvo.x, window.__alvo.y) }));
        expect(mid.drowning, `a ${Math.round(lc.M * 0.25)} px da margem (meio a ${Math.round(lc.M)}): nada`).toBe(false);
        expect(mid.thrown, 'julgado: a marca saiu').toBe(false);
        expect(await game.waitFor(s => window.__alvo.scene && !s._isWaterAt(window.__alvo.x, window.__alvo.y), { timeout: 8000 }),
            'chegou na margem').toBe(true);
        expect(await game.scene(s => s.farmersTotal || 0)).toBe(before.total);
        expect(game.realErrors).toEqual([]);
    });

    // Thiago 01/11 ("Faixa perto da praia"): no oceano nada até 2 células
    test('solto no oceano a 1 célula da praia: nada até a praia', async ({ game, page }) => {
        await startPlaying(game, page);
        const pt = await waterLib(game, 'oceanAt', 80);
        expect(pt, 'o mapa da seed tem oceano a 1 célula da praia').not.toBeNull();
        const before = await throwAt(game, 'farmer', pt);
        await game.scene(() => { const f = window.__alvo; f._wandering = false; if (f._timer) f._timer.paused = true; });
        await page.waitForTimeout(600);
        expect(await game.scene(() => !!window.__alvo._drowning), `a ${Math.round(pt.d)} px da praia: nada`).toBe(false);
        expect(await game.waitFor(s => window.__alvo.scene && !s._isWaterAt(window.__alvo.x, window.__alvo.y), { timeout: 8000 }),
            'chegou na praia').toBe(true);
        expect(await game.scene(s => s.farmersTotal || 0)).toBe(before.total);
        expect(game.realErrors).toEqual([]);
    });

    // Thiago 01/11: "fazendeiros largados nos currais ficam presos por alguns
    // segundos?" → "Sim, preso uns segundos"
    test('solto em cima do curral: fica preso ~3 s sem andar nem atirar e depois sai andando', async ({ game, page }) => {
        await startPlaying(game, page);
        const st0 = await game.scene(s => {
            const c = s.corrals[0];
            const f = s.farmers.find(v => v.scene && v.body && !v._dying);
            window.__alvo = f;
            for (const o of s.farmers) if (o !== f) o._cooldown = 1e12;    // só ele poderia atirar
            s.bullets.forEach(b => b.sprite && b.sprite.destroy()); s.bullets = [];
            // nave a 300 px: dentro do alcance de tiro (420) e da caça (690)
            s.ufo.setPosition(c.x + 300, c.y); s.ufo.setVelocity(0, 0); s.cameras.main.centerOn(c.x + 300, c.y);
            f.setPosition(c.x, c.y); f.setVelocity(0, 0); f._cooldown = 0;
            s.abductedCows.push(f); s._releaseAll();
            return { cx: c.x, cy: c.y, cows: (s.cowsTotal || 0) + (s.bullsTotal || 0), total: s.farmersTotal || 0 };
        });
        await game.hover();
        await page.waitForTimeout(2200);
        const mid = await game.scene((s, c) => { const f = window.__alvo;
            return { d: Math.hypot(f.x - c.cx, f.y - c.cy), trapped: (f._trapT || 0) > 0, bullets: s.bullets.length }; }, st0);
        expect(mid.trapped, 'preso no curral').toBe(true);
        expect(mid.d, 'continua dentro do curral').toBeLessThan(40);
        expect(mid.bullets, 'preso não atira').toBe(0);
        expect(await game.waitFor((s, c) => { const f = window.__alvo;
            return !!f.scene && Math.hypot(f.x - c.cx, f.y - c.cy) > 60; }, { timeout: 5000, arg: st0 }), 'saiu andando').toBe(true);
        const end = await game.scene(s => ({ alive: !!window.__alvo.scene, total: s.farmersTotal || 0,
            cows: (s.cowsTotal || 0) + (s.bullsTotal || 0) }));
        expect(end.alive).toBe(true);
        expect(end.total, 'não é morte').toBe(st0.total);
        expect(end.cows, 'não é entrega').toBe(st0.cows);
        expect(game.realErrors).toEqual([]);
    });

    // Fechamento (01/11): o giro de 3 s do arremesso contava pelo relógio da
    // cena, que anda na pausa
    test('a pausa congela o giro de 3 s do arremesso', async ({ game, page }) => {
        await startPlaying(game, page);
        const land = await game.scene(s => {
            for (let i = 0; i < 50; i++) { const p = s._randLandPos();
                if (!(s.corrals || []).some(c => Math.hypot(c.x - p.x, c.y - p.y) < 300)) return p; }
            return s._randLandPos();
        });
        await throwAt(game, 'farmer', land);
        await game.scene(() => { const f = window.__alvo; f._wandering = false; if (f._timer) f._timer.paused = true; });
        await page.waitForTimeout(500);
        await game.scene(s => s._setPaused(true));
        await page.waitForTimeout(2000);
        const left = await game.scene(s => { s._setPaused(false); return window.__alvo._releaseSpinUntil - s.time.now; });
        expect(left, 'depois de 2 s pausado o giro ainda tem ~2,5 s').toBeGreaterThan(1500);
        expect(game.realErrors).toEqual([]);
    });

    // Fechamento (01/11): o quique numa moita desviava o fazendeiro, mas o
    // embalo guardava a direção do soltar
    test('quadro a quadro: o quique numa moita realinha a direção do embalo', async ({ game, page }) => {
        await startPlaying(game, page);
        const r = await game.scene((s, a) => {
            const L = new Function('return (' + a.src + ')')()();
            L.init(); L.setProfile('60');
            return L.bounce();
        }, { src: LAB.toString() });
        expect(r, 'o mapa da seed tem praia reta').not.toBeNull();
        expect(r.dropDy, 'na soltura o embalo ia reto pro leste').toBeCloseTo(0, 2);
        expect(r.maxVyDown, 'a moita desviou ele pro sudeste').toBeGreaterThan(0.5);
        expect(r.maxDy, 'o embalo seguiu a direção nova (sudeste)').toBeGreaterThan(0.2);
    });

    // Achado do Ensaio (01/11, 5d5b636): no fim do escorregão ele entrava na
    // água e nadava (3 a 9 px a 60 fps, até 18 com frame irregular). O impulso
    // decaía 2× no frame da soltura, o dt vinha do delta da cena e não do passo
    // do Matter, e o resto do escorregão supunha passo de 16,7 ms
    for (const prof of ['60', 'jit']) {
        test(`quadro a quadro (${prof === '60' ? '60 fps' : 'frame irregular 16/33 ms'}): escorregão que chega à água por meio quadro entra no embalo; o que para antes não`, async ({ game, page }) => {
            await startPlaying(game, page);
            const r = await game.scene((s, a) => {
                const L = new Function('return (' + a.src + ')')()();
                L.init(); L.setProfile(a.prof);
                const sh = L.shore(), ld = L.land();
                if (!sh || !ld) return { missing: !sh ? 'praia' : 'terra' };
                const v = 8;
                const pure = L.drop(ld.x0 + 40, ld.y0 + 120, v);
                const near = L.drop(sh.X - (pure.maxAlong - 0.5 * v), sh.yc, v);
                const short = L.drop(sh.X - (pure.maxAlong + 15), sh.yc, v);
                return { L: pure.maxAlong, near, short };
            }, { src: LAB.toString(), prof });
            expect(r.missing, 'o mapa da seed tem praia reta e terra aberta').toBeUndefined();
            expect(r.L, 'escorregão puro de um embalo de 8').toBeGreaterThan(60);
            expect(r.near.entered, `o escorregão puro (${r.L} px) chega à água por 4 px`).toBe(true);
            expect(r.near.enteredMarked, 'entrou ainda no embalo (julgado pela regra da margem)').toBe(true);
            expect(r.near.drowned, 'parou colado na margem: nada').toBe(false);
            expect(r.short.entered, 'o escorregão para 15 px antes da água: não entra').toBe(false);
            expect(r.short.thrownEnd, 'a marca saiu em terra').toBe(false);
        });
    }

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
    // até ~7,1 px/frame perseguindo (10,6 com a escalada no máximo). Correndo
    // por conta própria pra nave sobre o lago ele não afoga: o escorregão que o
    // impulso do feixe (10 no fim do giro) ainda dava terminava em terra
    for (const c of [{ esc: 0, label: 'começo' }, { esc: 29, label: 'fim (escalada ~1,5)' }]) {
        test(`solto, o giro acaba com embalo e ele corre sozinho pra nave sobre o lago (${c.label}): nada de volta`, async ({ game, page }) => {
            await startPlaying(game, page);
            const sh = await game.scene((s, a) => new Function('return (' + a + ')')()(s), findLakeShore.toString());
            expect(sh, 'o mapa da seed tem beira de lago').not.toBeNull();
            const base = await game.scene((s, a) => {
                const p = a.sh;
                s.burgersCollected = a.esc;
                const f = s.farmers.find(v => v.scene && v.body && !v._dying);
                window.__alvo = f;
                s.ufo.setPosition(p.lake.x, p.lake.y); s.ufo.setVelocity(0, 0);
                s.cameras.main.centerOn(p.lake.x, p.lake.y);
                f.setPosition(p.land.x, p.land.y);
                // fim do giro: marca de arremesso, impulso 10 rumo à nave
                f._thrown = true; s._setBeamImpulse(f, 10, 0); f._releaseSpinUntil = 0; f.setFrictionAir(0.08);
                f.wanderAngle = 0; f._wandering = true; if (f._timer) f._timer.paused = true;
                f.setVelocity(10, 0);
                return s.farmersTotal || 0;
            }, { sh, esc: c.esc });
            await game.hover();
            await page.waitForTimeout(2500);
            const st = await game.scene(s => { const a = window.__alvo;
                return { alive: !!(a.scene && a.body), drowning: !!a._drowning, dying: !!a._dying,
                         thrown: !!a._thrown, total: s.farmersTotal || 0 }; });
            expect(st.alive, 'correndo por conta própria não afoga (segue vivo)').toBe(true);
            expect(st.drowning, 'correndo por conta própria não afoga').toBe(false);
            expect(st.dying).toBe(false);
            expect(st.thrown, 'a marca saiu: o escorregão do feixe terminava em terra').toBe(false);
            expect(st.total).toBe(base);
            expect(game.realErrors).toEqual([]);
        });
    }

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
