# Paridade Bevy ↔ Phaser — status dos dois projetos

> Levantado em **2026-08-29**. Fonte: leitura do código dos dois repos nesta data.
> **Bevy** = `H:/Projects/Bevy/ChapadaEscapade` (Rust, 3D, desktop, LOCAL-ONLY).
> **Phaser** = `H:/Projects/ChapadaEscapade` (JS, 2D top-down, web, GitHub Pages).

## Como ler este documento

O Phaser nasceu como **backport do Bevy** (fases F1–F6 em 2026-07-22), então a pergunta
"quanto falta" normalmente aponta pro lado web. Mas depois disso os dois andaram sozinhos,
e hoje **há coisas que só existem no web**. Por isso as diferenças estão em três listas:
só-Bevy, só-Phaser, e divergentes (existe nos dois mas foi resolvido diferente).

**Confiança:** o que está marcado ✔ foi verificado no código nesta sessão. O que está
marcado 📄 vem do `CLAUDE.md`/`PROGRESS.md` e **não** foi re-verificado — nem tudo lá
está atualizado (ver "Correções ao CLAUDE.md" no fim).

---

## 1. Números crus ✔

| | Bevy | Phaser |
|---|---|---|
| Linhas de código | **19.432** | **10.827** |
| Módulos | 42 `.rs` | 25 `.js` |
| Shaders | 4 WGSL (`crt`, `beam_field`, `terrain_proc`, `water_proc`) | 1 post-FX GLSL (barrel) |
| Achievements | 50 | 50 |
| Contratos (quests) | 10 no pool | 10 no pool |
| SFX | 13 | 12 |
| Faixas de música | 9 | 9 |
| Climas | 5 | 5 |
| Presets de TOD | 6 | 6 |
| Passos de tutorial | **7 + Done** | **10** |

O Bevy tem ~80% mais código. A maior parte dessa diferença **não é gameplay** — é terreno 3D
(`terrain.rs` sozinho tem 2.031 linhas), shaders, simulação de neve, editor e telemetria.

---

## 2. Placar de paridade

Nota por subsistema (0–100%), com peso pelo quanto aquilo define "é o mesmo jogo".

| Subsistema | Peso | Paridade | Comentário |
|---|---:|---:|---|
| Core loop | 20 | **95%** | abdução→curral→burger→score, quota 30, escalada, combo, porcos, fuel |
| Inimigos | 12 | **90%** | mechas 8-dir, torpedos perseguidores, friendly-fire, farmer agressivo |
| Meta | 10 | **95%** | 50 achievements + 10 contratos + save + itens raros nos dois |
| Áudio | 10 | **92%** | 9 faixas nos dois; falta 1 SFX (preso a mecânica inexistente) |
| HUD / radar | 12 | **80%** | cockpit e minimapa nos dois; faltam beacon glow e painéis laterais |
| Atmosfera / clima | 8 | **70%** | 5 climas e 6 TOD nos dois; falta sombra por hora, neve por altitude, campo de nuvens |
| Quips | 5 | **85%** | sistema igual, conteúdo divergiu |
| Tutorial | 8 | **40%** | **desenhos diferentes** — ver §5 |
| Mundo / terreno | 10 | **35%** | o maior buraco — ver §3 |
| FX / shaders | 5 | **25%** | CRT, heat-haze, água e vento GPU não existem no web |
| **TOTAL** | **100** | **≈ 76%** | |

**≈ 76% de paridade** contando só o que o jogador vê e joga.

Se incluir ferramenta de dev (editor PixaPro↔Bevy, telemetria, asset tour, tecla B — tudo
só-Bevy, peso 10 a ~15%), cai pra **≈ 70%**.

O grosso do que falta está concentrado em **dois lugares**: terreno/shaders e tutorial.
Fora deles, os dois jogos estão em ~90%.

---

## 3. Só no Bevy (não existe no web)

### Mundo e render — é aqui que mora a diferença
- **Terreno 3D com relevo** ✔ — heightfield real, chapadas com topo plano, terraços
  (praia < grama < terra), baixadas orgânicas, pico nevado intransponível. O web é
  **plano**: um canvas 2D procedural (ilha, costa, praia, grama/terra), sem altura.
- **Buracos negros** ✔ — 1-3 por seed, poço de gravidade → horizonte de eventos → game
  over em espiral. NPCs têm medo do vazio. **Não existe no web** (e por isso o SFX
  `fall.wav` do Bevy não tem par lá).
- **Água como shader** ✔ (`water_proc.wgsl`) — mesh separada, espuma cartoon em cristas,
  areia molhada dinâmica, ondas direcionais com o vento. No web a água é pintada no canvas.
- **Rios Catmull-Rom + lagoas metaball** 📄
- **Neve falling-sand** ✔ (`snow_sim.rs`, 492 linhas) — campo de profundidade vivo,
  ângulo de repouso, derretimento por altitude, o feixe **derrete trilha**, props
  bloqueiam acúmulo. No web "neve" é só partícula caindo.
- **Grama metaball 3D** 📄 — lâminas com gradiente, vacas se escondem no mato.
- **CRT post-process** ✔ (`crt.wgsl`) — barrel quártico, scanlines, vinheta, aberração,
  grão. O web tem só o **barrel** (e o véu de TOD do Bevy vive dentro do CRT).
- **Feixe como heat-haze** ✔ (`beam_field.wgsl`) — refrata o fundo, núcleo HDR no bloom.
  O web desenha círculos concêntricos.
- **Vento em partículas GPU** ✔ (`wind_gpu.rs`, bevy_hanabi).
- **Sombras dinâmicas por hora do dia** 📄 · **neve por altitude** 📄 · **campo de nuvens
  no mundo** 📄

