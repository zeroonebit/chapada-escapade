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

### 💾 Project server (`tools/project_server.py`) — porta 8090

**Convenção de portas (após audit cleanup 2026-05-02):**
- **8080** = game canvas (`python -m http.server 8080`)
- **8089** = PixaPro UI standalone (`H:/Projects/PixaPro/server.py`)
- **8090** = project server deste projeto (este script) — onde PixaPro standalone fala via API

Endpoints — ver docstring de `tools/project_server.py` pra lista completa. Principais:
- `POST /save_decisions`, `POST /save_configs`, `POST /save_mcp_queue` → persistem em `tools/saves/`
- `GET /list_assets`, `GET /scan_in_game_assets` → inventário de assets
- `GET /maps?project=<slug>` + `POST /maps/<name>` → CRUD de map presets pro PixaPro
- `GET|POST /mcp_status`, `GET|POST /pixellab_balance` → integração MCP/PixelLab

**Rodar:**
```
python -m http.server 8080                # game em http://localhost:8080
python tools/project_server.py            # API/static em http://localhost:8090
python H:/Projects/PixaPro/server.py 8089 # PixaPro UI em http://localhost:8089
```

PixaPro NÃO vive mais dentro do Chapada (era em `tools/pixapro/`, deletado no audit). Repo standalone: `H:/Projects/PixaPro`. Doc de integração: `H:/Projects/PixaPro/PROJECT_INTEGRATION.md`.

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

### ✅ Pronto (cont. — sessão 2026-04-30 manhã · gen + refactor curral V2 + cercas deco)
- **5 currais V2 PixelLab 200×200** — substitui sistema procedural de cercas
  - Variantes: pequeno_quadrado / redondo_feno / hexagonal_ornamental / rustico_pedra / abandonado_caveira
  - Salvos em `assets/pixel_labs/chars/nature/objects/curral_*.png`
  - `js/04_scenery.js` `_buildCorral`: substituiu ~50 linhas de procedural → 1 sprite random com `slotOffsetY` por variante
  - `js/08_corrals.js` `_slotPos`: lê `curral.slotOffsetY` (fallback 110)
  - Mascot/feno/balde/burger slots mantidos (Option C: sprite + procedural overlay)
- **Cercas scatter decoração** — assets antigos do curral procedural reaproveitados
  - 14 spots aleatórios pelo mapa em `_buildScenery` (após dry_turf, antes de currais)
  - 10 keys deco: fence_broken, fence_corner, post_single, post_thin, plank_v, post_lantern_low/thin, post_carved, post_thin_simple, post_double_rope
  - 60% spot único / 40% mini-cluster 2-3 peças, rotação random ±90°, alpha 0.85-1.0
- **5 grass blade variations** PixelLab 64×64 — em `assets/pixel_labs/chars/nature/grass_v2/`
  - Variantes: vibrant / dark_curled / lime_bent / olive_dry / yellow_tip
  - 5 wind_sway anims (4 frames) disparadas (~3min cooking, integração in-game pendente)
- **Saldo PixelLab via bookmarklet** — `tools/gallery_server.py`
  - `GET/POST /pixellab_balance` (cache + persiste em `tools/saves/pixellab_balance.json`)
  - PixaPro `tools/pixapro/js/balance.js`: badge no header com refresh 60s
  - Bookmarklet: roda em `pixellab.ai/account` → scrape DOM → POST localhost:8090
  - Por que bookmarklet: Secret da página `/account` NÃO autentica `api.pixellab.ai/get-account-data` (403 Invalid token). JWT real está em session cookie do browser
- **8 tilesets 16px transitions** disparados (4 v1 + 4 v2 cerrado)
  - Mapa Opção 1 (verde, v1): ocean↔dirt `ff745b17`, ocean↔grass `70faa0d8`, sand↔dirt `448352c8`, sand↔grass `ac546645`
  - Mapa Opção 2 (seco, v2): ocean↔dirt `d395054a`, ocean↔grass `53598aae`, sand↔dirt `e8b56eea`, sand↔grass `43ac051b`
  - Todos com base_tile_ids dos 16px existentes pra consistência visual
  - Slice + agrupar em WANG_PRESETS pendente

