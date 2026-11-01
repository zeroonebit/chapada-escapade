# Checklist de ship — Chapada Escapade (web, GitHub Pages)

> Como uma versão sai desta máquina e chega em
> https://zero-onebit.com/chapada-escapade/ (o `zeroonebit.github.io` redireciona). O Pages publica o que está em
> `main` (branch raiz, sem build): **push em `main` = deploy em ~30s**.
> Nada aqui roda sozinho — push, tag e deploy só com o ok do Thiago.

## 0. Antes de começar

- [ ] Branch de trabalho criada a partir de `main` (`git checkout -b claude/<tema>`).
- [ ] Arquivos **não versionados** continuam fora do commit: `CONTEXTO.md`,
      `.ai-memory.toml`, `docs/INVENTARIO_PIXELLAB.md`, `docs/inventario_pixellab/`,
      `tools/inventario_pixellab.py`, PNGs soltos em `refs/` e `splashv2.png`
      (`git status --short` só pode listar o que você mudou de propósito).

## 1. Verde local (obrigatório)

```bash
npm test
```

- [ ] **Suíte inteira verde** (desktop + tablet-touch + phone-touch). Reportar
      `N passed` e o tempo. "0 testes coletados" = NÃO VERIFICADO.
- [ ] Nenhum `[ASSET 404]` no boot (o `01_boot` falha se houver).
- [ ] Se mudou JS: **bump do `V`** em `index.html` (`const V = "AAAAMMDD-tag"`) — o
      Chrome serve JS velho do cache de memória sem isso (lição de 2026-07-22).
- [ ] Se mudou assets em `assets/` ou `data/maps/`: o workflow
      `.github/workflows/bake-indexes.yml` vai re-bakear os índices sozinho no push
      (commit `chore: re-bake static indexes [skip ci]`). Não precisa rodar na mão.

## 2. Ensaio Geral (obrigatório antes de qualquer push)

- [ ] Lançar o agente `ensaio-geral` em segundo plano com: repo
      (`N:\Projects\ChapadaEscapade`), branch, o que muda e o alvo (Pages a partir
      de `main`).
- [ ] Esperar o veredito: **PODE SHIPAR** ou **SHIPAR COM RESSALVAS** seguem;
      **NÃO SHIPAR** → corrigir e rodar de novo.
- [ ] Anotar o veredito em uma linha no `CONTEXTO.md`.

## 3. Validação do Thiago (o gargalo real)

Nada abaixo é automatizável; é o que falta pro `v1.0.0`:

- [ ] Jogar o tutorial (10 passos) e o loop até a quota de 30 **no desktop**.
- [ ] **Ouvir** o jogo (9 faixas, SFX, crossfade) — nunca foi escutado.
- [ ] Rodar o `docs/CHECKLIST_CELULAR.md` no celular de verdade.
- [x] Decidir o celular: **mantém o teaser** (Thiago, 01/11/2026). O jogo completo vai
      do tablet e do Z Fold aberto pra cima.
- [ ] A `v1.0.0` é o **congelamento** da web: depois dela não sai mais versão; a web
      vira referência e comparativo pro Unreal (`README.md`).

## 4. Versionar (semver)

| Situação | Tag |
|---|---|
| Hoje | `v0.9.1-alpha` (30/10/2026, conteúdo de `2530ae2`: suíte Playwright, 10 fixes, cockpit de toque) |
| Só correções e testes, sem feature nova | `v0.9.2-alpha` |
| Feature nova sem quebrar save/configs | `v0.10.0-alpha` |
| **Validado pelo Thiago** (tutorial + loop + áudio + celular) | **`v1.0.0`** — só com o ok dele, nunca antes |

- [ ] Atualizar `"version"` no `package.json` pra bater com a tag.
- [ ] `git tag -a vX.Y.Z -m "..."` **depois** do merge em `main`, nunca na branch.

## 5. Publicar

Com o ok explícito do Thiago (pergunta pelo `AskUserQuestion`), nesta ordem:

```bash
git push origin claude/<tema>
```

```bash
git checkout main
```

```bash
git merge --no-ff claude/<tema>
```

```bash
git push origin main
```

```bash
git push origin vX.Y.Z
```

- [ ] Esperar ~30s e abrir https://zero-onebit.com/chapada-escapade/ (o
      `github.io` responde 301 pro domínio `zero-onebit.com` — `curl` sem `-L` só vê
      o redirect; no browser funciona).
- [ ] Hard refresh (Ctrl+Shift+R) e conferir no console: `V` novo nos `js/*.js?v=`,
      nenhum 404.
- [ ] Jogar 1 minuto no Pages (splash → PLAY → abduzir → entregar → coletar).
- [ ] Se algo quebrou: `git revert` do merge em `main` e push — o Pages volta em 30s.

## 6. Depois

- [ ] `CONTEXTO.md` com a tag, a data e o que subiu.
- [ ] `/checkpoint` (CLAUDE.md + PROGRESS.md) se a sessão foi de código.
- [ ] Brain: o que vale pra outros projetos vai pra `N:\Brain` **pela sessão
      coordenadora**, não daqui.
