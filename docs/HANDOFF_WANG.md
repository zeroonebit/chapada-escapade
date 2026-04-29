# Handoff Wang Tiles → sessão `claude/nostalgic-mclaren-1f61ba`

> Transferido em 2026-04-29 da sessão `claude/intelligent-euler-7a236d` por pedido do usuário.

## Estado atual

### Generation em andamento (PixelLab)
- **Tileset 1: dirt↔grass cerrado**
  - ID: `5398c10b-52b2-45b3-b6ab-dac141249b1f`
  - Lower: `dry brown dirt with cracks, cerrado earth tones, slightly reddish`
  - Upper: `dry yellow-green grass tufts, sparse cerrado vegetation, sun-bleached`
  - Transition: `0.5` — `grass roots emerging from dirt, scattered dry leaves at edge`
  - View `high top-down`, outline `selective`, detail `medium`, shading `basic`
  - Tile size 16×16
  - Disparado às ~09:48 BRT — ~100s pra completar
  - **Base tile IDs** (pra chain):
    - dirt lower: `bf54c09f-0003-469b-bf40-9317c548a91f`
    - grass upper: `b18eb30d-e007-4e66-8a31-9d5d9099cd7c`

### Standby pré-existente
- **Tileset 0: ocean↔sand** (já completo)
  - ID: `2640e1f9-1e20-464d-b4ca-f700357733ee`
  - 16 tiles 16×16, PNG 64×64
  - Lower base: `2a7b28cc-4663-43c2-95dd-0055b2f03c55`
  - Upper sand base: `343965f3-fa23-4e42-99ca-edd909e04a07`

## Próximos passos sugeridos

1. **Verificar tileset 1**:
   ```
   mcp__pixellab__get_topdown_tileset({tileset_id: "5398c10b-52b2-45b3-b6ab-dac141249b1f"})
   ```
   Se `Status: Processing`, aguardar mais.

2. **Baixar PNG + metadata** quando pronto:
   ```
   curl --fail -o assets/terrain/cerrado_dirt_grass.png \
     https://api.pixellab.ai/mcp/tilesets/5398c10b-52b2-45b3-b6ab-dac141249b1f/image
   curl --fail -o assets/terrain/cerrado_dirt_grass.json \
     https://api.pixellab.ai/mcp/tilesets/5398c10b-52b2-45b3-b6ab-dac141249b1f/metadata
   ```

3. **Chain grass↔sand**:
   ```
   mcp__pixellab__create_topdown_tileset({
     lower_description: "dry yellow-green grass tufts, sparse cerrado vegetation, sun-bleached",
     upper_description: "light tan sand patches, dry cerrado soil",
     transition_description: "grass thinning into sandy patches",
     transition_size: 0.5,
     lower_base_tile_id: "b18eb30d-e007-4e66-8a31-9d5d9099cd7c",  // grass do tileset 1
     view: "high top-down", outline: "selective outline",
     detail: "medium detail", shading: "basic shading",
     tile_size: {width: 16, height: 16}
   })
   ```

4. **Slice + integração**:
   - Existe `tools/wang_playground/index.html` (cr31 convention) como referência
   - Atualmente `assets/terrain/test/wang_00..15.png` são placeholder solid colors carregados em `02_preload.js:142-145`
   - Substituir por tiles reais sliced do PNG do PixelLab
   - Mapear corners metadata (NW/NE/SW/SE = lower/upper) → ordem cr31 que o playground espera
   - Wire no jogo: hoje terreno é shader-based em `13_terrain_shader.js`. Wang é caminho alternativo — toggle existe em `dbg.fx.wangtiles` mas precisa wire-up de renderer

## Arquivos relevantes
- `tools/wang_playground/index.html` — playground cr31 standalone
- `tools/slice_tilesets.py` — slicer existente (naming TLTRBLBR antigo, refatorar pra cr31)
- `js/02_preload.js` — load loop linhas 142-145
- `js/13_terrain_shader.js` — terreno shader atual
- `js/15_debug_menu.js` — `fx.wangtiles` toggle no menu CONFIGS

## Convenção cr31 (corner)
Tile ID = bitmask 4 bits dos cantos (NW=1, NE=2, SE=4, SW=8). 16 tiles total.
- 0 = todos lower (terreno A)
- 15 = todos upper (terreno B)
- 1..14 = transições

PixelLab metadata tem `corners.{NW,NE,SE,SW}: "upper" | "lower"`. Converter:
```js
const bit = (c) => c === 'upper' ? 1 : 0;
const id = bit(NW)*1 + bit(NE)*2 + bit(SE)*4 + bit(SW)*8;
```

## Não tocar
- A sessão `claude/intelligent-euler-7a236d` está dormindo este item
- Se abrir esse arquivo de volta nessa sessão, esperar instrução explícita
