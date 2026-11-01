// tests/e2e/tutorial_helpers.js — ações de jogo reutilizadas pelos specs
// (tutorial, loop, touch). Não é spec: nenhum `test()` aqui.
//
// Convenção: cada ação devolve true (feito), 'GAMEOVER' (a nave morreu no meio)
// ou false (não conseguiu no tempo). Quem chama decide o que fazer.
'use strict';
const { expect } = require('@playwright/test');

const MIN_READ_MS = 700;   // _tutMinReadMs nos testes (o jogo usa 5000)
// Ordem dos passos (TUT_STEPS do 17_tutorial.js) + DONE
const ORDER = ['MOVE', 'GRAVITON_BAR', 'ABDUCT', 'DELIVER', 'BURGER', 'TAKE_DAMAGE',
               'FARMER', 'FARMER_KILL', 'DODGE_TORPEDOS', 'KILL_SHOOTER', 'DONE'];
const atOrAfter = (cur, key) => ORDER.indexOf(cur) >= ORDER.indexOf(key);

// Tecla "humana": keydown, 1-2 frames, keyup. O `Phaser.Input.Keyboard.JustDown`
// perde um press sintético instantâneo (down e up no mesmo lote de eventos).
async function pressKey(page, key, holdMs = 80) {
    await page.keyboard.down(key);
    await page.waitForTimeout(holdMs);
    await page.keyboard.up(key);
}

async function currentKey(game) {
    return game.scene(s => {
        if (s.gameOver) return 'GAMEOVER';
        const i = s._tutStepIdx;
        if (i == null) return 'DONE';
        return TUT_STEPS[i] ? TUT_STEPS[i].key : 'DONE';
    });
}

// Espera o tutorial chegar no passo `key` (ou já ter passado dele — no toque o
// feixe vai junto do dedo e um passo pode fechar durante o voo do anterior).
// Devolve o passo atual (string), 'GAMEOVER' se morreu, ou false no timeout.
async function waitStep(game, key, timeout = 30_000) {
    return game.waitFor((s, k) => {
        if (s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA) return 'GAMEOVER';
        const i = s._tutStepIdx;
        if (i == null) return 'DONE';
        const ti = TUT_STEPS.findIndex(x => x.key === k);
        return (ti >= 0 && i >= ti) ? TUT_STEPS[i].key : false;
    }, { timeout, interval: 100, arg: key });
}

// Botão RESTART/JOGAR NOVAMENTE do game over (11_gameflow._showGameOverUI: w/2, h/2+250)
async function clickGameOverRestart(game) {
    expect(await game.waitFor(s => s._gameOverUiShown, { timeout: 12_000 }), 'UI de game over apareceu').toBe(true);
    await game.input.up();                  // no toque: dedo pode estar preso desde a morte
    if (game.input.beamUp) await game.input.beamUp();   // cockpit: solta a lente também
    await game.page.waitForTimeout(1500);   // tween de entrada do botão
    const sz = await game.scene(s => ({ w: s.scale.width, h: s.scale.height }));
    const p = await game.toPage(sz.w / 2, sz.h / 2 + 250);
    let ok = false;
    for (let i = 0; i < 3 && !ok; i++) {    // um jogador toca de novo se não pegou
        await game.input.tap(p.x, p.y);
        ok = await game.waitFor(s => !s.gameOver && s.gameStarted && s.fuelCurrent > 20, { timeout: i === 0 ? 8000 : 6000 });
        if (!ok) {
            const d = await game.scene(s => ({
                gameOver: s.gameOver, ui: !!s._gameOverUiShown, inputEnabled: s.input.enabled,
                active: s.scene.isActive(), status: s.sys.settings.status,
                ptr: [Math.round(s.input.activePointer.x), Math.round(s.input.activePointer.y), s.input.activePointer.isDown],
                downs: s.input.manager.pointers.filter(q => q.isDown).length,
                btn: s.children.list.some(o => o.type === 'Rectangle' && o.input && o.input.enabled && Math.abs(o.y - s.scale.height / 2 - 250) < 2),
                rects: s.children.list.filter(o => o.type === 'Rectangle' && o.y > s.scale.height / 2)
                    .map(o => [Math.round(o.x), Math.round(o.y), o.depth, !!(o.input && o.input.enabled), o.visible, +o.alpha.toFixed(2)]).slice(0, 8),
                texts: s.children.list.filter(o => o.type === 'Text' && /RESTART|JOGAR|GAME OVER|CHAPADA/.test(o.text || '')).map(o => [o.text, o.depth, +o.alpha.toFixed(2)]),
                depth700: s.children.list.filter(o => o.depth >= 700).length,
                fuel: Math.round(s.fuelCurrent), tutStep: s._tutStepIdx, resume: window.__cepTutResume,
                errors: (s._errorLog || []).map(e => e.msg).slice(-3),
                deep: s.children.list.filter(o => o.depth >= 500).map(o => [o.type, o.depth, (o.text || '').slice(0, 20), +o.alpha.toFixed(2), o.visible]),
                children: s.children.list.length, fx: !!s._gameOverFx, smoke: !!s._gameOverDebrisSmoke,
            }));
            console.log('[restart] toque não pegou:', JSON.stringify({ tap: p, ...d, pageErrors: game.errors.slice(-3) }));
        }
    }
    expect(ok, 'cena reiniciou').toBe(true);
    await game.page.waitForTimeout(300);
}

