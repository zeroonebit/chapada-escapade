# Progresso — Chapada Escapade

Log cronológico das sessões. Adicionar entrada nova no topo.

---

## Sessão 2026-04-28 (noite) — Batch v2 assets PixelLab + variações de cor + gallery

- **36 assets nature/objetos** gerados via PixelLab MCP em `assets/pixel_labs/chars/nature/v2/inbox/`: bromélias, palmeiras, pedras, gramado, cochos, fardos, baldes, moinho, crop circles, satélite, wrecked_truck, gas_can, radio tower, lanterna, barris, caixas, flores, crânio, igrejinha, mesa rock
- **HUD bars regeneradas** com style transfer: crop PIL de `refs/huds.jpg` → resize 192×64 → base64 → PixelLab inpainting 55%
  - `combustivel_v2.png` — gradiente red→orange
  - `graviton_v2.png` — gradiente cyan→purple
- **4 variações wrecked_truck**: red / blue / green / yellow (128×128, high top-down)
- **4 variações gas_can**: red (existia) + blue / green / yellow (96×96, high top-down)
- **`tools/asset_gallery.html`** criada — galeria single-page com arrow nav, auto-refresh 8s, grid thumbnails, fundo xadrez; serve via port 8081
- **`.claude/launch.json`** atualizado com config "Chapada Escapade (gallery)" na porta 8081
- Refs salvas: `slice_combustivel.png`, `slice_combustivel_192.png`, `slice_graviton.png`, `slice_graviton_192.png` + b64 txt
- Git sync completo: 52 arquivos commitados → worktree ✅ → main ✅ → GitHub Pages ✅

---

## Sessão 2026-04-29 — Tutorial guiado completo + curral redesign + 14 cercas v2 + chuva controlável

**~30 commits, ~14h, das 09:00 às 23:00**

### Tutorial guiado (novo módulo `js/17_tutorial.js`)
- Splash com 2 botões: **JOGAR** / **TUTORIAL**
- 8 etapas sequenciais: MOVE → BEAM → ABDUCT → DELIVER → BURGER → BARS → TAKE_DAMAGE → FARMER → FARMER_KILL
- Hint overlay com progresso (pontos), título, texto, nota de conclusão
- Tempo mínimo de leitura por etapa (5s) — não avança antes de dar tempo de ler
- Caixa subida pra `h - 110` (libera visão das barras combustível/graviton)
- **Sistema de glow amarelo pulsante por etapa** via `highlight: [...]` em TUT_STEPS
  - Targets: nave, graviton, combustível, vacas, curral, fazendeiro, atirador, rocha
  - `_tutGlowAt` (mundo) e `_tutGlowAtScreenRect` (HUD) com 3 anéis pulsantes
- Setas verdes pulsantes apontando pra curral, fazendeiro, rocha
- Nova etapa **TAKE_DAMAGE**: spawna atirador perto, trava `_moverNave`, libera após dano no combustível
- Auto-respawn de vacas: 8 iniciais + reposiciona quando vivas < 3 (resolve travamento)
- Conclusão: botão "JOGAR AGORA" + spawna inimigos normais

### Curral redesign visual
- **1 vaca representativa** (top-down "eat bob") no centro com counter `×N` pulsante
- Vacas reais somem ao entregar — só sobe o counter
- Burgers spawnam **fora** do curral (sul, abaixo do gate) em fila de 24px
- Loading: piscando + ciclo classic→cheese→double a cada 1s (3s total)
- Ready: sprite fixo com bounce sutil
- `_reflowFila`: ao coletar, loadings remanescentes deslizam pros slots da frente
- Tempo de processamento: 5s → 3s

### Cercas v2 (14 assets PixelLab novos)
- Pipeline `tools/pixellab_fetch_new.py` baixa 20 IDs detectados via Chrome MCP
- `tools/pixellab_montage_new.py` gera contact sheet pra ID visual
- `tools/organize_cercas_v2.py` copia 14 cercas com nomes legíveis
- `chars/nature/cercas_v2/`: fence_curved_long, gate_open_double, post_carved, tower_ornamental_thin, post_lantern_low, etc
- `_construirCurral` reescrito com paleta clara consistente (mantém SCALE 0.9, cantos com torres ornamentais, lanternas decorativas na entrada)

