# PixaPro · Handoff de Migração

> Plano pra desacoplar **PixaPro** do projeto **Chapada Escapade** e movê-lo pra repo standalone.

---

## O que é o PixaPro

Tool dev (web app) pra:
1. **Curadoria** de assets gerados via PixelLab MCP (promote/discard/rename)
2. **Editor** de assets aprovados — visualizer 8-direções, formulários pra disparar PixelLab tools (vary/animate/etc.) via queue MCP
3. **Detail dashboard** — fila MCP + status real-time de jobs PixelLab
4. **Tiles editor** — Wang cr31 com auto-sort visual + transforms + test render procedural
5. **Gallery** — sumário de promoted/discarded/pending agrupado por folder/type/tags

Hoje vive em `tools/asset_gallery.html` + `tools/pixapro/{js,styles}/` e é servido por `tools/gallery_server.py`.

**Histórico recente:** monolito 121kb refatorado em 13 módulos JS + 7 stylesheets (Sprints 1-10, sessão 2026-04-30).

---

## Arquivos a migrar

```
PROJETO ORIGEM (Chapada Escapade)            →  REPO NOVO (PixaPro standalone)
──────────────────────────────────────────────────────────────────────────────
tools/asset_gallery.html                     →  index.html (renomear)
tools/pixapro/styles/*.css        (7 files)  →  styles/
tools/pixapro/js/*.js             (13 files) →  js/
tools/gallery_server.py                      →  server.py
tools/saves/                      (gitignored, opcional copiar) →  saves/
.gitignore (linhas relevantes)              →  .gitignore (filtrar)
```

### Lista completa dos JS modules

| Arquivo | Responsabilidade |
|---|---|
| `constants.js` | MANIFEST (hardcoded), PIXELLAB_TOOLS, WANG_PRESETS |
| `store.js` | localStorage wrappers (decisions, tags, queue, editor order) |
| `api.js` | HTTP wrappers pro server (`/save_*`, `/list_assets`, `/mcp_status`, `/pixellab_balance`) |
| `utils.js` | `$`, escHtml, timeAgo, suggestTargetFolder, getAssetType, mulberry32 |
| `popup.js` | Floating popup global (`#floatingPopup`) com show/hide/attach |
| `classify.js` | groupBy, classifyGroup, classifiedFlat, buildGroupPopupHTML, findDirectionVariants |
| `thumb.js` | makeThumb, thumbBadge, fillSumGrid (4 modos: folders/files/type/tags) |
| `tabs.js` | switchTab, activeTab, API_URL, scroll handlers |
| `tab-manager.js` | Manager tab (curadoria one-by-one): idx, decisions, render, keyboard P/D/R/C |
| `tab-gallery.js` | Gallery tab: summaryData, renderGallery, filter bar |
| `tab-editor.js` | Editor tab: visualizer 8-dir, tool forms, mcpQueue, popup-click handler |
| `tab-detail.js` | Detail tab: dashboard de queue + MCP live polling 4s |
| `tab-tiles.js` | Tiles tab: Wang editor, auto-sort, transforms, terrain test render |
| `balance.js` | PixelLab balance badge + bookmarklet trigger |

---

## Dependências do projeto-pai

### Caminhos de assets
PixaPro hoje **lê** caminhos relativos pra:

1. **`assets/pixel_labs/`** — root onde estão os PNGs gerados (chars, items, hud, etc.). Manifestados em `MANIFEST` (`constants.js`) e indexados via `GET /list_assets` que faz `rglob('*.png')` sob `assets/pixel_labs/`.

2. **`assets/terrain/{ocean_sand_32, dirt_grass_32, test}/`** — PNGs sliced de Wang tilesets, referenciados em `WANG_PRESETS.sliceFn`.

3. **`tools/saves/{decisions,asset_tags,mcp_queue,wang_corrections,mcp_live,pixellab_balance}.json`** — persistência server-side (gitignored).

