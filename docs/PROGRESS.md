# Progresso — Chapada Escapade

Log cronológico das sessões. Adicionar entrada nova no topo.

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
