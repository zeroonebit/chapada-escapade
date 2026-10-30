// 05_pause_restart.spec.js — pausa (ESC) congela o mundo e abre o CONFIGS;
// game over → reinício recria a cena SEM duplicar objetos/listeners; a UI do
// game over sai legível por cima da vinheta; morrer no tutorial retoma do passo
// que falhou.
const { test, expect } = require('./fixtures');
const { pressKey, clickGameOverRestart } = require('./tutorial_helpers');

// Contagens que devem ser iguais antes e depois de um scene.restart()
const counts = (s) => ({
    children: s.children.list.length,
    bodies: s.matter.world.localWorld.bodies.length,
    resizeListeners: s.scale.listenerCount('resize'),
    debugMenus: document.querySelectorAll('#debug-menu').length,
    cows: s.cows.filter(v => v && v.scene && !v.isBurger).length,
    corrals: s.corrals.length,
    shooters: s.shooters.length,
    farmers: s.farmers.filter(f => f && f.scene).length,
    ufos: s.children.list.filter(o => o.texture && o.texture.key === 'ufo_atlas').length,
    shadows: (s._allShadows || []).length,
    timers: s.time._active.length,
    tweens: s.tweens.getTweens().length,
});

// Força o game over pelo caminho real: tanque quase vazio → _updateFuel → _gameOver
async function dieByFuel(game) {
    await game.scene(s => { s.fuelCurrent = 0.2; });
    expect(await game.waitFor(s => s.gameOver, { timeout: 5000 }), 'game over disparou').toBe(true);
    // Cinematic (~3.5s) → UI com botão RESTART
    expect(await game.waitFor(s => s._gameOverUiShown, { timeout: 12_000 }), 'UI de game over apareceu').toBe(true);
}

const clickRestart = clickGameOverRestart;

