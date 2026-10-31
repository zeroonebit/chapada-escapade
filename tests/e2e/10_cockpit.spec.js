// 10_cockpit.spec.js — painel (cockpit FinalHud) na base da tela, desktop.
// user 30/10: "HUD tomando a parte de baixo da tela" — largura toda, com teto
// de 40% da altura em telas largas; depois, jogando no Z Fold: "pode ser menor
// uns 80% do tamanho atual" → × 0.8; e de novo: "pode ficar ainda um pouco
// menor, tá clipando embaixo da tela" → × 0.7 e o painel sobe o que o barrel
// corta no meio da borda de baixo (05_hud._positionCockpit, 16_fx BARREL_FRAG).
// Corte no meio da borda, pelo shader: d = c·(1 + 1.6k·r²)/(1 + 0.8k), com
// c.y = 0.5 e r² = 0.25 → a última linha visível é h·(0.5 + 0.5·(1+0.4k)/(1+0.8k)),
// ou seja, some h·0.2k/(1+0.8k) embaixo (k = 0.15 → 2,7% da altura).
const barrelLift = (h, k) => h * 0.2 * k / (1 + 0.8 * k);
const { test, expect } = require('./fixtures');

test.describe('cockpit no desktop', () => {
    test('painel na base: 70% da largura ou 28% da altura, acima do corte do barrel', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        const st = await game.scene(s => ({
            w: s.scale.width, h: s.scale.height,
            dashW: s.hud.ckDash.displayWidth, dashH: s.hud.ckDash.displayHeight,
            dashX: s.hud.ckDash.x, dashY: s.hud.ckDash.y,
            touchCockpit: !!s.touchCockpit, k: s.dbg.behavior.barrel,
        }));
        const sExpected = 0.7 * Math.min(st.w / 2056, (st.h * 0.40) / 541);
        expect(Math.abs(st.dashW - 2056 * sExpected)).toBeLessThan(2);
        expect(Math.abs(st.dashH - 541 * sExpected)).toBeLessThan(2);
        expect(st.dashH / st.h).toBeLessThanOrEqual(0.281);
        expect(st.dashW).toBeLessThanOrEqual(st.w * 0.7 + 1);
        expect(st.dashX).toBeCloseTo(st.w / 2, 0);     // centrado
        // Base do painel (origin 0.5,1) exatamente na última linha que o barrel mostra
        expect(st.k, 'barrel ligado no padrão').toBeGreaterThan(0);
        expect(Math.abs(st.dashY - (st.h - barrelLift(st.h, st.k))), `dashY ${st.dashY} vs h ${st.h}`).toBeLessThan(1.5);
        expect(st.touchCockpit, 'desktop com mouse não é cockpit de toque').toBe(false);

        // Barrel mexido ao vivo (CONFIGS → VISUAIS): o painel acompanha
        await game.scene(s => { s.dbg.behavior.barrel = 0; });
        await page.waitForTimeout(200);
        expect(await game.scene(s => s.hud.ckDash.y), 'sem barrel: colado na base').toBeCloseTo(st.h, 0);
        await game.scene(s => { s.dbg.behavior.barrel = 0.4; });
        await page.waitForTimeout(200);
        const y4 = await game.scene(s => s.hud.ckDash.y);
        expect(Math.abs(y4 - (st.h - barrelLift(st.h, 0.4)))).toBeLessThan(1.5);
        expect(game.realErrors).toEqual([]);
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