// Morreu no tutorial: RESTART e espera retomar no passo que falhou
async function recoverFromGameOver(game, log) {
    const key = await game.scene(s => TUT_STEPS[window.__cepTutResume]?.key);
    // Passo 10 fechou no MESMO frame em que o tanque zerou (torpedo mata o
    // mecha e a nave): _tutConcluir limpa o resume e o RESTART volta pro jogo
    // normal com o tutorial gravado como concluído. Conta como DONE.
    const concluded = await game.scene(s => window.__cepTutResume == null && s._tutStepIdx == null &&
        localStorage.getItem('cep_tutorial_done') === '1');
    // Diagnóstico da morte: tanque, graviton, inimigos/torpedos em cena, dedo
    const why = await game.scene(s => ({
        fuel: Math.round(s.fuelCurrent), energy: Math.round(s.energiaLed),
        farmers: s.farmers.filter(f => f.scene).length, mechas: s.shooters.length,
        bullets: s.bullets.length, down: s.input.activePointer.isDown,
        ship: [Math.round(s.ufo.x), Math.round(s.ufo.y)], cargo: s.abductedCows.length,
    }));
    log(`  GAME OVER no passo ${concluded ? 'DONE (concluiu no frame da morte)' : key} — RESTART e retoma ${JSON.stringify(why)}`);
    await clickGameOverRestart(game);
    if (concluded) { game.concludedOnDeath = true; return 'DONE'; }
    const ok = await game.waitFor(s => s.tutorialMode && s._tutStepIdx != null, { timeout: 10_000 });
    expect(ok, 'retomou o tutorial').toBe(true);
    await game.scene((s, ms) => { s._tutMinReadMs = ms; }, MIN_READ_MS);
    await game.page.waitForTimeout(400);
    await game.hover();
    return currentKey(game);
}

// ── Alvos (rodam no browser) ─────────────────────────────────────────
const nearestCow = (s, skip) => {
    let best = null, bd = Infinity;
    for (const v of s.cows) {
        if (!isAbducibleCow(v) || v.tipo === 'pig') continue;   // porco = bacon, outra mecânica
        if (skip && skip.some(p => distSq(v.x, v.y, p.x, p.y) < 150 * 150)) continue;
        const d = distSq(v.x, v.y, s.ufo.x, s.ufo.y);
        if (d < bd) { bd = d; best = v; }
    }
    return best ? { x: best.x, y: best.y, d: Math.sqrt(bd) } : null;
};
const nearestFarmer = (s) => {
    let best = null, bd = Infinity;
    for (const f of s.farmers) {
        if (!f.scene || f._dying || f._destroyed) continue;
        const d = distSq(f.x, f.y, s.ufo.x, s.ufo.y);
        if (d < bd) { bd = d; best = f; }
    }
    return best ? { x: best.x, y: best.y, d: Math.sqrt(bd) } : null;
};
const nearestMecha = (s) => {
    let best = null, bd = Infinity;
    for (const a of s.shooters) {
        const d = distSq(a.x, a.y, s.ufo.x, s.ufo.y);
        if (d < bd) { bd = d; best = a; }
    }
    return best ? { x: best.x, y: best.y, d: Math.sqrt(bd) } : null;
};
// `gameOver` também liga na VITÓRIA (11_gameflow._victory): morte = sem quota
// (a expressão fica inline em cada função — roda dentro do browser)
const status = (s) => ({
    gameOver: !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA, fuel: Math.round(s.fuelCurrent), energy: Math.round(s.energiaLed),
    hasFarmer: s.abductedCows.some(e => e.isEnemy), farmersTotal: s.farmersTotal || 0,
    shootersTotal: s.shootersTotal || 0,
});

// ── Ações ────────────────────────────────────────────────────────────

