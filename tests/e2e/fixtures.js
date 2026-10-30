// tests/e2e/fixtures.js — fixture `game` + helpers pra pilotar o Chapada Escapade real.
//
// O que a fixture faz antes de cada teste:
//   • seed no Math.random (mulberry32) ANTES de qualquer script → spawns, terreno
//     e currais ficam determinísticos por seed (Phaser.Math.Between usa Math.random)
//   • serve o phaser.js do node_modules no lugar do CDN (offline + rápido)
//   • stub do Google Fonts e do project_server (localhost:8090) — fora do jogo
//   • coleta console.error / pageerror / warn "[ASSET 404]" pra asserção de boot limpo
//   • espera a cena `Jogo` nascer (window.game já é exposto pelo 99_main.js)
//
// Todo acesso ao estado do jogo passa por `game.scene(fn)` = page.evaluate com a
// cena como argumento. Nenhum hook novo foi adicionado ao código do jogo: tudo
// que os testes usam já existia (window.game, _splashStartGame, flags do tutorial).
'use strict';
const base = require('@playwright/test');
const path = require('path');

const PHASER_LOCAL = path.join(__dirname, '..', '..', 'node_modules', 'phaser', 'dist', 'phaser.js');
const DEFAULT_SEED = 20261029;

// PRNG mulberry32 — substitui Math.random antes do Phaser carregar
const seedScript = (seed) => `(() => {
    let s = ${seed >>> 0};
    Math.random = function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    window.__CEP_SEED = ${seed};
})();`;

class GamePage {
    constructor(page, opts) {
        this.page = page;
        this.opts = opts;
        this.errors = [];      // console.error + pageerror
        this.warnings = [];    // console.warn
        this.logs = [];        // tudo (debug)
    }

    // Avalia `fn(scene, arg)` no browser com a cena Jogo como 1º argumento
    async scene(fn, arg) {
        return this.page.evaluate(({ src, arg }) => {
            const scene = window.game && window.game.scene && window.game.scene.keys.Jogo;
            // eslint-disable-next-line no-new-func
            const f = new Function('return (' + src + ')')();
            return f(scene, arg);
        }, { src: fn.toString(), arg });
    }

    // Snapshot compacto do estado que os testes mais olham
    async state() {
        return this.scene((s) => ({
            gameStarted: !!s.gameStarted,
            tutorialMode: !!s.tutorialMode,
            gameOver: !!s.gameOver,
            paused: !!s.paused,
            physics: !!s.matter?.world?.enabled,
            isMobile: !!s.isMobile,
            mobileMode: !!window.__MOBILE_MODE,
            ufo: s.ufo ? { x: Math.round(s.ufo.x), y: Math.round(s.ufo.y) } : null,
            score: s.score || 0,
            fuel: s.fuelCurrent,
            energy: s.energiaLed,
            cows: (s.cows || []).filter(v => v && v.scene && !v.isBurger).length,
            abducted: (s.abductedCows || []).length,
            cowsInBeam: s._cowsInBeamCount || 0,
            farmers: (s.farmers || []).filter(f => f && f.scene).length,
            shooters: (s.shooters || []).length,
            bullets: (s.bullets || []).length,
            corrals: (s.corrals || []).length,
            burgersCollected: s.burgersCollected || 0,
            cowsTotal: s.cowsTotal || 0,
            farmersTotal: s.farmersTotal || 0,
            shootersTotal: s.shootersTotal || 0,
            tutStep: s._tutStepIdx ?? null,
            tutKey: (s.tutorialMode && typeof TUT_STEPS !== 'undefined' && s._tutStepIdx != null)
                ? (TUT_STEPS[s._tutStepIdx]?.key ?? 'DONE') : null,
            inputMode: s.dbg?.behavior?.inputMode,
            lang: s.dbg?.behavior?.lang,
            children: s.children?.list?.length ?? 0,
        }));
    }

    // Pré-grava o CONFIGS (chapEscapadeDebug) ANTES do goto — mesmas chaves
    // do DBG_DEFAULTS do 15_debug_menu.js (ex.: {enabled:{farmers:false}})
    async presetConfig(cfg) {
        await this.page.addInitScript((c) => {
            try { localStorage.setItem('chapEscapadeDebug', JSON.stringify(Object.assign({ _parityV2: true }, c))); }
            catch (e) {}
        }, cfg);
    }

