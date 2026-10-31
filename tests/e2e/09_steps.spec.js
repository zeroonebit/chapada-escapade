// 09_steps.spec.js — invariantes de passos do tutorial e da economia de tanque
// que a suíte de ponta a ponta só pega por sorte (dependem de inércia, passeio
// aleatório do fazendeiro ou fps baixo).
const { test, expect } = require('./fixtures');

test.describe('passo 06 (REVIDE) não pode travar', () => {
    test('congelar a nave zera a velocidade (tiro reto não passa longe)', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        // Nave a toda (como quem acabou de coletar o burger voando)
        const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        let vBefore = 0;
        for (let i = 0; i < 40 && vBefore < 5; i++) {   // acelera até passar de 5 px/frame
            await game.aimToward(u0.x + 900, u0.y, 240);
            await page.waitForTimeout(100);
            vBefore = await game.scene(s => Math.hypot(s.ufo.body.velocity.x, s.ufo.body.velocity.y));
        }
        expect(vBefore).toBeGreaterThan(5);
        await game.hover();
        // Entra no TAKE_DAMAGE (BURGER → TAKE_DAMAGE) e espera o frame que spawna o atirador
        await game.scene(s => { s._tutMinReadMs = 300; for (let i = 0; i < 5; i++) s._tutAdvance(); });
        expect(await game.waitFor(s => s._tutAtiradorSpawned, { timeout: 3000 })).toBe(true);
        await page.waitForTimeout(60);
        const st = await game.scene(s => ({
            key: TUT_STEPS[s._tutStepIdx].key, frozen: !!s._tutFreezeNave,
            v: Math.hypot(s.ufo.body.velocity.x, s.ufo.body.velocity.y),
        }));
        expect(st.key).toBe('TAKE_DAMAGE');
        expect(st.frozen).toBe(true);
        expect(st.v, 'nave congelada de verdade (sem deslizar)').toBeLessThan(1);
    });

    test('fazendeiro fora do alcance é reposto perto (senão ninguém atira)', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        await game.scene(s => { s._tutMinReadMs = 300; for (let i = 0; i < 5; i++) s._tutAdvance(); });
        expect(await game.waitFor(s => s.farmers.length > 0, { timeout: 2000 }), 'atirador nasceu').toBe(true);
        // Mata o tiro inicial e manda o fazendeiro passear pra longe (800px > 420 de alcance)
        await game.scene(s => {
            s.bullets.forEach(b => b.sprite && b.sprite.destroy()); s.bullets = [];
            const f = s.farmers[0]; f.setPosition(s.ufo.x + 800, s.ufo.y); f._cooldown = 99999;
        });
        await page.waitForTimeout(200);
        const near = await game.waitFor(s => s.farmers.some(f => f.scene && !f._dying &&
            Math.hypot(f.x - s.ufo.x, f.y - s.ufo.y) <= 420), { timeout: 2500 });
        expect(near, 'tem fazendeiro no alcance de tiro de novo').toBe(true);
        // ...e a lição fecha: leva o tiro e avança pro FARMER
        const advanced = await game.waitFor(s => s._tutDamageTaken || TUT_STEPS[s._tutStepIdx]?.key === 'FARMER', { timeout: 8000 });
        expect(advanced, 'levou o tiro').toBe(true);
        expect(game.realErrors).toEqual([]);
    });
});

test.describe('economia de tanque independe do fps', () => {
    test('frame de 200ms (fps baixo) não drena mais que o passo da física (33ms)', async ({ game, page }) => {
        // O Matter limita o passo a ~33ms (runner.deltaMax) mas o delta da cena vai
        // a 200ms (minFps 5): a nave anda 33ms de física e pagava 200ms de tanque.
        await page.goto('/');
        await game.waitForScene();
        await game.startDirect({ tutorial: false, input: 'mouse' });
        const r = await game.scene(s => {
            s.ufo.setVelocity(8, 0);          // velocidade "cheia" (speedNorm 1)
            s.fuelCurrent = 100;
            s._updateFuel(33.3);
            const d33 = 100 - s.fuelCurrent;
            s.fuelCurrent = 100;
            s._updateFuel(200);
            const d200 = 100 - s.fuelCurrent;
            return { d33, d200 };
        });
        expect(r.d33).toBeGreaterThan(0);
        expect(r.d200, 'drain de um frame lento = drain do passo físico').toBeLessThanOrEqual(r.d33 * 1.05);
    });
});

