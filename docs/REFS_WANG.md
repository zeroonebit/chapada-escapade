# Wang Tiles — References permanentes

> Bookmark de links que sustentam a tab Tiles do `tools/asset_gallery.html`.
> Mantém aqui pra não perder. Surface também no UI da tab Tiles via `WANG_PRESETS[*].refs`.

## Convention canônica

- **cr31 — Corner Wang Tiles (2-edge)**
  http://www.cr31.co.uk/stagecast/wang/2corn.html
  Charles Rector, ~2009. Origem da convenção corner-based 2-edge usada no Tiled, Godot, etc.
  Bitmask: NW=1, NE=2, SE=4, SW=8 → 16 tiles total.

## Tools

- **Boris the Brave — Tileset Creator**
  https://www.boristhebrave.com/permanent/23/03/tileset-creator/?autotile=Corner&cellType=Square&rotation=None&terrainCount=2&overlay=False&skipCornerTiles=False&drawStyle=Circle
  Visualizador interativo. URL com params travados na config que usamos:
  - `autotile=Corner` (corner-based, não edge)
  - `cellType=Square` (não isometric/hex)
  - `rotation=None` (16 tiles distintos, sem reuso por rotação)
  - `terrainCount=2` (lower + upper)
  - `overlay=False`, `skipCornerTiles=False`, `drawStyle=Circle`

  Help page do tool (cópia integral pra evitar perder):

  > **Tileset Creator** — explora autotiling schemes. Gera set de tiles que conectam naturalmente quando colocados lado a lado. Customizáveis pra video/board games.
  >
  > Variantes do autor: hex grid, rotação de tiles antes de colocar, etc. Tudo gerado sistematicamente segundo a classificação que ele desenhou.
  >
  > **Autotiling**: schemes que trabalham com set fixo pequeno de tiles + regras de seleção. Mais popular: **Marching Squares** (16 tiles). User seta boolean por corner do grid; tiles são pickados auto.
  >
  > **Settings principais**:
  > - `Autotile` — basic scheme
  > - `Cell Type` — shape do tile
  >
  > **Output tabs**:
  > - **Tileset** — imagem com cada tile (ugly, illustrative; abre no Photoshop e desenha por cima)
  > - **Script** — código pra copiar pro game/level editor (mostra como pickar tile dado input)
  > - **Demo** — edita tilemap ao vivo usando o autotiling

- **Boris the Brave — Classification of Tilesets** (2021-11-14)
  https://www.boristhebrave.com/2021/11/14/classification-of-tilesets/
  Theory paper que sustenta o tileset creator. Categoriza autotiling schemes (corner vs edge, square vs hex, com/sem rotação, etc).

## Tilesets PixelLab gerados (orbit deste projeto)

### Ativos (32×32)
| ID | Nome | Tiles | Status |
|---|---|---|---|
| `6068781a-970c-4f9b-99fe-48ee90110038` | ocean ↔ sand (32px) | `assets/terrain/ocean_sand_32/` | ✅ sliced |
| `91c93294-a4fd-425e-8b10-eb1baf32890d` | dirt ↔ grass (32px) | `assets/terrain/dirt_grass_32/` | ✅ sliced |

Base tile IDs (32px):
- `ffb24a7a-cf6f-46bc-93ae-a458d0de07c8` — ocean lower (32px)
- `331870a5-d4ec-462a-b0d8-712dce1a3086` — sand upper (32px)
- `15201074-efb7-48ce-8056-bf9f73120961` — dirt lower (32px)
- `c92163d3-2f05-4ec9-adf7-925d72790530` — grass upper (32px)

### Archived (16×16, superseded)
| ID | Nome | Status |
|---|---|---|
| `2640e1f9-1e20-464d-b4ca-f700357733ee` | ocean ↔ sand (16px) | superseded by 32px |
| `5398c10b-52b2-45b3-b6ab-dac141249b1f` | dirt ↔ grass cerrado v1 (16px) | ❌ image 404 |
| `267836d8-f211-4260-8917-938216d7e0f1` | dirt ↔ grass cerrado v2 (16px) | superseded by 32px |

