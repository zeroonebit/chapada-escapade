# Progresso — Chapada Escapade

Log cronológico das sessões. Adicionar entrada nova no topo.

---

## Sessão 2026-05-02 (continuação · noite) — Pages-only mode + GitHub API write + Browse tab

**Tema:** Eliminar dependência de servers locais. PixaPro 100% serverless via GitHub Pages + GitHub API. ~12 commits Chapada + 12 commits PixaPro.

### Pages-only mode (read sem servers)
- `tools/bake_indexes.py`: gera `data/maps/_index.json` + `data/_assets_index.json` (manifest static)
- `bake_indexes.py` agora inclui `inGame: bool` em cada asset (porta a lógica do `/scan_in_game_assets`): 879 total, 751 in-game, 128 órfãos
- `.github/workflows/bake-indexes.yml`: GitHub Action auto-roda bake em pushes que tocam `assets/`, `data/maps/`, ou o script. Commita de volta com `[skip ci]`
- `.nojekyll` adicionado (Pages ignora `_-prefix` por default sem isso)
- Maps movidos de `tools/saves/projects/<slug>/maps/` (privado) → `data/maps/` (committed → Pages serve)

### PixaPro deployed em Pages
- Repo criado: `https://github.com/zeroonebit/pixapro` (push -u origin main)
- Pages enabled via `gh api`: `https://zeroonebit.github.io/pixapro/`
- `config.js` estático com defaults (substituí o dinâmico do server.py em deploy Pages)
- `tab-map.js` + `tab-naming.js`: `fetchWithFallback(serverPath, pagesPath)` — tenta server local (timeout 2s), senão Pages
- UI mostra source ativa: `(local · read+write)` vs `(Pages · read-only)`. Save/Apply desabilitam em modo Pages quando sem PAT

### Multi-project support
- `js/projects.js`: `PixaProjects` API global — `getActiveSlug`, `getActiveCfg`, `fetchWithFallback`, `populateSelector`
- Lê `linkedProjects` de `window.PIXAPRO_CFG` (`config.js`)
- Active project persiste em `localStorage`
- Custom event `pixapro:project-changed` notifica tabs
- `tab-map.js` + `tab-naming.js` deduplicados (-44 linhas comuns)
- Dropdowns auto-populam de `<select data-pixa-projects>`

### Asset naming features
- `project_server.py` ganhou `POST /apply_renames_with_refs` (transacional + dry_run)
- Algoritmo `diff_prefix`: detecta clusters de renames com mesmo padrão (ex: `chars/nature/X/` → `env/X/`)
- Auto-update de prefixes nos `js/*.js` (substituição literal + template-based via regex)
- Backup completo em `tools/saves/asset_rename_backup_<ts>/` com `js_backup/` pra rollback
- Re-bake automático dos indexes após apply
- PixaPro UI: 2 stat cards (in-game / órfãos) + filtro radio na Naming tab + badge IN/ORF por linha
- Botão verde **"✨ Apply + Update JS"** com preview detalhado no confirm

### GitHub API write (zero local server)
- `js/github-api.js`: PAT management + Contents API helpers (`getFile`, `putFile`, `saveTextFile`) + `batchTreeOperations` (atomic multi-file commits via Trees API)
- `js/github-modal.js`: UI handler do modal **🔑 GitHub** no header
- Modal: instruções de gerar PAT (scope `repo`) + Test/Save/Remove · PAT em `localStorage`
- `tab-map.js` Save: tenta server local primeiro, senão Contents API com PAT — commita `data/maps/<name>.json`
- `tab-naming.js` Apply: se Pages mode + PAT, usa `applyWithRefsViaGithub` — calcula prefix changes + js updates client-side, executa via `batchTreeOperations` (1 commit atomico)
- GitHub Action existente faz re-bake automático em ~30s

### PixaPro audit cleanup
- `PixaPro/server.py`: 390 → 88 linhas (-77%) — só serve static + `/config.js` dinâmico. Endpoints duplicados removidos (vivem no project_server.py de cada projeto)
- `tools/saves/projects/` deletado do Chapada (data/maps/ é canonical agora)
- `project_server.py`: maps_dir agora lê de `data/maps/` direto (alinha com Pages flow)

### Browse tab (gallery completa)
- Nova aba **🔍 Browse** mostra todos os 879 assets do projeto ativo
- Filtros: category dropdown (auto-populated de by_category), in-game radio, search com debounce, view grid/list
- Grid: thumbs 110px lazy-loaded com badge IN/ORF, max 200 por render
- Detail panel: imagem 200px + path + category + in-game + tags JSON + suggested_path + link "Open in new tab"
- Asset URLs apontam pra `<project.pages>/<asset.path>` (cross-origin Pages-to-Pages funciona)
- **Tag filter syntax:** `char:cow dir:N anim:walk frame:0 style:dirt_grass_32 bits:5` + negação com `-` + texto livre

### Convenção de portas final
- **8080** = game canvas
- **8089** = PixaPro UI standalone (opcional — só pra dev local)
- **8090** = project_server.py do projeto (opcional — só pra dev local)
- **Pages** = ambos (PixaPro + project) — zero local

### URLs ativas
- 🌐 PixaPro UI: https://zeroonebit.github.io/pixapro/
- 📦 PixaPro repo: https://github.com/zeroonebit/pixapro
- 📦 Chapada data: https://zeroonebit.github.io/chapada-escapade/data/...

### Pendências reais
- Apply renames real end-to-end (sistema todo pronto, é 1 clique)
- Map presets reais (criar 5-6 variados, wirar pro splash)
- Tutorial 09/10 completion logic (ainda placeholder)
- Grass blades wind_sway anims (BLOCKED externamente)

---

## Sessão 2026-05-02 — Audit cleanup + PixaPro spinoff + Asset Naming Standard

**Tema da sessão:** consolidar arquitetura — PixaPro vira repo standalone (`H:/Projects/PixaPro`) com API consumida pelo Chapada via HTTP. Asset naming convention centralizada. ~15 commits Chapada + 8 commits PixaPro.

### Audit cleanup (deletar duplicação)
- `tools/pixapro/` (Chapada) **DELETADO** — era cópia stale, drift entre as 2 versões. PixaPro canonical agora em `H:/Projects/PixaPro/`
- `tools/asset_gallery.html` (Chapada) **DELETADO** — UI antiga, substituída pelo PixaPro standalone
- `gallery_server.py` → **`project_server.py`** — nome reflete papel real (serve estático + API REST consumida pelo PixaPro)
- Total: -3620 linhas duplicadas removidas
- **Convenção de portas final:** 8080 game · 8089 PixaPro UI · 8090 project_server (cada projeto roda o próprio)

### Wang tiles bugs — 3 fixes encadeados
- **Convenção errada** — código usava `NE=1, SE=2, SW=4, NW=8` (rotacionado). PixaPro e os assets são cr31 standard `NW=1 NE=2 SE=4 SW=8`. Fix: `idx = nw + ne*2 + se*4 + sw*8`
- **CA convergindo tudo pra grass** — média 3×3 arredondada misturava tipos categóricos (water+grass = sand?!). Substituído por **majority vote** (modo, não média) — preserva blobs naturais
- **Corner grid derivado do cell grid** — dependia de "maioria de grass nos 4 cells vizinhos". Com tudo grass após bug #2, todos os cantos viravam 1 → todos os tiles = 15. Substituído por **vertex grid binário direto** (white noise + CA majoritário, mesma lógica do `generateTerrainGrid` do PixaPro)
- **Runtime auto-sort** por color sampling — resolve PixelLab CCW-shifted convention sem mexer no asset (port do `autoSortTiles` do PixaPro, cacheado em `_wangRemap[style]`)
- **Debug overlay** com nº dos tiles (toggle live no menu CONFIGS aba VFX)

