# 🏆 Conquistas — Chapada Escapade

Log de marcos do projeto. **Atualizado a cada sessão** — entrada nova no topo.

---

## 📅 2026-04-29 (sessão tripla manhã + noite + madrugada)

> **~26h em 3 sessões. Engineering audit + HUD upgrade + 9 objects v3 + debug overlay + bugs críticos resolvidos.**

### 📊 Snapshot
| Métrica | Valor | vs sessão anterior |
|---|---|---|
| Commits totais | **120+** | +33 |
| Linhas JS | **5.130+** (20 arquivos) | +522 |
| Linhas Python (tools) | **1.890+** | +146 |
| Assets PNG | **595** | +9 (objects v3) |
| Idade do projeto | **3 dias úteis** | igual |

### 🛸 Marcos atingidos
- ✅ **Engineering audit** com 18 issues mapeadas e 15 resolvidas em 3 sprints (Sprint 1 trivials / 2 medios / 3 complexos)
- ✅ **HUD radar com sprite** (refs do user) + decay-based blips estilo radar real
- ✅ **HUD barras** com pintura preta sobre label baked + Phaser text overlay i18n dinâmico
- ✅ **9 objects v3 PixelLab** baixados via batch (Chrome MCP + Backblaze CDN)
- ✅ **Debug overlay F3** com FPS color-coded, heap MB, counts, errors capture, snapshots no console
- ✅ **Splash 3 estágios** state machine (PLAY/TUTORIAL → ENG/PTBR ou MOUSE/WASD)
- ✅ **PREVIEW timeslice** 5s + shuffle aleatório opcional
- ✅ **Snow weather** preset (5º weather: clear/rain/snow/fog/storm)
- ✅ **Sliders editáveis** + sensibilidade discreta + i18n menu (~50 chaves)
- ✅ **`js/00_constants.js`** novo centralizando magic numbers + helpers reutilizáveis

### 🐛 Bugs notáveis corrigidos
- **SLOT_VALOR duplicado** entre `00_constants.js` e `08_curral.js` → SyntaxError quebrava arquivo inteiro → cascata de "X is not a function" → **causa do trava reportado pelo Dom**
- `atmosphere this.scene.scene.isActive()` não existe → crash no `_scheduleStormFlash` → corrigido pra `this.sys.isActive()`
- `c.ready` legacy struct (curral refactor pros slots) ainda em `06_nave.js _atualizarSeta` e `17_tutorial DELIVER`
- Listener leak global `window.addEventListener('keydown')` sem cleanup → acumulava a cada restart
- Tutorial flag pollution → flags vazavam pro modo normal entre restarts
- Fazendeiro `_timer` orphan quando morria por slam (não passava por `_destruirVaca`)
- Hint inicial 'CLICK AND HOLD' poluindo HUD em jogo normal
- Linha verde nos cantos (barrel out-of-bounds + box-shadow CSS)

### 📐 Decisões técnicas
- Reconciler pattern pra contadores de cows in beam (evita filter por frame)
- Debounce 500ms em `_saveDebugCfg` (slider drag = ~10 writes/s antes)
- Debounce 200ms em `_rebuildRain/Snow` (evita churn em slider drag)
- Cap rígido de 100 balas (descarta a mais antiga ao spawnar)
- `_sceneCleanup` central no `events.once('shutdown')` cobrindo H1+H2+M2+M4
- Objects v3: landmarks com 1500px de distância mínima, props industriais em 4 spots de cluster
- Snapshot estruturado no console.log a cada 5s pra debug remoto

---

## 📅 2026-04-29 (sessão dupla manhã + noite)

> **~20h em 2 sessões. Maior salto qualitativo do projeto: tutorial guiado, atmosphere system, mobile responsivo, i18n.**

### 📊 Snapshot
| Métrica | Valor | vs sessão anterior |
|---|---|---|
| Commits totais | **87** | +46 |
| Linhas JS | **4.608** (18 arquivos) | +1.695 |
| Linhas Python (tools) | **1.744** | +72 |
| Assets PNG | **586** | +14 (cercas v2) |
| Idade do projeto | **3 dias úteis** | +1 |
| Skills criadas | **1** (`pixellab-asset-download`) | +1 |
| Memórias salvas | **3** (perguntas explícitas, prompts complexos, heartbeat) | +3 |

### 🛸 Marcos atingidos
- ✅ **Tutorial guiado completo** — splash multi-stage, 9 etapas com glow amarelo, hint box, setas pulsantes, freeze de nave em TAKE_DAMAGE, auto-respawn vacas
- ✅ **Atmosphere system** (`js/18_atmosphere.js`) — 6 TOD presets gradient vertical + auto-cycle 60s/preset
- ✅ **5 weather presets** — clear / rain / snow (NOVO) / fog / storm com flash de raio
- ✅ **Curral redesign completo** — mascote vaca chubby anim eat + hay bale + 3 slots fixos com pontos progressivos + coleta via beam graviton + 4 variants
- ✅ **i18n menu CONFIGS** com toggle ENG/PTBR (~50 strings dict + data-i18n attrs)
- ✅ **Sliders editáveis** com sync bidirecional (digita valor direto)
- ✅ **PREVIEW timeslice** — 5s pra ver mood com shuffle aleatório opcional
- ✅ **Splash multi-stage** com state machine: PLAY → ENG/PTBR → MOUSE/WASD
- ✅ **Mobile responsivo** — `<meta viewport>` + safe-area + media query 100% no celular + fade dos buttons
- ✅ **14 cercas PixelLab v2** integradas (paleta clara consistente)
- ✅ **Skill `pixellab-asset-download`** documentando padrão Backblaze CDN sem API
- ✅ **Beam capacity rework** — cap 5 vacas/bois OU 1 fazendeiro mutex + nave -10% velocidade por animal

### 🐛 Bugs notáveis corrigidos
- Tutorial travava em GRAVITON_BAR (drain/regen bloqueados pelo visualOnly flag)
- BURGER nunca avançava (checava burgerCount que não incrementa via curral)
- Linha verde nos cantos (barrel out-of-bounds vec4 + box-shadow CSS)
- Mobile com tela torta (faltava `<meta viewport>`)
- Hit area dos botões desalinhada com visual (compensação 40×20 pra barrel pós-fx)
- HUD coberto pelo atmosphere overlay (depth 100 → 200)

### 📐 Decisões técnicas
- Atmosphere usa gradient vertical via `Graphics.fillGradientStyle` (4 cores)
- Storm flash com tween branco 200ms + eco curto
- HUD bars controladas por `_setBarrasVisibility` durante tutorial
- Splash state machine com 3 estágios pra evitar overflow visual
- Snow flakes maiores caem mais rápido (sizeFactor inverso ao raio)
- Slot do burger no curral: 0=classic (100pts), 1=cheese (150pts), 2=double (220pts)

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
