# 🏆 Conquistas — Chapada Escapade

Log de marcos do projeto. **Atualizado a cada sessão** — entrada nova no topo.

---

## 📅 2026-04-28 (sessão maratona 27/04 → 00:00+ 28/04)

> **15+ horas de trabalho, ~30 commits, sessão mais produtiva do projeto até agora.**

### 📊 Snapshot
| Métrica | Valor |
|---|---|
| Commits totais | **41** |
| Linhas JS | **2.913** (17 arquivos modulares) |
| Linhas Python (tools) | **1.672** |
| Assets PNG | **1.672** |
| Idade do projeto | **2 dias úteis** (início 2026-04-26) |

### 🛸 Marcos atingidos
- ✅ **5 personagens animados** PixelLab integrados (vaca chubby 8-dir, boi 8-dir, fazendeiro running, ufo, holstein) — ~620 frames
- ✅ **Mapa 2.5× maior** (8000×6000)
- ✅ **31 assets de cenário** (pedras, vegetação, cercas, placas) scrapeados via Chrome MCP, com per-asset proportional scale e bounds-aware placement
- ✅ **Currais procedural** montados com 10 variantes de cerca PixelLab, gate sempre aberto, só em terra
- ✅ **Debug menu DOM completo** com 30+ controles (toggles + sliders step 0.01) persisted em localStorage
- ✅ **FX stack** completa: chuva, neblina (vinheta radial), sombras blur, escapamento estilo carro com partículas coloridas, beam sparkles, explosão fancy, distorção esférica (barrel post-fx GLSL)
- ✅ **HP system colisional** — vaca/boi 3-5 hits, fazendeiro só morre em pedra, cow-cow elastic decay
- ✅ **Wang tiles cr31** com toggle no debug + paleta terrosa Chapada (areia + grama verde + dry transition)
- ✅ **Splashv3 fullscreen** + game over/vitória com splash desaturado
- ✅ **UFO dome opaca** confirmado (sem alien visível)

### 🐛 Bugs eliminados
- "Boneco deitado" ao colidir (faltava `setFixedRotation`)
- Beam não puxava vacas/bois (re-prendia na grama no frame seguinte)
- Beam com artefatos quadrados (PNG mask trocado por Graphics concêntrico)
- Wang tiles tudo idx=15 (threshold pegava grama+terra; trocado pra só grama)
- Bichos explodiam na primeira colisão (introduzido HP 3-5)
- Balas dos atiradores sumiam em 580px (agora seguem até sair do mapa)
- Fazendeiro grandão full-body aparecendo (rotations antigas substituídas)

---

## 📅 2026-04-27 (manhã/tarde) — fundação PixelLab

- ✅ Loop principal: nave → abdução → curral → burger → score
- ✅ PixelLab MCP integrado (25 tools) + assets hero 200×200 + HUD
- ✅ Vaca animada com personalidade: walk/run/eat/angry × 4 dir (104 frames)
- ✅ Boi 8-dir picker
- ✅ Atiradores fixos + fazendeiros móveis 8-dir
- ✅ Mobile controls (joystick + botão FEIXE)
- ✅ Refactor modular: 14 arquivos JS via `Object.assign(Jogo.prototype, {...})`
- ✅ Cenário procedural via Cellular Automata (4 níveis: água/areia/grama/terra)
- ✅ Deploy GitHub Pages (push → ~30s deploy)

---

## 📅 2026-04-26 — Initial commit

- ✅ Página estática single-file
- ✅ Phaser 3.60 via CDN, sem build step
- ✅ Matter.js para física
- ✅ Conceito: alien UFO + cerrado cattle abduction