// Abduz 1 vaca (persegue a mais perto com o feixe ligado). Com `keep`, o
// feixe FICA ligado ao voltar — a vaca continua a bordo pra entrega.
async function abductOne(game, log, { keep = true } = {}) {
    // Vacas que a nave não alcançou ficam de fora das próximas tentativas: o
    // 04_loop chegou a mirar 5× a mesma vaca a 642 px (o voo não chegava nela)
    const skip = [];
    for (let attempt = 0; attempt < 6; attempt++) {
        if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
        const cow = await game.scene(nearestCow, skip);
        if (!cow) { skip.length = 0; await game.page.waitForTimeout(300); continue; }
        log(`  vaca mais perto a ${Math.round(cow.d)}px`);
        const dFly = await game.flyTo(cow.x, cow.y, { tol: 140, timeout: 20_000, keep: true });
        if (typeof dFly === 'number' && dFly > 400) { skip.push({ x: cow.x, y: cow.y }); continue; }
        // (no toque o voo já pode ter abduzido no caminho — o feixe vai junto do dedo)
        const got = await game.beamUntil(s => s.abductedCows.some(v => !v.isEnemy && !v.isBurger && v.tipo !== 'pig'), {
            timeout: 8000, keep,
            track: await game.scene(nearestCow, skip),
        });
        if (got) return true;
        skip.push({ x: cow.x, y: cow.y });
    }
    return false;
}

// Leva a carga até o curral mais perto com o feixe ligado; solta ao chegar
async function deliverToCorral(game, log) {
    const c = await game.scene(s => {
        let best = null, bd = Infinity;
        for (const c of s.corrals) {
            const d = distSq(c.x, c.y, s.ufo.x, s.ufo.y);
            if (d < bd) { bd = d; best = c; }
        }
        return { x: best.x, y: best.y, d: Math.sqrt(bd) };
    });
    log(`  curral mais perto a ${Math.round(c.d)}px`);
    await game.beamOn();
    let dropped = false;
    try {
        const d = await game.flyTo(c.x, c.y, { tol: 80, timeout: 40_000 });
        log(`  chegou a ${Math.round(d)}px do curral`);
        // _checkDelivery dropa quando d < 110
        dropped = !!(await game.waitFor(s => s.corrals.some(c => c.slots && c.slots.some(x => x)), { timeout: 5000 }));
        if (!dropped) {
            const dd = await game.scene(s => ({
                cargo: s.abductedCows.length, held: !!s._beamHeld, beamP: s._beamPointerId, joyP: s._joyPointerId,
                energy: Math.round(s.energiaLed), want: s._beamWanted(), gameOver: s.gameOver,
                dCorral: Math.round(Math.min(...s.corrals.map(c => Math.hypot(c.x - s.ufo.x, c.y - s.ufo.y)))),
                pointers: s.input.manager.pointers.map(q => [q.id, q.isDown, q.active]),
            }));
            log('  [deliver] não dropou: ' + JSON.stringify(dd) + ' driver=' + JSON.stringify([...(game.input.points || new Map()).keys()]));
        }
    } finally {
        await game.beamOff();
    }
    await game.settle(2000);   // para junto do curral: cada px andado é tanque
    if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
    return dropped;
}

// Entrega com nova tentativa: sob carga o voo até o curral passa dos 13 s de
// graviton cheio e a vaca cai no caminho (Ensaio 01/11, 07_touch "loop no
// toque"). Recarrega o graviton e leva outra vaca, como o jogador faria
async function deliverWithRetry(game, log, tries = 3) {
    for (let k = 0; k < tries; k++) {
        const r = await deliverToCorral(game, log);
        if (r === true || r === 'GAMEOVER') return r;
        log('  [deliver] não entregou — recarrega o graviton e abduz de novo');
        await game.waitFor(s => s.energiaLed >= s.energiaMax * 0.9 || s.gameOver, { timeout: 20_000 });
        const a = await abductOne(game, log, { keep: true });
        if (a === 'GAMEOVER') return a;
        if (!a) return false;
    }
    return false;
}