// Thiago (31/10, "Web segue o Bevy"): a economia do feixe vira a do Bevy —
// gasta 7,5/s, recarga 5/s (o ajuste do PC dele virou o padrão do jogo no Bevy,
// 7e4999a). Antes a web era 5/s · 30/s. Tanque de 100 nas duas frentes.
test.describe('economia do feixe (paridade Bevy)', () => {
    test('graviton gasta 7,5/s com o feixe ligado e recarrega 5/s solto; tutorial 02 gasta 2×', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startDirect({ tutorial: false, input: 'mouse' });
        const r = await game.scene(s => {
            const step = (n, want) => { for (let i = 0; i < n; i++) s._stepGraviton(1000 / 30, want, false); };
            s._tutGravitonDrain2x = false;
            s.energiaLed = 100; step(30, true);  const drain = 100 - s.energiaLed;   // 1 s de feixe
            s.energiaLed = 50;  step(30, false); const regen = s.energiaLed - 50;    // 1 s solto
            s.energiaLed = 100; s._tutGravitonDrain2x = true; step(30, true);
            const drain2x = 100 - s.energiaLed; s._tutGravitonDrain2x = false;
            s.energiaLed = 1;   step(30, true);  const floor = s.energiaLed;          // não passa de 0
            s.energiaLed = 99;  step(30, false); const cap = s.energiaLed;            // não passa de 100
            return { drain, regen, drain2x, floor, cap, max: s.energiaMax };
        });
        expect(r.max, 'tanque de 100 (igual ao ENERGY_MAX do Bevy)').toBe(100);
        expect(r.drain, 'gasto por segundo').toBeCloseTo(7.5, 1);
        expect(r.regen, 'recarga por segundo').toBeCloseTo(5, 1);
        expect(r.drain2x, 'passo 02 do tutorial gasta 2×').toBeCloseTo(15, 1);
        expect(r.floor).toBe(0);
        expect(r.cap).toBe(100);
    });
});

test.describe('tanque no tutorial (decisão do Thiago, 30/10)', () => {
    test('entrar no passo 06 (REVIDE) reabastece o tanque', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        // Até o BURGER o tanque vai a 15% (lição); dali pra frente os passos de
        // combate gastavam o que sobrava e a nave morria 2-5× até o fim
        await game.scene(s => { s._tutMinReadMs = 300; for (let i = 0; i < 4; i++) s._tutAdvance(); });
        expect(await game.scene(s => s.fuelCurrent)).toBeLessThanOrEqual(16);
        await game.scene(s => s._tutAdvance());
        const st = await game.scene(s => ({ key: TUT_STEPS[s._tutStepIdx].key, fuel: s.fuelCurrent, max: s.fuelMax }));
        expect(st.key).toBe('TAKE_DAMAGE');
        expect(st.fuel, 'tanque cheio ao entrar no 06').toBeGreaterThanOrEqual(st.max - 1);
    });

    test('concluir o tutorial reabastece o tanque (sem morrer na tela de conclusão)', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        await game.scene(s => { s.fuelCurrent = 3; s._tutConcluir(); });
        const st = await game.scene(s => ({ fuel: s.fuelCurrent, max: s.fuelMax, idx: s._tutStepIdx }));
        expect(st.idx).toBeNull();
        expect(st.fuel, 'tanque cheio ao concluir').toBeGreaterThanOrEqual(st.max - 1);
    });
});

test.describe('drain de tanque não escala com o tempo (parity Bevy fuel.rs)', () => {
    test('depois de 5s de partida, a toda ainda gasta 3.5/s', async ({ game, page }) => {
        // O web multiplicava o drain por `difficulty`, que crescia +0.018/s pra
        // sempre: aos 5 min um tanque cheio durava 4s de voo. O Bevy não tem
        // isso (escalada é por quota, em _escalation).
        await page.goto('/');
        await game.waitForScene();
        await game.startDirect({ tutorial: false, input: 'mouse' });
        await page.waitForTimeout(5000);
        const r = await game.scene(s => {
            s.ufo.setVelocity(8, 0);
            s.fuelCurrent = 100;
            s._updateFuel(33.3);
            return { drain: 100 - s.fuelCurrent, difficulty: s.difficulty };
        });
        const expected = 3.5 * 0.0333;
        expect(r.drain).toBeGreaterThan(expected * 0.97);
        expect(r.drain, 'drain a toda = 3.5/s, sem crescer com o tempo').toBeLessThan(expected * 1.03);
    });
});
