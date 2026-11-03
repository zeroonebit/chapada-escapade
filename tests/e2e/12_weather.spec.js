// 12_weather.spec.js — clima. Thiago (01/11): "nao nevar na praia, nao faz
// muito sentido certo? aplica em todas as versoes web bevy e ue". Com neve, o
// floco some em cima da areia (o anel de praia em volta da água) e continua
// caindo no resto do mapa.
const { test, expect } = require('./fixtures');

test.describe('neve', () => {
    test('com neve, o floco some em cima da praia (areia) e continua em cima da terra', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startDirect({ tutorial: false, input: 'mouse' });
        await game.scene(s => { const fx = s.dbg.fx;
            fx.weather = 'snow'; fx.snow = true; fx.rain = false; fx.fog = false; s._applyFXVisibility(); });
        // Areia no meio do anel de praia (2 células da água) e grama/terra a 3-4 células
        // dela na horizontal ou 3 na vertical (dentro da tela com a nave em cima da praia)
        const spots = await game.scene(s => {
            const g = s.terrainGrid, d = s._distWater, C = s.terrainCell || 80;
            for (let y = 3; y < g.length - 3; y++) for (let x = 3; x < g[0].length - 3; x++) {
                if (g[y][x] !== 1 || !d || d[y][x] !== 2) continue;
                for (const [dx, dy] of [[3, 0], [-3, 0], [4, 0], [-4, 0], [0, 3], [0, -3]]) {
                    const yy = y + dy, xx = x + dx;
                    if (yy < 1 || yy >= g.length - 1 || xx < 1 || xx >= g[0].length - 1) continue;
                    let ok = g[yy][xx] >= 2;
                    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g[yy + ay][xx + ax] < 2) ok = false;
                    if (ok) return { beach: { x: (x + 0.5) * C, y: (y + 0.5) * C }, land: { x: (xx + 0.5) * C, y: (yy + 0.5) * C } };
                }
            }
            return null;
        });
        expect(spots, 'o mapa da seed tem praia com terra perto').not.toBeNull();
        // Nave (e câmera) em cima da praia
        await game.scene((s, p) => { s.ufo.setPosition(p.beach.x, p.beach.y); s.ufo.setVelocity(0, 0);
            s.cameras.main.centerOn(p.beach.x, p.beach.y); }, spots);
        await game.hover();
        // Espera a câmera assentar e os flocos começarem a cair (o 1º tween sai em até 1,5 s)
        await page.waitForTimeout(1700);
        const placed = await game.scene((s, p) => {
            const cam = s.cameras.main, wv = cam.worldView, z = cam.zoom;
            const toScreen = (w) => ({ x: (w.x - wv.x) * z, y: (w.y - wv.y) * z });
            const [a, b] = s._snowFlakes;
            s.tweens.killTweensOf(a); s.tweens.killTweensOf(b);
            const pa = toScreen(p.beach), pb = toScreen(p.land);
            a.setPosition(pa.x, pa.y); b.setPosition(pb.x, pb.y);
            window.__flakes = [a, b];
            return { pa, pb, w: s.scale.width, h: s.scale.height, visible: s.fxSnow.visible };
        }, spots);
        expect(placed.visible, 'neve ligada').toBe(true);
        for (const q of [placed.pa, placed.pb]) {
            expect(q.x).toBeGreaterThan(0); expect(q.x).toBeLessThan(placed.w);
            expect(q.y).toBeGreaterThan(0); expect(q.y).toBeLessThan(placed.h);
        }
        await page.waitForTimeout(500);
        const st = await game.scene(() => { const [a, b] = window.__flakes; return { a: a.alpha, b: b.alpha }; });
        expect(st.a, 'floco em cima da areia some').toBeLessThan(0.1);
        expect(st.b, 'floco em cima da terra continua').toBeGreaterThan(0.9);
        expect(game.realErrors).toEqual([]);
    });
    // Ressalva do Ensaio (02/11, fca6e8f): a areia do grid anda em degrau de
    // célula (80 px) e a praia DESENHADA é um campo contínuo com warp de ±0,85
    // célula; a neve sumia numa faixa de grama colada na praia. Juiz: a cor do
    // texel na textura do terreno (grama = verde bem acima do vermelho)
    test('a neve segue a praia desenhada: some na areia da tela, cai na grama mesmo onde o grid diz areia', async ({ game, page }) => {
        await page.goto('/');
        await game.waitForScene();
        await game.startDirect({ tutorial: false, input: 'mouse' });
        await game.scene(s => { const fx = s.dbg.fx;
            fx.weather = 'snow'; fx.snow = true; fx.rain = false; fx.fog = false; s._applyFXVisibility(); });
        const spots = await game.scene(s => {
            const src = s.textures.get('terrain_canvas').getSourceImage();
            const cw = src.width, ch = src.height;
            const px = src.getContext('2d').getImageData(0, 0, cw, ch).data;
            const g = s.terrainGrid, C = s.terrainCell || 80, RES = 8000 / cw;
            const at = (tx, ty) => { const i = (ty * cw + tx) * 4; return [px[i], px[i + 1], px[i + 2]]; };
            const green = (tx, ty) => { const [r, gg] = at(tx, ty); return gg > r + 20; };
            const sandy = (tx, ty) => { const [r, gg, b] = at(tx, ty); return r > 170 && r > gg && gg > b && b < 150; };
            const cellOf = (tx, ty) => g[Math.floor((ty + 0.5) * RES / C)]?.[Math.floor((tx + 0.5) * RES / C)];
            const block = (tx, ty, f) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!f(tx + dx, ty + dy)) return false; return true; };
            for (let ty = 4; ty < ch - 4; ty += 2) for (let tx = 4; tx < cw - 4; tx += 2) {
                // P: o grid diz areia, a tela mostra grama (bloco 5×5 texels verde)
                if (cellOf(tx, ty) !== 1 || !block(tx, ty, green)) continue;
                // Q: areia desenhada (e no grid) a até ~30 texels de P
                for (let r = 3; r <= 30; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
                    const qx = tx + dx, qy = ty + dy;
                    if (qx < 4 || qy < 4 || qx >= cw - 4 || qy >= ch - 4) continue;
                    if (cellOf(qx, qy) === 1 && block(qx, qy, sandy))
                        return { P: { x: (tx + 0.5) * RES, y: (ty + 0.5) * RES }, Q: { x: (qx + 0.5) * RES, y: (qy + 0.5) * RES } };
                }
            }
            return null;
        });
        expect(spots, 'achou grama desenhada em célula de areia, com areia desenhada perto').not.toBeNull();
        await game.scene((s, p) => { s.ufo.setPosition(p.P.x, p.P.y); s.ufo.setVelocity(0, 0);
            s.cameras.main.centerOn(p.P.x, p.P.y); }, spots);
        await game.hover();
        await page.waitForTimeout(1700);
        const placed = await game.scene((s, p) => {
            const cam = s.cameras.main, wv = cam.worldView, z = cam.zoom;
            const toScreen = (w) => ({ x: (w.x - wv.x) * z, y: (w.y - wv.y) * z });
            const [a, b] = s._snowFlakes;
            s.tweens.killTweensOf(a); s.tweens.killTweensOf(b);
            const pa = toScreen(p.P), pb = toScreen(p.Q);
            a.setPosition(pa.x, pa.y); b.setPosition(pb.x, pb.y);
            window.__flakes = [a, b];
            return { pa, pb, w: s.scale.width, h: s.scale.height };
        }, spots);
        for (const q of [placed.pa, placed.pb]) {
            expect(q.x).toBeGreaterThan(0); expect(q.x).toBeLessThan(placed.w);
            expect(q.y).toBeGreaterThan(0); expect(q.y).toBeLessThan(placed.h);
        }
        await page.waitForTimeout(500);
        const st = await game.scene(() => { const [a, b] = window.__flakes; return { grass: a.alpha, sand: b.alpha }; });
        expect(st.grass, 'grama na tela (mesmo com areia no grid): neva').toBeGreaterThan(0.9);
        expect(st.sand, 'areia na tela: não neva').toBeLessThan(0.1);
        expect(game.realErrors).toEqual([]);
    });
});
