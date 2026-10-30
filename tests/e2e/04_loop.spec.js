// 04_loop.spec.js — loop principal jogado de verdade: abduzir vaca → curral →
// burger (3s) → coleta pelo feixe → pontos + combustível + quota. Também o
// modo WASD (teclas + SPACE) e a vitória por quota com reinício.
const { test, expect } = require('./fixtures');
const { abductOne, deliverToCorral, collectBurger } = require('./tutorial_helpers');

test.describe('loop principal', () => {
    test('vaca → curral → burger → pontos e combustível (mouse)', async ({ game, page }) => {
        test.setTimeout(240_000);
        const log = (m) => console.log(m);
        // Sem inimigos (toggle do CONFIGS): o loop isolado; combate fica no tutorial
        await game.presetConfig({ enabled: { farmers: false, shooters: false } });
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });

        const before = await game.scene(s => ({
            score: s.score, fuel: s.fuelCurrent, cows: s.cows.length,
            matches: s.save?.matches, achievements: (s.save?.achievements || []).slice(),
        }));
        expect(before.cows).toBeGreaterThan(50);

        // 1. abduz uma vaca (persegue a mais perto com o feixe)
        expect(await abductOne(game, log, { keep: true }), 'abduziu vaca').toBe(true);
        const mid = await game.scene(s => ({
            inBeam: s._cowsInBeamCount, ach: s.save.achievements.includes('first_moo'),
            hudCows: s.hud.cowsText?.text,
        }));
        expect(mid.inBeam).toBe(1);
        expect(mid.ach, 'achievement first_moo').toBe(true);

        // 2. entrega no curral → slot 'loading'
        expect(await deliverToCorral(game, log), 'entregou no curral').toBe(true);
        const afterDrop = await game.scene(s => ({
            inBeam: s._cowsInBeamCount,
            cowsTotal: s.cowsTotal, bullsTotal: s.bullsTotal,
            // loading OU ready: a 1ª vaca pode ter caído ao passar a <110px, antes da 2ª
            loading: s.corrals.reduce((n, c) => n + (c.slots || []).filter(x => x && (x.state === 'loading' || x.state === 'ready')).length, 0),
            mascot: s.corrals.some(c => c.mascot && c.mascotCountTxt),   // criada pela entrega (xN some em 3s, quando vira burger)
        }));
        // No caminho até o curral o feixe pode pegar mais uma vaca: tudo que
        // chegou a bordo é entregue (até 3 slots)
        const delivered = afterDrop.cowsTotal + afterDrop.bullsTotal;
        expect(afterDrop.inBeam).toBe(0);
        expect(delivered).toBeGreaterThanOrEqual(1);
        expect(delivered).toBeLessThanOrEqual(3);
        expect(afterDrop.loading).toBe(delivered);
        expect(afterDrop.mascot, 'mascote do curral criada na entrega').toBe(true);
        // HUD: a caixa COWS mostra o TOTAL entregue (parity Bevy board.cows_delivered),
        // igual à caixa BULLS — não a carga no feixe (que já voltou a 0)
        const hudAfterDrop = await game.scene(s => ({ cows: s.hud.cowsText?.text, bulls: s.hud.bullsText?.text }));
        expect(hudAfterDrop.cows, 'caixa COWS do cockpit = vacas entregues').toBe(String(afterDrop.cowsTotal));
        expect(hudAfterDrop.bulls, 'caixa BULLS do cockpit = bois entregues').toBe(String(afterDrop.bullsTotal));

        // 3. burger pronto em ~3s e coleta pelo feixe
        expect(await collectBurger(game, log), 'coletou burger').toBe(true);
        const fuelBefore = game.lastCollect.fuelBefore;
        const after = await game.scene(s => ({
            score: s.score, fuel: s.fuelCurrent, burgers: s.burgersCollected,
            hudBurgers: s.hud.burgersText?.text, ach: s.save.achievements.includes('alien_chef'),
            slotsLeft: s.corrals.reduce((n, c) => n + (c.slots || []).filter(x => x).length, 0),
            burgersTotal: s.save.burgersTotal,
        }));
        // Slots a 56px um do outro e cone de 111px: com 2-3 entregues o feixe pode
        // coletar mais de um burger de uma vez. classic/cheese/double = 100/150/220
        // pts e 22/28/36 de fuel (00_constants.js)
        const n = after.burgers;
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(delivered);
        expect(after.score - before.score).toBeGreaterThanOrEqual(100 * n);
        expect(after.score - before.score).toBeLessThanOrEqual(220 * n);
        // Fuel do 1º burger coletado: +22..36 (cap em 100); o drain de 1 tick (<0.5) cabe
        const gain = game.lastCollect.fuelAfter - fuelBefore;
        if (game.lastCollect.fuelAfter < 99.9) {
            expect(gain).toBeGreaterThan(21);
            expect(gain).toBeLessThan(37);
        } else {
            expect(fuelBefore).toBeGreaterThan(100 - 37);
        }
        expect(after.hudBurgers).toBe(`${n}/30`);
        expect(after.ach, 'achievement alien_chef').toBe(true);
        expect(after.slotsLeft).toBe(delivered - n);
        expect(after.burgersTotal).toBe(n);
        expect(game.realErrors).toEqual([]);
    });

    test('WASD move a nave e SPACE liga o feixe', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'wasd' });
        // Foco no canvas pro teclado do Phaser (listener no window, mas garante)
        await page.mouse.click(640, 400);
        const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        await page.keyboard.down('KeyD');
        await page.waitForTimeout(900);
        await page.keyboard.up('KeyD');
        const u1 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        expect(u1.x - u0.x).toBeGreaterThan(120);
        expect(Math.abs(u1.y - u0.y)).toBeLessThan(60);

        await page.keyboard.down('KeyW');
        await page.waitForTimeout(700);
        await page.keyboard.up('KeyW');
        const u2 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        expect(u0.y - u2.y).toBeGreaterThan(60);

        // SPACE = feixe: cone visível + graviton drenando
        const e0 = await game.scene(s => s.energiaLed);
        await page.keyboard.down('Space');
        await page.waitForTimeout(800);
        const beam = await game.scene(s => ({ held: !!s._beamHeld, cone: s.lightCone.visible, e: s.energiaLed }));
        await page.keyboard.up('Space');
        expect(beam.held).toBe(true);
        expect(beam.cone).toBe(true);
        expect(beam.e).toBeLessThan(e0 - 2);
        // Soltou: regenera
        await page.waitForTimeout(600);
        const after = await game.scene(s => ({ held: !!s._beamHeld, cone: s.lightCone.visible, e: s.energiaLed }));
        expect(after.held).toBe(false);
        expect(after.cone).toBe(false);
        expect(after.e).toBeGreaterThan(beam.e);
        expect(game.realErrors).toEqual([]);
    });

    test('quota de 30 burgers → VITÓRIA → reinício sem splash', async ({ game, page }) => {
        test.setTimeout(240_000);
        const log = (m) => console.log(m);
        await game.presetConfig({ enabled: { farmers: false, shooters: false } });
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'pt', input: 'mouse' });
        // 29 já coletados; o 30º é jogado de verdade
        await game.scene(s => { s.burgersCollected = 29; });
        expect(await abductOne(game, log, { keep: true })).toBe(true);
        expect(await deliverToCorral(game, log)).toBe(true);
        expect(await collectBurger(game, log)).toBe(true);
        const won = await game.waitFor(s => s.gameOver && s.burgersCollected >= 30, { timeout: 5000 });
        expect(won, 'vitória disparou').toBe(true);
        const vic = await game.scene(s => ({
            text: s.children.list.some(o => o.type === 'Text' && /VITÓRIA/.test(o.text || '')),
            btn: s.children.list.some(o => o.type === 'Text' && /JOGAR NOVAMENTE/.test(o.text || '')),
            victories: s.save.victories,
            hudHidden: !(s.hud.ckDash && s.hud.ckDash.visible),
        }));
        expect(vic.text).toBe(true);
        expect(vic.btn).toBe(true);
        expect(vic.victories).toBe(1);
        expect(vic.hudHidden, 'cockpit escondido na vitória').toBe(true);

        // Botão JOGAR NOVAMENTE (w/2, h/2+120) → transição → scene.restart
        const sz = await game.scene(s => ({ w: s.scale.width, h: s.scale.height }));
        const p = await game.toPage(sz.w / 2, sz.h / 2 + 120);
        await game.input.tap(p.x, p.y);
        const restarted = await game.waitFor(s => !s.gameOver && s.gameStarted && s.burgersCollected === 0 && s.score === 0,
            { timeout: 15_000 });
        expect(restarted, 'reiniciou direto na partida (sem splash)').toBe(true);
        const st = await game.state();
        expect(st.tutorialMode).toBe(false);
        expect(st.physics).toBe(true);
        expect(st.cows).toBeGreaterThan(50);
        expect(game.realErrors).toEqual([]);
    });
});