### ✅ Pronto (cont. — sessão 2026-04-30 madrugada · PixaPro refactor 10 sprints) — *HISTÓRICO*
- **PixaPro modularizado** — `tools/asset_gallery.html` 121kb → 17kb (-86%), zero `<script>` inline (era 2778 linhas)
- **Estrutura `tools/pixapro/`:** 7 CSS + 13 JS modules (constants, store, api, utils, popup, classify, thumb, tabs, tab-manager/gallery/editor/detail/tiles)
- **Padrão usado:** ES script-globals (não module), top-level `let`/`function` visíveis script-wide entre `<script src>` tags
- **⚠️ DELETADO no audit cleanup de 2026-05-02** — `tools/pixapro/` migrou pra repo standalone `H:/Projects/PixaPro`. `tools/asset_gallery.html` removido (UI antiga). Ver sessão 2026-05-02 abaixo.

### ✅ Pronto (cont. — sessão 2026-04-30 tarde·noite)
- **Currais V2 mascotCfg per-variante** — `_buildCorral` push salva `mascotCenografico=true` + `mascotCfg{tipo,anim,dx,dy,bucket}`. `_ensureCowMascot` lê config (cow/bull, anim cow_eat_S/N/cow_angry_S/ox_walk_S). 01 pequeno + 02 redondo: cow eat S+balde. 03 hexagonal: cow drinking N (alinha coxo). 04 rustico: cow lie_down. 05 abandonado: ox walk S
- **Tutorial polish massivo**: box maior (BOX_W 280→360, fonts ↑), nomes engraçados PT-BR (PILOTANDO A NAVE, ROUBANDO VACAS, HORA DO LANCHE, REVIDE…), merge step 02+03, +2 steps novos (DODGE_TORPEDOS, KILL_SHOOTER)
- **Tutorial highlights fix** — `_combBar`/`_eneBar.y` top-left (era center)
- **HUD scores nameless V2** — 6 boxes sliced (`tools/slice_hud_scores.py`), labels overlay Phaser PT/EN
- **Radar v2 sandwich** — ring (199) + conteúdo (199.5-200.5) + dome glass (200.8 alpha 0.4), DOME_DY tunado pra base sentar no ring
- **Mobile force landscape** — `#rotate-prompt` overlay CSS @media portrait
- **HUD coluna left centralizada** — 5 boxes vertical (BULLS/COWS/FARMERS/SHOOTERS/BURGERS), score top-center mantido
- **HUD counters wired** — `bullsTotal`/`cowsTotal`/`farmersTotal`/`shootersTotal` cumulativos. Increment em `_dropCowsAtCorral` (cow/bull), `_explode` (farmer isEnemy), `_destroyShooter` (shooter)
- **8 tilesets 16px UNBLOCKED** — Mapa1 verde + Mapa2 seco downloaded via `api.pixellab.ai/mcp/tilesets/{id}/{image,metadata}` (sem auth), sliced cr31 mapping (PixelLab NW=8 NE=4 SW=2 SE=1 vs nosso NW=1 NE=2 SE=4 SW=8). Salvos em `assets/terrain/{mapa1,mapa2}_*`. WANG_STYLES expandida 3→11. Dropdown CONFIGS com 11 opções traduzidas
- **Wangtiles default ON** — `dbg.fx.wangtiles=true` no DBG_DEFAULTS
- **ox→bull rename** — bulk replace em todos refs, asset `oxen_v2.png`→`bulls_v2.png`
- **HUD assets cleanup** — 18 PNGs deletados (frames v1/v2/v3, radar_frame), preload simplificado. Combined HUD agora `_empty_nameless` + `_full-nameless`
- **Gas can rules** — só perto de truck, scale `truck.scale * 0.35`, tint `0xc88a5a` (marrom-laranja). Barrel_rusty cluster random independente
- **Wind swirls cartoon** — trail bezier (taper amp) + curl spiral 1.6 voltas no leading edge, len 60-110, alpha 0.18-0.42
- **Rotation lock cows/farmers** — `_directionalTexture` força `rotation=0` exceto se abducted; `_updateFarmers` igual exceto se inSpin
- **Cow/bull sem explosão** — `_environmentCollision` rocha branch: SÓ farmer (isEnemy) explode. Cow/bull bounce físico
- **Farmer release-spin 3s** — `_releaseCow` detecta isEnemy: friction 0.01 + `_releaseSpinUntil` + `_spinRate ±8-14 rad/s`. `_updateFarmers` rotaciona durante janela
- **Fuel drain por movimento** — `(0.4 + 3.1 × speedNorm) × difficulty`, parado ~0.4/s, full ~3.5/s
- **Bug fix loading** — removed `this.matter.body.setAngle()` calls (factory não tem método estático)
- **Splash skip on restart** + restart transition red→green
- **Game over cinematic V2** — vinheta + Fibonacci spiral + tremor + smoke + crash crooked
- **Quips coloridos por tom** + seguem target

