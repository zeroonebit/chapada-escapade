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

### 🚦 Workflow de teste e commits
- **Testar via GitHub Pages** — `git push` e ~30s o Pages atualiza em https://zeroonebit.github.io/chapada-escapade/
- Preview local da sessão atual quebrou (canvas vazio, scripts não rodam) — não usar
- **Commit só** quando o usuário disser `/checkpoint` no fim da sessão OU pedir explicitamente (incluindo "vamos voltar pro github" / "push")

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

### 🚧 Em andamento
- Re-habilitar **shaders** (terrain `13_terrain_shader.js` + grass `14_grass_patch.js`) — desligados pra debug. Background atual é `add.rectangle` verde + manchas de terra.
- Animar boi (chubby `e4c60ba7` tem walk-4-frames 8d + idle-shaking-head 8d + rest-idle 8d + eating south + attack south)
- Animar fazendeiro e UFO
- Bug pendente: **preview local na sessão atual quebrou** (`new Phaser.Game()` não executa, scripts carregam mas canvas vazio). Workaround: testar direto via Pages.

### 🔜 Próximos passos
1. **Animar boi** (mesmo schema da vaca: walk + idle + eating + attack como angry-equivalente)
2. **Animar fazendeiro** (running, attack, idle) — usar template animations
3. **Animar UFO** (idle/breathing-idle pra dar vida; alert state quando energia baixa)
4. **Re-habilitar terrain shader** após estabilizar — ou portar Wang playground (cr31) pra substituir CA layered overlap
5. **Anéis animados** (capture FX) — usar `animate_character` ou Phaser particles
6. **Minimapa** canto inferior esquerdo
7. **Code review:** ver tamanho do projeto e considerar TypeScript / build step (Vite) se passar de ~25 arquivos JS

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
