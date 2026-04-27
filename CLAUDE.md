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

## Estado atual (atualizar a cada sessão)

### ✅ Pronto
- Loop principal: nave → abdução → curral → burger → score
- Feixe graviton com barra de energia (drain/regen)
- Vacas brancas + bois marrons — sprite `cima_sobe` (top-down) com **rotação livre pela física** (glissagem visual ao entrar no feixe via `setAngularVelocity` random)
- Atiradores fixos (6 torres) com dano à barra COMBUSTÍVEL
- Fazendeiros móveis com chapéu cangaceiro (8 wandering)
- **Mobile controls (joystick + botão)** — `js/12_mobile.js`: joystick virtual à esquerda (vetor → alvo virtual 220px à frente da nave) + botão FEIXE à direita; substitui o "2° dedo" antigo
- Fix do freeze (cleanup de walkTimer em destruição)
- Idle das vacas a 50% da velocidade de fuga
- **PNGs implementados no Phaser** — preload + texturas vaca/boi/HUD funcionando
- **HUD novo:** COWS + BURGERS boxes (sliced de `refs/cow-burgers.png`) lado a lado no topo-esq; barras COMBUSTÍVEL e GRAVITON empilhadas no rodapé com frames-com-label baked-in (sliced de `refs/hud-vazia.png`) e fill desenhado por `Graphics.fillGradientStyle` (amarelo→vermelho / azul→roxo); score topo-centro
- **Pausa no ESC** com símbolo ⏸ + label "PAUSE"
- **Splash screen** com `splash.png` centralizado, hint piscando, física pausada até primeiro clique
- **Renderer CANVAS** — evita bloqueio CORS ao abrir via `file://`
- **Game over / vitória** com layout limpo
- **Refactor modular** — 13 arquivos `js/*.js` via `Object.assign(Jogo.prototype, {...})`
- **Cenário procedural via Cellular Automata** — grid 40×30 cells de 80px, 4 níveis altitude (água/areia/grama/terra), 5 passes smoothing, render layered overlap (0 Wang tiles), sombras em deep cells, tufos de grama, obstáculos/currais checam `isLand`. `_isOverGrass`/`_grassDepth` consultam `terrainGrid`. Linha marrom horizontal removida.
- **Deploy GitHub Pages** — `git push` em `main` faz deploy automático em ~30s na URL https://zeroonebit.github.io/chapada-escapade/

### 🚧 Em andamento
- Geração dos sprites Nano Banana restantes
  - ✅ `assets/ui/` — score, burger, COWS box, BURGERS box, frames combustível/graviton, mapa
  - ✅ `assets/characters/vaca/` e `boi/` — 6 sprites cada
  - ✅ Tileset terreno base + transições — aprovados, falta slicear
  - 🕒 Fazendeiro — prompt pronto, geração pendente
  - 🕒 UFO/nave — pendente
  - 🕒 Burgers, effects — pendentes
- Substituir layered overlap CA por Wang tiles "de verdade" quando os tiles SVG/PNG estiverem prontos (a função de seleção 16-pattern por boundary é o próximo passo)

### 🔜 Próximos passos
1. Gerar fazendeiro (pose única top-down 3/4) e implementar
2. Gerar UFO + beam halo + burgers (Sheet 1 revisada)
3. Slicear tileset de terreno (Sheets A/B já aprovadas) e popular `assets/terrain/`
4. Substituir `drawWobblyCell` por `add.image(cx, cy, tileKey)` selecionado por vizinhos do `terrainGrid` (usar skill `procedural-tilemap`)
5. Anéis animados (capture FX)
6. Minimapa no canto inferior esquerdo

### 🛠 Ferramentas criadas
- `tools/slice_sprites.py` — slicer genérico (qualquer sheet)
- `tools/process_chars.py` — processador de personagens (flood fill + numeração)
- `tools/clean_hud.py` — remove dígitos baked-in dos frames HUD
- `tools/slice_hud_frames.py` — extrai frames GRAVITON/COMBUSTÍVEL de `refs/hud-vazia.png`
- `tools/slice_cow_burger.py` — extrai boxes COWS/BURGERS de `refs/cow-burgers.png`
- `tools/migrate_to_projects.py` — migrou de N: pra H: (one-shot, mantido por referência)

## Convenções de código

- **Idioma:** identificadores em português onde já estão (`vaca`, `nave`, `curral`, `paciencia`) — não anglicizar
- **Sem build step** — tudo inline no HTML, scripts via CDN
- **Comentários em PT-BR** seguindo o padrão existente
- **Edits cirúrgicos** com a tool Edit, evitar reescrever blocos grandes
- **Validar no preview** após cada mudança visual

## Skills úteis pra este projeto

- `procedural-tilemap` — Wang tiles, WFC e Cellular Automata pra terrain procedural (criada nesta sessão)
- `engineering:debug` — quando rolar bug de física/matter.js
- `design:design-critique` — pra avaliar feedback visual da arte gerada
- `anthropic-skills:canvas-design` — se precisar gerar diagramas/mockups
- Não precisa de testing-strategy/code-review formal — projeto pessoal/criativo

## Comandos do projeto

- **`/checkpoint`** — rodar **antes de desligar o computador**. Atualiza CLAUDE.md, docs/PROGRESS.md e docs/PROMPTS.md com tudo que aconteceu na sessão, oferece backup do HTML se houve mudanças significativas. Garante que nada se perde entre sessões.
