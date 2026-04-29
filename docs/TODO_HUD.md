# TODO HUD — pendente desde sessão 2026-04-30

## ✅ Resolvido em 2026-04-29

### 1. Labels duplicados → re-slice automático (v3)
Script Python+PIL detectou bbox da badge baked nos PNGs v2 e pintou solid black:
- `combustivel_*_v3.png` (label cleared 155×16 @ y=3-19)
- `graviton_*_v3.png` (label cleared 141×14 @ y=5-19)

`02_preload.js` agora carrega `_v3.png` no lugar de `_v2.png`. Phaser overlay re-mostrado em `05_hud.js` — i18n FUEL/COMBUSTÍVEL volta a funcionar via `_applyHudI18n`.

### 2. Radar com sprite (steampunk)
`refs/hudradar.png` (254×254) copiado pra `assets/pixel_labs/hud/radar_frame_v2.png`. Em `05_hud.js`/`_positionHUD`:
- Sprite displayed em 240×240, inner dial ~69px
- Graphics concentric circles + cross só ficam como **fallback** se sprite não carregar
- Sweep + blips desenhados em depth 200 (acima do sprite frame)

## ✅ Resolvido em 2026-04-29 (cont.)

### 3. Alinhamento fino das barras + radar
Bug real achado: ENE_Y=h-60, PAC_Y=h-18 com bar height 68 → diff 42 (precisa ≥68) → PAC label cobria ENE bar fill em 13px. Corrigido pra ENE_Y=h-104, PAC_Y=h-36 (diff 68, gap 0). Bar bottoms agora em h-70 e h-2 (sem clipping).

Radar v2 também conflitava: 240×240 invadia área das barras horizontal e verticalmente. Reduzido pra 160×160 (R=46 inner), PAD_BOTTOM=142 → gap de 4px com ENE bar top em h-138.

## 🚧 Pendente
Nada — todos itens deste TODO resolvidos.

## Arquivos relevantes
- `js/05_hud.js`: criação e posicionamento das barras + radar
- `js/02_preload.js`: carga dos sprites
- `assets/pixel_labs/hud/`: sprites prontos