### HUD layout final
- **6 boxes em row no top:** BULLS · COWS · FARMERS · [SCORE] · SHOOTERS · BURGERS (score na 4ª pos, meio da row)
- **Radar bottom-right** com frame Graphics custom (era PNG perspectivo + glass dome no bottom-left)
  - Layers: outer glow ellipse → anel escuro principal → bordas finas verde brilhante → 4 rivets cardinais
  - Cor `0x001a08` matching tutorial bg + tint sutil `alpha 0.20` cobrindo só a cavidade
- **GeometryMask removido** — era causa do bug "radar não inicializa primeira sessão" (mask shape não aplicava no WebGL até primeiro `scene.restart`)
- **Labels FUEL/GRAVITON** posicionados nos slots pretos do HUD combined (cor `#aaffcc` matching coluna esquerda)

### Atmosphere + game flow polish
- **Shuffle a cada restart** (desktop) — TOD random + weather random (clear/rain/fog/storm/snow) + wind 50/50 on/off + intensidade random `±0.045`
- **Fuel drain por movimento** — `(0.4 + 3.1 × speedNorm) × difficulty`, parado ~0.4/s, full ~3.5/s
- **2º game over UI fix** — flags `_gameOverUiShown`/`_gameOverFx`/`_gameOverSmokeEvent` resetados em `_createBody` (scene.restart reusa instância)
- **Restart i18n** — PT: JOGAR NOVAMENTE / EN: RESTART nos 2 botões (vitória + game over)
- **Burgers spacing** `SLOT_W` 32→56px + reposicionados ao **norte** do corral (era ao sul)

### Wind cartoon swirls
- `_thickness` randomizado por partícula (0.8-3.2px)
- Removido o curl/spiral do leading edge (era "head de espermatozoide" 😆)
- Trail com taper bilateral (`sin(π·t)`) — fade nas duas pontas
- Segments 16 → 18 (curva mais lisa)

### MAP tab no debug menu (CONFIGS → MAP)
- **Map selector** — dropdown que fetcha presets do PixaPro server + botão Refresh
- Wang controls movidos pra essa aba (não estão mais em VFX)
- `proc.activeMap` salvo em localStorage. Vazio = procedural live
- Ao selecionar preset: fetch + cache em `localStorage['CEP_DBG__activeMapCache']`
- Próximo `scene.restart` → `_setupScenery` lê cache sync e usa em vez dos sliders

### `project_server.py` — 5 endpoints novos
- `GET /maps?project=<slug>` + `GET /maps/<name>` + `POST /maps/<name>` — CRUD de map presets
- `GET /scan_assets` — walks `assets/`, classifica via regex contra `ASSET_NAMING_STANDARD.md`. Retorna `{total, classified, unclassified, by_category, suggestions, items}`
- `GET /asset_naming` — config de naming do projeto
- `POST /apply_renames` — batch rename com **backup automático** em `tools/saves/asset_rename_backup_<ts>/` + manifest JSON pra rollback
- `POST /check_refs` — preview dos js files que referenciam paths a serem renomeados (extrai todos templates de string `'assets/.../${X}/...'`, converte em regex, testa cada path; dedup literal/template)

### PixaPro standalone — novidades
- **2 tabs novas:**
  - 🗺️ **Map** — test render canvas + Save/Load presets por projeto
  - 📋 **Naming** — audit asset naming, suggestions, check JS refs, apply com backup
- **2 docs novos:**
  - `PROJECT_INTEGRATION.md` — como conectar projetos novos ao PixaPro (arquitetura, endpoints obrigatórios/opcionais, schema do map JSON, storage layout)
  - `ASSET_NAMING_STANDARD.md` — convenção universal de assets (chars/items/hud/env/terrain/fx/ui), naming rules, direcionais, anims, tilesets cr31, auto-classify regex, migration checklist

### Naming Audit testado end-to-end
- **879 assets** scaneados — 773 já no padrão, 106 unclassified, **65 renames sugeridos** (`chars/nature/X/` → `env/X/`)
- Apply testado: 65/65 moveram com sucesso, 0 erros, backup completo
- **Rollback testado:** restaurou 65 arquivos pros locais originais via leitura do `_manifest.json` do backup
- Adicionada proteção: confirm de Apply auto-checa `/check_refs` antes e mostra aviso com lista de js files affected

### Pendências reais (próximas sessões)
- **Apply renames real** — sistema pronto, só usar com workflow seguro (1 categoria por vez + auto-update js refs)
- **PixaPro auto-update js refs** — hoje só DETECTA; deveria oferecer batch update
- **PixaPro Project dropdown** — hoje hardcoded `chapada-escapade`, devia ler `pixapro_config.json.linkedProjects`
- **PixaPro `server.py` simplificar** — fork antigo do project_server.py, código duplicado
- **Map preset end-to-end** — falta teste fim-a-fim (PixaPro → game)
- **Tutorial 09/10 completion logic** + **grass blades wind_sway anims** — ainda BLOCKED do mês passado

---

## Sessão 2026-04-30 (tarde·noite) — Polish in-game + sync/merge fix + 8 tilesets unblocked + HUD coluna + game over fixes

**~30 commits, sessão longa pós-merge da outra sessão**

### Fix do merge cataclísmico (start)
- Outra sessão (`nostalgic-mclaren-1f61ba`) mergeou 148 commits que clobbed o D+R2 refactor — código voltou a referenciar paths PT (`chars/vaca/`, `nature/pedras/`) que não existem mais → game não carregava
- Fix: restaurei `js/01..20` do meu último commit bom + reapliquei integração do Currais V2 sprite (preload + `_buildCorral` + `_slotPos` slotOffsetY)

### Currais V2 — mascote cenográfico per-variante
- `_buildCorral` push agora salva `mascotCenografico=true` + `mascotCfg` por variante
- `_ensureCowMascot` lê `cfg.tipo`/`anim`/`dx`/`dy` (cow/bull, cow_eat_S/cow_eat_N/cow_angry_S/ox_walk_S, posição offset)
- `_updateMascoteVisibilidade`: mascot+balde sempre visíveis (cenográfico) vs counter+feno só com delivery real
- 5 variantes configuradas: 01 pequeno (cow eat S + balde), 02 redondo (igual), 03 hexagonal (cow drinking N — alinha com coxo, sem balde), 04 rustico (cow lie_down S, sem balde), 05 abandonado (ox walk S, sem balde)

### Tutorial polish massivo
- **Box maior**: BOX_W 280→360, LINE_H 14→18, HEADER_H 22→30, fontes 11→14/13, body/note 10→12
- **Nomes engraçados PT-BR**: PILOTANDO A NAVE, TESTANDO O FEIXE (merge 02+03), ROUBANDO VACAS, ENTREGA EXPRESSA, HORA DO LANCHE, REVIDE (era LEVANDO TIRO), PEGANDO O FAZENDEIRO, ARREMESSO NAS PEDRAS
- **+2 steps**: 09 ESQUIVA DE TORPEDOS, 10 ABATER ESPANTALHO (lógica de completion ainda placeholder)
- **TUT_MODES**: 2 entradas novas (DODGE_TORPEDOS, KILL_SHOOTER) com flags default tipo FARMER
- **Tutorial highlights desalinhados**: `_combBar`/`_eneBar.y` agora top-left (era center) — `_tutGlowAtScreenRect` espera top-left, V2 calculava como center

### HUD scores nameless V2 + radar V2
- 6 boxes sliced via `tools/slice_hud_scores.py` (score/burgers/cows/oxen/farmers/shooters_v2)
- `radar_dome_v2` + `radar_ring_v2` sliced manualmente do `refs/hudradarv2.png`
- Sandwich layering radar: ring (depth 199) → conteúdo (199.5-200.5) → dome glass (200.8 alpha 0.4)
- Mobile force landscape: `#rotate-prompt` overlay CSS @media (orientation:portrait)
- Dome alignment iterado: DOME_DY -0.32 → -0.18 do height (dome alto demais)

### HUD reorg + ox→bull rename + cleanup assets
- User editou transparência dos 8 PNGs de score boxes — synced
- Rename `oxen_v2.png` → `bulls_v2.png` + bulk replace `ox`→`bull` em todos refs
- Cleanup: 18 PNGs deletados (frames v1/v2/v3, `radar_frame.png`, etc) — preload simplificado
- Combined HUD: `combustivel-graviton_empty_nameless.png` (substitui `_empty.png`)

