# Chapada Escapade — Project Context

> Este arquivo é carregado automaticamente pelo Claude Code no início de cada sessão. Mantenha enxuto e atualizado.

## Sobre o usuário

- **Nome:** Thiago
- **Idioma:** Português (Brasil) — responder sempre em PT-BR, tom direto e descontraído
- **Estilo de trabalho:** iterativo, gosta de validar visualmente cada mudança no preview, prefere mudanças pequenas e confirmadas antes de prosseguir
- **Nunca mencionar lembretes do sistema** (TodoWrite reminders, etc.)

## Sobre o projeto

**Chapada Escapade** (working title) — jogo arcade web 2D top-down onde o jogador controla uma nave alienígena que sequestra vacas no Cerrado brasileiro, leva pra currais e elas viram hambúrgueres. Estética inspirada em Chapada Diamantina + sci-fi retrô.

### Stack
- **Phaser 3.60** (CDN) — engine
- **Matter.js** (built-in do Phaser) — física
- **HTML único** — sem build, sem npm, abre direto no navegador
- **Hospedagem local:** `H:\Projects\ChapadaEscapade` (Python HTTP server porta 8080)
- **Hospedagem online:** GitHub Pages — https://zeroonebit.github.io/chapada-escapade/

### Arquivos principais
- `index.html` — só CSS + carregamento dos módulos `js/*.js` (renomeado de `ChapadaEscapade.html`)
- `js/01_scene.js` … `12_mobile.js` … `99_main.js` — código modular (classe + `Object.assign(Jogo.prototype, {...})`)
- `ChapadaEscapade_v1.html` — backup pré-fazendeiros/atiradores
- `assets/` — PNGs do Nano Banana (em construção)
- `docs/PROGRESS.md` — log cronológico de mudanças
- `docs/PROMPTS.md` — biblioteca dos prompts Nano Banana

### Localização
- **Projeto:** `H:\Projects\ChapadaEscapade`
- **Preview local:** `http://localhost:8080` (launch config em `.claude/launch.json`)
- **Repo:** https://github.com/zeroonebit/chapada-escapade (push → ~30s deploy no Pages)

### 💾 Servidor de tools (`tools/gallery_server.py`) — porta 8090
**8080 é reservada pro game.** Tools (gallery, persistência) rodam em **8090** por default. O server bloqueia se tentar 8080.

Endpoints POST que gravam JSON em disco:
- `POST /save_decisions` → `tools/saves/decisions.json` (+ history). Botão **Export** do `tools/asset_gallery.html` posta same-origin (gallery aberto em 8090).
- `POST /save_configs` → `tools/saves/configs.json` (+ history). Auto-salvo pelo `_saveDebugCfg()` no `js/15_debug_menu.js` via cross-origin fetch pra `http://localhost:8090` (CORS habilitado, fire-and-forget, debounce 500ms — silencioso se 8090 não estiver rodando).
- Histórico timestamped em `tools/saves/history/`.

**Rodar 2 servers em paralelo:**
- `python -m http.server 8080` (raiz) → game em http://localhost:8080
- `python tools/gallery_server.py` (raiz, default 8090) → gallery em http://localhost:8090/tools/asset_gallery.html + endpoints

### ⚡ No INÍCIO de toda sessão, rodar:
1. `mcp__Claude_Preview__preview_start({ name: "Chapada Escapade (static)" })` — inicializa o preview panel pra abrir pasta/arquivos do jogo
2. Não esperar o usuário pedir — fazer automático na primeira mensagem

### 🚦 Workflow de trabalho (padrão fixo)
- **Sempre trabalhar na worktree** (`H:\Projects\ChapadaEscapade\.claude\worktrees\intelligent-euler-7a236d`)
- **Ao final de cada request com mudança de código:** commit na worktree + sync completo (merge main + push)
- Preview local da sessão atual quebrou (canvas vazio, scripts não rodam) — não usar
- **Testar via GitHub Pages** — após push, ~30s o Pages atualiza em https://zeroonebit.github.io/chapada-escapade/

### 📤 Sync ao final de cada request (AUTOMÁTICO após qualquer mudança)
Executar **todos** os passos abaixo, sem pular nenhum:
1. `git add` + `git commit` na worktree (branch `claude/intelligent-euler-7a236d`)
2. `git push origin claude/intelligent-euler-7a236d`
3. Mudar pro branch `main` dentro do projeto principal (`H:\Projects\ChapadaEscapade`) e fazer merge:
   ```
   cd H:/Projects/ChapadaEscapade
   git merge claude/intelligent-euler-7a236d
   git push origin main
   ```
