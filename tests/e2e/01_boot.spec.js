// 01_boot.spec.js — boot limpo: página carrega, assets chegam, cena nasce no splash
const { test, expect } = require('./fixtures');

test.describe('boot', () => {
    test('carrega sem erro de console e sem asset 404', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();

        // Loader terminou: todos os atlases e PNGs do preload existem
        const tex = await game.scene(s => ({
            atlases: ['cow_atlas', 'pig_atlas', 'ox_atlas', 'farmer_atlas', 'ufo_atlas',
                      'hud_atlas', 'nature_atlas', 'items_atlas', 'mecha_atlas']
                .filter(k => !s.textures.exists(k)),
            splash: s.textures.exists('splash'),
            sfx: ['grab', 'drop', 'deliver', 'collect', 'shot', 'hit', 'gameover', 'victory']
                .filter(k => !s.cache.audio.exists(k)),
        }));
        expect(tex.atlases, 'atlases faltando').toEqual([]);
        expect(tex.splash).toBe(true);
        expect(tex.sfx, 'SFX faltando no cache').toEqual([]);

        expect(game.asset404s, 'avisos [ASSET 404]').toEqual([]);
        expect(game.realErrors, 'erros de console').toEqual([]);

        // Cena no splash, física desligada, nave no centro do mundo
        const st = await game.state();
        expect(st.gameStarted).toBe(false);
        expect(st.physics).toBe(false);
        expect(st.mobileMode).toBe(false);
        expect(st.ufo).toEqual({ x: 4000, y: 3000 });
        expect(st.corrals).toBeGreaterThan(0);
        expect(st.cows).toBeGreaterThan(0);
        expect(st.shooters).toBe(6);

        // Caixa vermelha "CREATE ERR" do try/catch do create() não apareceu
        const createErr = await game.scene(s =>
            s.children.list.some(o => o.type === 'Text' && /CREATE ERR/.test(o.text || '')));
        expect(createErr).toBe(false);
    });

    test('seed fixa = mundo determinístico (currais e vacas no mesmo lugar)', async ({ game, page }) => {
        const snapshot = async () => {
            await page.goto('/');
            await game.waitForScene();
            return game.scene(s => ({
                corrals: s.corrals.map(c => [Math.round(c.x), Math.round(c.y)]),
                cows: s.cows.slice(0, 5).map(v => [Math.round(v.x), Math.round(v.y), v.tipo]),
                shooters: s.shooters.map(a => [Math.round(a.x), Math.round(a.y)]),
            }));
        };
        const a = await snapshot();
        const b = await snapshot();
        expect(b).toEqual(a);
    });

    test('update() roda sem erro por 3s no splash (música de menu, overlay)', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await page.waitForTimeout(3000);
        expect(game.realErrors).toEqual([]);
        const upd = await game.scene(s => (s._errorLog || []).length);
        expect(upd, 'erros capturados pelo debug overlay').toBe(0);
    });
});