### Vida e cenário
- **Critters** ✔ (`critters.rs`, 415 linhas) — 10 espécies em habitats (cabra, cão, gato,
  égua, sapo, pato, porco ambiente…). **Zero no web** — nenhum arquivo menciona critter.
- **Clusters semânticos de scatter** 📄 — âncora→satélites, occupancy spatial-hash.

### Ferramenta de dev — nada disso existe no web
- **Editor ao vivo** ✔ (`manifest.rs`) — `scatter.json` relido a cada 2s, re-scatter sem
  recompilar; aba 🎮 Bevy do PixaPro fala no `editor_server.py` (porta 8091).
- **Telemetria** ✔ (`telemetry.rs`) — `runtime_state.json` a cada 5s.
- **Asset tour** ✔ (`asset_tour.rs`) — passeia por 1 instância de cada asset e printa.
- **Tecla B** 📄 — bane um asset apontando o cursor.

---

## 4. Só no Phaser (não existe no Bevy)

- **Pools de música no AUTO** ✔ — o web sorteia entre 9 faixas por estado e roda pra
  próxima quando acaba. **O AUTO do Bevy ainda roteia 3 faixas fixas** — as outras 6 só
  tocam escolhendo na mão no player. Mesmo patch resolve.
- **Rodar no navegador** ✔ — Pages, sem instalar nada. O Bevy é executável desktop.
- **Controles mobile** ✔ (`12_mobile.js`) — joystick + botão de feixe.
- **Motor de wang tiles** ✔ — ainda existe no web atrás do toggle (11 tilesets, editor de
  células, auto-sort). **No Bevy foi ARRANCADO** em 2026-07-07 (-850 linhas); só restam
  comentários dizendo que morreu.
- **Tutorial de combate** ✔ — 3 passos que o Bevy não tem (ver §5).

---

## 5. Tutorial — divergiram de propósito ✔

Essa era a pergunta que originou o relatório. **A suspeita de que o Bevy está bugado no
passo do fazendeiro não se aplica: esse passo não existe lá.**

| Phaser (10 passos) | Bevy (7 + Done) |
|---|---|
| MOVE | Move |
| GRAVITON_BAR | Beam |
| ABDUCT | Abduct |
| DELIVER | Deliver |
| BURGER | Collect |
| TAKE_DAMAGE | — |
| FARMER | — |
| **FARMER_KILL** | — |
| DODGE_TORPEDOS | — |
| KILL_SHOOTER | — |
| — | Radar |
| — | Hazards (borda + buracos negros) |

O comentário no `tutorial.rs` é explícito:

> *safety BRIEFING (not combat, user: "não punitivo"): edge + black holes + a heads-up
> about scarecrows. No abduct-farmer / kill-tower.*

E o `active()` de lá desliga o jogo punitivo durante o tutorial:

> *gameplay systems read this to stay non-punitive: no fuel drain, no towers, no farmer
> fire, no game over.*

Verificado: `farmer.rs`, `fuel.rs`, `shooter.rs` e `ufo.rs` (×2) todos consultam
`tut.active()` pra se desligar. **No Bevy não existe game over durante o tutorial**, então
o loop de morte que consertamos no web em 08-10 é estruturalmente impossível lá.

Isso veio do commit `0e699f8 feat(tutorial): sandbox de aprendizado, nao punitivo (user)` —
ou seja, **foi um pedido seu no Bevy** que nunca foi refletido no web.

**Decisão pendente:** ou o web adota o desenho não-punitivo do Bevy (perde 3 passos de
combate, ganha RADAR e HAZARDS), ou o Bevy recupera os passos de combate, ou assume-se
que são dois tutoriais diferentes de propósito. Hoje **os dois ensinam coisas diferentes**.

---

## 6. Divergentes (existe nos dois, resolvido diferente)

| Assunto | Bevy | Phaser |
|---|---|---|
| Terreno | heightfield 3D + 2 shaders | canvas 2D procedural por pixel |
| Wang tiles | arrancado | vivo atrás de toggle |
| Tutorial | 7 passos, não-punitivo | 10 passos, com combate |
| AUTO da música | 3 faixas fixas | pool de 9 com rotação |
| Distorção de tela | CRT completo | só barrel |
| Feixe | heat-haze refrativo | círculos concêntricos |
| Quips | pools próprios (EN/PT) | 150+150 rethemados em 08-10 |

---

## 7. O que sobra decidir

1. **Tutorial** — alinhar ou assumir divergência (§5). É a maior diferença de *design*,
   não de tecnologia.
2. **Pools de música no Bevy** — patch pequeno, tira 6 faixas da prateleira.
3. **Terreno do web** — relevo/rios/buracos negros é escopo grande, não bug. Decidir se
   o web é "a versão simples" de propósito.
4. **Critters no web** — 10 espécies de bicho ambiente, custo baixo, ganho de vida alta.
5. **`scatter.json` está 151/151 desligado** no Bevy desde 13/07 📄 — a ilha não spawna
   prop nenhum. Você optou por deixar; segue registrado.

---

## 8. Correções ao CLAUDE.md encontradas neste levantamento

- **"tutorial 10 passos" na seção do Bevy está DESATUALIZADO** ✔ — o código tem 7 + Done
  desde `0e699f8`, e a menção a "KillTower tático" descreve um passo que foi removido.

---

## 9. Ressalva honesta

Este relatório é **leitura de código**, não teste de jogo. Nesta sessão eu não rodei o
Bevy, e o web foi verificado por estado lido no console — **nenhum dos dois foi jogado
nem ouvido**. As notas de paridade medem *o que existe*, não *o que está bom*.
