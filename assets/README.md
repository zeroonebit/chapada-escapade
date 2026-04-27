# Assets

PNGs gerados pelo Nano Banana, sliceados e salvos com fundo transparente.

## Estrutura planejada

```
assets/
├── characters/
│   ├── nave_idle.png
│   ├── nave_beam.png
│   ├── nave_alerta.png
│   ├── sombra_nave.png
│   ├── vaca_branca.png
│   ├── vaca_brown_white.png
│   ├── boi.png
│   ├── bezerro.png
│   ├── fazendeiro_up.png
│   ├── fazendeiro_down.png
│   ├── fazendeiro_left.png
│   ├── fazendeiro_right.png
│   └── atirador_idle.png / atirador_alert.png
├── effects/
│   ├── beam_halo.png         (gradiente preenchido — principal)
│   ├── beam_halo_pulse_1..4.png  (frames de pulse)
│   ├── beam_core.png         (core glow brilhante)
│   ├── capture_ring_1..4.png (ring impact FX)
│   ├── bala.png
│   └── muzzle_flash_1..4.png
├── items/
│   ├── burger_classic.png
│   ├── burger_cheese.png
│   └── burger_double.png
├── vegetation/
│   ├── arvore_grande.png / media / pequena.png
│   ├── arvore_maca_*.png
│   ├── arbusto_*.png
│   ├── moita_*.png
│   ├── tronco_*.png
│   └── cogumelo_*.png
├── rocks/
│   ├── rocha_pequena_01..03.png
│   ├── rocha_grande_01..02.png
│   ├── arco_pedra.png
│   ├── muro_pedra.png
│   └── coluna_*.png
├── terrain/                  (tilesets do Tiled)
│   ├── grass.png
│   ├── dirt.png
│   ├── water.png
│   └── transitions.png
├── structures/
│   ├── curral.png
│   ├── cerca_*.png
│   └── estrada_madeira.png
└── ui/
    ├── popup_score.png
    └── (HUD futuro)
```

## Convenções

- **Snake_case em PT-BR** seguindo o padrão dos identificadores do código (`vaca`, `nave`, `curral`)
- **Background transparente** (PNG-32)
- **Pixel-perfect** — sem antialiasing nas bordas
- **Pivot:** centro do sprite na maioria dos casos; exceção pra árvores/atiradores (pivot na base)