### 8 tilesets 16px UNBLOCKED (Mapa1 verde + Mapa2 seco)
- URL pattern descoberto: `https://api.pixellab.ai/mcp/tilesets/{id}/{image,metadata}` (sem auth)
- Download 8 PNGs + 8 metadata JSONs
- Slice cr31: `name=wang_X` row-major no grid 4×4 + `corners` dict explicit
- Mapping: PixelLab usa NW=8 NE=4 SW=2 SE=1, nosso código usa NW=1 NE=2 SE=4 SW=8 — convertido
- Salvos em `assets/terrain/{mapa1,mapa2}_{ocean_dirt,ocean_grass,sand_dirt,sand_grass}/wang_NN.png`
- Preload `WANG_STYLES` expandida 3→11 styles
- Dropdown CONFIGS VFX → "Tile style" com 11 opções traduzidas EN/PT

### Wang tiles ON por default
- `DBG_DEFAULTS.fx.wangtiles = true` (era false) — render ativo no spawn

### Gas can spawn rules
- Antes: gas_can + barrel_rusty random pelo mapa
- Agora: gas_can SÓ atrelado a truck (`truckSpots` tracked no landmark loop), 1-3 cans em raio 60-100px, scale = `truck.scale * 0.35`, tint `0xc88a5a` (marrom-laranja casa com truck enferrujado)
- barrel_rusty mantém cluster random separado (3 spots)

### HUD coluna left + counters wired
- 5 boxes empilhados verticalmente: BULLS / COWS / FARMERS / SHOOTERS / BURGERS
- Score mantido top-center
- COL_X=100, GAP_Y=62, FIRST_Y centralizado vertical (`Math.max(36, h/2 - 2*GAP_Y)`)
- Counters cumulativos: `bullsTotal`/`cowsTotal`/`farmersTotal`/`shootersTotal` + `burgerCount` (já existia)
- Increment: `_dropCowsAtCorral` (cow/bull conforme tipo), `_explode` com isEnemy (farmer), `_destroyShooter` (shooter)
- i18n PT-BR: BOIS/VACAS/FAZENDEIROS/ESPANTALHOS/HAMBURGUERES

### Wind swirls cartoon style
- `_buildWindParticles`: + `_curlR` (5-10px) + `_trails` (1 ou 2 paralelas), len 60-110, alpha 0.18-0.42
- `_updateWind` redesenhado: trail bezier (taper amp 1→0.4) + curl spiral 1.6 voltas no leading edge
- Estilo cartoon (referências Adobe Stock/Vectorstock que user mostrou)

### Rotation lock cows/farmers
- User: "as animações de caminhar/correr não devem ter rotação"
- `_directionalTexture` (cows): força `v.rotation=0` exceto se `abductedCows.includes(v)`
- `_updateFarmers`: força `f.rotation=0` exceto se `isAbducted` ou `inSpin` (release window)

### Cow/bull sem explosão em colisões
- User: "tirar a explosão delas em colisões"
- `_environmentCollision` rocha branch: agora SÓ `entityIsEnemy` (farmer) toma dano + explode
- cow-cow / cow-bull / bull-bull: bounce físico, zero dano (era 1 hit em high-impact)

### Farmer release-spin 3s
- User: "quando soltar fazendeiro deve continuar movimento com inércia + spin 3s"
- `_releaseCow` detecta `isEnemy`: `setFrictionAir(0.01)` + `_releaseSpinUntil = now + 3000` + `_spinRate = ±8 a 14 rad/s` random
- `_updateFarmers`: durante `inSpin`, `f.rotation += spinRate * delta` + skip IA/sprite update; após 3s reset

### Fuel drain por movimento
- Antes: drain fixo 2.2/s × difficulty (igual parado e voando)
- Agora: `(0.4 + 3.1 × speedNorm) × difficulty` onde `speedNorm = min(1, |velocity|/8)`
- Parado: ~0.4/s (~250s pra esgotar). Full speed: ~3.5/s (~28s)

### Bug fix de loading
- `this.matter.body.setAngle(body, 0)` quebrava — `this.matter.body` é factory, não tem `setAngle` estático
- Removido — `v.rotation = 0` (Phaser MatterSprite setter) já sincroniza body angle

### Outros
- Splash skip on restart (`window.__cepPlayedOnce` in-memory, reseta no F5)
- Restart transition red→green loading bar (1.4s) antes de scene.restart
- Game over cinematic V2: vinheta + Fibonacci spiral + tremor + smoke + crash crooked + GAME OVER VT323 grow
- Quips coloridos por tom (r=angry/g=funny/y=ironic/b=factual) + seguem target
- Radar v2: GeometryMask cavidade + alien green + quadrantes + 3 anéis concêntricos

### Ferramentas criadas/usadas
- `tools/slice_hud_scores.py` — slice 6 score boxes do `refs/hud scores nameless.png`
- Probe URLs PixelLab CDN (revelou pattern api.pixellab.ai/mcp/tilesets sem auth)

---

## Sessão 2026-04-30 (manhã) — PixelLab gen sprint: currais V2 + grass blades + tilesets + balance + handoff PixaPro

### Currais V2 (substitui sistema procedural)
- 5 sprites PixelLab 200×200 gerados (~25 generations): pequeno_quadrado / redondo_feno / hexagonal_ornamental / rustico_pedra / abandonado_caveira
- Salvos em `assets/pixel_labs/chars/nature/objects/curral_*.png`
- `js/04_scenery.js` `_buildCorral`: substituiu ~50 linhas de procedural fences (norte/sul/leste/oeste/cantos+lanternas) → 1 sprite single random com `slotOffsetY` por variante
- `js/08_corrals.js` `_slotPos`: lê `curral.slotOffsetY` (fallback 110)
- Mantido (Option C): cow mascot, hay bale, bucket, 3 burger slots, beam attract, counter "xN" — só visual de fundo mudou
- `js/02_preload.js`: 5 novos texture keys `nat_obj_curral_01..05`, expostos via `this._curralKeys`

### Cercas scatter decoração
- Reaproveitamento dos assets antigos (24 cercas em `nature/cercas/` e `cercas_v2/` continuam carregadas no preload)
- `js/04_scenery.js`: nova section 5e — 14 spots aleatórios pelo mapa
- 10 cercas deco: fence_broken, fence_corner, post_single/thin/double_rope/lantern_low/lantern_thin/carved/thin_simple, plank_v
- 60% spot único / 40% mini-cluster 2-3 peças, rotação random ±90°, alpha 0.85-1.0
- Sem colisão (depth 1.4, decorativo puro) — vibe rural abandonado

### Grass blades
- 5 base sprites 64×64 PixelLab gerados (~7 generations: 5 + 2 retries pq olive saiu com vaso e yellow com lanterna)
- Salvos em `assets/pixel_labs/chars/nature/grass_v2/grass_*.png`
- 5 wind_sway anims (4 frames cada × 5 = 20 generations) disparadas
- Anim IDs: `585e0ba3` `6d62f51f` `03e4527b` `7af3a658` `b2354dc2`
- Integração in-game pendente quando frames completarem

### 8 tilesets 16px transitions (Mapa 1 vs Mapa 2)
- 5 tilesets já existiam (3 16px + 2 32px), faltavam transitions cross-material
- 4 disparados pra Mapa Opção 1 (cerrado verde v1): `ff745b17` `70faa0d8` `448352c8` `ac546645`
- 4 disparados pra Mapa Opção 2 (cerrado seco v2): `d395054a` `53598aae` `e8b56eea` `43ac051b`
- Todos com `lower_base_tile_id` + `upper_base_tile_id` dos materiais existentes pra consistência visual cross-tileset
- 2 já confirmados completed (ff745b17 + d395054a), outros 6 cooking
- Slice + WANG_PRESETS com headers de grupo pendente

