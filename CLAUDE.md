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

### ✅ Pronto (cont. — sessão 2026-05-02 noite · Pages-only mode + GitHub API write + Browse tab)
**Pages-only (read sem servers locais):**
- `tools/bake_indexes.py` gera `data/maps/_index.json` + `data/_assets_index.json` (manifest static com `inGame: bool` por asset)
- `.github/workflows/bake-indexes.yml` auto-roda bake em pushes (commits com `[skip ci]`)
- `.nojekyll` adicionado pra Pages servir `_-prefix` files
- Maps movidos pra `data/maps/` committed (era em `tools/saves/projects/<slug>/maps/` privado)

**PixaPro deployed em Pages:**
- Repo standalone: https://github.com/zeroonebit/pixapro
- UI live: https://zeroonebit.github.io/pixapro/
- `config.js` estático (substituí o dinâmico em deploy)
- `tab-map.js` + `tab-naming.js` com `fetchWithFallback(serverPath, pagesPath)` — server local primeiro, Pages fallback

**Multi-project support:**
- `js/projects.js` (`PixaProjects` API global): `getActiveSlug`, `getActiveCfg`, `fetchWithFallback`, `populateSelector`
- Lê `linkedProjects` de `window.PIXAPRO_CFG`
- Active project persiste em `localStorage` + custom event `pixapro:project-changed`
- Dropdowns auto-populam via `<select data-pixa-projects>`

**GitHub API write (zero local server):**
- `js/github-api.js` (Contents + Trees API helpers) + `js/github-modal.js` (PAT setup UI)
- Modal **🔑 GitHub** no header — PAT em localStorage (scope `repo`)
- Save preset via Contents API quando offline + PAT
- Apply renames via `batchTreeOperations` (1 commit atomico)

**Asset naming features:**
- `project_server.py` ganhou `POST /apply_renames_with_refs` (transacional, dry_run)
- Algoritmo `diff_prefix` clusters renames com mesmo padrão
- Auto-update de prefixes nos `js/*.js` + backup completo (.js + .png)
- PixaPro UI: 2 stat cards (in-game / órfãos) + filtro radio + badge IN/ORF + botão verde **"✨ Apply + Update JS"**

**Browse tab:**
- Aba **🔍 Browse** com gallery completa (879 assets) + filtros (category, in-game, search, view grid/list)
- Detail panel + tag chips
- Tag filter syntax: `char:cow dir:N anim:walk frame:0 style:dirt_grass_32 -wang_meta`

**PixaPro audit cleanup:**
- `PixaPro/server.py`: 390 → 88 linhas (-77%) — só static + `/config.js` dinâmico
- `tools/saves/projects/` deletado (`data/maps/` é canonical)
- `project_server.py` lê maps de `data/maps/` direto

### ✅ Pronto (cont. — sessão 2026-05-02 · audit cleanup + PixaPro spinoff + Asset Naming) — *primeira parte*
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

### ✅ Pronto (cont. — sessão 2026-05-02 tarde · Apply renames bug-fix + Audit Pages fallback)
- **Apply renames bug-fix** — `diffPrefix` algoritmo era over-broad: singleton `pixel_labs/beam.png`→`fx/beam.png` gerava prefix `pixel_labs`→`fx` que engolia paths irmãos. Fix: prefix rule só safe se grupo>=2 OU prefix>=4 segs; senão literal full-path replace. Aplicado nos 2 lados (`PixaPro/js/tab-naming.js` + `ChapadaEscapade/tools/project_server.py`)
- **65 PNGs renomeados via PixaPro live** — `chars/nature/{rocks,vegetation,fences,...}/X.png` → `env/X/Y.png` + `pixel_labs/beam.png` → `fx/beam.png`. Commit `17d7986` limpo, 0 broken refs
- **Audit panel Pages fallback** — `Api.listAssets()` + `Api.scanInGameAssets()` em `PixaPro/js/api.js` agora caem pra `cfg.pages + /data/_assets_index.json` quando server local off. Cache 60s, invalidado em `pixapro:project-changed`. URLs absolutos via `cfg.pages` em Pages mode. Commit PixaPro `6db6df7`
- **Plano debug PixaPro tab-by-tab** definido: ordem Browse → Naming → Map → Tiles → Gallery → Manager (Audit) → Editor → Detail. Iniciado pela Audit
- **PAT GitHub salvo** em `H:/Projects/.pat_pixapro` (plain-text — rotacionar após uso)