// Espera o burger ficar pronto (3s) e absorve com o feixe
async function collectBurger(game, log) {
    // Espera o burger PARADO (ponteiro na nave): a lição do BURGER começa com 15% de tanque
    let ready = false;
    const tr = Date.now();
    while (Date.now() - tr < 8000) {
        await game.hover();
        ready = await game.scene(s => s._anyCorralReady() || s.gameOver);
        if (ready) break;
        await game.page.waitForTimeout(100);
    }
    if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
    expect(ready, 'burger ficou pronto (3s)').toBe(true);
    const slot = await game.scene(s => {
        for (const c of s.corrals) {
            for (let i = 0; i < (c.slots || []).length; i++) {
                const sl = c.slots[i];
                if (sl && sl.state === 'ready') return { x: sl.icon.x, y: sl.icon.y };
            }
        }
        return null;
    });
    expect(slot).not.toBeNull();
    const before = await game.scene(s => ({ score: s.score, n: s.burgersCollected || 0 }));
    const dSlot = await game.flyTo(slot.x, slot.y, { tol: 50, timeout: 15_000, keep: true });
    log(`  burger pronto; nave a ${Math.round(dSlot)}px do slot`);
    // Mede a recompensa NO QUADRO da coleta (preupdate → postupdate): o fuel e
    // o burgersCollected++ entram juntos no onComplete do tween. A leitura antiga
    // ("antes" num evaluate separado) às vezes já vinha com a recompensa e o
    // ganho saía ~0 (corrida conhecida do 04_loop)
    await game.scene((s, b) => {
        window.__collect = null;
        let pre = s.fuelCurrent;
        const onPre = () => { pre = s.fuelCurrent; };
        const onPost = () => {
            if (!window.__collect && (s.burgersCollected || 0) > b.n) {
                window.__collect = { fuelBefore: pre, fuelAfter: s.fuelCurrent };
                s.events.off('preupdate', onPre); s.events.off('postupdate', onPost);
            }
        };
        s.events.on('preupdate', onPre); s.events.on('postupdate', onPost);
        window.__collectOff = () => { s.events.off('preupdate', onPre); s.events.off('postupdate', onPost); };
    }, before);
    const got = await game.beamUntil((s, b) => {
        if ((s.burgersCollected || 0) > b.n) return { score: s.score };
        return false;
    }, { timeout: 6000, arg: before, track: slot });
    const inFrame = await game.scene(() => { if (window.__collectOff) window.__collectOff(); return window.__collect; });
    const fuelPrev = inFrame ? inFrame.fuelBefore : NaN;
    game.lastCollect = got && inFrame ? { fuelBefore: inFrame.fuelBefore, fuelAfter: inFrame.fuelAfter, score: got.score } : null;
    if (!got) {
        const d = await game.scene((s, p) => ({
            slots: s.corrals.flatMap(c => (c.slots || []).map(x => x && { st: x.state, col: !!x._sendoColetado,
                icon: x.icon && x.icon.scene ? [Math.round(x.icon.x), Math.round(x.icon.y)] : null })).filter(Boolean),
            ship: [Math.round(s.ufo.x), Math.round(s.ufo.y)], dSlot: Math.round(Math.hypot(s.ufo.x - p.x, s.ufo.y - p.y)),
            isDown: s.input.activePointer.isDown, energy: Math.round(s.energiaLed), cone: Math.round(s.coneRadius),
            gameOver: s.gameOver, burgers: s.burgersCollected, score: s.score, noPull: !!s._tutBeamNoPull,
            held: !!s._beamHeld, beamP: s._beamPointerId, joyP: s._joyPointerId,
            pointers: s.input.manager.pointers.map(q => [q.id, q.isDown, q.active, q.identifier]),
        }), slot);
        log('  [collectBurger] falhou: ' + JSON.stringify(d) + ' driver=' + JSON.stringify([...(game.input.points || new Map()).keys()]));
    }
    log(`  score ${before.score} → ${await game.scene(s => s.score)}` +
        (game.lastCollect ? ` fuel ${Math.round(fuelPrev)} → ${Math.round(game.lastCollect.fuelAfter)}` : ''));
    if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
    return !!got;
}

// Abduz o fazendeiro (ele vem pra cima da nave; só segurar o feixe perto)
async function abductFarmer(game, log, { keep = true } = {}) {
    for (let attempt = 0; attempt < 6; attempt++) {
        if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
        const f = await game.scene(nearestFarmer);
        if (!f) { await game.page.waitForTimeout(400); continue; }
        log(`  fazendeiro a ${Math.round(f.d)}px`);
        await game.flyTo(f.x, f.y, { tol: 120, timeout: 15_000, keep: true });
        const got = await game.beamUntil(s => s.abductedCows.some(e => e.isEnemy), {
            timeout: 8000, keep, track: await game.scene(nearestFarmer),
        });
        if (got) return true;
    }
    return false;
}