    async waitForScene(timeout = 60_000) {
        await this.page.waitForFunction(() => {
            const s = window.game && window.game.scene && window.game.scene.keys.Jogo;
            return !!(s && s.ufo && s.sys && s.sys.isActive());
        }, null, { timeout });
        // pre-loader DOM some no 'complete' do loader (fade 500ms) — exceto no
        // modo teaser do celular, onde ele vira título persistente transparente
        await this.page.waitForFunction(() => {
            const pl = document.getElementById('pre-loader');
            return !pl || pl.classList.contains('fade') || window.__MOBILE_MODE;
        }, null, { timeout });
    }

    // Retângulo do canvas em coordenadas da página (o game-host é 75vw×75vh no desktop)
    async canvasRect() {
        return this.page.evaluate(() => {
            const c = document.querySelector('#game-host canvas');
            const r = c.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
        });
    }

    // Converte coordenada de tela do jogo (scale.width/height) pra coordenada da página
    async toPage(cx, cy) {
        const r = await this.canvasRect();
        const sz = await this.scene(s => ({ w: s.scale.width, h: s.scale.height }));
        return { x: r.x + (cx / sz.w) * r.w, y: r.y + (cy / sz.h) * r.h };
    }

    // Converte posição de MUNDO pra coordenada da página (via câmera)
    async worldToPage(wx, wy) {
        const sc = await this.scene((s, p) => {
            const cam = s.cameras.main;
            return { x: (p.wx - cam.scrollX) * cam.zoom, y: (p.wy - cam.scrollY) * cam.zoom,
                     w: s.scale.width, h: s.scale.height };
        }, { wx, wy });
        const r = await this.canvasRect();
        return { x: r.x + (sc.x / sc.w) * r.w, y: r.y + (sc.y / sc.h) * r.h, w: r.w, h: r.h, rect: r };
    }

    // ── Cockpit de toque (12_mobile.js): centros do joystick e da lente ──
    // Só existem depois do jogo começar numa tela de toque (touchCockpit).
    // Cache: o painel não muda de lugar (viewport fixo no teste) e cada
    // evaluate custa ~15ms — a esquiva de torpedo precisa reagir em <0.4s.
    async useCockpit() {
        if (!this.input.steer) return false;
        if (this._cockpitOk) return true;
        this._cockpitOk = await this.scene(s => !!(s.touchCockpit && s._ckJoyCenter));
        return this._cockpitOk;
    }
    async joyCenterPage() {
        if (this._joyCache) return this._joyCache;
        const c = await this.scene(s => s._ckJoyCenter ? { ...s._ckJoyCenter(), r: 90 * (s._ckScale || 0.3) } : null);
        if (!c) return null;
        const p = await this.toPage(c.x, c.y);
        const rect = await this.canvasRect();
        const sz = await this.scene(s => s.scale.width);
        this._joyCache = { x: p.x, y: p.y, r: c.r * (rect.w / sz) };
        return this._joyCache;
    }
    async lensCenterPage() {
        if (this._lensCache) return this._lensCache;
        const c = await this.scene(s => s._ckLensCenter ? s._ckLensCenter() : null);
        if (!c) return null;
        this._lensCache = await this.toPage(c.x, c.y);
        return this._lensCache;
    }

    // ── Splash ───────────────────────────────────────────────────────
    // Botões do splash (11_gameflow.js): esq em x=240, dir em x=w-240, y=h-38
    async splashButton(side) {
        const sz = await this.scene(s => ({ w: s.scale.width, h: s.scale.height }));
        const cx = side === 'left' ? 150 + 90 : sz.w - 150 - 90;
        return this.toPage(cx, sz.h - 38);
    }

    async clickSplash(side) {
        const p = await this.splashButton(side);
        await this.input.tap(p.x, p.y);
        await this.page.waitForTimeout(150);
    }

