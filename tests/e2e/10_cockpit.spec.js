// 10_cockpit.spec.js — painel (cockpit FinalHud) na base da tela, desktop.
// user 30/10: "HUD tomando a parte de baixo da tela" — largura toda, com teto
// de 40% da altura em telas largas; depois, jogando no Z Fold: "pode ser menor
// uns 80% do tamanho atual" → tudo × 0.8 (05_hud._positionCockpit).
const { test, expect } = require('./fixtures');

test.describe('cockpit no desktop', () => {
    test('painel ocupa a base: 80% da largura ou 32% da altura, o que vier primeiro', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        const st = await game.scene(s => ({
            w: s.scale.width, h: s.scale.height,
            dashW: s.hud.ckDash.displayWidth, dashH: s.hud.ckDash.displayHeight,
            dashX: s.hud.ckDash.x, dashY: s.hud.ckDash.y,
            touchCockpit: !!s.touchCockpit,
        }));
        const sExpected = 0.8 * Math.min(st.w / 2056, (st.h * 0.40) / 541);
        expect(Math.abs(st.dashW - 2056 * sExpected)).toBeLessThan(2);
        expect(Math.abs(st.dashH - 541 * sExpected)).toBeLessThan(2);
        expect(st.dashH / st.h).toBeLessThanOrEqual(0.321);
        expect(st.dashW).toBeLessThanOrEqual(st.w * 0.8 + 1);
        expect(st.dashX).toBeCloseTo(st.w / 2, 0);     // centrado
        expect(st.dashY).toBe(st.h);                    // colado na base (origin 0.5,1)
        expect(st.touchCockpit, 'desktop com mouse não é cockpit de toque').toBe(false);
    });

    test('lente do emissor acende com o mouse apertado (fonte única _beamWanted)', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        await game.hover();
        expect(await game.scene(s => s._beamWanted())).toBe(false);
        expect(await game.scene(s => s.hud.ckBeamOff.visible)).toBe(true);
        await game.beamOn();
        await page.waitForTimeout(250);
        expect(await game.scene(s => s._beamWanted())).toBe(true);
        expect(await game.scene(s => s.hud.ckBeamOff.visible), 'lente acesa').toBe(false);
        await game.beamOff();
        await page.waitForTimeout(250);
        expect(await game.scene(s => s._beamWanted())).toBe(false);
        expect(game.realErrors).toEqual([]);
    });
});
