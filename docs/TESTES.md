# Testes de regressão — Chapada Escapade (web)

> Suíte Playwright que pilota o **jogo real** (Phaser 3.60, sem build) em Chromium
> headless. Criada em 2026-10-29. Roda local e isolada: nada sai da máquina.

## Rodar

```bash
npm install            # uma vez: @playwright/test + phaser (cópia local do CDN)
npm run test:install   # uma vez: baixa o Chromium do Playwright (~150 MB)
npm test               # suíte inteira (desktop + tablet-touch + phone-touch)
```

Variações:

| Comando | O que faz |
|---|---|
| `npm run test:desktop` | só o projeto `desktop` (1280×800, mouse) |
| `npm run test:touch` | só `tablet-touch` (1024×768, toque) + `phone-touch` (375×812) |
| `npm run test:headed` | desktop com o browser visível (pra assistir) |
| `npx playwright test tests/e2e/03_tutorial.spec.js` | um arquivo só |
| `npx playwright show-report` | abre o relatório HTML da última execução |
| `npx playwright show-trace test-results/<pasta>/trace.zip` | trace de um teste que falhou |

O `webServer` do `playwright.config.js` sobe `tests/serve.cjs` em `127.0.0.1:8787`
(servidor estático em Node, zero dependências). Se já houver um na porta, reaproveita.
A porta 8080 do `python -m http.server` continua livre pro preview manual.

## Como funciona

- **Determinismo:** antes de qualquer script, a fixture injeta um PRNG com seed
  (mulberry32) no `Math.random`. `Phaser.Math.Between/FloatBetween` usam `Math.random`,
  então terreno, currais, vacas e mechas nascem **sempre no mesmo lugar** pra mesma seed
  (`DEFAULT_SEED = 20261029` em `tests/e2e/fixtures.js`). A física continua dependendo do
  `delta` real do frame, então posições dinâmicas variam alguns px.
- **Offline:** o `phaser.js` do CDN é servido do `node_modules/phaser/dist/phaser.js`
  (mesma versão 3.60.0); Google Fonts vira stub; o `project_server` (`localhost:8090`)
  é respondido com `{maps: []}` porque não faz parte do jogo.
- **Sem hooks novos no jogo:** os testes só usam o que já existia — `window.game`
  (99_main.js), `_splashStartGame` (hook do botão PREVIEW), as flags do tutorial
  (`_tutMinReadMs` cai de 5s pra 700ms no teste de ponta a ponta) e o estado da cena.
- **Input real:** os botões do splash são clicados nas coordenadas do 11_gameflow.js;
  no desktop a nave é pilotada com o mouse (modo mouse) ou teclado (WASD + SPACE);
  nos projetos touch os dedos são `TouchEvent`s sintéticos disparados no canvas
  (`new Touch`/`new TouchEvent`, cada dedo com seu `identifier`) — no tablet, um dedo na
  bola do joystick do painel (`steer`) e outro na lente do emissor (`beamDown/Up`), como o
  12_mobile.js espera; no celular (teaser) um dedo cru no mapa. Não é CDP: o
  `Input.dispatchTouchEvent` casa os pontos entre eventos por índice, e soltar o 1º dedo
  com o 2º preso virava "o 2º soltou".
- **Boot limpo:** `console.error`, `pageerror` e avisos `[ASSET 404]` são coletados e
  qualquer um deles falha o teste (`game.realErrors`). Avisos de WebGL/SwiftShader do
  headless são filtrados.

## O que cada spec cobre

