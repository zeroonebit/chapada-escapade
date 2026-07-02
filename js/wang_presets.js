// js/wang_presets.js — Catálogo de Wang tilesets (importado do PixaPro)
// 14 presets: 1 ground truth + 2 game-actives 32px + 5 mapa1 verde + 5 mapa2 seco + 1 shared 16px.
// Ground truth pra cr31: docs.cr31.co.uk/stagecast/wang/2corn.html
//
// Carregado via <script src="js/wang_presets.js"> antes de 15_debug_menu.js.
// Top-level const visível como global (escopo script-global, igual aos demais
// módulos do projeto que usam Object.assign(Jogo.prototype, {...}).
//
// Diferenças vs PixaPro:
//   - sliceFn paths: removido prefixo '../' (assets ficam no mesmo host)
//   - image URLs: stream direto do api.pixellab.ai/mcp/tilesets/{id}/image
//     (mesmo CDN, no auth needed)
//   - Não traz manual editor state (per-cell transforms) ainda — fase 2

const WANG_PRESETS = [
    // ════════════════════════════════════════════════════════════
    // GROUND TRUTH (cores sólidas pra debug)
    // ════════════════════════════════════════════════════════════
    {
        id: 'ground-truth',
        biome: 'ref', season: 'ref',
        name: '[REF] Ground Truth (cr31 cores sólidas)',
        meta: 'cr31 corner-2-edge convention · 16 solid blocks · debug palette',
        sliced: true,
        styleKey: 'test',  // mapeia pra wang_NN.png (test palette local)
        sliceFn: (i) => `assets/terrain/test/wang_${String(i).padStart(2,'0')}.png`,
        info: "Canonical reference de Wang tiles 2-edge corner-based. Cada tile = bitmask 4 bits dos 4 cantos (NW=1, NE=2, SE=4, SW=8). 16 tiles total cobrem todas as combinações lower/upper.",
        cr31Native: true,   // não precisa permutation (já em ordem cr31)
    },

    // ════════════════════════════════════════════════════════════
    // GAME ATIVOS (32×32, in-game agora)
    // ════════════════════════════════════════════════════════════
    {
        id: '6068781a-970c-4f9b-99fe-48ee90110038',
        biome: 'costa', season: 'universal',
        name: '[GAME 32px] ocean ↔ sand',
        meta: 'PixelLab · 32×32 · sliced local · ATIVO IN-GAME',
        sliced: true,
        styleKey: 'ocean_sand_32',
        sliceFn: (i) => `assets/terrain/ocean_sand_32/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 32,
        info: 'Base IDs: lower=ffb24a7a (ocean) upper=331870a5 (sand).',
    },
    {
        id: '91c93294-a4fd-425e-8b10-eb1baf32890d',
        biome: 'cerrado-verde', season: 'chuva',
        name: '[GAME 32px] dirt ↔ grass',
        meta: 'PixelLab · 32×32 · sliced local · ATIVO IN-GAME',
        sliced: true,
        styleKey: 'dirt_grass_32',
        sliceFn: (i) => `assets/terrain/dirt_grass_32/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 32,
        info: 'Base IDs: lower=15201074 (dirt) upper=c92163d3 (grass).',
    },

    // ════════════════════════════════════════════════════════════
    // MAPA OPÇÃO 1 — CERRADO VERDE (16×16)
    // ════════════════════════════════════════════════════════════
    {
        id: 'ff745b17-679f-4213-b8e8-ce08bd349e86',
        biome: 'cerrado-verde', season: 'chuva',
        name: '[MAPA 1] ocean ↔ cerrado_dirt',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa1_ocean_dirt',
        sliceFn: (i) => `assets/terrain/mapa1_ocean_dirt/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta ocean (2a7b28cc) ↔ cerrado_dirt_v1 (bf4bf323).',
    },
    {
        id: '70faa0d8-8c99-449c-9699-8d56175824c7',
        biome: 'cerrado-verde', season: 'chuva',
        name: '[MAPA 1] ocean ↔ cerrado_grass',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa1_ocean_grass',
        sliceFn: (i) => `assets/terrain/mapa1_ocean_grass/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta ocean (2a7b28cc) ↔ cerrado_grass_v1 (e8ede5e5).',
    },
    {
        id: '448352c8-0e6e-4515-b860-e15f70e93722',
        biome: 'cerrado-verde', season: 'chuva',
        name: '[MAPA 1] sand ↔ cerrado_dirt',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa1_sand_dirt',
        sliceFn: (i) => `assets/terrain/mapa1_sand_dirt/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta sand (343965f3) ↔ cerrado_dirt_v1 (bf4bf323).',
    },
    {
        id: 'ac546645-a924-465e-b474-0b2ab10ecdd4',
        biome: 'cerrado-verde', season: 'chuva',
        name: '[MAPA 1] sand ↔ cerrado_grass',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa1_sand_grass',
        sliceFn: (i) => `assets/terrain/mapa1_sand_grass/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta sand (343965f3) ↔ cerrado_grass_v1 (e8ede5e5).',
    },

    // ════════════════════════════════════════════════════════════
    // MAPA OPÇÃO 2 — CERRADO SECO (16×16)
    // ════════════════════════════════════════════════════════════
    {
        id: 'd395054a-5e3c-4e28-9b76-3d8ba82baec1',
        biome: 'cerrado-seco', season: 'seca',
        name: '[MAPA 2] ocean ↔ cerrado_dirt v2',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa2_ocean_dirt',
        sliceFn: (i) => `assets/terrain/mapa2_ocean_dirt/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta ocean ↔ cerrado_dirt_v2 (bf54c09f).',
    },
    {
        id: '53598aae-b258-47c4-b3fc-6d8a33befe40',
        biome: 'cerrado-seco', season: 'seca',
        name: '[MAPA 2] ocean ↔ cerrado_grass v2',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa2_ocean_grass',
        sliceFn: (i) => `assets/terrain/mapa2_ocean_grass/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta ocean ↔ cerrado_grass_v2 (b18eb30d).',
    },
    {
        id: 'e8b56eea-c20e-4ab9-9dff-bab3231eb333',
        biome: 'cerrado-seco', season: 'seca',
        name: '[MAPA 2] sand ↔ cerrado_dirt v2',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa2_sand_dirt',
        sliceFn: (i) => `assets/terrain/mapa2_sand_dirt/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta sand ↔ cerrado_dirt_v2.',
    },
    {
        id: '43ac051b-7e0d-4c84-8575-4dbc269db8db',
        biome: 'cerrado-seco', season: 'seca',
        name: '[MAPA 2] sand ↔ cerrado_grass v2',
        meta: 'PixelLab · 16×16 · transition cross-tileset',
        sliced: true,
        styleKey: 'mapa2_sand_grass',
        sliceFn: (i) => `assets/terrain/mapa2_sand_grass/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Conecta sand ↔ cerrado_grass_v2.',
    },

    // ════════════════════════════════════════════════════════════
    // BASE TILESETS (16×16) — dirt↔grass por mapa + ocean↔sand shared
    // ════════════════════════════════════════════════════════════
    {
        id: '267836d8-f211-4260-8917-938216d7e0f1',
        biome: 'cerrado-verde', season: 'chuva',
        name: '[MAPA 1] dirt ↔ grass cerrado',
        meta: 'PixelLab · 16×16 · BASE tileset',
        sliced: true,
        styleKey: 'mapa1_dirt_grass',
        sliceFn: (i) => `assets/terrain/mapa1_dirt_grass/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'BASE dirt↔grass pra mapa1 (cerrado verde).',
    },
    {
        id: '5398c10b-52b2-45b3-b6ab-dac141249b1f',
        biome: 'cerrado-seco', season: 'seca',
        name: '[MAPA 2] dirt ↔ grass cerrado v2',
        meta: 'PixelLab · 16×16 · BASE tileset',
        sliced: true,
        styleKey: 'mapa2_dirt_grass',
        sliceFn: (i) => `assets/terrain/mapa2_dirt_grass/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'BASE dirt↔grass pra mapa2 (cerrado seco).',
    },
    {
        id: '2640e1f9-1e20-464d-b4ca-f700357733ee',
        biome: 'costa', season: 'universal',
        name: '[SHARED 16px] ocean ↔ sand',
        meta: 'PixelLab · 16×16 · shared cross-mapas',
        sliced: true,
        styleKey: 'shared_ocean_sand_16',
        sliceFn: (i) => `assets/terrain/shared_ocean_sand_16/wang_${String(i).padStart(2,'0')}.png`,
        tileSize: 16,
        info: 'Versão 16px do ocean↔sand (shared entre mapa1 e mapa2).',
    },

];