### ✅ Pronto (cont. — sessão 2026-05-08 · Golden path audit + Boot perf rework Fix D)
- **Boot 200s → 30s no Pages** (-85%): 7 sprite atlases (cow/ox/farmer/ufo/hud/nature/items) via `tools/pack_atlas.py` + pngquant + oxipng. ~660 requests → ~30, ~5MB → ~1MB
- **Tools instalados:** pngquant 2.17.0 + oxipng 10.1.1 via scoop. `tools/pack_atlas.py` empacota frames PNG em atlases Phaser-compatíveis (JSONHash format) com modo `char` (8-dir + anims) e `flat` (lista files OU groups por subdir)
- **`_registerAtlasFrameTextures()` em 01_scene.js** — extrai static dirs + legacy aliases via canvas, mantém todos `setTexture('cow_S')` etc funcionando sem rewrite. Anim creation usa frames in-atlas: `{key:'cow_atlas', frame:'cow_walk_S_0'}`
- **`_refreshMapList` silencioso em production** — skip fetch quando hostname != localhost (evita CORS/refused warn no Pages). `console.warn` → `console.debug`
- **WASD tap responsiveness** — `Phaser.Input.Keyboard.JustDown` aplica velocity kick (1.8 unit/sec × sensitivity) em just-pressed. Antes: tap rápido = 1 frame força = movimento imperceptível
- **Bug #2 fix tween leak (HIGH severity):** rain/snow `fall()` recursive agora early-returns se weather off. `_applyFXVisibility` detecta off→on transition e re-kickstart drops; on→off chama `killTweensOf`. Antes: 250 rain tweens + 100 snow vazavam em loop infinito quando weather mudava → 361 tweens, FPS 1.6
- **Bug #1 fix corral slot sentinel (MED severity):** `time.delayedCall(3000, processSlot)` podia falhar; novo `_sweepStuckSlots()` em `_checkDelivery` força transição se slot loading > 5s. Caminho primário intocado, sentinela é safety net + console.warn
- **Bug #3 verificado falso positivo** — quips i18n já lia `dbg.behavior.lang` corretamente
- **Cleanup HUD aliases** — `hud_combustivel_v2`, `hud_graviton_v2` removidos do alias map (audit confirmou só `hud_combined_empty/full` são usados)

### 🛠 Pipeline atlas (novo)
- `tools/pack_atlas.py` — empacota frames PNG em atlases. Comandos:
  - `python tools/pack_atlas.py` — regenera todos
  - `python tools/pack_atlas.py cow` — só um
  - `python tools/pack_atlas.py --no-compress` — skip pngquant pra dev rápido
- Adicionar PixelLab assets novos: salva PNG → adiciona entrada no dict `ATLASES` em `pack_atlas.py` → roda. `02_preload.js` já tem `load.atlas()`, registrar alias em `_registerAtlasFrameTextures` se for static frame referenciado por `setTexture()` em call sites