### PixelLab balance via bookmarklet (PixaPro)
- Tentativa inicial: usar Secret da página `/account` (UUID `45609581-...`) como Bearer token. Resultado: **403 Invalid token**. Secret é pra Aseprite/Pixelorama plugin, não pra `api.pixellab.ai/get-account-data` (JWT real é da session Supabase do browser)
- Solução: pattern bookmarklet
  - `tools/gallery_server.py`: `GET/POST /pixellab_balance` (cache + persiste em `tools/saves/pixellab_balance.json`)
  - `tools/pixapro/js/balance.js` (novo): badge no header com auto-refresh 60s, vermelho se < 200 restantes
  - Botão "📋 Bookmarklet" copia code pra clipboard → user cola na barra de bookmarks
  - Bookmarklet em `pixellab.ai/account`: regex no `innerText` pra parse de "Generations 812 / 2,000" + plano + reset date → POST localhost:8090
- Validado end-to-end: 812/2000 · Tier 1 · resets May 26

### Handoff PixaPro pra repo próprio
- `docs/PIXAPRO_HANDOFF.md` (novo): plano completo de migração standalone (estrutura, deps, mudanças, server config)

### Conflito merge resolvido
- Worktree (`nostalgic-mclaren-1f61ba`) ainda usa nomes PT (`04_cenario.js`, `08_curral.js`)
- Main já tem nomes EN (`04_scenery.js`, `08_corrals.js`) do refactor D+R2
- Conflict resolvido com `--theirs` (worktree wins) — meus updates de currais V2 aplicados nos files renomeados

---

## Sessão 2026-04-30 (madrugada) — PixaPro refactor modular completo (10 sprints)

**Continuação direta da sessão da noite anterior. Foco: refactor de `tools/asset_gallery.html` de monolito 121kb → 13 módulos.**

### Code review inicial
- Análise dos 2778 linhas de single-file (CSS+HTML+JS misturados)
- Identificados 10 problemas: estado global solto (13+ vars), sem separação data↔render, monkey-patching do `switchTab`, `fillSumGrid` com 4 modos em 100 linhas, etc.
- Plano de 10 sprints com ordem de extração, regras (zero HTML inline, ES script-globals em vez de modules, store/api centralizados)

### Sprint 1 — CSS extraído (7 arquivos)
- `tools/pixapro/styles/{base,components,manager,gallery,editor,tiles,detail}.css`
- 295 linhas inline → 7 arquivos por componente
- HTML perdeu -10kb, validado via `getComputedStyle` no preview

### Sprint 2 — Constants extraídos
- `tools/pixapro/js/constants.js` com MANIFEST (68 entries), PIXELLAB_TOOLS (19), WANG_PRESETS (5)
- Total ~20kb de dados extraídos do `<script>` inline

### Sprint 3 — I/O centralizado (api.js + store.js)
- `api.js` com 10 wrappers de fetch (Api.saveDecisions, Api.listAssets, Api.mcpStatus, etc.)
- `store.js` com STORE_KEYS + 8 wrappers de localStorage (Store.loadDecisions, Store.saveQueue, etc.)
- 9 fetch sites + 4 localStorage sites convertidos
- API_BASE/MCP_SERVER duplicados removidos do inline

### Sprint 4 — Funções puras (4 módulos)
- `utils.js` (`$`, escHtml, timeAgo, suggestTargetFolder, getAssetType, TYPE_ICONS, mulberry32)
- `popup.js` (showFloatingPopup, hideFloatingPopup, attachPopupOrient + self-handlers)
- `classify.js` (groupBy, classifyGroup, classifiedFlat, buildGroupPopupHTML, findDirectionVariants)
- `thumb.js` (makeThumb, thumbBadge, fillSumGrid 4 modos + `_simpleThumb` DRY helper)
- **Bug encontrado:** Python regex de remoção quebrou em funções com defaults `opts={}` (counter contava o `{}` como abertura de body). Removidos 3 blocos órfãos manualmente.

### Sprints 5-10 — Tab modules
- `tab-manager.js` (S5): idx, decisions, render, side grids, keyboard shortcuts, setInterval refresh, initial render
- `tab-gallery.js` (S6): summaryData, renderGallery, filter bar (folders/files/type/tags), refresh button
- `tab-editor.js` (S7): detailSelected, mcpQueue, saveQueue, approvedAssets, renderDetailMain (visualizer 8-dir + tool forms), queueTool, popup click handler
- `tab-detail.js` (S8): renderDetailDashboard (stats cards + queue cards) + 4 dashboard buttons + MCP Live polling completo (pollMcpStatus, startMcpPolling, stopMcpPolling, switchTab hook)
- `tab-tiles.js` (S9): tileEditState, autoSortTiles (color sampling), transforms (rotate/flip), generateTerrainGrid (white/CA/value noise), renderTestMap, renderTiles + todos os 14 button handlers
- `tabs.js` (S10): activeTab, switchTab orchestrator, scroll handlers, tab buttons wiring

### Resultado final
- `asset_gallery.html`: 121kb → **17kb** (-86%)
- Inline `<script>` totalmente eliminado (era ~2778 linhas)
- 13 external scripts JS (~70kb) + 7 stylesheets
- Validação via preview_eval: 68 thumbs renderizando, todas 5 tabs trocam sem erro, todos os globals expostos

### Workflow
- Worktree: `nostalgic-mclaren-1f61ba` (renomeado de `intelligent-euler-7a236d` em sessão anterior)
- 6 commits durante o refactor (1 por sprint), todos sincronizados via worktree → main → GitHub Pages

### Pendente
- Game preview na worktree continua quebrado (`_setupGeometricTextures is not a function`, pré-existente)
- Refactor não tocou no game (`js/01_scene.js` etc.) — só no PixaPro tool

---

## Sessão 2026-04-30 — Wang 32px tilesets + MCP Live Status + PixaPro evolution

**~4 commits, sessão noturna**

### Wang tilesets 32×32
- Regenerados ocean↔sand e dirt↔grass via PixelLab MCP a 32×32 (16px eram muito pequenos pro mapa 8000×6000)
- Primeiro attempt com base_tile_ids falhou (403 cross-size); retry sem base IDs OK
- Spritesheets baixados via Backblaze CDN (User-Agent header necessário), sliced em 16 tiles individuais por cr31 index
- Novos folders: `assets/terrain/ocean_sand_32/` e `assets/terrain/dirt_grass_32/`
- `WANG_PRESETS` atualizado: 32px como primário, 16px legacy arquivado

### Game wiring
- `02_preload.js`: lê `tileStyle` do localStorage no preload, carrega folder correto
- Defaults mudados: `wangtiles=true`, `tileRes=32`, `tileStyle=dirt_grass`
- Menu TERRAIN no CONFIGS (aba VFX): toggle, selector res 16/32, selector estilo
- cr31 convention fix: game code + test palette corrigidos pra NW=1 NE=2 SE=4 SW=8

### PixaPro (tools/asset_gallery.html)
- **Detail dashboard evolution**: stats cards, progress bar, category chips, queue cards com ações individuais
- **5 bug fixes**: popup stuck on tab switch, gallery refresh duplicates, wang canvas gray after reload, tag input value lost, dashboard stale data
- **Test render 4:3**: canvas 640×480 matching game map ratio, grid retangular, info tile size
- **Font-size clamped** 12px–17px pra legibilidade
- **MCP Live Status panel**: polling 4s, cards expandíveis com inspect banner (ID, type, params, preview, error/log)

### gallery_server.py
- `GET/POST /mcp_status`: Claude posta status de jobs, dashboard faz polling
- `POST /mcp_clear`: limpa todos os jobs
- Persist em `tools/saves/mcp_live.json`

### Auto-sort validation
- Provado que algoritmo funciona sem corrections salvas (bloqueou `applyStoredCorrections`)
- 16/16 classificações corretas, 0 conflitos, determinístico em ambos tilesets

---

## Sessão 2026-04-29 (madrugada) — Audit fixes + HUD assets + Objects v3 + debug overlay

**~30 commits, ~6h, das 00:00 às 06:00+**