// Com o fazendeiro preso, leva ele até a pedra mais perta e VARRE a nave de um
// lado pro outro da pedra — o fazendeiro vem a reboque e cruza o corpo da pedra
// (abduzido tocando pedra = impacto alto por definição, 10_collision.js).
async function killFarmerOnRock(game, log) {
    const base = await game.scene(s => s.farmersTotal || 0);
    for (let attempt = 0; attempt < 5; attempt++) {
        if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
        const has = await game.scene(s => s.abductedCows.some(e => e.isEnemy));
        if (!has) {
            const ok = await abductFarmer(game, log);
            if (ok === 'GAMEOVER') return ok;
            if (!ok) continue;
        }
        const rock = await game.scene(s => {
            const f = s.abductedCows.find(e => e.isEnemy);
            if (!f) return null;
            const r = s._tutAcharRochaPerto(f.x, f.y);
            return r ? { x: r.x, y: r.y, d: Math.hypot(r.x - s.ufo.x, r.y - s.ufo.y) } : null;
        });
        if (!rock) { log('  sem pedra/fazendeiro'); continue; }
        log(`  pedra a ${Math.round(rock.d)}px (tentativa ${attempt + 1})`);
        await game.beamOn();
        let outcome = null;
        try {
            // A: aproxima com a carga
            const t0 = Date.now();
            while (Date.now() - t0 < 25_000) {
                const d = await game.aimToward(rock.x, rock.y, 240);
                const st = await game.scene(status);
                if (st.gameOver) { outcome = 'GAMEOVER'; break; }
                if (st.farmersTotal > base) { outcome = true; break; }
                if (!st.hasFarmer || st.energy <= 2) { outcome = 'lost'; break; }
                if (d < 110) break;
                await game.page.waitForTimeout(80);
            }
            // B: varre pela pedra (alterna o alvo entre os dois lados a cada 600ms)
            if (outcome === null) {
                const t1 = Date.now();
                let side = 1;
                while (Date.now() - t1 < 12_000) {
                    const u = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
                    const ang = Math.atan2(rock.y - u.y, rock.x - u.x);
                    const tx = rock.x + Math.cos(ang) * 140 * side, ty = rock.y + Math.sin(ang) * 140 * side;
                    const tEnd = Date.now() + 600;
                    while (Date.now() < tEnd) {
                        await game.aimToward(tx, ty, 240);
                        const st = await game.scene(status);
                        if (st.gameOver) { outcome = 'GAMEOVER'; break; }
                        if (st.farmersTotal > base) { outcome = true; break; }
                        if (!st.hasFarmer || st.energy <= 2) { outcome = 'lost'; break; }
                        await game.page.waitForTimeout(70);
                    }
                    if (outcome !== null) break;
                    side = -side;
                }
            }
        } finally {
            await game.beamOff();
        }
        if (outcome === true || outcome === 'GAMEOVER') return outcome;
        log(`  tentativa falhou (${outcome || 'timeout'}) — ${JSON.stringify(await game.scene(status))}`);
        await game.settle(1200);
        // Recarga do feixe é 5/s (paridade Bevy): de 0 a 90% são 18 s
        await game.waitFor(s => s.energiaLed >= s.energiaMax * 0.9 || s.gameOver, { timeout: 20_000 });
    }
    return false;
}

// Passo 09: esquivar 5 torpedos. Piloto = ÓRBITA contínua em volta do mecha
// com raio 280 (dentro dos 420 de tiro mesmo com o sobressalto do controle).
// A nave chega a ~15 px/frame; o torpedo anda 6.2 (8 no boost de 1.5s) e só
// guina 1.8 rad/s: quem está em movimento tangencial não é alcançado. O
// piloto antigo PARAVA na faixa e só reagia a 230px — saía do zero contra um
// torpedo a 484 px/s e levava 4-5 acertos (13 de tanque cada) por tentativa.
// Órbitas largas (330+) saíam do alcance e o mecha nem atirava. Medido em
// 30/10 no passo isolado: R330 em alcance 7-15% do tempo; R280 91-95%,
// 0 acertos, 5/5 esquivas em 12-18s sobrando 36-58 de tanque (3/3).
//
// NO TOQUE (cockpit) esse piloto falhava: o aimToward do joystick limita a
// velocidade a 9 px/frame e seguir a CORDA até o ponto do círculo puxa pra
// dentro — a nave descia a ~120px do mecha, levava torpedo de perto e às vezes
// o próprio torpedo matava o mecha (fogo amigo) e o passo ficava sem tiro.
// No toque o piloto é outro: tangente ao círculo + correção radial, joystick
// no fim do curso (o que um jogador faz pra fugir). Medido 30/10 no passo
// isolado, tablet: atual 2/4 (r mín 116) × este 4/4, 0-1 acerto. No desktop
// o atual ganha (4/4, 0 acertos, alcance 86-91%) e o radial abre demais
// (alcance 41%): cada um no seu modo.
// Raio e ganho do toque medidos SOB CARGA (2 workers) com o tanque de entrada
// real do passo 09 (68): R280/ganho 120 deixava a órbita na mediana de 412px,
// no limite dos 420 de tiro (alcance 84-87%; no tutorial inteiro saía do
// alcance, o mecha parava de atirar e o tanque acabava só de voar). R260 com
// ganho 60 e correção pra dentro até 3×: mediana 340px, alcance 96-99%, 4/4,
// 0 acertos, 12-16s. Joystick é liga/desliga (a força satura a 16% do curso),
// então a curva sai da DIREÇÃO, não da velocidade.
const DODGE_ORBIT_R = 280;
const DODGE_TOUCH_R = 260, DODGE_TOUCH_GAIN = 60, DODGE_TOUCH_KMIN = -3;
async function dodgeSteerTouch(game, st, dir) {
    const ax = st.ufo.x - st.mecha.x, ay = st.ufo.y - st.mecha.y;
    const r = Math.hypot(ax, ay) || 1;
    const rx = ax / r, ry = ay / r;
    // + = abre, - = fecha (fechar pode pesar até 3× a tangente)
    const k = Math.max(DODGE_TOUCH_KMIN, Math.min(1.2, (DODGE_TOUCH_R - r) / DODGE_TOUCH_GAIN));
    let dx = -ry * dir + rx * k, dy = rx * dir + ry * k;
    const n = Math.hypot(dx, dy) || 1;
    await game.input.steer(dx / n, dy / n, 1);
}
async function dodgeTorpedoes(game, log, need = 5) {
    const base = await game.scene(s => s._torpedoesDodged || 0);
    const touch = await game.useCockpit();
    const release = async () => { if (touch) await game.input.steer(0, 0, 0); };
    const t0 = Date.now();
    let lastLog = 0, dir = 0;
    while (Date.now() - t0 < 120_000) {
        const st = await game.scene((s, b) => {
            let m = null, md = Infinity;
            for (const a of s.shooters) {
                const d = distSq(a.x, a.y, s.ufo.x, s.ufo.y);
                if (d < md) { md = d; m = { x: a.x, y: a.y, d: Math.sqrt(d) }; }
            }
            const v = s.ufo.body?.velocity || { x: 0, y: 0 };
            return { dodged: (s._torpedoesDodged || 0) - b, mecha: m,
                     ufo: { x: s.ufo.x, y: s.ufo.y }, vx: v.x, vy: v.y, fuel: Math.round(s.fuelCurrent),
                     gameOver: !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA,
                     bullets: s.bullets.filter(q => q.torpedo).length };
        }, base);
        if (st.gameOver) { await release(); return 'GAMEOVER'; }
        if (st.dodged >= need) { await release(); return true; }
        if (Date.now() - lastLog > 5000) {
            log(`  esquivas ${st.dodged}/${need} fuel ${st.fuel} mecha ${st.mecha ? Math.round(st.mecha.d) : '-'} torpedos ${st.bullets}`);
            lastLog = Date.now();
        }
        if (!st.mecha) { await game.page.waitForTimeout(200); continue; }

        const ax = st.ufo.x - st.mecha.x, ay = st.ufo.y - st.mecha.y;
        // Sentido da órbita: o que a nave já estiver fazendo (sem meia-volta)
        if (dir === 0) dir = (ax * st.vy - ay * st.vx) >= 0 ? 1 : -1;
        if (touch) { await dodgeSteerTouch(game, st, dir); await game.page.waitForTimeout(40); continue; }
        const r = Math.hypot(ax, ay) || 1;
        // Mira num ponto do círculo à frente: longe demais → menos avanço
        // (puxa pra dentro); perto demais → mais avanço (abre)
        const lead = Math.max(0.35, Math.min(1.3, 0.9 - (r - DODGE_ORBIT_R) / 150));
        const th = Math.atan2(ay, ax) + dir * lead;
        await game.aimToward(st.mecha.x + Math.cos(th) * DODGE_ORBIT_R,
                             st.mecha.y + Math.sin(th) * DODGE_ORBIT_R, 240);
        await game.page.waitForTimeout(40);
    }
    await release();
    return false;
}