### MCP integration
- O PixaPro **não chama MCP diretamente** — só prepara queue (`Add to queue`) e mostra status real-time.
- O usuário cola "executa o mcp queue" no chat do Claude Code, que lê queue de localStorage e executa via PixelLab MCP tools.
- Status updates do MCP voltam pelo endpoint `POST /mcp_status` do server (in-memory + persiste em `mcp_live.json`).

### Bookmarklet PixelLab balance
- Roda em `https://www.pixellab.ai/account` (browser logado)
- Faz scrape do innerText (regex pra "Generations X/Y", "Resets DATE", etc.)
- POSTs `http://localhost:8090/pixellab_balance` com JSON
- Cross-origin OK — server tem `Access-Control-Allow-Origin: *`

---

## Plano de migração (passo a passo)

### Fase 1 — Spinoff

```bash
# 1. Criar repo novo
mkdir ~/Projects/PixaPro && cd ~/Projects/PixaPro
git init

# 2. Copiar arquivos do origem
cp -r ../ChapadaEscapade/tools/pixapro/* .
cp ../ChapadaEscapade/tools/asset_gallery.html ./index.html
cp ../ChapadaEscapade/tools/gallery_server.py ./server.py

# 3. Criar gitignore mínimo
cat > .gitignore <<'EOF'
__pycache__/
*.pyc
saves/
pixellab_secret.txt
.DS_Store
Thumbs.db
EOF

# 4. README + handoff doc copiado
cp ../ChapadaEscapade/docs/PIXAPRO_HANDOFF.md ./MIGRATION_NOTES.md
```

### Fase 2 — Tornar standalone

**Path adjustments necessários:**

1. **`server.py`** — `ROOT` aponta pra parent dir, hoje espera estrutura `tools/asset_gallery.html`. Ajustar:

   ```python
   # ANTES (gallery_server.py linha 19):
   ROOT = Path(__file__).resolve().parent.parent  # → /Projects/ChapadaEscapade
   
   # DEPOIS (PixaPro standalone):
   ROOT = Path(__file__).resolve().parent  # → /Projects/PixaPro
   ```

2. **`server.py`** — endpoint `/list_assets` faz `ROOT / "assets" / "pixel_labs"`. Decidir:
   - **Opção A (config externa):** ler caminho de `pixapro_config.json`:
     ```json
     {
       "asset_root": "H:/Projects/ChapadaEscapade/assets/pixel_labs",
       "terrain_root": "H:/Projects/ChapadaEscapade/assets/terrain"
     }
     ```
   - **Opção B (CLI arg):** `python server.py --asset-root=/path/to/assets`
   - **Opção C (multi-project):** indexar múltiplos projetos cadastrados

3. **`index.html`** — `<link rel="stylesheet" href="pixapro/styles/...">` precisam virar `styles/...` (sem prefixo `pixapro/`):

   ```bash
   sed -i 's|pixapro/styles/|styles/|g; s|pixapro/js/|js/|g' index.html
   ```

4. **`constants.js` MANIFEST** — hardcoded com IDs PixelLab dos assets do Chapada Escapade. Pra standalone:
   - Migrar pra leitura dinâmica: server endpoint `/manifest` que lê `manifest.json` no asset_root
   - OU manter hardcoded se PixaPro vai ser fork-per-projeto

5. **`api.js` API_BASE** — hoje detecta porta 8090 vs cross-origin. Manter como tá (funciona standalone também).

### Fase 3 — Multi-projeto (opcional)

Se quiser PixaPro **único** servindo múltiplos projetos:

```
~/Projects/PixaPro/
├── server.py              ← serve todos os projetos
├── index.html             ← seletor de projeto no topo
├── projects.json          ← lista de projetos
│   [
│     {"name": "Chapada Escapade", "root": "/path/to/.../assets/pixel_labs", "manifest_url": "..."},
│     {"name": "Outro Projeto",  "root": "..."}
│   ]
├── js/, styles/
```

Frontend lê `projects.json` via `/projects`, dropdown no header troca contexto, store keys ficam scoped por projeto (`chapEscapade_decisions`, `outroProj_decisions`).

---

## Server endpoints (referência completa)