    // PLAY → idioma → input (cliques reais nos botões do splash)
    async startPlayViaSplash({ lang = 'en', input = 'mouse' } = {}) {
        await this.clickSplash('left');                       // PLAY → ENG | PTBR
        await this.clickSplash(lang === 'pt' ? 'right' : 'left');
        await this.clickSplash(input === 'wasd' ? 'right' : 'left');
        await this.page.waitForFunction(() => window.game.scene.keys.Jogo.gameStarted);
        // Em modo mouse a nave sai atrás do ponteiro (que ficou no botão do
        // splash): traz o ponteiro pra cima da nave, como um jogador faria.
        if (input === 'mouse') await this.hover();
    }

    // TUTORIAL → input (cliques reais)
    async startTutorialViaSplash({ input = 'mouse' } = {}) {
        await this.clickSplash('right');                      // TUTORIAL → MOUSE | WASD
        await this.clickSplash(input === 'wasd' ? 'right' : 'left');
        await this.page.waitForFunction(() => window.game.scene.keys.Jogo.gameStarted);
        if (input === 'mouse') await this.hover();
    }

    // Atalho: usa o hook que o próprio splash expõe pro botão PREVIEW
    async startDirect({ tutorial = false, input = 'mouse', lang = 'en' } = {}) {
        await this.scene((s, o) => {
            if (s.dbg?.behavior) { s.dbg.behavior.lang = o.lang; }
            s._splashStartGame(o.tutorial, o.input);
        }, { tutorial, input, lang });
        await this.page.waitForFunction(() => window.game.scene.keys.Jogo.gameStarted);
    }

    // ── Pilotagem (modo mouse/touch: nave vai atrás do ponteiro) ─────
    // Coloca o ponteiro a `reach` px da nave na direção do alvo (em tela).
    // A menos de `stopWithin` px do alvo o ponteiro fica NA nave: o 06_ufo só
    // aplica força com o cursor a >50px, então a nave para (e poupa tanque).
    async aimToward(wx, wy, reach = 240, stopWithin = 0) {
        // Toque: mover = dedo encostado (o feixe acende junto, como no tablet real)
        if (this.input.needsHold && !this.input.isDown) await this.input.down();
        const info = await this.scene((s, p) => {
            const cam = s.cameras.main;
            const sx = (s.ufo.x - cam.scrollX), sy = (s.ufo.y - cam.scrollY);
            const dx = p.wx - s.ufo.x, dy = p.wy - s.ufo.y;
            const d = Math.hypot(dx, dy) || 1;
            const v = s.ufo.body?.velocity || { x: 0, y: 0 };
            return { sx, sy, ux: dx / d, uy: dy / d, dist: d, vx: v.x, vy: v.y,
                     w: s.scale.width, h: s.scale.height };
        }, { wx, wy });
        if (await this.useCockpit()) {
            // Joystick do painel: qualquer deflexão >16% já é força máxima (o
            // cursor virtual fica a 220px), então "apontar pro alvo" passa reto.
            // Controle de velocidade: quer v ∝ distância; o joystick empurra na
            // direção do ERRO (v desejada − v atual) e solta quando acertou.
            const speed = Math.hypot(info.vx, info.vy);
            if (info.dist <= stopWithin && speed < 2.5) { await this.input.steer(0, 0, 0); return info.dist; }
            const vWant = info.dist <= stopWithin ? 0 : Math.min(9, info.dist * 0.06);
            const ex = info.ux * vWant - info.vx, ey = info.uy * vWant - info.vy;
            const m = Math.hypot(ex, ey);
            if (m < 0.8) await this.input.steer(0, 0, 0);       // na velocidade certa: plana
            else await this.input.steer(ex / m, ey / m, 1);
            return info.dist;
        }
        const r = info.dist <= stopWithin ? 0 : Math.min(reach, Math.max(55, info.dist));
        let cx = info.sx + info.ux * r, cy = info.sy + info.uy * r;
        cx = Math.max(4, Math.min(info.w - 4, cx));
        cy = Math.max(4, Math.min(info.h - 4, cy));
        const p = await this.toPage(cx, cy);
        await this.input.move(p.x, p.y);
        return info.dist;
    }