### Engineering audit Sprint 1+2+3 (15 itens resolvidos)
- **Sprint 1 trivials**: M6 (dead code), L4 (preload error handler), L1 (`js/00_constants.js` novo com magic numbers), L2 (helpers `isAbducibleCow`, `distSq`), L3 (speed thresholds), M1 (Math.sqrt → squared), H5 (counter `_cowsInBeamCount` reconciler — elimina filter por frame)
- **Sprint 2 medios**: M7 (debounce 500ms localStorage), H3 (debounce 200ms rebuild rain/snow), M5 (cap rígido 100 balas)
- **Sprint 3 complexos**: H1 (listener leak global keydown), H2 (tutorial flag pollution reset), H4 (fazendeiro `_timer` cleanup em `_explodir`), M2 (graphics destroy), M4 (`_sceneCleanup` central no `events.once('shutdown')`)
- 15/18 issues resolvidas. Pendentes: M3 (slot tweens raro), L5 (mobile dual-input), L6 (FSM tutorial opcional)
- `docs/AUDIT_2026-04-29.md` atualizado com status

### HUD upgrade (refs do user)
- `refs/hudradar.png` + `refs/huds isolados.png` integrados
- `tools/slice_huds_isolados.py` extrai graviton/combustivel `_full` + `_frame` via PIL (bbox + saturation mask)
- Radar redesenhado: sprite `hud_radar_frame` (NSWE marcado) + decay-based blips (cada entidade só acende quando sweep line passa, fade 2.5s via `_radarBlipFades` Map)
- Barras: pintura preta sobre label baked PT-BR + Phaser text overlay (FUEL/GRAVITON em EN, COMBUSTÍVEL/GRAVITON em PT)
- `_applyHudI18n` disparado on lang change e setup
- HUD subido pra depth 200 (era 100, atmosphere overlay em 195 cobria)
- Radar desce R/2 (35px) pra ficar acima das barras

### Objects v3 (9 PixelLab via Chrome MCP)
- `tools/pixellab_fetch_objects_v3.py` baixa 39 IDs novos (timestamp ≥1777400000)
- `tools/pixellab_montage_objects_v3.py` contact sheet
- `tools/organize_objects_v3.py` copia 9 com nomes legíveis
- `chars/nature/objects/`: church, windmill, old_truck, satellite_dish_rusty, gas_can, barrel_rusty, bucket_empty, bucket_milk, dry_turf
- 4 LANDMARKS aleatórios (1500px de distância entre si)
- 4 spots de PROPS INDUSTRIAIS (gas_can/barrel_rusty random, 2-4 por spot)
- 8 patches de DRY TURF espalhados (alpha 0.85)
- Curral mascote: balde (milk OR empty random 50/50) ao lado da vaca

### Debug overlay (F3)
- `js/19_debug_overlay.js` novo — DOM div fixed top-left
- FPS color-coded, heap MB, counts entidades/tweens, radar fades
- Captura `window.error` e `unhandledrejection` (pega coisas fora do try/catch)
- Snapshot estruturado no console.log a cada 5s pra anexar em bug reports
- Toggleable com F3, funciona desde o splash
- Removido `_errShown` flag (agora todos erros são capturados)

### Splash + CONFIGS
- 3 botões split: PLAY → ENG/PTBR → MOUSE/WASD; TUTORIAL → MOUSE/WASD
- ESC funciona desde splash pra abrir CONFIGS
- Botão **PREVIEW** (👁): 5s timeslice + esconde inimigos + reabre menu depois
- Checkbox **Shuffle on PREVIEW** aleatoriza weather+TOD a cada click
- Splash fit-to-screen + barrel ativo desde loading
- Hit area expandida dos botões (compensa barrel post-fx)

### Snow weather preset
- Flocos brancos r=1-3.5px com drift sinuoso ±60px
- Velocidade: flocos maiores caem mais rápido
- Adicionado em `_applyWeatherPreset` + UI no select Weather

### Editable sliders + UX
- Sliders viraram `<input type="number">` editáveis (digita valor direto)
- Sync bidirecional com clamp min/max
- Sensibilidade discreto: 1 / 1.25 / 1.5 (step 0.25)
- Toggle Input WASD/Mouse + Language ENG/PTBR no menu CONFIGS

### i18n menu (en/pt)
- `MENU_I18N` dict com ~50 chaves
- `data-i18n` attrs em legends/notes/tabs/buttons/h2
- `_applyMenuI18n()` percorre e troca textContent
- Aba LOOKS → VISUALS, DEBUG MENU → CONFIGS

### Bugs críticos corrigidos (post-audit)
- **SLOT_VALOR/SLOT_FUEL/BURGER_TEXTURES** duplicados entre `00_constants.js` e `08_curral.js` → SyntaxError → arquivo inteiro falhava ao carregar → `_verificarEntrega is not a function` em cascata. **Causa do trava reportado.**
- `18_atmosphere.js` `this.scene.scene.isActive()` não existe → crash no _scheduleStormFlash. Corrigido pra `this.sys.isActive()`.
- `c.ready` legacy struct (curral refactor pros slots) ainda referenciada em `06_nave.js _atualizarSeta` e `17_tutorial DELIVER` → corrigido pra `c.slots.some(s => s.state === 'ready')`
- Hint inicial 'CLICK AND HOLD' removido (poluía HUD em jogo normal)
- Linha verde nos cantos eliminada (barrel out-of-bounds + box-shadow CSS)
- HUD coberto pelo atmosphere overlay (depth 100 → 200)
- PREVIEW: safety reset 6s da flag `_tutPreviewActive`

### Pós-checkpoint (mesma sessão, polish final)
- **Cursor laser vermelho** (substitui rastro escuro) — 4 layers: halo + nucleo + reflexo branco
- **Radar revertido pro Graphics-based** (mantém decay-based blips)
- **TAKE_DAMAGE com fazendeiro** em vez de torre (cooldown 400ms, spawn a 280px)
- **Slider Rotação disco removido** das configs
- **HUD bars v2** com setCrop dinâmico: `_full.png` (fill bakeded) + `_empty.png` (miolo preto) via `tools/slice_huds_v2.py`. Substitui Graphics gradient.

### Pendentes (próxima sessão)
- **Tutorial etapas 8-9** (FARMER / FARMER_KILL) — TAKE_DAMAGE pronto
- **Tradução D+R2** (identificadores PT→EN) — esperando JSON do localStorage do user
- **Configs do user como DBG_DEFAULTS** (mesma dependência)
- **Audit pendentes**: M3 (slot tweens raro), L5 (mobile dual-input), L6 (FSM tutorial)
- **Labels de inputs** com `data-i18n` no menu (só legends/notes/buttons traduzidos)

---

## Sessão 2026-04-29 (noite) — Atmosphere system + tutorial overhaul + i18n + responsividade

**~25 commits, ~6h, das 18:00 às 00:00+**

### Atmosphere system (novo `js/18_atmosphere.js`)
- 6 TOD presets (dawn/day/dusk/sunset/night/midnight) com gradient vertical via Graphics.fillGradientStyle
- Auto-cycle 60s/preset (ciclo 6min completo)
- Weather: clear / rain / fog / snow / storm
- Storm com flash de raio aleatório (5-15s, com eco)
- Snow: flocos brancos r=1-3.5px, drift ±60px sinuoso, queda lenta (3-6s)
- Tutorial sempre força day + clear

### Tutorial overhaul
- Splash multi-stage: PLAY → ENG/PTBR → MOUSE/WASD; TUTORIAL → MOUSE/WASD
- Nova etapa BEAM_VISUAL (cone sem efeito, antes do GRAVITON_BAR)
- GRAVITON_BAR com drain 2x didático
- Bug fix: tutorial travava em GRAVITON_BAR (visualOnly bloqueava drain) — separadas flags `_tutBeamNoDrain` vs `_tutBeamNoPull`
- ABDUCT spawna 50 vacas globais uniformes pelo mapa 8000×6000
- Vacas imortais durante etapa ABDUCT
- BURGER inicia combustível em 15% (dramático, restaura com burger)
- HUD bars hide/show por etapa (combustível e graviton só aparecem nas etapas certas)