// Cores por bioma pra UI cards (matches PixaPro)
const WANG_BIOME_COLORS = {
    'cerrado-verde': '#9fe89f',
    'cerrado-seco':  '#dfa6df',
    'costa':         '#9fcfe8',
    'ref':           '#a89368',
};

// Helper: encontra preset por styleKey (usado pelo runtime)
function getWangPresetByStyleKey(key) {
    return WANG_PRESETS.find(p => p.styleKey === key) || null;
}

// CR31 ↔ PixelLab permutation (PixaPro Ground Truth).
// PixelLab tiles vêm em convenção CCW-shifted vs cr31 (NW=1 NE=2 SE=4 SW=8).
// Aplicar a presets sem cr31Native: srcIdx = CR31_TO_PIXELLAB[cr31Bits].
const CR31_TO_PIXELLAB = [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];

// ════════════════════════════════════════════════════════════
// TILE TRANSFORMS — per-cell (cr31Idx 0..15) por preset
// ════════════════════════════════════════════════════════════
// Cada cr31 cell pode ter:
//   - srcIdx: 0..15 (qual tile da fonte usar; default = cr31Idx OR CR31_TO_PIXELLAB[cr31Idx])
//   - rot: 0|90|180|270 (rotação clockwise em graus)
//   - flipH: bool (espelha horizontal)
//   - flipV: bool (espelha vertical)
// Ausência de override = transform default (resolvido em render).
// Persistido em localStorage[WANG_TRANSFORMS_KEY] como JSON.