    // Voa até ficar a `tol` px do alvo (mundo). Retorna distância final.
    // No toque a nave só anda com o dedo encostado (e o feixe acende junto —
    // é assim que se joga no tablet): segura durante o voo e solta no fim,
    // a não ser que `keep` (carga a bordo continua presa).
    async flyTo(wx, wy, { tol = 60, timeout = 25_000, reach = 240, keep = false } = {}) {
        const holdHere = !!this.input.needsHold && !this.input.isDown;
        if (holdHere) await this.input.down();
        const t0 = Date.now();
        let dist = Infinity;
        while (Date.now() - t0 < timeout) {
            dist = await this.aimToward(wx, wy, reach, tol);
            if (dist <= tol) break;
            if (await this.scene(s => !!s.gameOver)) break;   // morreu: não insiste 15s num cadáver
            await this.page.waitForTimeout(90);
        }
        if (dist > tol && !(await this.scene(s => !!s.gameOver))) {
            // Diagnóstico: por que não chegou?
            const d = await this.scene((s, p) => ({
                ship: [Math.round(s.ufo.x), Math.round(s.ufo.y)], target: [Math.round(p.wx), Math.round(p.wy)],
                vel: [+s.ufo.body.velocity.x.toFixed(2), +s.ufo.body.velocity.y.toFixed(2)],
                cam: [Math.round(s.cameras.main.scrollX), Math.round(s.cameras.main.scrollY)],
                virtual: [Math.round(s.virtualX), Math.round(s.virtualY)],
                ptr: [Math.round(s.input.activePointer.x), Math.round(s.input.activePointer.y), s.input.activePointer.isDown],
                inputEnabled: s.input.enabled, frozen: !!s._tutFreezeNave, paused: s.paused, gameOver: s.gameOver,
                physics: s.matter.world.enabled, fuel: Math.round(s.fuelCurrent), inputMode: s.dbg?.behavior?.inputMode,
                scale: [s.scale.width, s.scale.height],
            }), { wx, wy });
            console.log('[flyTo] não chegou:', JSON.stringify({ dist: Math.round(dist), mouse: this.input.pos, rect: await this.canvasRect(), ...d }));
        }
        await this.settle(1500); // ponteiro acompanha a nave até ela parar (sem gastar tanque)
        if (holdHere && !keep) await this.input.up();
        return dist;
    }

    // Ponteiro em cima da nave (dist < 50 → nenhuma força). No cockpit o
    // joystick FREIA (empurra contra a velocidade) até parar, senão a nave
    // plana — e perto da costa a barreira do oceano a arrasta pro centro.
    async hover() {
        if (await this.useCockpit()) {
            const v = await this.scene(s => ({ x: s.ufo.body.velocity.x, y: s.ufo.body.velocity.y }));
            const sp = Math.hypot(v.x, v.y);
            if (sp > 1.0) await this.input.steer(-v.x / sp, -v.y / sp, 1);
            else await this.input.steer(0, 0, 0);
            return;
        }
        const sc = await this.scene(s => {
            const cam = s.cameras.main;
            return { x: s.ufo.x - cam.scrollX, y: s.ufo.y - cam.scrollY };
        });
        const p = await this.toPage(sc.x, sc.y);
        await this.input.move(p.x, p.y);
    }

    // Espera a nave praticamente parar (no cockpit: freando pelo joystick).
    // No timeout SOLTA o joystick — senão o freio vira aceleração ao contrário.
    async settle(ms = 1500) {
        const t0 = Date.now();
        let sp = Infinity;
        while (Date.now() - t0 < ms) {
            await this.hover();
            sp = await this.scene(s => Math.hypot(s.ufo.body.velocity.x, s.ufo.body.velocity.y));
            if (sp < 0.3) break;
            await this.page.waitForTimeout(80);
        }
        if (this.input.steer && await this.useCockpit()) await this.input.steer(0, 0, 0);
    }

    async beamOn()  { if (await this.useCockpit()) await this.input.beamDown(); else await this.input.down(); }
    async beamOff() { if (await this.useCockpit()) await this.input.beamUp(); else await this.input.up(); }