### Chuva controlável (4 controles live em VFX)
- `_rebuildRain` recria pool de gotas quando `chuvaCount` muda
- `_startRainDrop` lê live: ângulo (-1 a +1), velocidade (0.2-3x), comprimento traço (0.3-3x), frequência (0-400 gotas)
- Aba VFX dividida em CHUVA / NEBLINA com 6 controles na chuva

### Debug menu refatorado
- **4 abas**: CONTROLES / LOOKS / VFX / DEBUG
- Slider novo: **sensibilidade da nave** (multiplica força em `_moverNave` live)
- Step 0.05 → 0.01 + display `toFixed(2)` (era `toFixed(1)`, parecia pular 0.1)
- Barrel distortion movido pra LOOKS

### Bug fixes
- **Barrel distortion não funcionava** — `addPostPipeline` no renderer ANTES de `setPostPipeline` (Phaser 3.60 exige)
- **BURGER não avançava** — checava `burgerCount` (não incrementa via curral); agora usa `scoreAtual > antes`
- **DELIVER não detectava entrega** — agora checa `processing.length > 0 || ready.length > 0`
- **Linha verde nos cantos** — barrel out-of-bounds `vec4(0.04,0.05,0.03)` → `vec4(0,0,0)` + remove `box-shadow` verde do `#game-host`
- **Vaca west bug do farmer** — corrigido manualmente pelo usuário no editor PixelLab
- **Curral invisível** — chão de terra alpha 0.0 → 0.38; spawn ignora terrain CA constraint

### Refactor & cleanup
- **`paciencia` → `combustivel`** em todo o codebase (8 arquivos)
- Removidas pastas duplicadas `vaca_chubby/`, `vaca_holstein/`, `vaca_skinny_4dir/` (457 arquivos)
- Workflow git: sync automático ao final de cada request (worktree → main → push)

### Memory & skills
- Skill nova `~/.claude/skills/pixellab-asset-download/` documentando padrão Backblaze CDN + 2 caminhos (Chrome MCP / DevTools manual)
- Memória `feedback_explicit_questions.md`: sempre destacar perguntas com caixa visual numerada
- Memória `feedback_heartbeat_5min.md`: heartbeat 5min em tasks longas

---

## Sessão 2026-04-27 (noite) → 2026-04-28 — Maratona: anims completas + debug menu + FX stack + nature + currais + Wang

**24+ commits, ~15h, das 21:14 (27/04) à 00:00+ (28/04)**

### Animações & sprites
- **Fazendeiro running 8-dir** wired no jogo (anim play por direção via velocity picker)
  - Fix do norte: rerota `N` puro pra `NE`/`NW` (chapéu cobre corpo na vista superior)
  - Fazendeiro convertido `matter.add.image` → `matter.add.sprite` + `setBody({type:'circle',radius:16})`
  - Static rotations top-down (156×156) substituíram as full-body antigas (180×180 cowboy)
- **Boi walk 8-dir** wired (state machine: walking quando movendo, sprite estático parado)
  - Wander force bumpada 0.0010 → 0.0030 (boi diagonal funciona agora)
- **Vaca chubby 8-dir** substitui skinny 4-dir
  - Anims walk(4f) / idle_head_shake→eat(11f) / lie_down→angry(8f) — 32 anim sets
  - vaca_run = vaca_walk com fps×2
  - Old skinny preservada em `chars/vaca_skinny_4dir/`
- **5 chars PixelLab** completos integrados — `chars/{vaca,boi,fazendeiro,ufo,vaca_holstein}/` (~620 frames)
- **UFO `b7bc12d9` re-baixado** (dome opaca, sem alien) — nave aponta pra `chars/ufo/south.png`
- **Scary_walk fazendeiro deletado** (full-body humanoid não-topdown)
- **Splashv3 + icon.png** — favicon novo, splash fullscreen (cover scale)
- **Game over + vitória** com splash desaturado (vermelho 0x441111 / verde 0x114422)