4. Resultado: worktree ✅ + projeto local ✅ + GitHub Pages ✅ — todos sincronizados

## Estado atual (atualizar a cada sessão)

### ✅ Pronto
- Loop principal: nave → abdução → curral → burger → score
- Feixe graviton com barra de energia (drain/regen) + **PNG halo do PixelLab com BlendMode.ADD** pra glow real
- **Sprites do jogo todos via PixelLab MCP** em `assets/pixel_labs/`:
  - Hero 200×200: vaca, boi, nave, beam
  - Directional 128px: UFO 8d, Fazendeiro 8d, Boi 8d (chubby), Vaca 4d
  - HUDs 400×200/400×120: SCORE, COWS, BURGERS, COMBUSTÍVEL, GRAVITON
  - Items 120×120: burger_classic, burger_cheese, burger_double
- **Vaca animada com personalidade** — 4 estados × 4 direções (104 frames):
  - `eat` (60% prob, 2.5-5s) e `walk` (40% prob, 1.5-3.5s) quando longe (>240px)
  - `run` quando player a < 240px
  - `angry` quando capturada pelo beam
  - State machine em `_atualizarIAVacas` + `_texturaDirecional` chama `v.play(animKey)`
- **`matter.add.sprite()`** (não `image`) em `_criarVaca` — Sprite suporta `.anims`, Image não
- Atiradores fixos (6 torres) com dano à barra COMBUSTÍVEL
- Fazendeiros móveis 8-dir (chapéu cangaceiro) — sprite muda baseado em velocidade
- Boi 8-dir picker (mesma lógica do fazendeiro)
- **Mobile controls** — `js/12_mobile.js`: joystick + botão FEIXE
- **HUD PixelLab** integrado: SCORE topo-centro, COWS+BURGERS boxes top-left, COMBUSTÍVEL+GRAVITON barras no rodapé com gradiente fill via `Graphics.fillGradientStyle`
- **Pausa no ESC** com símbolo ⏸
- **Splash screen** com `splash.png`, dismiss no primeiro clique
- **Game over / vitória** com layout limpo
- **Refactor modular** — 14 arquivos `js/*.js` via `Object.assign(Jogo.prototype, {...})`
- **Cenário procedural via Cellular Automata** — grid 40×30, 4 níveis altitude. Render simplificado pra `add.rectangle` + manchas de terra (shader desligado nesta sessão).
- **Deploy GitHub Pages** — push → ~30s deploy
- **PixelLab MCP** — 25 tools, fórmula `Material/Type + Feature + Mood`, bug conhecido: 8d quadruped
- **Wang playground standalone** em `tools/wang_playground/` (cr31 convention) — pronto pra portar quando reativar terrain shader
- **Cleanup deprecated** — `assets/characters/`, `assets/ui/`, `assets/terrain/`, `refs/preview*` removidos via `git rm`. Só `assets/pixel_labs/`, `splash.png`, `favicon.svg` sobreviveram.
- **Diagnostic try/catch** em `create()` e `update()` — erro vira box vermelho na tela
- **`window.game` exposto** pra debug via `99_main.js`