    // Segura o feixe sobre um alvo até `cond(scene, arg)` virar true. Com
    // `keep`, o feixe continua ligado quando deu certo (carga fica a bordo).
    async beamUntil(cond, { timeout = 10_000, track = null, arg, keep = false, onTick = null } = {}) {
        await this.beamOn();
        const t0 = Date.now();
        let ok = false;
        try {
            while (Date.now() - t0 < timeout) {
                if (track) await this.aimToward(track.x, track.y, 120, 70); else await this.hover();
                ok = await this.scene(cond, arg);
                if (ok) break;
                if (onTick) await onTick();
                await this.page.waitForTimeout(80);
            }
        } finally {
            if (!(ok && keep)) await this.beamOff();
        }
        return ok;
    }

    // Espera `cond(scene, arg)` virar truthy; devolve o valor (ou false no timeout)
    async waitFor(cond, { timeout = 15_000, interval = 100, arg } = {}) {
        const t0 = Date.now();
        while (Date.now() - t0 < timeout) {
            const v = await this.scene(cond, arg);
            if (v) return v;
            await this.page.waitForTimeout(interval);
        }
        return false;
    }

    // Erros de console que NÃO são ruído conhecido do ambiente headless
    get realErrors() {
        return this.errors.filter(e => !/WebGL|GPU stall|SwiftShader|ANGLE|swiftshader|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/i.test(e));
    }
    get asset404s() {
        return this.warnings.filter(w => w.includes('[ASSET 404]'));
    }
}

// ── Drivers de input: mouse (desktop) ou toque via CDP (touch) ─────────
// down()/up() são idempotentes: segurar duas vezes não re-dispara o evento.
class MouseInput {
    constructor(page) { this.page = page; this.pos = { x: 0, y: 0 }; this.isDown = false; }
    async move(x, y) { this.pos = { x, y }; await this.page.mouse.move(x, y); }
    async down() { if (this.isDown) return; this.isDown = true; await this.page.mouse.down(); }
    async up()   { if (!this.isDown) return; this.isDown = false; await this.page.mouse.up(); }
    async tap(x, y) { await this.page.mouse.click(x, y); }
}