// Pega um fazendeiro e arremessa no mecha (slam a <35px em 09_enemies.js)
async function killMecha(game, log) {
    const base = await game.scene(s => s.shootersTotal || 0);
    // O mecha pode morrer fora do arremesso (encostão, torpedo) e o tutorial
    // fechar sozinho: sem esta checagem o helper insistia, não achava mais
    // fazendeiro nem mecha, e o beamOn seguinte apertava o JOGAR AGORA do card
    const closed = (s, b) => (s.shootersTotal || 0) > b || (s.tutorialMode && s._tutStepIdx == null);
    for (let attempt = 0; attempt < 5; attempt++) {
        if (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA)) return 'GAMEOVER';
        if (await game.scene(closed, base)) return true;
        const has = await game.scene(s => s.abductedCows.some(e => e.isEnemy));
        if (!has) {
            const ok = await abductFarmer(game, log);
            if (ok === 'GAMEOVER') return ok;
            if (!ok) continue;
        }
        const m = await game.scene(nearestMecha);
        if (!m) { await game.page.waitForTimeout(300); continue; }
        log(`  mecha a ${Math.round(m.d)}px (tentativa ${attempt + 1})`);
        if (await game.scene(closed, base)) return true;
        await game.beamOn();
        let outcome = null;
        try {
            const t0 = Date.now();
            while (Date.now() - t0 < 25_000) {
                const mm = await game.scene(nearestMecha);
                if (!mm) break;
                await game.aimToward(mm.x, mm.y, mm.d > 120 ? 240 : 60);
                const st = await game.scene(status);
                if (st.gameOver) { outcome = 'GAMEOVER'; break; }
                if (st.shootersTotal > base) { outcome = true; break; }
                if (!st.hasFarmer || st.energy <= 2) { outcome = 'lost'; break; }
                await game.page.waitForTimeout(80);
            }
        } finally {
            await game.beamOff();
        }
        if (outcome === true || outcome === 'GAMEOVER') return outcome;
        if (await game.scene((s, b) => (s.shootersTotal || 0) > b, base)) return true;
        log(`  tentativa falhou (${outcome || 'timeout'}) — ${JSON.stringify(await game.scene(status))}`);
        await game.settle(1200);
        // Recarga do feixe é 5/s (paridade Bevy): de 0 a 90% são 18 s
        await game.waitFor(s => s.energiaLed >= s.energiaMax * 0.9 || s.gameOver, { timeout: 20_000 });
    }
    return false;
}