### ✅ Pronto (cont. — sessão 2026-04-27/28)
- **Vaca chubby 8-dir** substitui skinny 4-dir (anims walk + idle_head_shake→eat + lie_down→angry; vaca_run = walk @ fps×2)
- **Boi walk** anim 8-dir wired (state machine: walking quando movendo, estático parado)
- **Fazendeiro running** anim 8-dir wired (matter.add.sprite + setBody radius 16; rotations top-down corrigidas)
- **Fix do norte do fazendeiro** (rerota N → NE/NW)
- **UFO `b7bc12d9` re-baixado** (dome opaca, sem alien) — nave aponta pra `chars/ufo/south.png`
- **4 chars completos integrados** (~620 frames): vaca chubby, boi, fazendeiro, ufo (holstein removida)
- **Mapa 2.5×** (3200×2400 → 8000×6000) + spawn defaults boost (vacas 100, fazendeiros 20)
- **31 nature assets** scrapeados via Chrome MCP (pedras/vegetação/cercas/placas/outros) com per-asset SCALE_MAP + bounds-aware placement
- **Currais procedural** com cercas decorativas (sem colisão, gate aberto, chão de terra visível; spawn em qualquer terrain)
- **Wang tiles cr31** toggle no debug — corner grid próprio + threshold só grama + paleta terrosa Chapada
- **Debug menu DOM completo** na pausa (ESC) — 30+ controles persisted em localStorage, sliders step 0.05; intensidade chuva/neblina separados
- **FX stack** (`16_fx.js`): chuva, neblina vinheta radial, beam sparkles + shake/flash, explosão fancy, sombras blur, escapamento estilo carro + partículas coloridas (substituiu LEDs giroflex), distorção esférica (barrel post-fx GLSL), smoke puff no muzzle do farmer
- **HP system colisional:** vaca/boi 3-5 hits + setBounce(0.5); farmer só morre em pedra (HP 1, setBounce 0.2); debounce 120ms; cow-cow elastic decay
- **Beam revertido pra Graphics concêntrico** (5 círculos, sem artefatos PNG) + pull default 0.5
- **Balas atiradores persistem** até sair do mundo
- **setFixedRotation** em fazendeiro/vaca/boi (fim do "boneco deitado")
- **Soltar do beam:** force south orientation 3s
- **Burger variants** random (classic/cheese/double)
- **Splash v3 fullscreen** + game over/vitória com splash desaturado + favicon icon.png
- **Tilt suave da nave** baseado em vel lateral; LED ring proporcional ao displayWidth
- **`docs/CONQUISTAS.md`** — log de achievements/estatísticas atualizado por sessão

### ✅ Pronto (cont. — sessão 2026-04-28 tarde)
- **UFO hovering_idle** 8-dir (MatterSprite + picker de velocidade, 4 fps)
- **Anéis de captura** — 3 anéis verdes saem do alvo e sobem até a nave ao abduzir
- **Radar** no canto inferior esq. — disco estilo sonar com scan line girando; branco=vacas, marrom=bois, amarelo=fazendeiros, azul=currais, verde=nave
- **Boi idle_head_shake** 7-dir wired (fallback static em N)
- **Sliders step 0.05** + sliders de intensidade chuva/neblina separados (live)
- **Vaca holstein removida** (sprite slim não combina com estética chubby)
- **Currais visíveis** — chão de terra preenchido (alpha 0.38) + cercas decorativas sem colisão + distância mínima 800px entre currais

### ✅ Pronto (cont. — sessão 2026-04-29)
- **Tutorial guiado completo** (`js/17_tutorial.js`) — 8 etapas, glow amarelo por elemento, setas pulsantes, freeze de nave em TAKE_DAMAGE, auto-respawn de vacas, conclusão com botão JOGAR AGORA
- **Splash JOGAR/TUTORIAL** com 2 botões (sem dismiss cego)
- **Tutorial min-read 5s** por etapa antes de avançar
- **Curral redesign**: 1 vaca representativa "eat bob" + counter ×N; burgers em fila externa (sul) com loading piscando + ready fixo; tempo 5s→3s
- **14 cercas v2 PixelLab** integradas em `chars/nature/cercas_v2/` — currais agora usam `fence_curved_long` + `tower_ornamental_thin` + `gate_open_double` + lanternas decorativas
- **Chuva controlável** 4 sliders live: ângulo, velocidade, comprimento, frequência (0-400 gotas)
- **Debug menu refatorado** em 4 abas (CONTROLES / LOOKS / VFX / DEBUG); slider sensibilidade da nave; step 0.01; toFixed(2)
- **Barrel distortion funcionando** (faltava `addPostPipeline` antes do `setPostPipeline`)
- **Linha verde nos cantos eliminada** (barrel out-of-bounds + box-shadow verde removido)
- **Rename `paciencia` → `combustivel`** em todo o codebase
- **Cleanup**: vaca_chubby/holstein/skinny removidas (457 arquivos duplicados)
- **Workflow git automático** — sync worktree → main → push ao final de cada request

### 🛠 Pipeline PixelLab (novo)
- `tools/pixellab_fetch_new.py` — baixa por ID via Backblaze CDN (sem API key)
- `tools/pixellab_montage_new.py` — contact sheet pra ID visual
- `tools/organize_cercas_v2.py` — copia inbox → chars/nature/cercas_v2 com nomes legíveis
- Skill `~/.claude/skills/pixellab-asset-download/SKILL.md` documenta o padrão completo

