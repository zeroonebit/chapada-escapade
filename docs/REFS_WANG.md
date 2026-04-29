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

| ID | Nome | Status |
|---|---|---|
| `2640e1f9-1e20-464d-b4ca-f700357733ee` | ocean ↔ sand | ✅ pronto |
| `5398c10b-52b2-45b3-b6ab-dac141249b1f` | dirt ↔ grass cerrado v1 | ❌ image 404 (falhou) |
| `267836d8-f211-4260-8917-938216d7e0f1` | dirt ↔ grass cerrado v2 | 🟡 em geração (~100s) |

Base tile IDs disponíveis pra chain (handoff `HANDOFF_WANG.md`):
- `bf54c09f-0003-469b-bf40-9317c548a91f` — dirt lower (v1, possivelmente reusável)
- `b18eb30d-e007-4e66-8a31-9d5d9099cd7c` — grass upper (v1)
- `bf4bf323-8369-46fa-9974-1fe68a7edac9` — dirt lower (v2)
- `e8ede5e5-355c-4cac-9d69-1954567c7bc2` — grass upper (v2)
- `2a7b28cc-4663-43c2-95dd-0055b2f03c55` — ocean lower
- `343965f3-fa23-4e42-99ca-edd909e04a07` — sand upper

## Convention check (NW NE SE SW)

| bits | NW | NE | SE | SW | descrição |
|---|---|---|---|---|---|
| 0  | L | L | L | L | tudo lower |
| 1  | U | L | L | L | só NW upper |
| 2  | L | U | L | L | só NE upper |
| 4  | L | L | U | L | só SE upper |
| 8  | L | L | L | U | só SW upper |
| 15 | U | U | U | U | tudo upper |
