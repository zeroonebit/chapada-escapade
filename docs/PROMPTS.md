# Prompts Nano Banana — Biblioteca

Prompts usados pra gerar a arte do jogo. Manter sincronizado com `assets/`.

---

## Estilo base (cole no início de TODA geração)

```
Detailed top-down 3/4 perspective pixel art, 32-64 pixel sprite resolution,
painted pixel-art shading with soft colored outlines (no harsh pure-black
outlines — use a darker shade of each base color), warm naturalistic Brazilian
Cerrado / Chapada palette: lush forest greens, dusty terracotta browns, sandy
ochres, muted sky blues, sage tones. Style reference: Moonlighter, Stardew
Valley, Children of Morta, Sun Haven. Each asset has small lighter grass tufts
at its base to ground it visually. Render as a sprite sheet on a solid sage-gray
background (#a7b3a3) with even spacing between items so they can be sliced
individually. No text, no UI, no labels, no borders around items.
```

---

## SHEET 1 — Player, Beam & Items (revisada)

**Status:** ⚠️ Versão original gerada com rings errados — re-rodar com este prompt

```
[ESTILO BASE]

A pixel art sprite sheet for an alien UFO game, arranged in a clean grid:

1. UFO ship — top-down view, ~80x80 pixels, green-and-silver disc with a
   visible green alien pilot through a transparent glass dome, cyan LED lights
   around the rim, metallic silver hull. Show 3 states side by side:
   - Idle (LEDs glow soft cyan)
   - Beam-ready (LEDs glow bright cyan, faint glow underneath)
   - Red alert (LEDs glow red, alien tinted red, danger state)

2. The same UFO from a 3/4 isometric angle, larger detail piece (~160x140),
   for use as splash/banner art.

3. A circular soft black shadow disc, ~80x80, semi-transparent radial gradient
   from black center to fully transparent edge.

4. *** ABDUCTION BEAM GLOW HALO *** — most important asset.
   A large soft RADIAL GRADIENT DISC seen from directly above, ~256x256 pixels,
   representing a tractor-beam of light projected straight down onto the
   ground. NOT a ring outline — it must be a FILLED soft glow that fades from
   a saturated green-cyan center (#88ffaa) outward through medium green
   (#66ff99) to fully transparent at the edges. Multiple subtle concentric
   intensity bands create a layered "spotlight on ground" effect. Pure
   top-down, no 3D tilt. Generate 4 pulse-frames at 90/100/110/100% scale.

5. A small bright core glow, ~64x64, intense white-cyan radial dot fading
   to transparent.

6. CAPTURE RING IMPACT — 4 frames of a thin glowing cyan circle outline
   expanding outward and fading (one-shot FX when cow is abducted).
   Each ~96x96, ring grows from small/bright to large/faint.

7. Glowing projectile bullet ~24x24, bright orange-yellow core with red-orange
   outer halo (farmer's shotgun pellet).

8. Three top-down hamburgers ~40x40: classic, cheeseburger with melted cheese,
   double-stack.

CRITICAL: Item #4 must be a SOFT FILLED GRADIENT, not hollow rings.
"Spotlight illuminating ground" / "Diablo AoE indicator", NOT "Stargate rings".
```

---

## SHEET 2 — Characters & Enemies

**Status:** 🕒 Pendente. Rodar na MESMA sessão da Sheet 1 com prefixo:
> "Continue using the exact same pixel art style, color palette, lighting, and grass-tuft anchoring as the previous UFO sprite sheet."

```
[ESTILO BASE]

A pixel art sprite sheet of farm characters and enemies, top-down:

1. Four cow variations, each ~32x40 pixels, top-down view:
   - Black-and-white Holstein dairy cow
   - Brown-and-white Brazilian Girolando cow
   - Solid chocolate-brown Nelore-inspired bull (boi), chunky, white chest patch
   - Small light-brown calf with tiny horn nubs

2. "Cangaceiro Farmer" enemy — strict top-down view: wide triangular straw
   cangaceiro hat dominates silhouette, golden-yellow with darker leather band,
   tip points up, small face peeks below brim. 4 angled views (up/down/left/
   right). ~40x40 each.

3. Wooden farm guard tower (sentinel), 3/4 angle, ~48x48: dark red shingled
   roof, rust-orange wood walls, glowing yellow-orange window with shotgun
   barrel poking out. Idle (yellow glow) + alert/firing (red glow + muzzle flash).
```

---

## SHEET 3 — Vegetation

**Status:** 🕒 Pendente

```
[ESTILO BASE + continuity prefix]

Brazilian Cerrado / temperate forest vegetation, top-down 3/4:

- 3 sizes leafy round trees (large 80px, medium 56px, small 40px), brown roots
- 3 sizes apple trees with red fruit
- 3 sizes yellow-flowering bushes
- 3 sizes plain green bushes
- 3 sizes blue-flowered/blueberry bushes
- 3 sizes blue crystal/flower clusters
- 3 sizes red bromeliad spiky plants
- 4 tree-stump variations (tall jagged, short flat, decayed mossy, tiny remnant)
- 3 sizes pink mushroom clusters

All on sage-gray bg, evenly spaced grid.
```

---

## SHEET 4 — Rocks & Ancient Ruins

**Status:** 🕒 Pendente

```
[ESTILO BASE + continuity prefix]

Stones and abandoned ruins, top-down 3/4, weathered with vines:

- 4 sizes single sandstone rocks (pebble cluster → large boulder)
- 3 medium rock cluster groups
- 1 large stone arch ruin (~96x96) with hanging vines
- 1 medium broken wall with stairs and vines
- 3 broken stone column variations (standing, stubby, fallen)

Weathered with cracks, moss, hanging vines — Chapada Diamantina ruins feel.
```

---

## SHEET 5 — Terrain Tileset

**Status:** 🕒 Pendente

```
[ESTILO BASE + continuity prefix]

TERRAIN TILESET, 32x32 or 48x48 tiles, grid-aligned for tile engine:

- Grass terrain tile + 4 variants
- Dry sandy/ochre dirt tile + 4 variants
- Grass↔dirt 3x3 transition set (edges + corners + inner corners)
- Stone-rocky cliff edge with grass on top — 3x3 set
- Hole/pit tiles — 3x3 set
- Water puddle/pond tiles with foam edges — 3x3 + standalone shapes
- Horizontal wooden plank "rural road" strip (3 segments looping seamlessly)
- Ground decorations: grass tufts (3), tiny flowers (red/orange/yellow/white/blue)

Strict top-down, no perspective, ready for Tiled.
```

---

## SHEET 6 — Structures & Props

**Status:** 🕒 Pendente

```
[ESTILO BASE + continuity prefix]

Farm structures & props, top-down 3/4:

1. Complete circular cattle pen / curral, ~120x120: round wooden plank fence,
   14 posts, circular dirt floor (warm brown), one open gap at top as gate.
   Weathered wood with grain.

2. Individual fence pieces: horizontal/vertical sections, corners, single post,
   gate (open + closed).

3. Wooden plank road strip, ~480x32, dark weathered planks tiling seamlessly.

4. "+score" floating popup particle (yellow-gold star burst with sparkles).

5. Muzzle flash particle, 4 frames (small bright → expanded → fading → gone).
```

---

## Notas de pipeline

1. **Background sage gray (#a7b3a3)** facilita chroma key no Photopea
2. **Resolução de saída:** pedir 1024x1024 ou 2048x2048
3. **Mesma sessão** = consistência de estilo entre sheets
4. Após gerar: slicear, salvar como PNG transparente em `assets/<categoria>/`