### ✅ Pronto (cont. — sessão 2026-04-29 madrugada / post-audit)
- **Engineering audit 15/18 fixes** (Sprint 1+2+3) — `js/00_constants.js` novo, helpers `isAbducibleCow`/`distSq`, listener leak fix, scene shutdown handler, debounces, cap 100 balas, counter cows beam, etc
- **HUD radar com sprite** + decay-based blips (cada blip acende quando sweep passa, fade 2.5s)
- **HUD barras**: pintura preta sobre label baked + Phaser text overlay com i18n (FUEL/GRAVITON em EN, COMBUSTÍVEL/GRAVITON em PT)
- **9 objects v3 PixelLab** (`chars/nature/objects/`): church, windmill, old_truck, satellite_dish_rusty (landmarks), gas_can, barrel_rusty (props industriais), bucket_milk, bucket_empty (curral random 50/50), dry_turf (8 patches)
- **Debug overlay F3** (`js/19_debug_overlay.js`): FPS, heap MB, counts, errors, snapshots no console a cada 5s
- **Splash multi-stage**: PLAY → ENG/PTBR → MOUSE/WASD; TUTORIAL → MOUSE/WASD; ESC abre CONFIGS desde splash
- **Botão PREVIEW** (👁): 5s timeslice + esconde inimigos + checkbox shuffle weather/TOD
- **Snow weather preset** (flocos brancos r=1-3.5px com drift sinuoso)
- **Sliders editáveis** (digita valor direto, sync bidirecional)
- **Sensibilidade discreto** 1/1.25/1.5
- **Toggle Input WASD/Mouse + Language ENG/PTBR** no menu CONFIGS
- **i18n menu CONFIGS** (~50 strings dict + data-i18n attrs + `_applyMenuI18n`)
- **CONFIGS menu** (renomeado DEBUG MENU), aba VISUALS (renomeada LOOKS)
- **Bugs críticos corrigidos**: SLOT_VALOR duplicado quebrava 08_curral inteiro (causa do trava reportado), atmosphere `isActive` crash, c.ready legacy struct em 2 arquivos, linha verde nos cantos
- **`docs/AUDIT_2026-04-29.md`** documenta 18 issues + status (15 resolvidas, 3 pendentes)

### ✅ Pronto (cont. — sessão 2026-04-29 noite)
- **Atmosphere system** (`js/18_atmosphere.js`) — 6 TOD presets + auto-cycle + 5 weather (clear/rain/snow/fog/storm) + storm flash
- **Snow weather** com flocos brancos r=1-3.5px com drift sinuoso
- **Tutorial reorganização** completa: BEAM_VISUAL/GRAVITON_BAR/ABDUCT/DELIVER/BURGER/COMBUSTIVEL com flags separadas (`_tutBeamNoDrain` vs `_tutBeamNoPull`)
- **Tutorial bug GRAVITON_BAR travado** corrigido (drain/regen estavam bloqueados)
- **Vaca chubby sprite no curral** (mascote 68px com anim `vaca_eat_S` fixa + hay bale 84×76)
- **3 slots fixos por curral** (classic/cheese/double, pontos progressivos 100/150/220)
- **Coleta de hamburger via beam graviton** (atrai burgers ready dentro do raioCone)
- **Curral variants** random (4 tipos: padrão / rústico fechado / grande aberto duplo / pequeno reto)
- **Sliders editáveis** (digita valor direto no number input ao lado)
- **Sensibilidade discreto** 1/1.25/1.5
- **Toggle Input WASD/Mouse** no menu CONFIGS
- **Toggle Language ENG/PTBR** no menu CONFIGS + sistema i18n
- **CONFIGS menu acessível desde splash** (ESC funciona antes do jogo)
- **Botão PREVIEW** (5s timeslice + esconde inimigos + checkbox shuffle)
- **Splash multi-stage** (PLAY → ENG/PTBR → MOUSE/WASD; TUTORIAL → MOUSE/WASD)
- **Splash fit-to-screen** + barrel ativo desde o loading
- **Hit area expandida** dos botões (compensa barrel post-fx)
- **Responsividade mobile** (`<meta viewport>` faltando + safe-area + media query 100% no celular)
- **Mobile controls fade** (silhueta 0.25 → invisível 0.0 ao tocar)
- **Beam capacity rework** (cap 5 vacas/bois OU 1 fazendeiro mutex; nave -10% velocidade por animal)
- **Fazendeiro bounce 0.45** em vaca/boi/cacto (sem dano)
- **HUD acima do atmosphere** (depth 100 → 200) + radar desce R/2
- **Linha verde dos cantos** eliminada
- **Skill `pixellab-asset-download`** + 3 memórias (perguntas explícitas, prompts complexos, heartbeat)