### Curral upgrade
- Mascote vaca chubby tamanho real (68px) com anim eat fixa
- Hay bale ao lado direito (84×76px, 2x maior)
- 3 slots fixos por curral (slot 0=classic, 1=cheese, 2=double)
- Coleta via beam graviton (atrai burgers ready dentro do raioCone)
- Pontos progressivos: 100/150/220 — fuel 22/28/36 por slot
- Counter ×N maior (22px com stroke 5)
- Mascote esconde se count=0
- 4 variants random de curral

### CONFIGS menu (renomeado de DEBUG MENU)
- ESC funciona desde o splash pra configurar antes do jogo
- Novo botão **PREVIEW** (👁): timeslice de 5s + esconde inimigos + reabre menu depois
- Checkbox **Shuffle on PREVIEW** aleatoriza weather+TOD a cada click
- Sliders viraram inputs editáveis (digita o valor direto, sync bidirecional)
- Sensibilidade discreto: 1 / 1.25 / 1.5 (step 0.25)
- Toggle **Input** WASD/Mouse na aba CONTROLS > SHIP
- Toggle **Language** ENG/PTBR no topo da CONTROLS > SHIP
- Sistema i18n via `MENU_I18N` dict + `data-i18n` attrs + `_applyMenuI18n()`
- Aba LOOKS → VISUALS

### Splash screen
- Hit area expandida (HIT_PAD 40x20) compensa deslocamento visual do barrel post-fx
- Splash fit-to-screen (Math.min, antes era cover)
- Barrel ativo desde o splash (`_setupBarrel` aplica strength inicial)
- Layout 2 botões com state machine de 3 estágios

### Mobile
- `<meta viewport>` adicionado (faltava — era a causa principal de tela torta)
- Safe-area pra notch iPhone via `env(safe-area-inset-*)`
- Media query (≤900px ou pointer:coarse): canvas vira 100%×100% sem border-radius
- Botões mobile fade: silhueta 0.25 (idle) → invisível 0.0 (touched) com tween 150ms
- Label FEIXE → BEAM

### Outros bugs e melhorias
- HUD subido pra depth 200 (era 100, atmosphere em 195 cobria)
- Radar desce R/2 (35px) pra ficar acima das barras
- Linha verde nos cantos eliminada (barrel out-of-bounds → preto puro + box-shadow removido)
- Beam capacity rework: cap 5 vacas/bois OU 1 fazendeiro (mutex)
- Velocidade nave: -10% por vaca/boi abduzido (max -50%); fazendeiros não desaceleram
- Fazendeiro `setBounce(0.45)` (era 0.2) — bounce visível em vaca/boi/cacto

### Skills & memória
- Nova skill `pixellab-asset-download` (Backblaze CDN sem API + caminhos Chrome MCP / DevTools manual)
- Memória `feedback_explicit_questions.md` (perguntas com caixa visual)
- Memória `feedback_break_complex_prompts.md` (plano numerado antes de implementar)
- Memória `feedback_heartbeat_5min.md` (ping em tasks longas)

### Pendentes (próxima sessão)
- **Tradução D+R2 Y** (refator identificadores PT→EN + comentários) — esperando JSON do localStorage do user pra preservar configs
- **Configs do user como DBG_DEFAULTS** (mesma dependência do JSON)
- **Etapas tutoriais 7-9** (TAKE_DAMAGE, FARMER, FARMER_KILL) — texto/glow refinements
- **Tradução de labels de inputs** no menu (data-i18n nos `<span>` restantes)

---

## Sessão 2026-04-29 — Tutorial guiado completo + curral redesign + 14 cercas v2 + chuva controlável

**~30 commits, ~14h, das 09:00 às 23:00**

### Tutorial guiado (novo módulo `js/17_tutorial.js`)
- Splash com 2 botões: **JOGAR** / **TUTORIAL**
- 8 etapas sequenciais: MOVE → BEAM → ABDUCT → DELIVER → BURGER → BARS → TAKE_DAMAGE → FARMER → FARMER_KILL
- Hint overlay com progresso (pontos), título, texto, nota de conclusão
- Tempo mínimo de leitura por etapa (5s) — não avança antes de dar tempo de ler
- Caixa subida pra `h - 110` (libera visão das barras combustível/graviton)
- **Sistema de glow amarelo pulsante por etapa** via `highlight: [...]` em TUT_STEPS
  - Targets: nave, graviton, combustível, vacas, curral, fazendeiro, atirador, rocha
  - `_tutGlowAt` (mundo) e `_tutGlowAtScreenRect` (HUD) com 3 anéis pulsantes
- Setas verdes pulsantes apontando pra curral, fazendeiro, rocha
- Nova etapa **TAKE_DAMAGE**: spawna atirador perto, trava `_moverNave`, libera após dano no combustível
- Auto-respawn de vacas: 8 iniciais + reposiciona quando vivas < 3 (resolve travamento)
- Conclusão: botão "JOGAR AGORA" + spawna inimigos normais

### Curral redesign visual
- **1 vaca representativa** (top-down "eat bob") no centro com counter `×N` pulsante
- Vacas reais somem ao entregar — só sobe o counter
- Burgers spawnam **fora** do curral (sul, abaixo do gate) em fila de 24px
- Loading: piscando + ciclo classic→cheese→double a cada 1s (3s total)
- Ready: sprite fixo com bounce sutil
- `_reflowFila`: ao coletar, loadings remanescentes deslizam pros slots da frente
- Tempo de processamento: 5s → 3s

### Cercas v2 (14 assets PixelLab novos)
- Pipeline `tools/pixellab_fetch_new.py` baixa 20 IDs detectados via Chrome MCP
- `tools/pixellab_montage_new.py` gera contact sheet pra ID visual
- `tools/organize_cercas_v2.py` copia 14 cercas com nomes legíveis
- `chars/nature/cercas_v2/`: fence_curved_long, gate_open_double, post_carved, tower_ornamental_thin, post_lantern_low, etc
- `_construirCurral` reescrito com paleta clara consistente (mantém SCALE 0.9, cantos com torres ornamentais, lanternas decorativas na entrada)

### Chuva controlável (4 controles live em VFX)
- `_rebuildRain` recria pool de gotas quando `chuvaCount` muda
- `_startRainDrop` lê live: ângulo (-1 a +1), velocidade (0.2-3x), comprimento traço (0.3-3x), frequência (0-400 gotas)
- Aba VFX dividida em CHUVA / NEBLINA com 6 controles na chuva

### Debug menu refatorado
- **4 abas**: CONTROLES / LOOKS / VFX / DEBUG
- Slider novo: **sensibilidade da nave** (multiplica força em `_moverNave` live)
- Step 0.05 → 0.01 + display `toFixed(2)` (era `toFixed(1)`, parecia pular 0.1)
- Barrel distortion movido pra LOOKS

### Bug fixes
- **Barrel distortion não funcionava** — `addPostPipeline` no renderer ANTES de `setPostPipeline` (Phaser 3.60 exige)
- **BURGER não avançava** — checava `burgerCount` (não incrementa via curral); agora usa `scoreAtual > antes`
- **DELIVER não detectava entrega** — agora checa `processing.length > 0 || ready.length > 0`
- **Linha verde nos cantos** — barrel out-of-bounds `vec4(0.04,0.05,0.03)` → `vec4(0,0,0)` + remove `box-shadow` verde do `#game-host`
- **Vaca west bug do farmer** — corrigido manualmente pelo usuário no editor PixelLab
- **Curral invisível** — chão de terra alpha 0.0 → 0.38; spawn ignora terrain CA constraint

### Refactor & cleanup
- **`paciencia` → `combustivel`** em todo o codebase (8 arquivos)
- Removidas pastas duplicadas `vaca_chubby/`, `vaca_holstein/`, `vaca_skinny_4dir/` (457 arquivos)
- Workflow git: sync automático ao final de cada request (worktree → main → push)

