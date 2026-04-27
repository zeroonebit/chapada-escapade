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
- **Hospedagem:** drive local — `H:\Projects\ChapadaEscapade` (servido via Python HTTP server porta 8080)

### Arquivos principais
- `ChapadaEscapade.html` — só CSS + carregamento dos módulos `js/*.js` (51 linhas)
- `js/01_scene.js` … `99_main.js` — código modular (classe + `Object.assign(Jogo.prototype, {...})`)
- `ChapadaEscapade_v1.html` — backup pré-fazendeiros/atiradores
- `assets/` — PNGs do Nano Banana (em construção)
- `docs/PROGRESS.md` — log cronológico de mudanças
- `docs/PROMPTS.md` — biblioteca dos prompts Nano Banana

### Localização
- **Projeto:** `H:\Projects\ChapadaEscapade`
- **Preview:** `http://localhost:8080` (launch config em `.claude/launch.json`)

## Estado atual (atualizar a cada sessão)

### ✅ Pronto
- Loop principal: nave → abdução → curral → burger → score
- Feixe graviton com barra de energia (drain/regen)
- Vacas brancas + bois marrons (drop 2-3 burgers)
- Atiradores fixos (6 torres) que disparam dano à barra COMBUSTÍVEL
- Fazendeiros móveis com chapéu de cangaceiro (8 wandering)
- Mobile: 2° toque ativa beam (`addPointer(1)` + `touch-action: none`), scale 75vw/75vh
- Fix do freeze (cleanup de walkTimer em destruição)
- Idle das vacas a 50% da velocidade de fuga
- **PNGs implementados no Phaser** — preload + texturas vaca/boi/HUD funcionando
- HUD com sprite frames + texto sobreposto (score, burger, lvl, barras combustível/graviton)
- Vacas/bois usam sprite `frente` no movimento, troca pra `cima_sobe`/`cima_desce` dentro do curral
- **Pausa no ESC** com símbolo ⏸ (Graphics `fillRoundedRect`×2) + label "PAUSE" (matter.world.enabled = false)
- **Splash screen** com `splash.png` centralizado, hint piscando, física pausada até primeiro clique
- **HUD barras reais** — `hud_barra_combustivel.png` + `hud_barra_graviton.png` com cover approach (retângulo escuro cobre parte vazia)
- **HUD frames limpos** — dígitos baked-in removidos por script Python; `hud_barra_frame.png` e `hud_lvl_badge.png` deletados
- **Renderer CANVAS** — `Phaser.CANVAS` evita bloqueio CORS ao abrir via `file://`
- **Game over / vitória** com layout limpo: linhas decorativas + score destacado + botão restart
- **Refactor modular** — código quebrado em 12 arquivos `js/*.js` via `Object.assign(Jogo.prototype, {...})`

### 🚧 Em andamento
- Geração dos sprites Nano Banana restantes
  - ✅ `assets/ui/` — 7 HUD PNGs (score, burger, lvl, barras, mapa)
  - ✅ `assets/characters/vaca/` — 6 sprites
  - ✅ `assets/characters/boi/` — 6 sprites
  - ✅ Tileset terreno base + transições — aprovados, falta slicear
  - 🕒 Fazendeiro — prompt pronto, geração pendente
  - 🕒 UFO/nave — pendente
  - 🕒 Burgers, effects — pendentes

### 🔜 Próximos passos
1. **Abrir nova sessão de `H:\Projects\ChapadaEscapade`** — para o preview servir H: diretamente
2. Testar splash screen visualmente (deve aparecer antes do primeiro clique)
3. Testar pause ⏸ e game over/vitória visualmente
4. Gerar fazendeiro (pose única top-down 3/4) e implementar
5. Gerar UFO + beam halo + burgers (Sheet 1 revisada)
6. Slicear tileset de terreno e popular `assets/terrain/`
7. Implementar tilemap procedural (CA → blob tile lookup)
8. Anéis animados (capture FX)
9. Minimapa no canto inferior esquerdo

### 🛠 Ferramentas criadas
- `tools/slice_sprites.py` — slicer genérico (qualquer sheet)
- `tools/process_chars.py` — processador de personagens (flood fill + numeração)

## Convenções de código

- **Idioma:** identificadores em português onde já estão (`vaca`, `nave`, `curral`, `paciencia`) — não anglicizar
- **Sem build step** — tudo inline no HTML, scripts via CDN
- **Comentários em PT-BR** seguindo o padrão existente
- **Edits cirúrgicos** com a tool Edit, evitar reescrever blocos grandes
- **Validar no preview** após cada mudança visual

## Skills úteis pra este projeto

- `engineering:debug` — quando rolar bug de física/matter.js
- `design:design-critique` — pra avaliar feedback visual da arte gerada
- `anthropic-skills:canvas-design` — se precisar gerar diagramas/mockups
- Não precisa de testing-strategy/code-review formal — projeto pessoal/criativo

## Comandos do projeto

- **`/checkpoint`** — rodar **antes de desligar o computador**. Atualiza CLAUDE.md, docs/PROGRESS.md e docs/PROMPTS.md com tudo que aconteceu na sessão, oferece backup do HTML se houve mudanças significativas. Garante que nada se perde entre sessões.