### ✅ Pronto (cont. — sessão 2026-04-30)
- **Wang tilesets 32×32 via PixelLab** — ocean↔sand e dirt↔grass regenerados a 32px, sliced em `assets/terrain/ocean_sand_32/` e `assets/terrain/dirt_grass_32/` (16 tiles cada, cr31 index)
- **Wang tiles habilitados no jogo** — `wangtiles=true` por default, `tileStyle=dirt_grass`, preload lê config do localStorage
- **Menu TERRAIN no CONFIGS** (aba VFX): toggle on/off, selector resolução 16/32, selector estilo (test/ocean_sand/dirt_grass). Nota "Aplica ao reiniciar"
- **cr31 convention fix** — game code e test palette corrigidos pra NW=1 NE=2 SE=4 SW=8 (standard)
- **PixaPro font-size** clamped 12px–17px pra legibilidade
- **PixaPro Detail dashboard** evolution: stats cards, progress bar, category chips, queue cards com ações por card
- **PixaPro 5 bug fixes**: popup stuck, gallery refresh duplica, wang canvas gray, tag input perde valor, dashboard stale
- **PixaPro test render 4:3** — canvas 640×480, grid retangular, info de tile size + game map total
- **MCP Live Status endpoint** — `gallery_server.py` com `GET/POST /mcp_status` + `POST /mcp_clear` + persist em `mcp_live.json`
- **MCP Live dashboard no PixaPro** — painel na tab Detail com polling 4s, cards expandíveis (inspect banner com ID, type, params, preview images, error/log)
- **WANG_PRESETS atualizados** — 32px sliced local como primário, 16px arquivados como legacy
- **Auto-sort validado** — algoritmo funciona sem corrections salvas, 0 conflitos nos 2 tilesets PixelLab
- **`docs/REFS_WANG.md`** atualizado com novos IDs 32px e base tile IDs

### ✅ Pronto (cont. — sessão 2026-04-30 madrugada · PixaPro refactor 10 sprints)
- **PixaPro modularizado** — `tools/asset_gallery.html` 121kb → 17kb (-86%), zero `<script>` inline (era 2778 linhas)
- **Estrutura final** `tools/pixapro/`:
  - `styles/` (S1): 7 CSS por componente — base, components, manager, gallery, editor, tiles, detail
  - `js/constants.js` (S2): MANIFEST (68), PIXELLAB_TOOLS (19), WANG_PRESETS (5)
  - `js/store.js` + `js/api.js` (S3): localStorage wrappers + fetch wrappers
  - `js/utils.js` (S4): `$`, escHtml, timeAgo, suggestTargetFolder, getAssetType, mulberry32
  - `js/popup.js` (S4): floating popup global (show/hide/attachOrient + self-handlers)
  - `js/classify.js` (S4): groupBy, classifyGroup, classifiedFlat, buildGroupPopupHTML, findDirectionVariants
  - `js/thumb.js` (S4): makeThumb, thumbBadge, fillSumGrid (4 modos)
  - `js/tabs.js` (S10): switchTab, activeTab, API_URL, scroll handlers
  - `js/tab-manager.js` (S5): idx, decisions, render, keyboard shortcuts, setInterval, initial render
  - `js/tab-gallery.js` (S6): summaryData, renderGallery, filter bar, refresh button
  - `js/tab-editor.js` (S7): visualizer 8-dir + tool forms, mcpQueue, queueTool
  - `js/tab-detail.js` (S8): renderDetailDashboard + MCP live polling 4s
  - `js/tab-tiles.js` (S9): Wang editor + auto-sort visual + terrain gen + 14 button handlers
- **Padrão usado:** ES script-globals (não module), top-level `let`/`function` visíveis script-wide entre `<script src>` tags
- **Bug encontrado e corrigido durante o refactor:** Python regex de remoção quebrou em funções com defaults `opts={}` (counter contava o `{}` como abertura de body). Removidos 3 blocos órfãos manualmente
- **Validação:** preview_eval com 68 thumbs renderizando + todas 5 tabs trocam sem erro