const WANG_TRANSFORMS_KEY = 'chapEscapadeWangTransforms';

// Lê todos os overrides do localStorage. Forma:
//   { [styleKey]: { [cr31Idx]: {srcIdx,rot,flipH,flipV} } }
function loadAllTileTransforms() {
    try {
        const raw = localStorage.getItem(WANG_TRANSFORMS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
}

function saveAllTileTransforms(all) {
    try { localStorage.setItem(WANG_TRANSFORMS_KEY, JSON.stringify(all)); }
    catch(e) { console.warn('[WANG] save transforms fail:', e); }
}

// Resolve o transform efetivo de um cr31Idx num style.
// Prioridade: override → CR31_TO_PIXELLAB (PixelLab styles) → identidade.
function resolveTileTransform(styleKey, cr31Idx) {
    const all = loadAllTileTransforms();
    const userT = all?.[styleKey]?.[cr31Idx];
    if (userT) {
        // Sanitiza valores (defensive)
        return {
            srcIdx: typeof userT.srcIdx === 'number' ? userT.srcIdx : cr31Idx,
            rot:    [0,90,180,270].includes(userT.rot) ? userT.rot : 0,
            flipH:  !!userT.flipH,
            flipV:  !!userT.flipV,
        };
    }
    // Sem override: usa permutation default
    const preset = getWangPresetByStyleKey(styleKey);
    const isCr31Native = (preset && preset.cr31Native) || styleKey === 'test';
    const srcIdx = isCr31Native ? cr31Idx : CR31_TO_PIXELLAB[cr31Idx];
    return { srcIdx, rot: 0, flipH: false, flipV: false };
}

// Set/clear override de uma cell. Passa null pra clear.
function setTileTransform(styleKey, cr31Idx, transform) {
    const all = loadAllTileTransforms();
    if (!all[styleKey]) all[styleKey] = {};
    if (transform === null || transform === undefined) {
        delete all[styleKey][cr31Idx];
        if (Object.keys(all[styleKey]).length === 0) delete all[styleKey];
    } else {
        all[styleKey][cr31Idx] = transform;
    }
    saveAllTileTransforms(all);
}

// Reset todos os overrides de um style (volta pra default permutation).
function resetTileTransforms(styleKey) {
    const all = loadAllTileTransforms();
    if (all[styleKey]) {
        delete all[styleKey];
        saveAllTileTransforms(all);
    }
}