### ✅ Pronto (cont. — sessão 2026-05-02 · audit cleanup + PixaPro spinoff + Asset Naming)
**Audit + cleanup:**
- **`tools/pixapro/` deletado** — migrou pra repo standalone `H:/Projects/PixaPro` (estava duplicado, drift entre as 2 cópias)
- **`tools/asset_gallery.html` deletado** — UI antiga substituída pelo PixaPro standalone
- **`gallery_server.py` → `project_server.py`** — nome reflete papel real (serve estático + API REST consumida pelo PixaPro)
- **Convenção de portas final:** 8080 game · 8089 PixaPro UI · 8090 project_server
- Total: -3620 linhas duplicadas removidas

**Wang tiles bugs corrigidos:**
- **Convenção alinhada com PixaPro/cr31** — código antigo usava `NE=1, SE=2, SW=4, NW=8` (rotacionado). Agora `NW=1 NE=2 SE=4 SW=8` (cr31 standard, mesma do PixaPro)
- **CA majoritário (vertex grid binário)** em vez de média 3×3 do cell grid — fix bug "tudo idx=15" (média categórica convergia tudo pra grass)
- **Runtime auto-sort** por color sampling — resolve PixelLab CCW-shifted convention sem mexer no asset
- **Debug overlay** com nº dos tiles (toggle live) + sliders procedural (vertThreshold, vertCaPasses)

**HUD layout final:**
- **6 boxes em row no top:** BULLS · COWS · FARMERS · [SCORE] · SHOOTERS · BURGERS (score no meio)
- **Radar bottom-right** com frame Graphics custom (anel escuro + 4 rivets cardinais), removido PNG perspectivo + glass dome
- **GeometryMask removido** do radar — era causa do bug "não inicializa primeira sessão"
- **Labels FUEL/GRAVITON** nos slots pretos do HUD combined (cor `#aaffcc` matching coluna esquerda)

**Atmosphere + game flow:**
- **Shuffle a cada restart** — TOD random (day/dawn/dusk/sunset/night/midnight) + weather (clear/rain/fog/storm/snow) + wind 50/50 on/off
- **Fuel drain por movimento** — `(0.4 + 3.1 × speedNorm) × difficulty`
- **2º game over UI fix** — `_gameOverUiShown` resetado em `_createBody` (scene.restart reusa instância)
- **Restart i18n** — PT: JOGAR NOVAMENTE / EN: RESTART
- **Burgers spacing** 32→56px + reposicionados ao **norte** do corral

**Wind cartoon swirls:**
- Thickness variável por partícula (0.8-3.2px)
- Removido curl/spiral do leading edge (era "head de espermatozoide")
- Trail com taper bilateral (`sin(π·t)`)

**Currais V2 mascote:**
- `mascotCfg` per-variante: 01 pequeno + 02 redondo (cow eat S+balde) · 03 hexagonal (cow drinking N+coxo) · 04 rustico (cow lying down) · 05 abandonado (ox walking S)