### 🚧 Em andamento
- **Tradução D+R2** — esperando JSON do `localStorage` do user pra preservar configs antes do refator de identificadores PT→EN
- **Tutorial etapas 7-9** (TAKE_DAMAGE / FARMER / FARMER_KILL) — funcional mas precisa refinar texto/glow/condições
- **Game preview na worktree** — `_setupGeometricTextures is not a function` (pré-existente, não investigado)

### 🔜 Próximos passos
1. **Verificar PixaPro modularizado** — abrir gallery via `python tools/gallery_server.py` e testar todas as funcionalidades end-to-end (Manager P/D/R/C, Gallery filtros, Editor 8-dir slots, Detail dashboard, Tiles auto-sort)
2. **Verificar tiles in-game** — testar via GitHub Pages se Wang dirt↔grass renderiza corretamente no mapa
3. **Conclusão do tutorial** etapas 7-9 (TAKE_DAMAGE / FARMER / FARMER_KILL) — refinar visual + balanço
4. **Pegar JSON do localStorage do user** → salvar em `configs_pre_translation.json` + atualizar `DBG_DEFAULTS` + migration code
5. **Refator D+R2** (identificadores PT→EN, comentários, code review com cleanups óbvios)
6. **Audit pendentes**: M3 (slot tweens raro), L5 (mobile dual-input untestado), L6 (FSM tutorial opcional)
7. **Labels de inputs** com `data-i18n` no menu CONFIGS (só legends/notes/buttons traduzidos)
8. **Wire `fx.tileRes`** pra carregar tiles de resolução diferente (hoje tudo é 32px)
9. **PixaPro futuras melhorias** (opcional): converter pra ES modules reais (import/export) se módulos crescerem; criar `Store.subscribe` pattern pra reatividade; DRY mais o `fillSumGrid`

### 🛠 Ferramentas criadas
- `tools/slice_sprites.py` — slicer genérico (qualquer sheet)
- `tools/process_chars.py` — processador de personagens (flood fill + numeração)
- `tools/clean_hud.py` — remove dígitos baked-in dos frames HUD
- `tools/slice_hud_frames.py` — extrai frames GRAVITON/COMBUSTÍVEL de `refs/hud-vazia.png`
- `tools/slice_cow_burger.py` — extrai boxes COWS/BURGERS de `refs/cow-burgers.png`
- `tools/slice_tilesets.py` — augmenta tileset base via mirror/rotação (naming `TLTRBLBR` antigo, refatorar pra cr31)
- `tools/wang_test_palette.py` — gera 16 PNGs cor sólida em `assets/terrain/test/`
- `tools/wang_playground/index.html` — playground standalone single-file (PRNG + corner grid + lookup cr31 + canvas)
- `tools/migrate_to_projects.py` — migrou de N: pra H: (one-shot, mantido por referência)

## Convenções de código

- **Idioma:** identificadores em português onde já estão (`vaca`, `nave`, `curral`, `paciencia`) — não anglicizar
- **Sem build step** — tudo inline no HTML, scripts via CDN
- **Comentários em PT-BR** seguindo o padrão existente
- **Edits cirúrgicos** com a tool Edit, evitar reescrever blocos grandes
- **Validar no preview** após cada mudança visual

## Skills úteis pra este projeto (`C:\Users\thiag\.claude\skills\`)

- `procedural-tilemap` — Wang tiles, WFC, CA pra terrain procedural
- `gamedev-assets` — busca de assets free/paid (Kenney, OpenGameArt, itch, Craftpix, Mana Seed)
- `gameart-prompts` — formula de prompts pra IA visual (Nano Banana, RD, PixelLab, MJ)
- `gpt-image-2` — GPT Image 2 specifics (Thinking Mode, text rendering, etc.)
- `tileset-slicer` — slice + augment Wang via mirror/rotation
- `engineering:debug` — bugs de física/matter.js
- `design:design-critique` — feedback visual da arte gerada
- `anthropic-skills:canvas-design` — diagramas/mockups

## Comandos do projeto

- **`/checkpoint`** — rodar **antes de desligar o computador**. Atualiza CLAUDE.md, docs/PROGRESS.md e docs/PROMPTS.md com tudo que aconteceu na sessão, oferece backup do HTML se houve mudanças significativas. Garante que nada se perde entre sessões.
