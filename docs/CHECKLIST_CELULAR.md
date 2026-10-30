# Checklist de celular — só dá pra conferir num aparelho de verdade

> A suíte emula toque por CDP (Chromium headless) e cobre lógica e fluxo. O que está
> aqui depende de hardware, browser móvel real ou olho/ouvido humano.
> URL: https://zeroonebit.github.io/chapada-escapade/ (ou o IP da máquina na porta 8080
> com `python -m http.server 8080` na pasta do repo, no mesmo Wi-Fi).

## Como o jogo se comporta hoje no celular (pra saber o que esperar)

- Tela ≤ 900 px de largura **ou** toque + largura < 1024 → **modo teaser** (`index.html`,
  decisão de 29/04/2026): pula o splash, esconde o HUD, sem inimigos, até 5 vacas,
  tempestade à meia-noite, o feixe acende mas **não abduz**, a nave tem inércia alta e
  quica nas bordas. Em retrato aparece o aviso **ROTATE**.
- O joystick + botão BEAM do `12_mobile.js` **não aparece** em nenhum aparelho: ele
  exige `isMobile && !__MOBILE_MODE`, e toda tela que liga `isMobile` liga o teaser
  antes. Se o Thiago quiser o jogo completo no celular, é uma decisão de design
  (ver `CONTEXTO.md`), não um bug de teste.
- Tablet em paisagem com ≥ 1024 px (iPad landscape, por exemplo) → **jogo completo**,
  com o dedo fazendo o papel do mouse: tocar = mover a nave até o dedo **e** ligar o feixe.

## Celular (Android Chrome e/ou iPhone Safari)

### Carregamento
- [ ] Preloader vermelho com CHAPADA ESCAPADE aparece e a barra chega a 100%.
- [ ] Tempo até o jogo aparecer no 4G/5G (anotar segundos; os 7 atlases são ~1 MB,
      os MP3 de música só baixam depois, um por vez).
- [ ] Nenhum "CREATE ERR" em caixa vermelha na tela.

### Orientação e tela
- [ ] Retrato: aviso **ROTATE** cobre tudo; ao girar pra paisagem ele some sozinho.
- [ ] Paisagem: canvas ocupa a tela inteira, sem borda arredondada, sem barra branca.
- [ ] Notch / barra de gestos não cobrem o título (safe-area do `index.html`).
- [ ] Barra de endereço do browser não rouba altura depois do primeiro toque
      (se roubar: "Adicionar à tela inicial" resolve? o `apple-mobile-web-app-capable`
      está no HTML).
- [ ] Pinch-zoom e scroll da página **não** acontecem (`touch-action: none`).

### Teaser (comportamento atual)
- [ ] Segurar o dedo: nave acelera na direção do dedo; soltar: continua deslizando e
      quica na borda.
- [ ] Feixe acende embaixo da nave enquanto o dedo está na tela; vacas **não** sobem.
- [ ] Chuva densa + vinheta escura + relâmpago da tempestade estão visíveis e o jogo
      não engasga (anotar FPS percebido: liso / tranco leve / injogável).
- [ ] A cada 30-50 s o clima/hora muda (sempre escuro: dusk/sunset/night/midnight).
- [ ] Quips do `MOBILE_QUIPS` aparecem ("só PC").
- [ ] Deixar 3 minutos rodando: nada trava, aquecimento do aparelho aceitável.

### Áudio no celular
- [ ] Música de menu/jogo toca **depois do primeiro toque** (autoplay bloqueado antes).
- [ ] Volume razoável nos alto-falantes; não distorce.
- [ ] Trocar de app e voltar: música retoma ou fica muda? (anotar)

## Tablet em paisagem (≥ 1024 px) — jogo completo no toque

- [ ] Splash: botões PLAY / TUTORIAL respondem ao toque na primeira vez (hit area
      expandida compensa o barrel).
- [ ] ⏮ ⏯ ⏭ do splash: um toque = uma ação (gate de 250 ms contra o duplo pointerdown).
- [ ] Tutorial 01-05 com o dedo: mover, segurar pro feixe, abduzir, entregar, coletar.
- [ ] Tutorial 06-10: levar tiro, capturar fazendeiro, pedra, torpedos, mecha —
      **dá pra fazer curva com o dedo rápido o bastante pra esquivar?** (09 é o passo
      que mais depende de destreza).
- [ ] ESC não existe: dá pra pausar / abrir CONFIGS? (hoje só por teclado — anotar
      se faz falta).
- [ ] Multi-toque: segundo dedo na tela não rouba o controle (o jogo ignora pointers
      além do primeiro em `isMobile`, mas no tablet `isMobile` é falso).
- [ ] Teclado virtual nunca aparece.

## Ambos
- [ ] Rodar o jogo com a tela do celular em 100% de brilho ao sol: o cockpit e o
      MISSION LOG continuam legíveis?
- [ ] Bateria depois de 10 minutos (anotar %).
- [ ] Anotar aparelho, browser, versão e data no `CONTEXTO.md`.