### Mapa & cenário
- **Mapa 2.5×** (3200×2400 → 8000×6000) em todos os 4 lugares hardcoded
- **31 nature assets** scrapeados via Chrome MCP do `/create-object` PixelLab
  - Categorias: `pedras` (3), `vegetacao` (12), `cercas` (10), `placas` (4), `outros` (2)
  - Per-asset proportional `SCALE_MAP` (saguaro 2.0, pillar 1.9, agave 1.3, dry 0.9 etc)
  - Bounds-aware placement (até 12 retries por peça, raio 32×scale×0.85, sem overlap)
  - Labels baked-in detectados + cropados (16/31 PNGs)
- **Cellular Automata terreno** com grid 100×75 cells (4 níveis: água/areia/grama/terra)
- **Currais procedural** com 10 cercas variantes (fence_long/gate_open/post_thin)
  - Retângulo 220×180, gate sempre aberto + sem matter body (vacas atravessam)
  - **Currais só em terra** (`grid===3`)
- **Wang tiles cr31** toggle no debug menu
  - Corner grid (COLS+1)×(ROWS+1) próprio (sem costura)
  - Threshold corrigido: só `grass===2` é UPPER (era `>=2` que pegava terra → todos idx=15)
  - 2 passes de smoothing extra nos cantos
  - Paleta terrosa: areia `#c9a574` + grama `#6e9b3a` + dry transition `#a89548`

### Debug menu (DOM-based, ESC)
- 30+ controles persistidos em localStorage
- ON/OFF: vacas, bois, fazendeiros, atiradores, beam visual, cenário
- Sliders escala: vaca, boi, faz, beam, nave, hambúrguer (todos step **0.01**)
- Sliders comportamento: dano atiradores, vel faz, vel vacas, pull beam, discoRot, **barrel** (distorção esférica)
- Quantidades: spawn count vacas (100) + fazendeiros (20)
- FX toggles: chuva, neblina, sparkles beam, shake, explosão fancy, **wangtiles**
- APLICAR + REINICIAR + RESET defaults

### FX stack (16_fx.js)
- **Chuva:** 80 gotas em loop diagonal
- **Neblina:** vinheta canvas com gradiente radial (centro nítido, bordas brancas alpha 0-40%)
- **Beam sparkles:** pontinhos verdes orbitando que viajam pro centro da nave
- **Beam shake/flash** ao ligar (transição off→on, verde 0x50c878)
- **Explosão upgrade:** shockwave anel + 8 sparks + flash branco central
- **Distorção esférica (barrel)** PostFXPipeline GLSL — `r²·strength·1.6` — slider 0-0.8
- **Sombras com blur fake** (3 elipses stacked, alpha 0.18/0.40/0.85) em todas as entidades + nave
  - Proporcional a `entity.displayWidth` (boi grande = sombra grande)
- **Escapamento estilo carro:** spawn 100ms, size 4, growTo 3.5×, alpha 0.75→0
- **Partículas coloridas** misturadas no escapamento (5 cores) — substituiu LEDs giroflex
- **Smoke puff no muzzle** dos disparos do farmer

### Sistema de jogo
- **HP system colisional:**
  - Vaca/boi: HP random 3-5 + setBounce(0.5)
  - Fazendeiro: HP 1 + setBounce(0.2) — só morre em pedra
  - Debounce 120ms entre hits
  - `_hitFlash(entity, color)` tint pulse 120ms ao tomar dano
  - Cow vs farmer: ninguém toma dano (faz só morre em rocha)
