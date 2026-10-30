// 06_save.spec.js — save em localStorage (22_meta.js) e configs (15_debug_menu.js):
// persistem entre reloads, toleram JSON corrompido, e o tutorial concluído fica gravado.
const { test, expect } = require('./fixtures');

test.describe('save / load', () => {
    test('partidas, conquistas e configs sobrevivem ao reload', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'pt', input: 'wasd' });
        await page.waitForTimeout(800);   // _metaSetup (delayedCall 0) + debounce do _saveDebugCfg
        const s1 = await page.evaluate(() => ({
            save: JSON.parse(localStorage.getItem('chapEscapadeSave')),
            dbg: JSON.parse(localStorage.getItem('chapEscapadeDebug')),
        }));
        expect(s1.save.matches).toBe(1);
        expect(s1.save.achievements).toContain('small_step');
        expect(s1.save.questsCompleted).toEqual([]);
        expect(s1.dbg.behavior.lang).toBe('pt');
        expect(s1.dbg.behavior.inputMode).toBe('wasd');
        expect(s1.dbg._parityV2).toBe(true);

        // Reload: nova partida lê o save e incrementa
        await page.reload();
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'pt', input: 'wasd' });
        await page.waitForTimeout(800);
        const s2 = await game.scene(s => ({
            matches: s.save.matches, ach: s.save.achievements,
            lang: s.dbg.behavior.lang, input: s.dbg.behavior.inputMode,
            toasts: s.children.list.filter(o => o.type === 'Text' && /🏆/.test(o.text || '')).length,
        }));
        expect(s2.matches).toBe(2);
        expect(s2.ach).toContain('small_step');
        expect(s2.lang).toBe('pt');
        expect(s2.input).toBe('wasd');
        // Conquista já desbloqueada não dá toast de novo
        expect(s2.toasts).toBe(0);
        expect(game.realErrors).toEqual([]);
    });

    test('save corrompido não derruba o boot (volta pros defaults)', async ({ game, page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('chapEscapadeSave', '{not json');
            localStorage.setItem('chapEscapadeDebug', '<<<');
        });
        await page.reload();
        await game.waitForScene();
        await game.startDirect({ tutorial: false, input: 'mouse' });
        await page.waitForTimeout(500);
        const st = await game.scene(s => ({
            matches: s.save.matches, coins: s.save.coins,
            lang: s.dbg.behavior.lang, cows: s.dbg.counts.cows,
        }));
        expect(st.matches).toBe(1);
        expect(st.coins).toBe(0);
        expect(st.lang).toBe('en');
        expect(st.cows).toBe(100);
        expect(game.realErrors).toEqual([]);
    });

    test('tutorial concluído fica gravado e dá a conquista graduate', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        await page.waitForTimeout(300);
        // Conclusão real do 17_tutorial.js (o que o passo 10 chama ao fechar)
        await game.scene(s => s._tutConcluir());
        await page.waitForTimeout(300);
        const st = await game.scene(s => ({
            flag: localStorage.getItem('cep_tutorial_done'),
            saveFlag: !!s.save.tutorialDone,
            graduate: s.save.achievements.includes('graduate'),
            persisted: (JSON.parse(localStorage.getItem('chapEscapadeSave') || '{}').achievements || []).includes('graduate'),
            btn: s.children.list.some(o => o.type === 'Text' && /PLAY NOW|JOGAR AGORA/.test(o.text || '')),
        }));
        expect(st.btn, 'botão JOGAR AGORA').toBe(true);
        expect(st.flag).toBe('1');
        expect(st.saveFlag).toBe(true);
        expect(st.graduate).toBe(true);
        expect(st.persisted).toBe(true);
    });
});