Servidor: `python server.py [port]` (default 8090)

| Method | Path | Function |
|---|---|---|
| GET | `/` | static (serve index.html) |
| GET | `/list_assets` | scan filesystem (`assets/pixel_labs/**/*.png`) |
| GET | `/mcp_status` | retorna jobs in-memory (sorted by ts desc) |
| POST | `/mcp_status` | recebe job update do Claude (id, type, description, status, result) |
| POST | `/mcp_clear` | limpa todos os jobs |
| GET | `/pixellab_balance` | retorna saldo PixelLab (cache) |
| POST | `/pixellab_balance` | recebe saldo do bookmarklet |
| POST | `/save_decisions` | grava `saves/decisions.json` + history timestamped |
| POST | `/save_configs` | grava `saves/configs.json` |
| POST | `/save_mcp_queue` | grava `saves/mcp_queue.json` |
| POST | `/save_wang_corrections` | grava `saves/wang_corrections.json` |
| POST | `/save_asset_tags` | grava `saves/asset_tags.json` |

Todos com CORS aberto (`Access-Control-Allow-Origin: *`).

---

## Workflow de uso (standalone)

```bash
# 1. Subir server
cd ~/Projects/PixaPro
python server.py
# Serving at http://localhost:8090

# 2. Abrir browser
# http://localhost:8090/

# 3. (Opcional) Habilitar saldo PixelLab
# - Click "📋 Bookmarklet" no header → copia
# - Cola num bookmark novo na Brave/Chrome
# - Vai em pixellab.ai/account, clica no bookmark → saldo aparece no PixaPro
```

---

## Diferenças entre versão atual (in-tree) vs standalone

| Aspecto | In-tree (hoje) | Standalone |
|---|---|---|
| Path do server | `tools/gallery_server.py` | `server.py` |
| Path do HTML | `tools/asset_gallery.html` | `index.html` |
| Asset root | `<project>/assets/pixel_labs/` | configurável (config.json ou CLI) |
| Hardcoded MANIFEST | sim (constants.js) | manter ou tornar dinâmico |
| Stylesheet paths | `pixapro/styles/...` | `styles/...` |
| JS paths | `pixapro/js/...` | `js/...` |
| Saves | `tools/saves/` | `saves/` (gitignored) |
| Bookmarklet | localhost:8090 hardcoded | mesmo (manter) |

---

## Decisões pendentes (pré-migração)

1. **Repo público ou privado?** Influencia nome (PixaPro vs algo neutro como "asset-curator-mcp").
2. **Multi-projeto ou single-projeto?** Determina arquitetura de configuração.
3. **MANIFEST hardcoded ou dinâmico?** Single-projeto pode manter hardcoded; multi-projeto exige loader dinâmico.
4. **Bookmarklet localhost ou configurável?** `localhost:8090` hoje funciona pra dev local; pra deploy precisa de URL configurável.
5. **CSS framework?** Hoje 7 arquivos puros (~395 linhas total). Considerar Tailwind/UnoCSS se for crescer.

---

## Próximos passos sugeridos (ordem)

1. **Decidir repo + nome** — criar GitHub repo
2. **Fase 1** (spinoff cópia simples) — funcional in-place sem mexer em paths ainda
3. **Fase 2** (standalone real) — ajustar `ROOT`, paths, asset config
4. **Smoke test** — todas as 5 tabs funcionam em standalone
5. **README** com instruções de instalação + uso
6. **(Opcional) Fase 3** — multi-projeto

---

## Refs internas

- Ponto de entrada: `tools/asset_gallery.html` (16kb HTML + 13 `<script src>`)
- Refactor doc inicial: `CLAUDE.md` seção "PixaPro modularizado"
- Server: `tools/gallery_server.py` (~200 linhas)
- Saves locais: `tools/saves/` (gitignored)
- PixelLab MCP: `mcp__pixellab__*` (configurado no Claude Code)

*Doc atualizado: 2026-04-30. Mover este arquivo pra repo novo como `MIGRATION_NOTES.md` ou similar.*