- **Beam pull fix:** removida re-prisão na grama (vacas saiam intocaveis do beam)
- **Beam graphics revert:** voltou pros 5 círculos concêntricos (alpha 0.05→0.22) — sem artefatos PNG
- **pullBeam default 0.5** (era 1.0 — bichos arremessavam contra obstáculos e morriam)
- **Balas atiradores persistem** até saírem do mundo 8000×6000 (era fade após MAX_DIST=580)
- **Fazendeiro/vaca/boi `setFixedRotation`** — fim do bug "boneco deitado" por colisão
- **Soltar do beam:** `_returnSouthUntil = now + 3000` força orientação south + fricção alta 3s
- **Burger variants** random no spawn e no virar (classic 2× weight + cheese + double)

### Nave (UFO)
- `setFixedRotation` + rotação manual via slider `discoRot`
- **Tilt suave** baseado em mudança de velocidade lateral (banking)
- **LED ring radius proportional** ao `nave.displayWidth*0.48`
- LEDs giroflex desativados → partículas coloridas no escapamento

### Tools
- `pixellab_objects_fetch.py` — baixa 31 map_objects via CDN backblaze
- `pixellab_montage.py` — gera contact sheet pra ID visual
- `crop_nature_labels.py` — detecta + crop banda de label
- `organize_nature.py` — copia inbox → chars/nature com nomes legíveis
- `wang_test_palette.py` — atualizado pra paleta terrosa Chapada

### Conquistas doc
- `docs/CONQUISTAS.md` criado — log de achievements + estatísticas atualizado por sessão

---

## Sessão 2026-04-27 (cont.) — PixelLab MCP integrado + assets novos + vaca animada

- **PixelLab MCP** ativado via `claude mcp add pixellab https://api.pixellab.ai/mcp -t http -H "Authorization: Bearer ..."` — 25 tools disponíveis (`create_character`, `create_map_object`, `animate_character`, etc.)
- **Workflow PixelLab:** `create_character` (4d/8d sprite sheets) vs `create_map_object` (single sprite até 400×400) vs `animate_character` (templates como walk-4-frames, running-8-frames, eating, angry)
- **Bug PixelLab descoberto:** `KeyError: 'bone_scaling'` no endpoint 8-rotations pra quadruped (workaround: 4-dir pra cat/bear/horse template)
- **Bug PixelLab + workaround:** templates quadruped (cat/bear/horse) **bloqueiam anatomia** — descrições só customizam aparência. Boi não saía como touro com bear template; usar `chubby cow/bull` em prompt + `cat` template deu resultado mais próximo
- **Hero assets 200×200** em `assets/pixel_labs/`: vaca, boi (Nelore brown), nave (UFO com alien verde na cúpula), beam halo (concêntrico cyan)
- **Directional chars 128px** em `assets/pixel_labs/chars/{ufo,fazendeiro,vaca,boi}/{S,E,N,W,SE,NE,NW,SW}.png`:
  - UFO 8d, Fazendeiro 8d, Boi 8d (chubby Nelore) — todos full 8 direções
  - Vaca 4d (cat template, bug 8d quadruped)
- **HUDs 400×200/400×120** em `assets/pixel_labs/hud/`: SCORE, COWS (com ícone vaca), BURGERS (com ícone), COMBUSTÍVEL (vermelho/laranja), GRAVITON (ciano sci-fi tech)
- **Items burger 120×120** em `assets/pixel_labs/items/`: classic, cheese (queijo derretido), double (2 patties)
- **Vaca animada** (id `7a011aff`): 4 estados × 4 dir × N frames = 104 frames PNG → `assets/pixel_labs/chars/vaca/anims/{walk,run,eat,angry}/{S,E,N,W}/`
- **State machine de personalidade** em `_atualizarIAVacas`:
  - `vaca_abduzida` → `angry` anim
  - dist < 240px → `run` + flee force
  - idle far → alterna entre `eat` (60%, 2.5-5s) e `walk` (40%, 1.5-3.5s)