Legacy base tile IDs (16px):
- `bf4bf323-8369-46fa-9974-1fe68a7edac9` — dirt lower (v2, 16px)
- `e8ede5e5-355c-4cac-9d69-1954567c7bc2` — grass upper (v2, 16px)
- `2a7b28cc-4663-43c2-95dd-0055b2f03c55` — ocean lower (16px)
- `343965f3-fa23-4e42-99ca-edd909e04a07` — sand upper (16px)

## 🔬 Boris Classification Findings (síntese 2026-04-29)

Fetched from https://www.boristhebrave.com/2021/11/14/classification-of-tilesets/

### Taxonomia (4 dimensões)
1. **Cell Type:** S (square), C (cube), H (hexagon), T (triangle)
2. **Tile Identification:** V (vertices/corners), E (edges), F (faces), C (cell center) — "minimal information needed to uniquely identify a tile". Sufixo numérico = qtd de valores possíveis. V2 = bicolor vertices.
3. **Symmetry:** R (rotation) e/ou M (mirror)
4. **Restrictions:** regras pra eliminar combinações inválidas (ex: blob)

### Onde nosso scheme atual cai
- Hoje usamos **S-V2** (square cells, 2-color vertices) = **16 tiles**
- Boris: aplicar simetria de rotação reduz a **S-V2-R = 6 tiles**, mesma cobertura visual
- *"S-V2 compared with S-V2-R, which allows any rotation... there are much fewer tiles in the latter, only 6 vs 16."*

### Orbits de rotação (CW: bit_pos rotaciona NW→NE→SE→SW→NW)

| Orbit | Membros | Descrição |
|---|---|---|
| 0  | {0} | tudo lower |
| 1  | {1, 2, 4, 8} | 1 corner upper |
| 3  | {3, 6, 9, 12} | 2 corners adjacentes upper |
| 5  | {5, 10} | 2 corners diagonais upper |
| 7  | {7, 11, 13, 14} | 3 corners upper |
| 15 | {15} | tudo upper |

**Total: 6 representantes únicos.** Ao gerar PixelLab, só precisamos de 6 tiles (em vez de 16). Os outros 10 são derivados via rotação CW.

### Schemes alternativos com menos tiles ainda
- **T-V2-RM** (triangle cells + R + M) = **4 tiles** — visualmente diferente, abandona quad grid
- **S-V2-RM** = 6 tiles também (mirror não reduz mais nesse caso porque rotação já cobre)
- **Blob (S-V2E2-Blob)** = 47 tiles — *adiciona* edges sobre corners pra mais variedade visual; vale a pena se quiser textura mais rica

### Recomendações pro nosso pipeline
1. **Não regerar PixelLab até usar o set reduzido** — economia de 10/16 = 62.5% no compute/credit
2. Editor precisa de toggle: ver os 16 (full) ou só 6 (reduced via rotação)
3. Test render sempre usa 16 lookups, mas em modo reduced aplica rotação ao desenhar
4. PixelLab generation pipeline futuro: pedir só os 6 reps + rotacionar localmente

### Pitfalls
- *"the tile classification does not fully specify how to autotile them"* — implementation rules importam tanto quanto a estrutura
- Tiles com simetria C2 (5, 10 — diagonal) só dão 2 variantes via rotação, não 4
- Tiles invariantes (0, 15) não rotacionam — são únicos

## Convention check (NW NE SE SW)

| bits | NW | NE | SE | SW | descrição |
|---|---|---|---|---|---|
| 0  | L | L | L | L | tudo lower |
| 1  | U | L | L | L | só NW upper |
| 2  | L | U | L | L | só NE upper |
| 4  | L | L | U | L | só SE upper |
| 8  | L | L | L | U | só SW upper |
| 15 | U | U | U | U | tudo upper |
