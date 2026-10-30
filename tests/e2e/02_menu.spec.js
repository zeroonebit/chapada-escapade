// 02_menu.spec.js — splash → partida com cliques reais. Desde 30/10 (decisão
// do Thiago, 1:1 com Bevy/Unreal): a splash é só PLAY | TUTORIAL e começa
// direto; idioma e controle vivem no CONFIGS (ESC), mouse é o padrão no PC e
// a 1ª visita usa o idioma do navegador. CONFIGS abre na visão de jogador com
// a chave DEV MODE (abas MAP/TILES/DEBUG e ajuste fino atrás dela).
const { test, expect } = require('./fixtures');
const { pressKey } = require('./tutorial_helpers');

const splashTexts = (s) => (s._splashElements || []).filter(o => o.type === 'Text').map(o => o.text);
const savedCfg = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('chapEscapadeDebug') || '{}'));

test.describe('menu → partida', () => {
    test.beforeEach(async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
    });

    test('PLAY começa a partida direto: mouse por padrão, idioma do navegador (en)', async ({ game, page }) => {
        const labels = await game.scene(splashTexts);
        expect(labels).toContain('PLAY');
        expect(labels).toContain('TUTORIAL');
        expect(labels.some(t => /^(ENG|PTBR|MOUSE|WASD)$/.test(t)), 'sem pickers na splash').toBe(false);
        await game.clickSplash('left');
        await page.waitForFunction(() => window.game.scene.keys.Jogo.gameStarted);
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.tutorialMode).toBe(false);
        expect(st.physics).toBe(true);
        expect(st.lang, 'Chromium do teste fala en-US').toBe('en');
        expect(st.inputMode, 'mouse por padrão no PC').toBe('mouse');
        // Splash destruído: nenhum objeto na depth 500-503 sobrou
        const splashLeft = await game.scene(s =>
            s.children.list.filter(o => o.depth >= 500 && o.depth <= 503).length);
        expect(splashLeft).toBe(0);
        const hudVisible = await game.scene(s => !!(s.hud && s.hud.ckDash && s.hud.ckDash.visible));
        expect(hudVisible).toBe(true);
        // Nada foi escolhido: nada a persistir (os padrões se resolvem a cada boot)
        const saved = await savedCfg(page);
        expect(saved.behavior?.lang ?? 'en').toBe('en');
        expect(saved.behavior?.inputMode ?? 'mouse').toBe('mouse');
        expect(game.realErrors).toEqual([]);
    });

    test('idioma e controle trocados no CONFIGS (ESC na splash) valem na partida e persistem: PTBR + WASD', async ({ game, page }) => {
        await pressKey(page, 'Escape');
        const menu = page.locator('#debug-menu');
        await expect(menu).toBeVisible();
        await menu.locator('select[data-cfg="behavior.lang"]').selectOption('pt');
        await menu.locator('select[data-cfg="behavior.inputMode"]').selectOption('wasd');
        // A splash reage ao idioma: PLAY vira JOGAR
        expect(await game.scene(splashTexts)).toContain('JOGAR');
        await pressKey(page, 'Escape');
        await expect(menu).toBeHidden();
        await game.clickSplash('left');
        await page.waitForFunction(() => window.game.scene.keys.Jogo.gameStarted);
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.lang).toBe('pt');
        expect(st.inputMode).toBe('wasd');
        await page.waitForTimeout(700);
        const saved = await savedCfg(page);
        expect(saved.behavior.lang).toBe('pt');
        expect(saved.behavior.inputMode).toBe('wasd');
        expect(game.realErrors).toEqual([]);
    });

    test('TUTORIAL entra direto no passo 01 com o mapa limpo', async ({ game, page }) => {
        await game.clickSplash('right');
        await page.waitForFunction(() => window.game.scene.keys.Jogo.gameStarted);
        const st = await game.state();
        expect(st.gameStarted).toBe(true);
        expect(st.tutorialMode).toBe(true);
        expect(st.tutStep).toBe(0);
        expect(st.tutKey).toBe('MOVE');
        expect(st.inputMode).toBe('mouse');
        // _setupTutorial limpa inimigos e vacas; o mapa já tem currais
        expect(st.farmers).toBe(0);
        expect(st.shooters).toBe(0);
        expect(st.cows).toBe(0);
        expect(st.corrals).toBeGreaterThan(0);
        const log = await game.scene(s =>
            s.children.list.some(o => o.type === 'Text' && /MISSION LOG/.test(o.text || '')));
        expect(log).toBe(true);
        expect(game.realErrors).toEqual([]);
    });

    test('ESC no splash abre e fecha o CONFIGS; visão de jogador por padrão, DEV MODE libera o resto', async ({ game, page }) => {
        const menu = page.locator('#debug-menu');
        await expect(menu).toBeHidden();
        await pressKey(page, 'Escape');
        await expect(menu).toBeVisible();
        // Visão de jogador: idioma, controle, áudio, visuais e efeitos enxutos
        for (const t of ['controls', 'looks', 'vfx', 'audio']) await expect(menu.locator(`.tab-btn[data-tab="${t}"]`)).toBeVisible();
        for (const t of ['map', 'tiles', 'debug']) await expect(menu.locator(`.tab-btn[data-tab="${t}"]`), `aba ${t} é de dev`).toBeHidden();
        await expect(menu.locator('select[data-cfg="behavior.lang"]')).toBeVisible();
        await expect(menu.locator('select[data-cfg="behavior.inputMode"]')).toBeVisible();
        await expect(menu.locator('input[data-cfg="behavior.sensitivity"]')).toBeVisible();
        await expect(menu.locator('input[data-cfg="behavior.cowSpeed"]'), 'ajuste fino é de dev').toBeHidden();
        await expect(menu.locator('input[data-cfg="counts.cows"]')).toBeHidden();
        await expect(menu.locator('#dbg-preview')).toBeHidden();
        // Chave no cabeçalho (Bevy dev_mode, default OFF)
        const dev = menu.locator('#dbg-devmode');
        await expect(dev).toHaveText(/DEV MODE: OFF/);
        await dev.click();
        await expect(dev).toHaveText(/DEV MODE: ON/);
        await expect(menu.locator('.tab-btn[data-tab="debug"]')).toBeVisible();
        await expect(menu.locator('input[data-cfg="behavior.cowSpeed"]')).toBeVisible();
        await menu.locator('.tab-btn[data-tab="debug"]').click();
        await expect(menu.locator('input[data-cfg="enabled.cows"]')).toBeVisible();
        // Desligar numa aba de dev volta pra CONTROLES
        await dev.click();
        await expect(menu.locator('.tab-btn[data-tab="debug"]')).toBeHidden();
        await expect(menu.locator('.tab-btn[data-tab="controls"]')).toHaveClass(/active/);
        await page.waitForTimeout(700);
        expect((await savedCfg(page)).behavior.devMode).toBe(false);
        await pressKey(page, 'Escape');
        await expect(menu).toBeHidden();
        expect((await game.state()).gameStarted).toBe(false);
        expect(game.realErrors).toEqual([]);
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
        const ach = await game.scene(s => (s.save?.achievements || []).includes('audiophile'));
        expect(ach).toBe(true);
    });
});

test.describe('idioma do navegador', () => {
    test.use({ locale: 'pt-BR' });

    test('1ª visita em pt-BR abre em PTBR (splash diz JOGAR)', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        expect(await game.scene(s => s.dbg.behavior.lang)).toBe('pt');
        expect(await game.scene(splashTexts)).toContain('JOGAR');
    });

    test('preferência salva (en) vence o idioma do navegador', async ({ game, page }) => {
        await game.presetConfig({ behavior: { lang: 'en' } });
        await page.goto('/');
        await game.waitForScene();
        expect(await game.scene(s => s.dbg.behavior.lang)).toBe('en');
        expect(await game.scene(splashTexts)).toContain('PLAY');
    });
});