// Toque por TouchEvent SINTÉTICO no canvas (new Touch/new TouchEvent): o
// Phaser lê `changedTouches`/`identifier` direto do evento, então cada dedo
// tem identidade própria. (O CDP Input.dispatchTouchEvent casa os pontos entre
// eventos POR ÍNDICE, e soltar o 1º dedo com o 2º preso virava "o 2º soltou".)
// Dois modos:
//   cru     — move/down/up/tap: um dedo no mapa (teaser do celular, splash)
//   cockpit — steer()/beamDown()/beamUp(): um dedo no joystick do painel,
//             outro na lente do emissor (12_mobile.js, tablet)
class TouchInput {
    constructor(page) {
        this.page = page; this.pos = { x: 0, y: 0 };
        this.isDown = false; this.needsHold = false; this.game = null;
        this.points = new Map();                     // id → {id, x, y}
        this.slot = { raw: null, joy: null, lens: null };
        this._nextId = 100;
    }
    async init(game) { this.game = game; }
    _begin(slot) { const id = this._nextId++; this.slot[slot] = id; this.points.set(id, { id, x: 0, y: 0 }); return this.points.get(id); }
    _pt(slot) { const id = this.slot[slot]; return id == null ? null : this.points.get(id); }
    // Dispara `type` no canvas com `touches` = todos os dedos ativos e
    // `changedTouches` = os que mudaram (no touchend, os que saíram)
    async _dispatch(type, changed) {
        const all = [...this.points.values()].map(p => ({ ...p }));
        await this.page.evaluate(({ type, all, changed }) => {
            const canvas = document.querySelector('#game-host canvas');
            const mk = (p) => new Touch({ identifier: p.id, target: canvas,
                clientX: p.x, clientY: p.y, pageX: p.x, pageY: p.y, screenX: p.x, screenY: p.y,
                radiusX: 2.5, radiusY: 2.5, rotationAngle: 0, force: 1 });
            const touches = all.map(mk), changedTouches = changed.map(mk);
            canvas.dispatchEvent(new TouchEvent(type, { touches, targetTouches: touches, changedTouches,
                bubbles: true, cancelable: true, composed: true }));
        }, { type, all, changed: changed.map(p => ({ ...p })) });
    }
    async _startSlot(slot, x, y) {
        const f = this._begin(slot); f.x = x; f.y = y;
        await this._dispatch('touchstart', [f]);
        return f;
    }
    async _moveSlot(slot, x, y) {
        const f = this._pt(slot); if (!f) return;
        f.x = x; f.y = y;
        await this._dispatch('touchmove', [f]);
    }
    async _endSlot(slot) {
        const f = this._pt(slot); if (!f) return false;
        this.points.delete(f.id); this.slot[slot] = null;
        await this._dispatch('touchend', [f]);
        return true;
    }
    // ── dedo cru no mapa (teaser / splash) ──
    async move(x, y) { this.pos = { x, y }; await this._moveSlot('raw', x, y); }
    async down() {
        if (this._pt('raw')) return;
        this.isDown = true;
        await this._startSlot('raw', this.pos.x, this.pos.y);
        // Dedo real sempre treme ~1px: o jogo só lê a posição do dedo no
        // pointermove (01_scene virtualX/Y) — um touchstart parado não pilota.
        await this.page.waitForTimeout(30);
        await this._moveSlot('raw', this.pos.x + 1, this.pos.y);
    }
    async up() {
        if (!(await this._endSlot('raw'))) return;
        this.isDown = false;
    }
    async tap(x, y) {
        const id = this._nextId++;
        const f = { id, x, y };
        this.points.set(id, f);
        await this._dispatch('touchstart', [f]);
        await this.page.waitForTimeout(40);
        this.points.delete(id);
        await this._dispatch('touchend', [f]);
    }
    // ── cockpit: um dedo no joystick (k=0 solta), outro na lente ──
    async steer(ux, uy, k) {
        const c = await this.game.joyCenterPage();
        if (!c) return;
        if (k <= 0) {
            if (await this._endSlot('joy')) {}
            this.isDown = false;
            return;
        }
        const x = c.x + ux * c.r * k, y = c.y + uy * c.r * k;
        if (!this._pt('joy')) await this._startSlot('joy', c.x, c.y);
        await this._moveSlot('joy', x, y);
        this.isDown = true;
    }
    async beamDown() {
        if (this._pt('lens')) return;
        const l = await this.game.lensCenterPage();
        if (!l) return;
        await this._startSlot('lens', l.x, l.y);
    }
    async beamUp() { await this._endSlot('lens'); }
}

const test = base.test.extend({
    seed: [DEFAULT_SEED, { option: true }],
    // `game` sobe a página já pronta (cena viva, loader concluído)
    game: async ({ page, seed, hasTouch }, use) => {
        await page.addInitScript(seedScript(seed));
        await page.route('**/phaser@3.60.0/dist/phaser.js', r =>
            r.fulfill({ path: PHASER_LOCAL, contentType: 'application/javascript' }));
        await page.route('https://fonts.googleapis.com/**', r =>
            r.fulfill({ body: '/* stub */', contentType: 'text/css' }));
        await page.route('https://fonts.gstatic.com/**', r => r.abort());
        // project_server (PixaPro) não faz parte do jogo — stub pra não poluir o console
        await page.route('http://localhost:8090/**', r =>
            r.fulfill({ body: JSON.stringify({ maps: [] }), contentType: 'application/json' }));

        const g = new GamePage(page, { seed });
        page.on('console', (msg) => {
            const text = msg.text();
            g.logs.push(`[${msg.type()}] ${text}`);
            if (msg.type() === 'error') g.errors.push(text);
            if (msg.type() === 'warning') g.warnings.push(text);
        });
        page.on('pageerror', (err) => g.errors.push('pageerror: ' + (err.stack || err.message)));

        g.input = hasTouch ? new TouchInput(page) : new MouseInput(page);
        if (g.input.init) await g.input.init(g);

        await use(g);
    },
});

module.exports = { test, expect: base.expect, GamePage, DEFAULT_SEED };