test.describe('pausa e reinício', () => {
    test('ESC pausa (física off, overlay, CONFIGS) e ESC retoma', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        await pressKey(page, 'Escape');
        await page.waitForTimeout(200);
        const paused = await game.scene(s => ({
            paused: s.paused, physics: s.matter.world.enabled,
            overlay: s.pauseOverlay.visible, label: s.pauseLabel.visible,
            menu: document.getElementById('debug-menu')?.style.display,
            cowPos: s.cows.slice(0, 10).map(v => [v.x, v.y]),
            fuel: s.fuelCurrent,
        }));
        expect(paused.paused).toBe(true);
        expect(paused.physics).toBe(false);
        expect(paused.overlay).toBe(true);
        expect(paused.label).toBe(true);
        expect(paused.menu).toBe('block');
        // Mundo congelado: vacas não andam, combustível não gasta
        await page.waitForTimeout(800);
        const still = await game.scene(s => ({ cowPos: s.cows.slice(0, 10).map(v => [v.x, v.y]), fuel: s.fuelCurrent }));
        expect(still.cowPos).toEqual(paused.cowPos);
        expect(still.fuel).toBe(paused.fuel);

        await pressKey(page, 'Escape');
        await page.waitForTimeout(200);
        const resumed = await game.scene(s => ({
            paused: s.paused, physics: s.matter.world.enabled, overlay: s.pauseOverlay.visible,
            menu: document.getElementById('debug-menu')?.style.display,
        }));
        expect(resumed.paused).toBe(false);
        expect(resumed.physics).toBe(true);
        expect(resumed.overlay).toBe(false);
        expect(resumed.menu).toBe('none');
        expect(game.realErrors).toEqual([]);
    });

    // Thiago no Z Fold (30/10): "tela escura / botão apagado". A vinheta e o
    // grayscale do cinematic são postFX da CAMERA principal e pintavam por cima
    // do GAME OVER, do score e do RESTART (vermelho cc1122 virava marrom quase
    // preto). A UI tem que sair por uma camera própria, sem FX.
    test('game over: RESTART e GAME OVER legíveis por cima da vinheta (camera sem postFX)', async ({ game, page }) => {
        test.setTimeout(120_000);
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        await page.waitForTimeout(500);
        await dieByFuel(game);
        await page.waitForTimeout(2500);     // tween de entrada (1.1s + 0.6s) + folga
        const px = await game.scene(s => new Promise(res => {
            const w = s.scale.width, h = s.scale.height;
            const read = (x, y) => new Promise(r => s.game.renderer.snapshotPixel(x, y, c => r([c.r, c.g, c.b])));
            // Botão em 11_gameflow._showGameOverUI: w/2, h/2+250, 280×52, fill 0xcc1122.
            // Lê à esquerda do texto, dentro do preenchimento (longe do stroke).
            (async () => {
                const btn = await read(Math.round(w / 2 - 100), Math.round(h / 2 + 250));
                const go  = await read(Math.round(w / 2),       Math.round(h / 2 - 200));
                res({
                    btn, go,
                    cams: s.cameras.cameras.length,
                    mainFx: !!(s._gameOverFx && s._gameOverFx.vignFx &&
                        s.cameras.main.postPipelines.some(p => p.controller === s._gameOverFx.vignFx)),
                });
            })();
        }));
        // Cinematic continua na camera principal (vinheta + grayscale)...
        expect(px.mainFx, 'vinheta segue na camera principal').toBe(true);
        // ...e a UI sai limpa: o botão lê vermelho de verdade, não marrom escuro.
        expect(px.btn[0], `botão R (lido ${px.btn})`).toBeGreaterThan(170);
        expect(px.btn[1], `botão G (lido ${px.btn})`).toBeLessThan(70);
        expect(px.btn[2], `botão B (lido ${px.btn})`).toBeLessThan(90);
        expect(px.cams, 'camera própria da UI').toBe(2);

        await clickRestart(game);
        // scene.restart recria o CameraManager: a camera da UI não vaza
        expect(await game.scene(s => s.cameras.cameras.length), 'cameras após restart').toBe(1);
        expect(game.realErrors).toEqual([]);
    });

    test('game over → RESTART recria a cena sem objetos nem listeners duplicados', async ({ game, page }) => {
        test.setTimeout(180_000);
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        await page.waitForTimeout(500);
        const c0 = await game.scene(counts);

        await dieByFuel(game);
        const go = await game.scene(s => ({
            text: s.children.list.some(o => o.type === 'Text' && /GAME OVER/.test(o.text || '')),
            physics: s.matter.world.enabled,
            ach: s.save.achievements.includes('dry_tank'),
            cinematic: !!(s._gameOverFx && s._gameOverFx.vignFx),
        }));
        expect(go.text).toBe(true);
        expect(go.physics).toBe(false);
        expect(go.ach, 'achievement dry_tank').toBe(true);
        // O cinematic (espiral + vinheta) tem que rodar, não o fallback direto
        expect(go.cinematic, 'cinematic de game over rodou (vinheta criada)').toBe(true);
        expect(game.warnings.filter(w => /cinematic falhou/.test(w)), 'fallback do cinematic').toEqual([]);

        await clickRestart(game);
        const c1 = await game.scene(counts);
        // Mesmo mundo (seed) → mesmas contagens de entidades
        expect(c1.corrals).toBe(c0.corrals);
        expect(c1.shooters).toBe(c0.shooters);
        expect(c1.ufos).toBe(c0.ufos);
        expect(c1.debugMenus).toBe(1);
        expect(Math.abs(c1.cows - c0.cows)).toBeLessThanOrEqual(4);     // repovoamento a cada 6s
        expect(Math.abs(c1.bodies - c0.bodies)).toBeLessThanOrEqual(8);
        expect(Math.abs(c1.children - c0.children)).toBeLessThanOrEqual(40);
        // Listeners de resize no ScaleManager (que sobrevive ao restart) não acumulam.
        // O restart pula o splash (1 listener a menos é esperado); antes do fix
        // eram 9 → 14 → 19 (5 closures presas a objetos destruídos por ciclo).
        expect(c1.resizeListeners, 'listeners de resize acumulados após restart').toBeLessThanOrEqual(c0.resizeListeners);

        // Segundo ciclo: outro game over → outro restart, pra pegar acúmulo lento
        await dieByFuel(game);
        await clickRestart(game);
        const c2 = await game.scene(counts);
        expect(c2.resizeListeners, 'segundo restart idêntico ao primeiro').toBe(c1.resizeListeners);
        expect(c2.debugMenus).toBe(1);
        expect(Math.abs(c2.children - c0.children)).toBeLessThanOrEqual(40);

        // Jogo continua jogável depois de 2 reinícios: nave responde, sem erro
        const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        await game.flyTo(u0.x + 300, u0.y, { tol: 80, timeout: 8000 });
        const u1 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        expect(u1.x - u0.x).toBeGreaterThan(150);
        // Resize da janela depois dos restarts não pode estourar listener velho
        await page.setViewportSize({ width: 1200, height: 760 });
        await page.waitForTimeout(400);
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(400);
        expect(game.realErrors).toEqual([]);
        expect(await game.scene(s => (s._errorLog || []).length)).toBe(0);
    });

    test('morrer no tutorial retoma do passo que falhou, com tanque reposto', async ({ game, page }) => {
        test.setTimeout(180_000);
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        // Avança até BURGER (fuel vira 15% e o drain liga — é aqui que se morre)
        await game.scene(s => { for (let i = 0; i < 4; i++) s._tutAdvance(); });
        expect(await game.scene(s => TUT_STEPS[s._tutStepIdx].key)).toBe('BURGER');
        expect(await game.scene(s => s.fuelCurrent)).toBeLessThanOrEqual(16);

        await dieByFuel(game);
        expect(await game.scene(() => window.__cepTutResume)).toBe(4);
        await clickRestart(game);
        await page.waitForTimeout(500);
        const st = await game.scene(s => ({
            tutorial: s.tutorialMode, key: TUT_STEPS[s._tutStepIdx]?.key,
            fuel: s.fuelCurrent, gameOver: s.gameOver,
            log: s.children.list.some(o => o.type === 'Text' && /MISSION LOG/.test(o.text || '')),
        }));
        expect(st.tutorial).toBe(true);
        expect(st.key).toBe('BURGER');
        expect(st.fuel).toBeGreaterThanOrEqual(45);   // mínimo 50% ao retomar no BURGER (menos o drain do 1º segundo)
        expect(st.gameOver).toBe(false);
        expect(st.log).toBe(true);
        // O restart limpa vacas e currais: a lição (coletar um burger) só fecha se
        // houver vaca pra entregar — antes do fix ficava 0 vacas = soft-lock
        const cows = await game.waitFor(s => s._tutVacasVivas() >= 1, { timeout: 3000 });
        expect(cows, 'vacas repostas ao retomar no BURGER').toBe(true);
        expect(game.realErrors).toEqual([]);
    });

    test('mecha abatido no passo 09, morte no 10 e retomada: o passo 10 ainda fecha', async ({ game, page }) => {
        test.setTimeout(180_000);
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        await game.scene(s => { s._tutMinReadMs = 300; for (let i = 0; i < 8; i++) s._tutAdvance(); });
        expect(await game.scene(s => TUT_STEPS[s._tutStepIdx].key)).toBe('DODGE_TORPEDOS');
        // Fogo amigo no 09: o mecha morre antes do passo 10 (shootersTotal = 1)
        expect(await game.waitFor(s => s.shooters.length > 0, { timeout: 3000 })).toBe(true);
        await game.scene(s => { const m = s.shooters[0]; s.shooters = s.shooters.filter(x => x !== m); s._destroyShooter(m, null); });
        await game.scene(s => s._tutAdvance());
        expect(await game.scene(s => TUT_STEPS[s._tutStepIdx].key)).toBe('KILL_SHOOTER');
        await page.waitForTimeout(400);   // _tutStepInit captura o baseline (=1)
        expect(await game.scene(s => s.shootersTotal)).toBe(1);

        await dieByFuel(game);
        await clickRestart(game);
        const resumed = await game.waitFor(s => s.tutorialMode && TUT_STEPS[s._tutStepIdx]?.key === 'KILL_SHOOTER', { timeout: 8000 });
        expect(resumed, 'retomou no KILL_SHOOTER').toBe(true);
        await game.scene(s => { s._tutMinReadMs = 300; });
        // Abate o mecha da retomada: o passo tem que fechar (antes: baseline velho = travado)
        expect(await game.waitFor(s => s.shooters.length > 0, { timeout: 3000 })).toBe(true);
        await page.waitForTimeout(400);
        await game.scene(s => { const m = s.shooters[0]; s.shooters = s.shooters.filter(x => x !== m); s._destroyShooter(m, null); });
        const done = await game.waitFor(s => s._tutStepIdx == null, { timeout: 4000 });
        expect(done, 'tutorial concluiu após abater o mecha na retomada').toBe(true);
        expect(game.realErrors).toEqual([]);
    });
});
