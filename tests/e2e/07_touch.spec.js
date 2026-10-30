// 07_touch.spec.js — projeto `tablet-touch` (1024×768, toque, sem mouse).
// Nessa largura o index.html NÃO cai no failsafe mobile: é o jogo completo com
// o dedo no lugar do ponteiro (toque = mover nave + feixe ligado enquanto segura).
// Os toques vão por CDP Input.dispatchTouchEvent (TouchInput na fixture).
const { test, expect } = require('./fixtures');
const { playTutorial, abductOne, deliverToCorral, collectBurger } = require('./tutorial_helpers');

test.describe('touch (tablet 1024×768)', () => {
    test('boot em touch: jogo completo, sem modo teaser, splash com botões', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        const st = await game.state();
        expect(st.mobileMode).toBe(false);
        expect(st.isMobile, 'isMobile (joystick) — falso em 1024px').toBe(false);
        expect(st.gameStarted).toBe(false);
        const env = await page.evaluate(() => ({
            coarse: matchMedia('(pointer: coarse)').matches,
            touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            w: innerWidth, rotate: getComputedStyle(document.getElementById('rotate-prompt')).display,
        }));
        expect(env.touch).toBe(true);
        expect(env.coarse).toBe(true);
        expect(env.rotate, 'prompt ROTATE escondido em landscape').toBe('none');
        expect(game.realErrors).toEqual([]);
    });

    test('toque nos botões do splash começa a partida e o dedo pilota a nave', async ({ game, page }) => {
        test.setTimeout(120_000);
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.inputMode).toBe('mouse');

        // Dedo encostado à direita da nave: ela vai atrás (e o feixe liga)
        const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        const p = await game.worldToPage(u0.x + 260, u0.y);
        await game.input.move(p.x, p.y);
        await game.input.down();
        await page.waitForTimeout(900);
        const mid = await game.scene(s => ({
            x: s.ufo.x, y: s.ufo.y, down: s.input.activePointer.isDown,
            cone: s.lightCone.visible, energy: s.energiaLed,
        }));
        await game.input.up();
        expect(mid.down).toBe(true);
        expect(mid.cone, 'feixe aceso com o dedo na tela').toBe(true);
        expect(mid.x - u0.x).toBeGreaterThan(120);
        expect(mid.energy).toBeLessThan(100);
        // Soltou: feixe apaga e graviton recarrega
        await page.waitForTimeout(500);
        const after = await game.scene(s => ({ down: s.input.activePointer.isDown, cone: s.lightCone.visible, energy: s.energiaLed }));
        expect(after.down).toBe(false);
        expect(after.cone).toBe(false);
        expect(after.energy).toBeGreaterThan(mid.energy);
        expect(game.realErrors).toEqual([]);
    });

    test('loop no toque: vaca → curral → burger', async ({ game, page }) => {
        test.setTimeout(240_000);
        const log = (m) => console.log(m);
        await game.presetConfig({ enabled: { farmers: false, shooters: false } });
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'pt', input: 'mouse' });
        expect(await abductOne(game, log, { keep: true })).toBe(true);
        expect(await deliverToCorral(game, log)).toBe(true);
        expect(await collectBurger(game, log)).toBe(true);
        // Com o dedo na tela o feixe vai junto: pode entregar e coletar mais de um
        const st = await game.state();
        expect(st.burgersCollected).toBeGreaterThanOrEqual(1);
        expect(st.score).toBeGreaterThanOrEqual(100);
        expect(game.realErrors).toEqual([]);
    });

    test('tutorial inteiro (10 passos) no toque', async ({ game, page }) => {
        test.setTimeout(480_000);
        await playTutorial(game, page);
    });
});
