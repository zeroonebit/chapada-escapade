# TODO HUD — pendente desde sessão 2026-04-30

## ✅ Resolvido em 2026-04-29 (sessão D+R2)

### 1. Labels duplicados nas barras → opção C aplicada
PNGs `combustivel_full_v2.png` e `graviton_full_v2.png` têm "COMBUSTÍVEL" e "GRAVITON" baked no topo. Optei por **esconder o overlay Phaser** (`combLabelBg`/`combLabel`/`eneLabelBg`/`eneLabel` agora `setVisible(false)`). Labels baked são únicos visíveis. Trade-off: i18n FUEL/EN só funciona depois de re-slice das PNGs.

## 🚧 Pendente

### 2. Barras posicionadas (alinhamento fino)
Se ainda houver offset visual entre `combImg` (empty) e `combFillImg` (full v2 com setCrop), revisar — pode ser que o source PNG tenha padding interno diferente entre as 2 versões. Não testado nesta sessão.

### 3. Re-slice dos PNGs v2 pra restaurar i18n
Caminho definitivo pra ter FUEL/COMBUSTÍVEL dinâmico:
1. Editar `combustivel_full_v2.png` e `graviton_full_v2.png` no GIMP/PS
2. Apagar o label baked (deixar transparente naquela área)
3. Re-mostrar `combLabel`/`eneLabel` em 05_hud.js (`setVisible(true)`) — i18n já funciona

### 4. Implementar HUD do radar com sprite
`assets/pixel_labs/hud/radar_frame.png` já carregado. Hoje usa Graphics-based (círculos). Pendente:
- Carregar sprite como image e posicionar
- Manter decay-based blips dentro do interior do sprite
- Desabilitar os círculos Graphics quando sprite estiver visível

## Arquivos relevantes
- `js/05_hud.js`: criação e posicionamento das barras + radar
- `js/02_preload.js`: carga dos sprites
- `assets/pixel_labs/hud/`: sprites prontos