### 🌽 Bevy 3D edition (paralelo) — JOGÁVEL, fases 0-7 percorridas (2026-07-02/04)
- Repo: `H:/Projects/Bevy/ChapadaEscapade/` — port 1:1 do Phaser em Rust+Bevy 0.15, ~30 commits, jogo desktop completo
- **Rust instalado** (scoop, stable 1.96 MSVC). Rodar: `cargo run`. Em bash do Claude: `export PATH="$HOME/scoop/persist/rustup/.cargo/bin:$PATH"` antes
- **Implementado:** billboards PixelLab 8-dir (~330 PNGs) · mouse follow força+inércia (probe no Phaser live: accel 60/drag 2.4/tilt 23°/sens 1.54 embutida) · core loop (cargo anel cap 5, 4 currais slots, burgers, score, fuel) · terrain CA 100×100 em 500×500u + wang layer ESTILO ÚNICO por partida (5 estilos, auto-sort com upper_hint, aba TILES com REGENERAR) · enemies (farmers mutex, 6 torres, slam, rochas com HP) · game flow completo (splash art, pause+RECOMEÇAR, game over espiral, vitória) · 5 weathers + TOD overlay uniforme (tudo unlit) + shuffle · HUD PixelLab + radar sonar (ping/rastro/decay) · CONFIGS 6 abas · F3/F4 (inspector) · tutorial 7 etapas · exhaust cone · blob shadows Multiply
- **Fixes memoráveis:** abdução travada por gravidade × pull (BeamGrip) · mundo duplicando no unpause (guards nos OnEnter) · B0002 Res+ResMut · egui try_ctx_mut race · sombras-bloco (NotShadowCaster) · flicker de transparências via `depth_bias` fixo (sombras -60 < fumaça 0 < cone +30) · overlays egui numa layer única `screen_layer()` ordenada pelos systems (fog pintava sobre o HUD)
- **Terreno PROCEDURAL (2026-07-04):** modo TILES×PROCEDURAL na aba TILES · seed fBm (value noise hash, sem crate) nos 2 modos: elevação→água/areia, umidade→grass/dirt · distance field BFS (`TerrainGrid.dist_water`): praia garantida 2 células + margens escurecidas 16% · relevo com clamp 0.38 = chapadas de topo plano (abaixo das blob shadows 0.40) · 4 sliders (escala/água/aridez/relevo) · rios pendentes (base pronta no dist_water)
- **Plano 8 fases:** `~/.claude/plans/quero-planejar-a-migra-ao-binary-horizon.md`
- **Próximo épico (confirmado):** pipeline Houdini→glTF extras→Bevy (Houdini como level editor) — ver memória + README do repo
- **Backlog:** i18n EN · mobile/WASM · hanabi · barrel · grass verlet · sons (adiado pelo user)

### ✅ Pronto (cont. — sessão 2026-05-09 · WANG_DEBUG mode + PixaPro tiles port + tudo live)
- **WANG_DEBUG mode** (`?debug=wang` URL flag) — minimal scene isolada (sem splash/UFO/NPCs/HUD/FX/atmosphere), só terrain + camera + debug menu. WASD/arrows scroll, `[/]` zoom, R regen, ESC menu
- **WANG_PRESETS catalog** importado do PixaPro (`js/wang_presets.js`) — 11 tilesets com metadata completa (id UUID PixelLab, biome, season, name, tileSize, info, cr31Native flag), `WANG_BIOME_COLORS`, `CR31_TO_PIXELLAB` permutation hardcoded
- **Tile transforms data layer** — `resolveTileTransform/setTileTransform/resetTileTransforms` persistido em `localStorage[chapEscapadeWangTransforms]`. Resolução: override > CR31_TO_PIXELLAB > identidade
- **Aba TILES dedicada no CONFIGS** — Compare All grid (3-col cards com biome chip), filter chips, INFO panel (name/meta/desc/UUID), CELL EDITOR (REF cr31 ground truth + PRESET side-by-side), AUTO-SORT button, RESET TRANSFORMS, PROCEDURAL sliders
- **Cell editor handlers** — Click rotate · Shift flipH · Alt flipV · Right-click cycle srcIdx · Double-click reset · drag-drop swap entre cells
- **Auto-sort algorithm** portado do PixaPro — 3×3 region sampling (era single-pixel), 8% margin, single getImageData per tile (50× faster), variance-based fallback, conflict detection
- **Tudo live no CONFIGS** — botão APPLY+RESTART removido. Scales resize entities existentes, enabled spawn/despawn dinâmico, counts reconcile diff, proc → scene.restart com debounce 250ms
- **pixelArt:true global** no Phaser config (engine-level antialias=false + roundPixels) — fix definitivo do bleeding entre tiles wang
- **Random orientation em tiles uniformes** (cr31 0/15) — hash determinístico por (x,y) → rot 0/90/180/270 + flipH/V. Quebra "grid feel" sem violar cr31 contracts
- **Eager-load tilesets** ao abrir TILES tab — paralelo, idempotente, popula thumbnails Compare All conforme cada termina
- **Banner WANG_DEBUG** full-width via DOM overlay (`position: fixed`) — robusto vs Phaser Rectangle que reportava `scale.width` errado
- **Menu landscape mode** — max-width min(1400, 95vw), 3-col default + 4-col em ≥1280px, TILES com layout custom 1.4fr·1fr·1fr (Compare à esquerda, Info+Cell+Proc à direita)
- **MAP tab dedupe** — WANG TILES + PROCEDURAL movidos pra TILES (estavam duplicados)
- **REF cr31 grid** dentro do Cell Editor — mostra os 16 tiles do test palette (ground truth) numerados, render via canvas+toDataURL (era blob URL bugado)