| Spec | Projeto | Cobre |
|---|---|---|
| `01_boot` | desktop | página carrega sem erro/404, 9 atlases + splash + SFX no cache, cena no splash, mundo determinístico por seed, 3s de `update()` sem erro |
| `02_menu` | desktop | PLAY → ENG/PTBR → MOUSE/WASD e TUTORIAL → MOUSE com cliques reais; preferência salva no localStorage; ESC abre/fecha o CONFIGS no splash; transport de música (⏭) + conquista `audiophile` |
| `03_tutorial` | desktop | **os 10 passos jogados de ponta a ponta** com o mouse: mover, drenar/recarregar graviton, abduzir vaca, entregar no curral, coletar burger (fuel a 15%), levar tiro congelado, capturar fazendeiro, matar na pedra, esquivar 5 torpedos, abater mecha com arremesso; conclusão grava `cep_tutorial_done` + `graduate` |
| `04_loop` | desktop | vaca → curral (slot loading, mascote x1, contador do cockpit) → burger pronto em 3s → coleta pelo feixe (+100 pts, +22 fuel, 1/30, `alien_chef`); WASD + SPACE; **quota 30 → VITÓRIA** → JOGAR NOVAMENTE reinicia sem splash |
| `05_pause_restart` | desktop | ESC pausa (física off, overlay, CONFIGS, vacas paradas, fuel parado) e retoma; game over por tanque vazio → RESTART duas vezes **sem duplicar** objetos, corpos, `#debug-menu` nem listeners de resize; resize após restart não estoura; morrer no tutorial retoma do passo (BURGER com ≥50% de tanque) |
| `06_save` | desktop | save (`chapEscapadeSave`) e configs (`chapEscapadeDebug`) sobrevivem ao reload (matches 1→2, conquista sem toast repetido); JSON corrompido volta pros defaults; `_tutConcluir` persiste o tutorial e dá `graduate` |
| `07_touch` | tablet-touch | 1024×768 **não** cai no failsafe mobile: splash tocável; **cockpit de toque** (painel a 80% da largura, dedo na bola do joystick move, dedo na lente liga o feixe, toque no mapa não faz nada, dois dedos juntos); loop vaca→curral→burger pelo joystick; **tutorial inteiro no toque** |
| `08_phone` | phone-touch | 375×812 retrato = prompt ROTATE; 812×375 = **modo teaser** (sem splash/HUD/inimigos, feixe só visual, tempestade à meia-noite, inércia alta); 8s sem erro |
| `09_steps` | desktop | invariantes: passo 06 congela de verdade e repõe o atirador; drain independe do fps; tanque cheio no 06 e na conclusão; drain não cresce com o tempo |
| `10_cockpit` | desktop | painel na base: 80% da largura ou 32% da altura (o que vier primeiro), centrado, colado embaixo; lente acende com o mouse apertado (`_beamWanted`) |

## Garagem

Não existe na versão web: a garagem (naves/skins) foi implementada só no Bevy (CONTEXTO
de 13/10). A conquista `full_fleet` ("Unlock every saucer variant") existe na tabela mas
é dormente. Nada a testar aqui até portar.

## Bugs achados pela suíte em 2026-10-29 (cada um com teste que falhava antes)

