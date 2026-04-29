# TODO HUD — pendente desde sessão 2026-04-30

## Bugs visíveis no jogo (ver print do user)

### 1. Labels duplicados nas barras
Os PNGs `combustivel_full_v2.png` e `graviton_full_v2.png` ainda têm "COMBUSTÍVEL" e "GRAVITON" **baked** no topo da barra. O overlay Phaser também escreve por cima → texto duplicado/sobreposto ("GRAVITON ON", "FUEL").

**Fix opção A:** Re-slicar com `tools/slice_huds_v2.py`, detectar área do label baked e tornar alpha 0 (transparent).
**Fix opção B:** Aumentar `combLabelBg`/`eneLabelBg` (atual 90×18) pra cobrir totalmente o label baked. Talvez 130×26.
**Fix opção C:** Remover o overlay Phaser, aceitar label baked PT-BR fixo (perde i18n).

### 2. Barras posicionadas erradas
No print: GRAVITON e FUEL aparecem desalinhadas, combFillImg parece estar offset em relação ao combImg base.

**Investigar:** verificar se `setOrigin(0.5)` está consistente entre empty/full e se `setDisplaySize` bate.

### 3. Implementar HUD do radar com sprite
`assets/pixel_labs/hud/radar_frame.png` já está na pasta. Atualmente o radar usa Graphics-based (círculos). Pendente:
- Carregar sprite como image e posicionar
- Manter decay-based blips dentro do interior do sprite
- Desabilitar/esconder os círculos Graphics quando sprite estiver carregado

## Arquivos relevantes
- `js/05_hud.js`: criação e posicionamento das barras + radar
- `js/02_preload.js`: carga dos sprites
- `tools/slice_huds_v2.py`: slicer (re-rodar se for opção A)
- `assets/pixel_labs/hud/`: sprites prontos