### 🛠 Pipeline tiles wang (novo nesta sessão)
- `js/wang_presets.js` — fonte de verdade do catalog. Adicionar tileset: nova entrada no array `WANG_PRESETS` + slice PNGs em `assets/terrain/<styleKey>/wang_NN.png`
- `setTileTransform(styleKey, cr31Idx, {srcIdx, rot, flipH, flipV})` ou `null` pra resetar — persistido em localStorage
- `_autoSortWangTiles(style)` em `js/04_scenery.js` — color sampling robusto, retorna `remap[cr31Bits] = srcIdx`. Cacheado em `this._wangRemap[style]`
- Botão AUTO-SORT no TILES tab roda + aplica como transforms
- Drag-drop no Cell Editor: arrasta cr31 A pra cr31 B = swap dos transforms

### 🚧 Em andamento
- **Bevy 3D edition** — JOGÁVEL (ver seção 🌽 acima); polish contínuo guiado por playtests do user; próximo épico: Houdini→glTF→Bevy
- **Audit element-by-element** continuação — terrain isolado robusto agora (TILES tab completo); próximo: adicionar UFO, beam, cow AI etc um por vez via toggles em CONFIGS
- **Audit live testing PixaPro** — Audit panel Pages fallback pushed; falta user validar painel popula + walk through one-by-one
- **Tutorial steps 09+10 completion logic** — DODGE_TORPEDOS counter + KILL_SHOOTER flag ainda placeholder
- **Grass blades anim integration** — 5 base PNGs no disco, 20 anim frames BLOCKED (URL pattern PixelLab unknown)

### 🔜 Próximos passos
1. **Slice 3 tilesets BASE/SHARED faltantes** — `mapa1_dirt_grass`, `mapa2_dirt_grass`, `shared_ocean_sand_16`. Existem na origem (PixelLab API) mas não sliced localmente. Tool `tools/slice_tilesets.py` precisa update pra cr31 mapping
2. **Atlas extras (opcional)** — atlas pra 4 HUDs gigantes 1536x1024 requer bin-packing real. Cortaria mais ~300kb
3. **Performance pass** — FPS no Pages cai pra 11 com 126 entities + barrel pipeline. Object pooling, layer culling, ou reduzir DBG_DEFAULTS counts
4. **Tutorial 09/10 completion logic** — contadores em `_updateBody` + flag em `_destroyShooter`
5. **Map presets reais** (5-6 variados) wirar pro splash escolher, dar variedade visual
6. **Bevy 3D Phase 1 verificação** — quando user instalar Rust, rodar `cargo run` e validar checklist Phase 1 do plan

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
