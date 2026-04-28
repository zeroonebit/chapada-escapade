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

### ✅ Pronto (cont. — sessão 2026-04-28 noite)
- **Batch v2 — 36 assets** natureza/objetos em `chars/nature/v2/inbox/` (bromélias, palmeiras, pedras, cochos, fardos, moinho, satélite, radio tower, barris, caixas, flores, igrejinha, mesa rock, etc.)
- **HUD bars v2** — `combustivel_v2.png` (red→orange) e `graviton_v2.png` (cyan→purple) via style transfer com crop de `refs/huds.jpg`
- **Variações wrecked_truck**: red / blue / green / yellow
- **Variações gas_can**: blue / green / yellow (+ red já existia)
- **`tools/asset_gallery.html`** — galeria de preview com arrow nav, auto-refresh, grid thumbs, fundo xadrez (port 8081)
- **`.claude/launch.json`** — config "gallery" porta 8081 adicionada

### 🛠 Pipeline PixelLab (novo)
- `tools/pixellab_fetch_new.py` — baixa por ID via Backblaze CDN (sem API key)
- `tools/pixellab_montage_new.py` — contact sheet pra ID visual
- `tools/organize_cercas_v2.py` — copia inbox → chars/nature/cercas_v2 com nomes legíveis
- Skill `~/.claude/skills/pixellab-asset-download/SKILL.md` documenta o padrão completo

### 🚧 Em andamento
- **Wang tiles** funcionalmente OK mas precisa de tiles "de verdade" (atualmente só palette de teste sólida)
- **Tutorial reorganização**: separar BARS em GRAVITON (após BEAM) + COMBUSTIVEL (após BURGER) — pedido do usuário
- **Curral variations**: portas abertas/fechadas, cantos retos/redondos usando os assets v2 — pedido do usuário
- **Coleta de hamburger no tutorial**: highlight no burger + coleta na posição do burger (não em cima do curral) — pedido do usuário
- **Vaca chubby sprite no curral**: substituir cima_sobe/cima_desce pelo chubby idle/walk/eat — pedido do usuário
- **Integrar assets v2 no cenário**: adicionar os 36+ novos assets em `js/03_cenario.js` NATURE_ASSETS com SCALE_MAP e bounds-aware scatter

### 🔜 Próximos passos
1. **Integrar assets v2 no cenário** — adicionar `wrecked_truck_*`, `gas_can_*`, bromélias, palmeiras, pedras etc. em `js/03_cenario.js` NATURE_ASSETS com escala e posicionamento corretos
2. **Salvar configs do user como defaults no git** — pegar `localStorage.getItem('chapEscapadeDebug')` e fazer override de `DBG_DEFAULTS` em `js/15_debug_menu.js`
3. **Toggle de input WASD + Space** na aba CONTROLES do debug menu
4. **Tileset Wang real** com transição grass↔sand↔dirt (gerar via PixelLab `create_topdown_tileset`)
5. **Boi rest_idle/attack** anims (parcial — só S no disco)
6. **Balde de leite** no curral (gerar via PixelLab MCP)

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
