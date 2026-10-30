// 08_phone.spec.js — projeto `phone-touch` (375×812, o preset "mobile" do browser).
// Documenta o comportamento ATUAL do index.html em celular: retrato mostra o
// prompt ROTATE; paisagem (≤900px) entra no "mobile teaser" (sem splash, sem
// HUD, sem inimigos, feixe só visual) — decisão de 2026-04-29 (commit 5a10ad7).
// O joystick do 12_mobile.js NÃO aparece: ele exige isMobile && !__MOBILE_MODE,
// e toda tela que liga isMobile também liga o teaser (ver docs/TESTES.md).
const { test, expect } = require('./fixtures');

test.describe('celular (375×812)', () => {
    test('retrato: prompt ROTATE cobre a tela; jogo carrega em modo teaser por baixo', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        const env = await page.evaluate(() => ({
            rotate: getComputedStyle(document.getElementById('rotate-prompt')).display,
            mobileMode: !!window.__MOBILE_MODE,
            title: document.getElementById('pre-loader-title')?.style.color,
            host: document.getElementById('game-host').getBoundingClientRect().width,
        }));
        expect(env.rotate).toBe('flex');
        expect(env.mobileMode).toBe(true);
        expect(env.host).toBe(375);           // fullscreen (media query ≤900px)
        expect(game.realErrors).toEqual([]);
    });

    test('paisagem: teaser — sem splash, sem HUD, sem inimigos, dedo move a nave com inércia', async ({ game, page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width: 812, height: 375 });
        await page.goto('/');
        await game.waitForScene();
        const st = await game.state();
        expect(st.mobileMode).toBe(true);
        expect(st.isMobile).toBe(true);
        expect(st.gameStarted, 'teaser pula o splash').toBe(true);
        expect(st.physics).toBe(true);
        expect(st.farmers).toBe(0);
        expect(st.shooters).toBe(0);
        expect(st.cows).toBeLessThanOrEqual(5);
        const env = await page.evaluate(() => ({
            rotate: getComputedStyle(document.getElementById('rotate-prompt')).display,
            loaderBg: document.getElementById('pre-loader')?.style.background,
        }));
        expect(env.rotate).toBe('none');
        expect(env.loaderBg).toBe('transparent');   // título CHAPADA ESCAPADE fica por cima
        const flags = await game.scene(s => ({
            hudHidden: !(s.hud.ckDash && s.hud.ckDash.visible),
            joystick: !!s.joyBase,
            noPull: !!s._tutBeamNoPull, fuelFrozen: !!s._tutCombustivelCongelado,
            weather: s.dbg.fx.weather, tod: s.dbg.fx.timeOfDay,
        }));
        expect(flags.hudHidden).toBe(true);
        expect(flags.joystick, 'joystick do 12_mobile.js não existe no teaser').toBe(false);
        expect(flags.noPull).toBe(true);
        expect(flags.fuelFrozen).toBe(true);
        expect(flags.weather).toBe('storm');
        expect(flags.tod).toBe('midnight');

        // Dedo na tela: força enquanto segura; solta e a nave continua (inércia)
        const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        const p = await game.worldToPage(u0.x + 200, u0.y);
        await game.input.move(p.x, p.y);
        await game.input.down();
        await page.waitForTimeout(1000);
        const held = await game.scene(s => ({ x: s.ufo.x, cone: s.lightCone.visible, abducted: s.abductedCows.length }));
        await game.input.up();
        expect(held.x - u0.x).toBeGreaterThan(40);
        expect(held.cone, 'feixe visual no toque').toBe(true);
        expect(held.abducted, 'teaser não abduz').toBe(0);
        const v1 = await game.scene(s => Math.hypot(s.ufo.body.velocity.x, s.ufo.body.velocity.y));
        await page.waitForTimeout(600);
        const v2 = await game.scene(s => Math.hypot(s.ufo.body.velocity.x, s.ufo.body.velocity.y));
        expect(v1).toBeGreaterThan(0.5);
        expect(v2, 'inércia alta (frictionAir 0.005)').toBeGreaterThan(v1 * 0.5);
        expect(game.realErrors).toEqual([]);
    });

    test('teaser roda 8s sem erro (shuffle de clima, chuva densa, vinheta)', async ({ game, page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width: 812, height: 375 });
        await page.goto('/');
        await game.waitForScene();
        await page.waitForTimeout(8000);
        expect(game.realErrors).toEqual([]);
        expect(await game.scene(s => (s._errorLog || []).length)).toBe(0);
        expect(await game.scene(s => !!s.fxMobileVignette?.visible)).toBe(true);
    });
});