| # | Bug | Onde | Teste que pegou |
|---|---|---|---|
| 1 | **Vitória travava o jogo**: slot vazio de curral é `null` e `_hideForCinematic` estourava TypeError; sem try/catch na vitória = `gameOver` sem tela nem botão. No game over o mesmo erro caía no fallback silencioso — o cinematic (espiral + vinheta) nunca tinha rodado | `11_gameflow.js` | `04_loop` quota → VITÓRIA; `05` cinematic de game over |
| 2 | **Listeners de resize vazavam** a cada `scene.restart` (7 módulos registravam direto no ScaleManager do game): 9 → 14 → 19 closures presas a objetos destruídos | `01_scene.js` `_onResize` + `_sceneCleanup` (+ 6 módulos) | `05` restart sem duplicar |
| 3 | **Tutorial concluído nunca era gravado** (`cep_tutorial_done` / `save.tutorialDone` só eram lidos) → conquista `graduate` dormente | `17_tutorial.js` `_tutConcluir` | `06_save` graduate; fim do `03` |
| 4 | **Caixa COWS do cockpit mostrava a carga do feixe**, não o total entregue (BULLS mostrava o total; Bevy mostra `cows_delivered`) | `01_scene.js` `_updateBody` | `04_loop` |
| 5 | **Morrer no passo 05 (BURGER) e retomar = soft-lock**: o restart limpa vacas e currais, o resume pula o spawn do ABDUCT/DELIVER, e a lição (coletar um burger) ficava impossível | `17_tutorial.js` caso `BURGER` | `05` retomar no BURGER; `03` round 2 |
| 6 | **Feixe do teaser nunca acendia no celular**: com `isMobile` o jogo lê `_beamHeld`, que só o joystick preenche — e o joystick não existe no teaser (`12_mobile` sai cedo). O dedo na tela já movia a nave (`_moveShip`) mas o cone (e o hum do feixe) ficavam mudos | `01_scene.js` `_updateBody`, `21_audio.js` | `08_phone` paisagem |
| 7 | **Resume nos passos 08/09/10 com baseline velho = soft-lock**: `_tutStepInit` sobrevive ao `scene.restart` (a cena é reusada), então ao retomar o passo o contador-base (`_tutShooterBase` etc.) não era recapturado. Cenário comum: fogo amigo mata um mecha no 09, a nave morre no 10, retoma, abate o mecha e **nunca avança** | `17_tutorial.js` `_setupTutorial` | `05` "mecha abatido no passo 09, morte no 10" |
| 8 | **Passo 06 (REVIDE) travava sem saída**: o "congelar" só cortava a força — quem chegava do curral a toda continuava deslizando, o tiro reto (mira a posição do disparo) passava longe e o fazendeiro, que não persegue nave congelada, passeava pra fora dos 420px e nunca mais atirava. Nave e tanque congelados = nem morrer dava. Fix: zera a velocidade ao congelar e repõe o atirador se nenhum estiver no alcance | `17_tutorial.js` caso `TAKE_DAMAGE` | `09_steps` (2 testes); era a causa da instabilidade do `07_touch` tutorial |
| 9 | **Tanque e graviton drenavam pelo delta da cena, não pelo passo da física**: o Matter limita o passo a ~33ms (`runner.deltaMax`) mas o `delta` da cena chega a 200ms (`minFps` 5). Com fps baixo a nave andava 33ms e pagava 200ms de combustível — até 6× mais caro por metro (achado do Ensaio Geral, que viu a suíte morrer de fome com 3 workers) | `06_ufo.js` `_updateFuel`, `01_scene.js` (graviton) | `09_steps` "frame de 200ms" |
| 10 | **Drain de tanque dobrava a cada ~55s**: `difficulty += 0.000018·delta` por frame multiplicava o drain pra sempre — aos 5 min um tanque cheio durava 4s de voo (uma partida de 30 burgers leva 5-10 min). O Bevy (`fuel.rs`) não tem multiplicador por tempo; a escalada é por quota (`_escalation`). Era a causa da "morte de tanque" em todo teste longo | `01_scene.js` `_updateBody`, `06_ufo.js` `_updateFuel` | `09_steps` "não escala com o tempo" |

## Limites do headless (o que a suíte NÃO prova)

- **Áudio**: WebAudio roda, o estado (faixa, volume, pools) é lido, mas ninguém OUVE.
- **Visual**: WebGL é por software (SwiftShader). Screenshots só em falha. Paleta, barrel,
  shaders e legibilidade do cockpit precisam de olho humano.
- **Celular de verdade**: o toque é emulado por CDP. Latência, multi-toque real, Safari iOS,
  safe-area do notch e fullscreen ficam no checklist `docs/CHECKLIST_CELULAR.md`.
- **Tempo**: o tutorial roda com leitura mínima de 700ms por passo (não 5s). A espera
  real de 5s é só um timer; o fluxo é o mesmo.