### Memory & skills
- Skill nova `~/.claude/skills/pixellab-asset-download/` documentando padrão Backblaze CDN + 2 caminhos (Chrome MCP / DevTools manual)
- Memória `feedback_explicit_questions.md`: sempre destacar perguntas com caixa visual numerada
- Memória `feedback_heartbeat_5min.md`: heartbeat 5min em tasks longas

---

## Sessão 2026-04-27 (noite) → 2026-04-28 — Maratona: anims completas + debug menu + FX stack + nature + currais + Wang

**24+ commits, ~15h, das 21:14 (27/04) à 00:00+ (28/04)**

### Animações & sprites
- **Fazendeiro running 8-dir** wired no jogo (anim play por direção via velocity picker)
  - Fix do norte: rerota `N` puro pra `NE`/`NW` (chapéu cobre corpo na vista superior)
  - Fazendeiro convertido `matter.add.image` → `matter.add.sprite` + `setBody({type:'circle',radius:16})`
  - Static rotations top-down (156×156) substituíram as full-body antigas (180×180 cowboy)
- **Boi walk 8-dir** wired (state machine: walking quando movendo, sprite estático parado)
  - Wander force bumpada 0.0010 → 0.0030 (boi diagonal funciona agora)
- **Vaca chubby 8-dir** substitui skinny 4-dir
  - Anims walk(4f) / idle_head_shake→eat(11f) / lie_down→angry(8f) — 32 anim sets
  - vaca_run = vaca_walk com fps×2
  - Old skinny preservada em `chars/vaca_skinny_4dir/`
- **5 chars PixelLab** completos integrados — `chars/{vaca,boi,fazendeiro,ufo,vaca_holstein}/` (~620 frames)
- **UFO `b7bc12d9` re-baixado** (dome opaca, sem alien) — nave aponta pra `chars/ufo/south.png`
- **Scary_walk fazendeiro deletado** (full-body humanoid não-topdown)
- **Splashv3 + icon.png** — favicon novo, splash fullscreen (cover scale)
- **Game over + vitória** com splash desaturado (vermelho 0x441111 / verde 0x114422)

### Mapa & cenário
- **Mapa 2.5×** (3200×2400 → 8000×6000) em todos os 4 lugares hardcoded
- **31 nature assets** scrapeados via Chrome MCP do `/create-object` PixelLab
  - Categorias: `pedras` (3), `vegetacao` (12), `cercas` (10), `placas` (4), `outros` (2)
  - Per-asset proportional `SCALE_MAP` (saguaro 2.0, pillar 1.9, agave 1.3, dry 0.9 etc)
  - Bounds-aware placement (até 12 retries por peça, raio 32×scale×0.85, sem overlap)
  - Labels baked-in detectados + cropados (16/31 PNGs)
- **Cellular Automata terreno** com grid 100×75 cells (4 níveis: água/areia/grama/terra)
- **Currais procedural** com 10 cercas variantes (fence_long/gate_open/post_thin)
  - Retângulo 220×180, gate sempre aberto + sem matter body (vacas atravessam)
  - **Currais só em terra** (`grid===3`)
- **Wang tiles cr31** toggle no debug menu
  - Corner grid (COLS+1)×(ROWS+1) próprio (sem costura)
  - Threshold corrigido: só `grass===2` é UPPER (era `>=2` que pegava terra → todos idx=15)
  - 2 passes de smoothing extra nos cantos
  - Paleta terrosa: areia `#c9a574` + grama `#6e9b3a` + dry transition `#a89548`

### Debug menu (DOM-based, ESC)
- 30+ controles persistidos em localStorage
- ON/OFF: vacas, bois, fazendeiros, atiradores, beam visual, cenário
- Sliders escala: vaca, boi, faz, beam, nave, hambúrguer (todos step **0.01**)
- Sliders comportamento: dano atiradores, vel faz, vel vacas, pull beam, discoRot, **barrel** (distorção esférica)
- Quantidades: spawn count vacas (100) + fazendeiros (20)
- FX toggles: chuva, neblina, sparkles beam, shake, explosão fancy, **wangtiles**
- APLICAR + REINICIAR + RESET defaults

### FX stack (16_fx.js)
- **Chuva:** 80 gotas em loop diagonal
- **Neblina:** vinheta canvas com gradiente radial (centro nítido, bordas brancas alpha 0-40%)
- **Beam sparkles:** pontinhos verdes orbitando que viajam pro centro da nave
- **Beam shake/flash** ao ligar (transição off→on, verde 0x50c878)
- **Explosão upgrade:** shockwave anel + 8 sparks + flash branco central
- **Distorção esférica (barrel)** PostFXPipeline GLSL — `r²·strength·1.6` — slider 0-0.8
- **Sombras com blur fake** (3 elipses stacked, alpha 0.18/0.40/0.85) em todas as entidades + nave
  - Proporcional a `entity.displayWidth` (boi grande = sombra grande)
- **Escapamento estilo carro:** spawn 100ms, size 4, growTo 3.5×, alpha 0.75→0
- **Partículas coloridas** misturadas no escapamento (5 cores) — substituiu LEDs giroflex
- **Smoke puff no muzzle** dos disparos do farmer

### Sistema de jogo
- **HP system colisional:**
  - Vaca/boi: HP random 3-5 + setBounce(0.5)
  - Fazendeiro: HP 1 + setBounce(0.2) — só morre em pedra
  - Debounce 120ms entre hits
  - `_hitFlash(entity, color)` tint pulse 120ms ao tomar dano
  - Cow vs farmer: ninguém toma dano (faz só morre em rocha)
- **Beam pull fix:** removida re-prisão na grama (vacas saiam intocaveis do beam)
- **Beam graphics revert:** voltou pros 5 círculos concêntricos (alpha 0.05→0.22) — sem artefatos PNG
- **pullBeam default 0.5** (era 1.0 — bichos arremessavam contra obstáculos e morriam)
- **Balas atiradores persistem** até saírem do mundo 8000×6000 (era fade após MAX_DIST=580)
- **Fazendeiro/vaca/boi `setFixedRotation`** — fim do bug "boneco deitado" por colisão
- **Soltar do beam:** `_returnSouthUntil = now + 3000` força orientação south + fricção alta 3s
- **Burger variants** random no spawn e no virar (classic 2× weight + cheese + double)

### Nave (UFO)
- `setFixedRotation` + rotação manual via slider `discoRot`
- **Tilt suave** baseado em mudança de velocidade lateral (banking)
- **LED ring radius proportional** ao `nave.displayWidth*0.48`
- LEDs giroflex desativados → partículas coloridas no escapamento

### Tools
- `pixellab_objects_fetch.py` — baixa 31 map_objects via CDN backblaze
- `pixellab_montage.py` — gera contact sheet pra ID visual
- `crop_nature_labels.py` — detecta + crop banda de label
- `organize_nature.py` — copia inbox → chars/nature com nomes legíveis
- `wang_test_palette.py` — atualizado pra paleta terrosa Chapada

### Conquistas doc
- `docs/CONQUISTAS.md` criado — log de achievements + estatísticas atualizado por sessão

---

## Sessão 2026-04-27 (cont.) — PixelLab MCP integrado + assets novos + vaca animada

- **PixelLab MCP** ativado via `claude mcp add pixellab https://api.pixellab.ai/mcp -t http -H "Authorization: Bearer ..."` — 25 tools disponíveis (`create_character`, `create_map_object`, `animate_character`, etc.)
- **Workflow PixelLab:** `create_character` (4d/8d sprite sheets) vs `create_map_object` (single sprite até 400×400) vs `animate_character` (templates como walk-4-frames, running-8-frames, eating, angry)
- **Bug PixelLab descoberto:** `KeyError: 'bone_scaling'` no endpoint 8-rotations pra quadruped (workaround: 4-dir pra cat/bear/horse template)
- **Bug PixelLab + workaround:** templates quadruped (cat/bear/horse) **bloqueiam anatomia** — descrições só customizam aparência. Boi não saía como touro com bear template; usar `chubby cow/bull` em prompt + `cat` template deu resultado mais próximo
- **Hero assets 200×200** em `assets/pixel_labs/`: vaca, boi (Nelore brown), nave (UFO com alien verde na cúpula), beam halo (concêntrico cyan)
- **Directional chars 128px** em `assets/pixel_labs/chars/{ufo,fazendeiro,vaca,boi}/{S,E,N,W,SE,NE,NW,SW}.png`:
  - UFO 8d, Fazendeiro 8d, Boi 8d (chubby Nelore) — todos full 8 direções
  - Vaca 4d (cat template, bug 8d quadruped)