- **🐛 BUG CRÍTICO consertado:** `this.matter.add.image()` não suporta `.anims` — substituído por `this.matter.add.sprite()` em `_criarVaca`. Anims rodavam silenciosamente sem efeito antes da fix.
- **🐛 Bug do travamento pós-splash:** `_setupLEDs()` foi perdido no refactor do `01_scene.js` create() → `_atualizarLEDs` quebrava `Cannot read properties of undefined (reading 'length')`. Re-adicionado.
- **Geometria removida** em `03_textures.js`: nave (PNG sobrescreve), hambúrguer (PixelLab), fazendeiro (PixelLab). Sobreviveram: curral, gaiola, rocha, moita, atirador.
- **Cleanup deprecated** via `git rm`: `assets/characters/`, `assets/ui/`, `assets/terrain/` (Wang antigos), `refs/preview_pixellab/`, `refs/preview_shader_*.png`, `refs/seamless_preview_*.png`, `refs/tilegpt.png`, `refs/tilenanobanana.jpg`, `refs/cow-burgers.png`, `refs/hud-vazia.png`. Sobraram: `assets/pixel_labs/`, `splash.png`, `favicon.svg`, refs originais (`vacas.jpg`, `farmer.jpg`, etc.).
- **Workflow:** preview local quebrou nesta sessão (`new Phaser.Game(config)` em `99_main.js` não executa por causa não diagnosticada — scripts carregam, canvas existe, mas window.game vazio). Trocado pra **testar via GitHub Pages direto** (push → ~30s deploy). `99_main.js` agora expõe `window.game` pra debug.
- **Diagnostic try/catch** em `update()` e `create()` — se quebrar, aparece box vermelho com stack trace na tela em vez de travar silencioso
- **Shaders desligados temporariamente:** terrain (`13_terrain_shader.js`) substituído por `add.rectangle` verde sólido + manchas de terra; grass patch só em EXPERIMENT_MODE (forçado OFF). Re-habilitar quando confirmarmos estabilidade.
- **Skill nova:** `pixellab-prompts` (implícita) — formula `Material/Type + Distinguishing Feature + Mood/Context`, doc oficial do MCP em `https://api.pixellab.ai/mcp/docs`

---

## Sessão 2026-04-27 — Wang playground standalone + convenção cr31