// ── Tutorial inteiro ─────────────────────────────────────────────────
// Joga os 10 passos com o driver de input da fixture (mouse ou toque). Cada
// passo roda numa função `run` que devolve true ou 'GAMEOVER'; no game over o
// teste faz o que o jogador faria: RESTART e repete o passo retomado.
async function playTutorial(game, page) {
    const timeline = [];
    const t0 = Date.now();
    const log = (m) => timeline.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${m}`);
    const fuel = async () => Math.round(await game.scene(s => s.fuelCurrent));
    let deaths = 0;

    const doStep = async (key, nextKey, run) => {
        for (let round = 0; round < 4; round++) {
            const cur = await currentKey(game);
            if (cur !== 'GAMEOVER' && atOrAfter(cur, nextKey)) {
                // ex.: MOVE fecha sozinho no modo mouse (cursor no botão do splash);
                // no toque o feixe vai junto do dedo e fecha passos durante o voo
                log(`${key} já tinha avançado sozinho → ${cur} (fuel ${await fuel()})`);
                return;
            }
            expect(cur, `passo atual deveria ser ${key}`).toBe(key);
            const r = await run();
            if (r === 'GAMEOVER' || (await game.scene(s => !!s.gameOver && (s.burgersCollected || 0) < BURGER_QUOTA))) {
                deaths++;
                const resumed = await recoverFromGameOver(game, log);
                if (atOrAfter(resumed, nextKey)) {   // o passo fechou no mesmo instante em que o tanque zerou
                    log(`${key} ok (fechou junto com a morte; retomou em ${resumed})`);
                    return;
                }
                expect(resumed, 'retomou no passo que falhou').toBe(key);
                continue;
            }
            expect(r, `ação do passo ${key}`).toBe(true);
            const w = await waitStep(game, nextKey, 15_000);
            if (w === 'GAMEOVER') {
                deaths++;
                const resumed = await recoverFromGameOver(game, log);
                if (atOrAfter(resumed, nextKey)) { log(`${key} ok (fechou junto com a morte; retomou em ${resumed})`); return; }
                expect(resumed, 'retomou no passo que falhou').toBe(key);
                continue;
            }
            expect(typeof w === 'string' && atOrAfter(w, nextKey), `avançou de ${key} pra ${nextKey} (got ${w})`).toBe(true);
            log(`${key} ok (fuel ${await fuel()})`);
            return;
        }
        throw new Error(`passo ${key} não fechou em 4 rodadas`);
    };

    try {
        await page.goto('/');
        await game.waitForScene();
        await game.startTutorialViaSplash({ input: 'mouse' });
        await game.scene((s, ms) => { s._tutMinReadMs = ms; }, MIN_READ_MS);

        // 01 MOVE — voa 200px
        await doStep('MOVE', 'GRAVITON_BAR', async () => {
            const u0 = await game.scene(s => ({ x: s.ufo.x, y: s.ufo.y }));
            await game.flyTo(u0.x + 450, u0.y, { tol: 80 });
            return true;
        });

        // 02 GRAVITON_BAR — drena <50%, solta, espera 100%
        await doStep('GRAVITON_BAR', 'ABDUCT', async () => {
            await game.settle();
            await game.beamOn();
            const drained = await game.waitFor(s => s.energiaLed <= s.energiaMax * 0.5, { timeout: 15_000 });
            await game.beamOff();
            expect(drained, 'graviton drenou abaixo de 50%').toBe(true);
            // O passo fecha com o graviton a 99%; a 5/s (paridade Bevy) de 50%
            // são ~10 s — espera aqui pra não estourar o waitStep de 15 s
            await game.waitFor(s => s.energiaLed >= s.energiaMax * 0.99 || s.gameOver, { timeout: 25_000 });
            return true;
        });

        // 03 ABDUCT — 50 vacas nascem, abduz 1 (e segura)
        await doStep('ABDUCT', 'DELIVER', async () => {
            expect(await game.waitFor(s => s.cows.length >= 40, { timeout: 5000 }), '50 vacas nasceram').toBe(true);
            return abductOne(game, log, { keep: true });
        });

        // 04 DELIVER — leva pro curral
        await doStep('DELIVER', 'BURGER', async () => {
            // Sob carga o voo até o curral já levou 16 s (normal ~4 s) e o
            // graviton (13 s cheio) zerou no caminho: a vaca caiu. Recarrega e
            // leva outra, como o jogador faria
            for (let k = 0; k < 3; k++) {
                const r = await deliverToCorral(game, log);
                if (r === true || r === 'GAMEOVER') return r;
                if (await game.scene(s => s.tutorialMode && TUT_STEPS[s._tutStepIdx]?.key !== 'DELIVER')) return true;
                log('  [deliver] não entregou — recarrega o graviton e abduz de novo');
                await game.waitFor(s => s.energiaLed >= s.energiaMax * 0.9 || s.gameOver, { timeout: 20_000 });
                const a = await abductOne(game, log, { keep: true });
                if (a === 'GAMEOVER') return a;
            }
            return false;
        });
        // Entrar no BURGER zera o tanque pra 15% (lição). Só vale na 1ª entrada:
        // se morrer aqui, o resume repõe 50% (pedido do user em 08-10).
        if (deaths === 0) {
            const f = await game.scene(s => s.fuelCurrent);
            expect(f, 'lição do BURGER começa com 15% de tanque').toBeLessThanOrEqual(16);
        }

        // 05 BURGER — coleta o burger (recarrega o tanque). Se retomou aqui depois
        // de morrer não há burger cozinhando: abduz e entrega de novo primeiro.
        await doStep('BURGER', 'TAKE_DAMAGE', async () => {
            const cooking = await game.scene(s => s.corrals.some(c =>
                c.slots && c.slots.some(x => x && (x.state === 'loading' || x.state === 'ready'))));
            if (!cooking) {
                log('  sem burger a caminho (retomada): abduz + entrega de novo');
                const a = await abductOne(game, log, { keep: true });
                if (a !== true) return a;
                const d = await deliverToCorral(game, log);
                if (d !== true) return d;
            }
            return collectBurger(game, log);
        });

        // 06 TAKE_DAMAGE — automático: nave congela, farmer atira, fuel cai
        await doStep('TAKE_DAMAGE', 'FARMER', async () => {
            expect(await game.scene(s => !!s._tutFreezeNave || !!s._tutDamageTaken), 'nave congelada (ou tiro já levado)').toBe(true);
            const w = await waitStep(game, 'FARMER', 30_000);
            if (w === 'GAMEOVER') return 'GAMEOVER';
            expect(typeof w === 'string', 'passou do TAKE_DAMAGE').toBe(true);
            expect(await game.scene(s => !!s._tutFreezeNave)).toBe(false);
            return true;
        });

        // 07 FARMER — abduz o fazendeiro (e segura: o passo 08 precisa dele a bordo)
        await doStep('FARMER', 'FARMER_KILL', async () => abductFarmer(game, log, { keep: true }));

        // 08 FARMER_KILL — arrasta ele numa pedra
        await doStep('FARMER_KILL', 'DODGE_TORPEDOS', async () => killFarmerOnRock(game, log));

        // 09 DODGE_TORPEDOS — 5 esquivas
        await doStep('DODGE_TORPEDOS', 'KILL_SHOOTER', async () => {
            expect(await game.waitFor(s => s.shooters.length > 0, { timeout: 5000 }), 'mecha nasceu').toBe(true);
            return dodgeTorpedoes(game, log);
        });

        // 10 KILL_SHOOTER — arremessa fazendeiro no mecha → DONE
        await doStep('KILL_SHOOTER', 'DONE', async () => killMecha(game, log));

        // Conclusão: flag persistida + conquista graduate + botão JOGAR AGORA.
        // (A conclusão NÃO reabastece: quem fecha o passo 10 com 1% de tanque
        // morre na tela de "TUTORIAL COMPLETE" — fica como observação, não trava o teste.)
        const fin = await game.scene(s => ({
            tutDone: localStorage.getItem('cep_tutorial_done'),
            graduate: (s.save?.achievements || []).includes('graduate'),
            gameOver: s.gameOver, stepIdx: s._tutStepIdx, fuel: Math.round(s.fuelCurrent),
            btn: s.children.list.some(o => o.type === 'Text' && /PLAY NOW|JOGAR AGORA/.test(o.text || '')),
        }));
        log(`DONE (mortes no caminho: ${deaths}; fuel ao concluir ${fin.fuel}${fin.gameOver ? ' — morreu logo após concluir' : ''}${game.concludedOnDeath ? ' — concluiu no frame da morte' : ''})`);
        expect(fin.stepIdx).toBeNull();
        if (!game.concludedOnDeath) expect(fin.btn, 'botão JOGAR AGORA').toBe(true);
        expect(game.realErrors).toEqual([]);
        expect(fin.tutDone, 'cep_tutorial_done gravado').toBe('1');
        expect(fin.graduate, 'conquista graduate').toBe(true);
    } finally {
        console.log(timeline.join('\n'));
    }
    return timeline;
}

module.exports = { MIN_READ_MS, pressKey, currentKey, waitStep, clickGameOverRestart, recoverFromGameOver,
                   abductOne, deliverToCorral, deliverWithRetry, collectBurger, abductFarmer, killFarmerOnRock,
                   dodgeTorpedoes, killMecha, playTutorial };
