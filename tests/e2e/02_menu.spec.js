// 02_menu.spec.js — splash → partida com cliques reais nos botões (PLAY/TUTORIAL,
// idioma, input), CONFIGS no ESC e persistência da escolha no localStorage.
const { test, expect } = require('./fixtures');
const { pressKey } = require('./tutorial_helpers');

test.describe('menu → partida', () => {
    test.beforeEach(async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
    });

    test('PLAY → ENG → MOUSE começa a partida normal', async ({ game, page }) => {
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.tutorialMode).toBe(false);
        expect(st.physics).toBe(true);
        expect(st.lang).toBe('en');
        expect(st.inputMode).toBe('mouse');
        // Splash destruído: nenhum objeto na depth 500-503 sobrou
        const splashLeft = await game.scene(s =>
            s.children.list.filter(o => o.depth >= 500 && o.depth <= 503).length);
        expect(splashLeft).toBe(0);
        // HUD (cockpit) visível
        const hudVisible = await game.scene(s => !!(s.hud && s.hud.ckDash && s.hud.ckDash.visible));
        expect(hudVisible).toBe(true);
        // Preferência persistida (debounce 500ms do _saveDebugCfg)
        await page.waitForTimeout(700);
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('chapEscapadeDebug') || '{}'));
        expect(saved.behavior.lang).toBe('en');
        expect(saved.behavior.inputMode).toBe('mouse');
        expect(game.realErrors).toEqual([]);
    });

    test('PLAY → PTBR → WASD persiste idioma e input', async ({ game, page }) => {
        await game.startPlayViaSplash({ lang: 'pt', input: 'wasd' });
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.lang).toBe('pt');
        expect(st.inputMode).toBe('wasd');
        await page.waitForTimeout(700);
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('chapEscapadeDebug') || '{}'));
        expect(saved.behavior.lang).toBe('pt');
        expect(saved.behavior.inputMode).toBe('wasd');
    });

    test('TUTORIAL → MOUSE entra no passo 01 com o mapa limpo', async ({ game }) => {
        await game.startTutorialViaSplash({ input: 'mouse' });
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.tutorialMode).toBe(true);
        expect(st.tutStep).toBe(0);
        expect(st.tutKey).toBe('MOVE');
        // _setupTutorial limpa inimigos e vacas; o mapa já tem currais
        expect(st.farmers).toBe(0);
        expect(st.shooters).toBe(0);
        expect(st.cows).toBe(0);
        expect(st.corrals).toBeGreaterThan(0);
        // Quest log ([ MISSION LOG ]) na tela
        const log = await game.scene(s =>
            s.children.list.some(o => o.type === 'Text' && /MISSION LOG/.test(o.text || '')));
        expect(log).toBe(true);
        expect(game.realErrors).toEqual([]);
    });

    test('ESC no splash abre e fecha o CONFIGS', async ({ game, page }) => {
        const menu = page.locator('#debug-menu');
        await expect(menu).toBeHidden();
        await pressKey(page, 'Escape');
        await expect(menu).toBeVisible();
        // Abas do menu existem (CONTROLS / VISUALS / VFX / AUDIO ...)
        expect(await menu.locator('.tab-btn').count()).toBeGreaterThanOrEqual(4);
        await pressKey(page, 'Escape');
        await expect(menu).toBeHidden();
        // Continua no splash, jogo não começou
        expect((await game.state()).gameStarted).toBe(false);
    });

    test('transport de música do splash troca a faixa (⏭) e persiste', async ({ game, page }) => {
        // Botão ⏭: slot 2, x = w-40 - 22, y = 42 (21_audio.js _buildSplashMusicTransport)
        const sz = await game.scene(s => ({ w: s.scale.width }));
        const p = await game.toPage(sz.w - 40 - 22, 42);
        const before = await game.scene(s => s.dbg.audio.track);
        expect(before).toBe('auto');
        await game.input.tap(p.x, p.y);
        await page.waitForTimeout(300);
        const after = await game.scene(s => s.dbg.audio.track);
        expect(after).not.toBe('auto');
        // achievement audiophile dispara
        const ach = await game.scene(s => (s.save?.achievements || []).includes('audiophile'));
        expect(ach).toBe(true);
    });
});