- **Pesquisa:** docs PixelLab MCP `/v2/tilesets` (Wang assíncrono, 16 tiles, 32px max, chaining via `*_base_tile_id`) + cr31 2-corner (NE=1, SE=2, SW=4, NW=8 — adotado como padrão do projeto, deprecando o naming `wang_TLTRBLBR` do `slice_tilesets.py`)
- **`tools/wang_test_palette.py`:** gera 16 PNGs 32×32 com cores HSV-spread + quadrantes shaded por corner bit + índice no centro; saída em `assets/terrain/test/wang_00.png` … `wang_15.png` + `_montage.png`
- **`tools/wang_playground/index.html`:** playground standalone (sem deps, sem build) — single-file vanilla JS com Mulberry32 PRNG, geração de corner grid (W+1)×(H+1) com fill + smoothing CA majority, lookup `wangIndex(nw,ne,sw,se)` cr31, render em canvas com `image-rendering: pixelated`
- Pack switcher: `test` (canvas-only, file:// friendly) / `nanobanana` / `gpt` (carrega `assets/terrain/<pack>/wang_NN.png` quando existir, fallback automático)
- Controles: seed (texto/núm), grid cols/rows, tile px, zoom 1-4×, fill 0-1, smoothing 0-10, debug grid, índices, export PNG
- ⚠️ Servidor HTTP local 8080 já estava ocupado por outra coisa nesta sessão — playground não foi aberto via HTTP; testar abrindo `tools/wang_playground/index.html` direto via `file://` (test pack funciona) ou subir um servidor em outra porta apontando pra raiz `H:\Projects\ChapadaEscapade`
- **Decisão arquitetural:** trilha B escolhida (playground isolado primeiro, port pro Phaser depois) — ciclo de iteração rápido, fundação reutilizável, alinhado com "step after step"

---

## Sessão 2026-04-26 (cont. 3) — Deploy Pages, mobile controls, terreno CA, HUD novo

- **Vacas/bois** mudaram pra sprite `cima_sobe` (top-down puro) + removido `setRotation` manual + spin random ao entrar no feixe → glissagem natural pela física
- **Mobile controls** em novo `js/12_mobile.js`: joystick virtual à esquerda (vetor → alvo virtual 220px à frente da nave) + botão FEIXE à direita; substitui o "2° dedo" antigo
- HUD layout iterado: foi pra horizontal, voltou pro empilhado clássico (score topo-centro, burger topo-esq, barras combustível/graviton no rodapé com gap visível)
- **LVL badge removido** (sem badge, sem `textoDif`)
- **Novos frames de barra** com label baked-in: `tools/slice_hud_frames.py` extrai GRAVITON e COMBUSTÍVEL de `refs/hud-vazia.png`; fill desenhado por `Graphics.fillGradientStyle` (combustível amarelo→vermelho, graviton azul→roxo)
- **COWS + BURGERS boxes**: `tools/slice_cow_burger.py` extrai 2 boxes de `refs/cow-burgers.png` (detecção por interior escuro + expansão da bbox + remove bg verde); substituem o burger frame antigo + mini-icons vaca/boi
- **Cenário procedural via Cellular Automata** (`04_cenario.js` reescrito): grid 40×30 cells de 80px, 4 níveis de altitude (água/areia/grama/terra), 5 passes de smoothing 3×3, render em layered overlap (polígonos wobbly oversize fundindo entre cells iguais) → 0 Wang tiles necessários
- Sombras internas em deep cells (4 cardinais do mesmo nível); tufos decorativos só em grama
- Obstáculos e currais checam `isLand` antes de spawnar (evitam água)
- `_isOverGrass`/`_grassDepth` em `07_vacas.js` refatorados pra consultar `terrainGrid` em vez de blobs explícitos
- **Linha marrom horizontal removida** do meio do mapa
- **Deploy GitHub Pages**: repo público em `https://github.com/zeroonebit/chapada-escapade`, live em `https://zeroonebit.github.io/chapada-escapade/`; `git init` + `.gitignore` + commits com co-author Claude; `ChapadaEscapade.html` renomeado pra `index.html` pra URL limpa
- Bug: HTTP server da sessão caiu, causando placeholder verde do Phaser nas imagens — diagnosticado e reiniciado; também workaround pra preview servir N: vs H:
- ⚠️ Preview do Claude Code não respeita `--directory` ou `cwd` em launch.json — sempre serve do workspace root

---

## Sessão 2026-04-26 (cont. 2) — Splash com imagem, HUD barras reais, migração H:

- `_setupSplash()` reescrito: usa `splash.png` centralizado (~70% da tela), hint piscando abaixo, física pausada até primeiro clique (`matter.world.enabled = false`)
- `_setupPausa()` melhorado: símbolo ⏸ desenhado com Graphics (`fillRoundedRect` × 2) substituiu texto "PAUSADO", + label "PAUSE" + hint "ESC para continuar"
- Game over e vitória melhorados: linhas decorativas, layout com score destacado, botão "JOGAR NOVAMENTE" mais limpo
- HUD reescrito para usar imagens reais de barra: `hud_barra_combustivel.png` + `hud_barra_graviton.png` com abordagem cover (retângulo escuro cobre a parte vazia em tempo real)
- `tools/clean_hud.py` criado: remove dígitos baked-in dos frames (solid fill com `DARK_BG=(9,16,9)`), deleta `hud_barra_frame.png` e `hud_lvl_badge.png`
- `hud_score_frame.png` limpo ("12988" removido), `hud_burger_frame.png` limpo ("5" removido)
- Renderer alterado `Phaser.AUTO` → `Phaser.CANVAS` para evitar bloqueio CORS no protocolo `file://`
- **Migração completa do projeto:** `N:\WebGames\ChapadaEscapade` → `H:\Projects\ChapadaEscapade` via `shutil.copytree` — paths em CLAUDE.md, `settings.local.json` e `launch.json` atualizados
- Jogo confirmado rodando visualmente (screenshot): HUD barras verde/roxa visíveis, score/burger/LVL no lugar
- ⚠️ Preview desta sessão só serve N: (CWD da sessão é NAS); workaround: nova sessão aberta de `H:\Projects\ChapadaEscapade`

---

## Sessão 2026-04-26 (cont.) — Implementação dos PNGs, pausa ESC e refactor modular

- Implementado `preload()` no Phaser carregando todos os PNGs (vaca/boi/HUD) — confirmado via console que 19 texturas carregam sem erro
- Substituído `generateTexture` de vaca/boi por `this.matter.add.image(x,y,'vaca_frente')` — escala 0.18 (vaca) / 0.22 (boi)
- Mudança de detecção de colisão: `texture.key` → `body.label` (porque a key agora muda dinamicamente)
- HUD reescrito pra usar sprite frames com texto sobreposto (score, burger, lvl, barras combustível/graviton)
- Fix HUD: "SCORE" e "EMPTY BAR" duplicados — labels nossos centralizados sobre o frame pra cobrir o texto baked-in
- Adicionado `_texturaDirecional(v)` — simplificado pra sempre usar `frente` (decisão do user)
- Loading de sprites enxugado: só carrega `frente`, `cima_sobe`, `cima_desce` (deixa esquerda/direita/fundo no disco mas não usa)
- Vacas/bois dentro do curral trocam pra sprite top-down (`cima_sobe` ou `cima_desce` aleatoriamente)
- **Pausa no ESC:** `Phaser.Input.Keyboard.JustDown(teclaEsc)` toggle, `matter.world.enabled = false`, overlay verde com texto "PAUSADO" + hint "ESC para continuar"
- **Refactor modular** — HTML monolítico (1215 linhas) quebrado em 12 arquivos `js/*.js`:
  - `01_scene.js` — classe + `create()`/`update()` orquestradores
  - `02_preload.js` — assets
  - `03_textures.js` — sprites geométricos (nave, hamburguer, curral, gaiola, rocha, moita, atirador, fazendeiro)
  - `04_cenario.js` — chão, grama (noise blobs), obstáculos, currais
  - `05_hud.js` — `_criarHUD`, `_posicionarHUD`
  - `06_nave.js` — LEDs, rastro, movimento, paciência
  - `07_vacas.js` — criação, IA, abdução, bacia física, virar burger
  - `08_curral.js` — drop, processamento, coleta
  - `09_inimigos.js` — atiradores fixos + fazendeiros móveis
  - `10_colisao.js` — listener + handler + repovoamento
  - `11_gameflow.js` — pausa, gameOver, vitória
  - `99_main.js` — `new Phaser.Game(config)`
  - Padrão: `Object.assign(Jogo.prototype, {...})` em cada módulo
  - HTML reduzido a 51 linhas (head + 12 `<script src>`)
- Validado no preview: 13 scripts carregam, canvas renderiza, classe `Jogo` definida, zero erros
- Drive de rede mapeado: `N:\WebGames` (mais rápido que `\\BoloNas\home\WebGames`)
- `settings.local.json` atualizado pra autorizar Read/Edit/Write/Glob/Grep em `N:\WebGames\**` + Bash básico (sleep, wc, echo) + ferramentas Claude_Preview — reduz prompts de permissão durante a sessão

---

## Sessão 2026-04-26 — Pipeline de arte + sprites de personagens e HUD

- Decisões de tileset: 32×32px, grid quadrado (não hex), blob tile transitions, WFC+CA pra geração de mapa
- Gerado Sheet A (terreno base: grama/terra/areia/água, 4 variantes cada) — aprovado
- Gerado Sheet B (transições grass↔dirt, grass↔sand, grass↔water) — aprovado, 6 tiles únicos + rotações
- Gerado e sliceado HUD completo: score, burger, lvl badge, barras combustível/graviton, mapa button → `assets/ui/`
- Gerado e sliceado sprites vaca (6 PNG: frente/fundo/cima_sobe/cima_desce/direita/esquerda) → `assets/characters/vaca/`
- Gerado e sliceado sprites boi (6 PNG: frente/fundo/cima_sobe/cima_desce/direita/esquerda) → `assets/characters/boi/`
- Criado `tools/slice_sprites.py` — slicer genérico com remoção de fundo por cor e componentes conectados
- Criado `tools/process_chars.py` — processador de personagens com flood fill das bordas + numeração automática
- Criado `refs/vacas.jpg` e `refs/huds.jpg` — originals das sheets geradas
- `.claude/launch.json` configurado em WebGames root; servidor Python rodando na porta 8080
- `checkpoint.md` copiado para `WebGames/.claude/commands/`
- Prompts fazendeiro e cows documentados; fazendeiro simplificado pra pose única top-down 3/4

---

## Sessão 2026-04-25 — Fix mobile touch-action + dev server

- `touch-action: none` adicionado em `html, body`, `#game-host` e `canvas` — impede o browser de interceptar o segundo toque como pinch-zoom, completando o fix do beam mobile
- `.claude/launch.json` criado em `WebGames/.claude/` com servidor estático Python (porta 8080, `--directory ChapadaEscapade`)
- Servidor iniciado via `preview_start`: `http://localhost:8080`
- `checkpoint.md` copiado para `WebGames/.claude/commands/` — agora acessível pelo workspace raiz

---

## Sessão anterior — Setup do projeto

- Movido `ChapadaEscapade.html` e `_v1.html` da raiz `WebGames/` para `WebGames/ChapadaEscapade/`
- Criada estrutura de pastas: `assets/`, `docs/`, `.claude/`
- Adicionado favicon SVG (mini UFO verde com alien)
- Linkado favicon no `<head>` do HTML
- Criado `CLAUDE.md` com contexto persistente do projeto
- Criado `docs/PROMPTS.md` com biblioteca dos prompts do Nano Banana
- Sheet 1 do Nano Banana revisada: beam = gradiente radial preenchido, não rings outline

## Sessões anteriores (resumo retroativo)

### Mobile UX
- Aumentado canvas pra 75vw/75vh (era 50%)
- Detecção de mobile via `device.input.touch`
- `pointer1` (primeiro dedo) move a nave; `pointer2` (segundo dedo) ativa o beam
- Hint dinâmico: "2° dedo para abduzir" no mobile, "CLIQUE E SEGURE" no desktop

### Fazendeiros móveis
- Novo sprite gerado por código: `fazendeiro` (chapéu triangular cangaceiro top-down)
- 8 fazendeiros wandering pelo mapa com mesmo sistema das vacas
- IDLE_F = 0.0008 (mesmo ritmo idle das vacas brancas)
- Atiram quando nave entra em 420px (mesma bala/dano dos atiradores fixos)
- Não colidem com vacas/nave (collisionCategory 8, collidesWith [1])

### Atiradores fixos
- 6 torres fixas: `atirador` sprite (torre quadrada vermelha com janela)
- Range 420px, fire rate 2-3.5s, dano 13 na barra COMBUSTÍVEL
- Bala laranja (4.5 px/frame), camera shake + flash no acerto
- Tint vermelho quando em alerta, branco quando idle

### Renomeação vaca_marrom → boi
- Texture key, tipo string, todas as referências (collision check, spawn, virarBurger)

### Velocidade idle das vacas
- `walkTimer` agora só atualiza `wanderAngle` (sem aplicar força)
- `_atualizarIAVacas` aplica força contínua frame-a-frame em modo idle
- Idle = `baseF * 0.5` (metade da força de fuga)
- Flee mantém: vetor sempre para grama mais próxima OU oposto da nave

### Fix do freeze
- `walkTimer` não era removido em duas paths de destruição (rocha + entrega)
- `applyForce` em corpo destruído travava o loop após poucos segundos
- Adicionado `_destruirVaca()` idempotente que limpa walkTimer + tweens + gaiola

### Pointer lock + viewport
- Canvas full-window com `Phaser.Scale.RESIZE`
- HUD reposiciona em `scale.on('resize')`
- Cursor virtual com pointer lock + ESC para liberar