- **HUDs 400×200/400×120** em `assets/pixel_labs/hud/`: SCORE, COWS (com ícone vaca), BURGERS (com ícone), COMBUSTÍVEL (vermelho/laranja), GRAVITON (ciano sci-fi tech)
- **Items burger 120×120** em `assets/pixel_labs/items/`: classic, cheese (queijo derretido), double (2 patties)
- **Vaca animada** (id `7a011aff`): 4 estados × 4 dir × N frames = 104 frames PNG → `assets/pixel_labs/chars/vaca/anims/{walk,run,eat,angry}/{S,E,N,W}/`
- **State machine de personalidade** em `_atualizarIAVacas`:
  - `vaca_abduzida` → `angry` anim
  - dist < 240px → `run` + flee force
  - idle far → alterna entre `eat` (60%, 2.5-5s) e `walk` (40%, 1.5-3.5s)
- **🐛 BUG CRÍTICO consertado:** `this.matter.add.image()` não suporta `.anims` — substituído por `this.matter.add.sprite()` em `_criarVaca`. Anims rodavam silenciosamente sem efeito antes da fix.
- **🐛 Bug do travamento pós-splash:** `_setupLEDs()` foi perdido no refactor do `01_scene.js` create() → `_atualizarLEDs` quebrava `Cannot read properties of undefined (reading 'length')`. Re-adicionado.
- **Geometria removida** em `03_textures.js`: nave (PNG sobrescreve), hambúrguer (PixelLab), fazendeiro (PixelLab). Sobreviveram: curral, gaiola, rocha, moita, atirador.
- **Cleanup deprecated** via `git rm`: `assets/characters/`, `assets/ui/`, `assets/terrain/` (Wang antigos), `refs/preview_pixellab/`, `refs/preview_shader_*.png`, `refs/seamless_preview_*.png`, `refs/tilegpt.png`, `refs/tilenanobanana.jpg`, `refs/cow-burgers.png`, `refs/hud-vazia.png`. Sobraram: `assets/pixel_labs/`, `splash.png`, `favicon.svg`, refs originais (`vacas.jpg`, `farmer.jpg`, etc.).
- **Workflow:** preview local quebrou nesta sessão (`new Phaser.Game(config)` em `99_main.js` não executa por causa não diagnosticada — scripts carregam, canvas existe, mas window.game vazio). Trocado pra **testar via GitHub Pages direto** (push → ~30s deploy). `99_main.js` agora expõe `window.game` pra debug.
- **Diagnostic try/catch** em `update()` e `create()` — se quebrar, aparece box vermelho com stack trace na tela em vez de travar silencioso
- **Shaders desligados temporariamente:** terrain (`13_terrain_shader.js`) substituído por `add.rectangle` verde sólido + manchas de terra; grass patch só em EXPERIMENT_MODE (forçado OFF). Re-habilitar quando confirmarmos estabilidade.
- **Skill nova:** `pixellab-prompts` (implícita) — formula `Material/Type + Distinguishing Feature + Mood/Context`, doc oficial do MCP em `https://api.pixellab.ai/mcp/docs`

---

## Sessão 2026-04-27 — Wang playground standalone + convenção cr31

- **Pesquisa:** docs PixelLab MCP `/v2/tilesets` (Wang assíncrono, 16 tiles, 32px max, chaining via `*_base_tile_id`) + cr31 2-corner (NE=1, SE=2, SW=4, NW=8 — adotado como padrão do projeto, deprecando o naming `wang_TLTRBLBR` do `slice_tilesets.py`)
- **`tools/wang_test_palette.py`:** gera 16 PNGs 32×32 com cores HSV-spread + quadrantes shaded por corner bit + índice no centro; saída em `assets/terrain/test/wang_00.png` … `wang_15.png` + `_montage.png`
- **`tools/wang_playground/index.html`:** playground standalone (sem deps, sem build) — single-file vanilla JS com Mulberry32 PRNG, geração de corner grid (W+1)×(H+1) com fill + smoothing CA majority, lookup `wangIndex(nw,ne,sw,se)` cr31, render em canvas com `image-rendering: pixelated`
- Pack switcher: `test` (canvas-only, file:// friendly) / `nanobanana` / `gpt` (carrega `assets/terrain/<pack>/wang_NN.png` quando existir, fallback automático)
- Controles: seed (texto/núm), grid cols/rows, tile px, zoom 1-4×, fill 0-1, smoothing 0-10, debug grid, índices, export PNG
- ⚠️ Servidor HTTP local 8080 já estava ocupado por outra coisa nesta sessão — playground não foi aberto via HTTP; testar abrindo `tools/wang_playground/index.html` direto via `file://` (test pack funciona) ou subir um servidor em outra porta apontando pra raiz `H:\Projects\ChapadaEscapade`
- **Decisão arquitetural:** trilha B escolhida (playground isolado primeiro, port pro Phaser depois) — ciclo de iteração rápido, fundação reutilizável, alinhado com "step after step"

---

## Sessão 2026-04-26 (cont. 3) — Deploy Pages, mobile controls, terreno CA, HUD novo

- **Vacas/bois** mudaram pra sprite `cima_sobe` (top-down puro) + removido `setRotation` manual + spin random ao entrar no feixe → glissagem natural pela física
- **Mobile controls** em novo `js/12_mobile.js`: joystick virtual à esquerda (vetor → alvo virtual 220px à frente da nave) + botão FEIXE à direita; substitui o "2° dedo" antigo
- HUD layout iterado: foi pra horizontal, voltou pro empilhado clássico (score topo-centro, burger topo-esq, barras combustível/graviton no rodapé com gap visível)
- **LVL badge removido** (sem badge, sem `textoDif`)
- **Novos frames de barra** com label baked-in: `tools/slice_hud_frames.py` extrai GRAVITON e COMBUSTÍVEL de `refs/hud-vazia.png`; fill desenhado por `Graphics.fillGradientStyle` (combustível amarelo→vermelho, graviton azul→roxo)
- **COWS + BURGERS boxes**: `tools/slice_cow_burger.py` extrai 2 boxes de `refs/cow-burgers.png` (detecção por interior escuro + expansão da bbox + remove bg verde); substituem o burger frame antigo + mini-icons vaca/boi
- **Cenário procedural via Cellular Automata** (`04_cenario.js` reescrito): grid 40×30 cells de 80px, 4 níveis de altitude (água/areia/grama/terra), 5 passes de smoothing 3×3, render em layered overlap (polígonos wobbly oversize fundindo entre cells iguais) → 0 Wang tiles necessários
- Sombras internas em deep cells (4 cardinais do mesmo nível); tufos decorativos só em grama
- Obstáculos e currais checam `isLand` antes de spawnar (evitam água)
- `_isOverGrass`/`_grassDepth` em `07_vacas.js` refatorados pra consultar `terrainGrid` em vez de blobs explícitos
- **Linha marrom horizontal removida** do meio do mapa
- **Deploy GitHub Pages**: repo público em `https://github.com/zeroonebit/chapada-escapade`, live em `https://zeroonebit.github.io/chapada-escapade/`; `git init` + `.gitignore` + commits com co-author Claude; `ChapadaEscapade.html` renomeado pra `index.html` pra URL limpa
- Bug: HTTP server da sessão caiu, causando placeholder verde do Phaser nas imagens — diagnosticado e reiniciado; também workaround pra preview servir N: vs H:
- ⚠️ Preview do Claude Code não respeita `--directory` ou `cwd` em launch.json — sempre serve do workspace root

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
