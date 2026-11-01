# Chapada Escapade — versão web (Phaser)

Jogo arcade 2D top-down: uma nave alienígena sequestra vacas no Cerrado, leva pros
currais e elas viram hambúrguer. Phaser 3.60 + Matter, sem build.

**Jogar:** https://zero-onebit.com/chapada-escapade/ (o endereço antigo `zeroonebit.github.io/chapada-escapade/`
redireciona pra ele).

## Status: em fechamento (desde 01/11/2026)

O projeto tem três versões, cada uma com um papel (decisão do Thiago, 01/11/2026):

| Versão | Papel | Onde |
|---|---|---|
| **Unreal** | a principal, pra PC e Android; é a única que segue recebendo atualização | `N:\Projects\ChapadaEscapadeUE` |
| **Bevy** | versão Android | `N:\Projects\Bevy\ChapadaEscapade` |
| **Web (este repo)** | versão universal: roda em qualquer navegador | GitHub Pages |

A web congela na tag **`v1.0.0`**, depois que o checklist do celular
(`docs/CHECKLIST_CELULAR.md`) passar no aparelho e o jogo for jogado e ouvido no desktop.
Daí em diante ela não recebe mais atualização: serve de **referência e comparativo**
pro Unreal, junto com o Bevy.

- No celular pequeno (até 900 px ou toque com menos de 1024 px) a web roda um
  **teaser**; o jogo completo, com o cockpit de toque, vai do tablet e do Z Fold
  aberto pra cima.
- As regras que as três versões combinaram estão em `docs/PARITY_BEVY_PHASER.md`.

## Rodar

```bash
python -m http.server 8080
```

Abre em `http://localhost:8080`.

## Testes de regressão

Playwright + Chromium headless pilotando o jogo real (detalhes em `docs/TESTES.md`):

```bash
npm install
```

```bash
npm run test:install
```

```bash
npm test
```

## Docs

- `docs/TESTES.md` — o que cada spec cobre e os bugs que a suíte achou.
- `docs/SHIP_CHECKLIST.md` — como uma versão sai pro Pages.
- `docs/CHECKLIST_CELULAR.md` — o que só dá pra conferir num aparelho de verdade.
- `docs/PARITY_BEVY_PHASER.md` — paridade e regras combinadas com o Bevy.
- `docs/PROGRESS.md` — histórico.