**MAP tab no debug menu (CONFIGS → MAP):**
- Dropdown de map presets fetched do PixaPro server (`http://localhost:8090/maps?project=chapada-escapade`)
- Selecionou preset → fetch + cache em `localStorage` → próximo `scene.restart` lê sync e usa

**`project_server.py` — endpoints novos:**
- `GET /maps?project=<slug>` + `POST /maps/<name>` — CRUD de map presets
- `GET /scan_assets` — walks `assets/`, classifica via regex contra `ASSET_NAMING_STANDARD.md`
- `GET /asset_naming` — config do projeto
- `POST /apply_renames` — batch rename com **backup automático** em `tools/saves/asset_rename_backup_<ts>/`
- `POST /check_refs` — preview dos js files que referenciam paths a serem renomeados (dedup literal/template via regex extraído)

**Test naming audit:** 879 assets, 773 já no padrão, 65 renames sugeridos (`chars/nature/X/` → `env/X/`). Apply testado + rollback completo testado.

### 🚧 Em andamento
- **Currais V2 polish** — variantes 02/05 ainda usam `mascotCfg` simples; user revisando curral a curral, pode ajustar offsets
- **Tutorial steps 09+10 completion logic** — DODGE_TORPEDOS (counter de torpedos esquivados) + KILL_SHOOTER (flag) ainda placeholder, gameplay já avança via min-read time
- **Grass blades anim integration** — 5 base PNGs no disco, mas 20 anim frames wind_sway ainda BLOCKED (URL pattern de anim frames PixelLab desconhecido)
- **Naming rename real** — sistema pronto, não foi usado pra valer ainda. Workflow seguro = 1 categoria por vez fixando js refs entre cada batch

### 🔜 Próximos passos
1. **Apply renames real** — pegar Naming tab e fazer 1 batch (ex: só `chars/nature/fences/` → `env/fences/`) + auto-update dos js refs (ainda falta esse último passo no PixaPro)
2. **Wirar completion logic do tutorial 09/10** — contador `_tutTorpedosDodged` em `_updateBody` + `_tutShooterKilled` flag em `_destroyShooter`
3. **Grass blades** — descobrir URL pattern de anim frames OU pedir scrape via Chrome MCP da outra sessão
4. **Map preset end-to-end test** — criar preset no PixaPro → game refresh → load → restart → ver terreno gerado
5. **PixaPro Project dropdown** — hoje hardcoded `chapada-escapade`, devia ler `pixapro_config.json.linkedProjects`
6. **PixaPro `server.py` simplificar** — fork antigo do project_server, tem código duplicado que devia ficar só no project_server

### 🛠 Ferramentas criadas
- `tools/project_server.py` (era `gallery_server.py`) — server local porta 8090 com API REST consumida pelo PixaPro standalone (8 endpoints: maps, scan_assets, apply_renames, check_refs, etc)
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

## Handoff entre sessões

Sistema simples de fila pra coordenar múltiplas sessões Claude trabalhando no projeto:

- **Source-of-truth:** `docs/HANDOFF_QUEUE.json` (versionado no git)
- **Mirror human-readable:** `docs/HANDOFF_QUEUE.md`
- **Skill:** `~/.claude/skills/handoff-queue/SKILL.md` — comandos `/handoff list/add/claim/done`
- **Workflow:**
  - Sessão A (ex: asset-gen com PixelLab MCP) adiciona items quando fica algo pendente pra integração in-game
  - Sessão B (in-game integration) abre projeto, lê `/handoff list`, escolhe item, implementa, marca done
  - Git é o sync: sempre `git pull` antes de ler, `git push` após editar

Triggers naturais: "que pendências tem", "adiciona X à handoff", "pega item Y", "marca Z como done".

## Comandos do projeto

- **`/checkpoint`** — rodar **antes de desligar o computador**. Atualiza CLAUDE.md, docs/PROGRESS.md e docs/PROMPTS.md com tudo que aconteceu na sessão, oferece backup do HTML se houve mudanças significativas. Garante que nada se perde entre sessões.
