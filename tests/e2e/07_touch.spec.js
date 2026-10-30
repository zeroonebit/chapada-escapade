// 07_touch.spec.js — projeto `tablet-touch` (1024×768, toque, sem mouse).
// Nessa largura o index.html NÃO cai no failsafe mobile: é o jogo completo com
// o COCKPIT DE TOQUE (12_mobile.js, user 30/10): dedo na bola do joystick move
// a nave, dedo na lente do emissor liga o feixe, toque no mapa não faz nada.
// Os toques vão por CDP Input.dispatchTouchEvent (TouchInput na fixture).
const { test, expect } = require('./fixtures');
const { playTutorial, abductOne, deliverToCorral, collectBurger } = require('./tutorial_helpers');

test.describe('touch (tablet 1024×768)', () => {
    test('boot em touch: jogo completo, sem modo teaser, splash com botões', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        const st = await game.state();
        expect(st.mobileMode).toBe(false);
        expect(st.isMobile, 'isMobile (teaser) — falso em 1024px').toBe(false);
        expect(await game.scene(s => !!s.touchCockpit), 'cockpit de toque ligado').toBe(true);
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

    test('splash no toque; joystick move, lente liga o feixe, mapa não faz nada', async ({ game, page }) => {
        test.setTimeout(120_000);
        await page.goto('/');
        await game.waitForScene();
        await game.startPlayViaSplash({ lang: 'en', input: 'mouse' });
        const st = await game.state();
        expect(st.gameStarted).toBe(true);

        // Painel na largura toda (1024×768: w/2056 = 0.498 < 0.4h/541 = 0.568)
        const dash = await game.scene(s => ({ w: s.scale.width, h: s.scale.height,
            dw: s.hud.ckDash.displayWidth, dy: s.hud.ckDash.y }));
        expect(Math.abs(dash.dw - dash.w)).toBeLessThan(2);
        expect(dash.dy).toBe(dash.h);

        // 1. Toque no MAPA: nave parada, feixe apagado
        const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        const pm = await game.worldToPage(u0.x + 260, u0.y - 120);
        await game.input.move(pm.x, pm.y);
        await game.input.down();
        await page.waitForTimeout(800);
        const map = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y, beam: s._beamWanted(), cone: s.lightCone.visible }));
        await game.input.up();
        expect(Math.hypot(map.x - u0.x, map.y - u0.y), 'toque no mapa não move a nave').toBeLessThan(15);
        expect(map.beam).toBe(false);
        expect(map.cone).toBe(false);

        // 2. Joystick pra direita: nave anda, bola do painel acompanha o dedo
        const joy = await game.joyCenterPage();
        expect(joy).not.toBeNull();
        await game.input.steer(1, 0, 1);
        await page.waitForTimeout(900);
        const mv = await game.scene(s => ({
            x: s.ufo.x, joy: s._joyVec, held: s._joyPointerId != null,
            knob: s.hud.ckKnob.visible, knobX: s.hud.ckKnob.x, joyCx: s._ckJoyCenter().x,
        }));
        expect(mv.held).toBe(true);
        expect(mv.joy.active).toBe(true);
        expect(mv.joy.x).toBeGreaterThan(0.9);
        expect(mv.x - u0.x, 'nave andou pra direita').toBeGreaterThan(120);
        expect(mv.knob, 'bola do joystick visível').toBe(true);
        expect(mv.knobX, 'bola deslocada pra direita').toBeGreaterThan(mv.joyCx + 5);
        await game.input.steer(0, 0, 0);
        await page.waitForTimeout(200);
        expect(await game.scene(s => s._joyVec.active)).toBe(false);

        // 3. Lente: feixe liga, graviton drena, lente acende; solta → apaga e regenera
        await game.input.beamDown();
        await page.waitForTimeout(700);
        const bm = await game.scene(s => ({ held: !!s._beamHeld, beam: s._beamWanted(), cone: s.lightCone.visible,
            lensOff: s.hud.ckBeamOff.visible, e: s.energiaLed }));
        expect(bm.held).toBe(true);
        expect(bm.beam).toBe(true);
        expect(bm.cone).toBe(true);
        expect(bm.lensOff, 'lente acesa').toBe(false);
        expect(bm.e).toBeLessThan(99);
        await game.input.beamUp();
        await page.waitForTimeout(500);
        const off = await game.scene(s => ({ beam: s._beamWanted(), cone: s.lightCone.visible, e: s.energiaLed }));
        expect(off.beam).toBe(false);
        expect(off.cone).toBe(false);
        expect(off.e).toBeGreaterThan(bm.e);

        // 4. Dois dedos: joystick + lente ao mesmo tempo
        const u1 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
        await game.input.steer(0, 1, 1);
        await game.input.beamDown();
        await page.waitForTimeout(800);
        const both = await game.scene(s => ({ y: s.ufo.y, beam: s._beamWanted(), cone: s.lightCone.visible }));
        await game.input.beamUp();
        await game.input.steer(0, 0, 0);
        expect(both.y - u1.y, 'nave desceu com o joystick').toBeGreaterThan(80);
        expect(both.beam && both.cone, 'feixe ligado junto').toBe(true);
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
