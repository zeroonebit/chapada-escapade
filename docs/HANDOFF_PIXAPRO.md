# PixaPro — Handoff (estado atual)

**Última sessão:** 2026-04-29 noite/madrugada
**Branch:** `claude/nostalgic-mclaren-1f61ba` (synced com `main`)
**Última commit:** `fe4106c` — PixaPro capitalization

## O que é

`tools/asset_gallery.html` virou **PixaPro** — uma tool web standalone pra:
- Curar assets PixelLab (Manager)
- Visualizar/operar com MCP (Editor)
- Wang tile editing (Tiles)
- Sumários do projeto (Gallery)
- Acompanhar queue MCP (Detail)

Eventualmente vira skill `~/.claude/skills/asset-manager/` reutilizável em outros projetos.

## Tabs (ordem atual)

1. **📊 Gallery** — sumário Approved/Discarded/Pending com grupos por personagem/categoria, filter bar, popup flutuante
2. **✏️ Editor** — visualizador 480×480 com 8-dir slots dentro, name top-left, dir preview hover · 4 sections de tools (Create/Modify/Animate/Meta) empilhadas com drag-drop reorder
3. **🎨 Manager** (default) — curadoria com Promote/Discard/Rename/Clear/Save
4. **🧩 Tiles** — wang editor com Auto-sort visual + Flip L/U + Rot+/Rot- + Restore + view modes Full(16)/Reduced(6) + test render procedural com bias
5. **🔧 Detail (queue)** — dashboard MCP queue (cooking/done/total/%) + Active Tileset Info + refs

## Servidor

`tools/gallery_server.py` na porta **8090** (8080 reservada pro game).
Endpoints: `/save_decisions`, `/save_configs`, `/save_mcp_queue`, `/save_wang_corrections`, `/list_assets`.
History timestamped em `tools/saves/history/`.

## Pendentes

1. **Wangs reflection** — usuário quer pensar melhor antes de gerar mais
   - Tilesets PixelLab atuais: ground-truth (placeholder), ocean↔sand ✓, dirt↔grass v1 ❌, dirt↔grass v2 (em geração `267836d8...`)
   - Default permutation `CR31_TO_PIXELLAB_MAP = [0,8,1,9,2,10,3,11,4,12,5,13,6,14,7,15]` aplicada em PixelLab tilesets
   - 4 biomas + 4 estações como botões placeholder na Tiles tab
   - Reduced mode (6 tiles via rotação) cobre os 16 — economia 62.5% em geração futura
2. **Modularização** — refactor pra ES modules nativos (estrutura proposta em chat anterior). Adiar até concluir features.
3. **Filtros Type/Tags no PROMOTED** — placeholder existe, lógica pendente
4. **Skill extraction** — extrair pra `~/.claude/skills/asset-manager/` quando estiver mais maduro
5. **MCP queue runner end-to-end** — queue salva mas execução depende do Claude rodar manualmente
6. **Detail dashboard** — % por task individual + explicações/links migrar pra cá
7. **Sistema de modularidade pra composições** (ex: curral montado com fence_curved_long + tower + gate) — design futuro
8. **DB?** — não precisa, JSON files cobrem perfeitamente até bater 100MB ou multi-user

## Arquivos principais

- `tools/asset_gallery.html` — toda a UI (monolítico ~2500 linhas)
- `tools/gallery_server.py` — backend Python
- `tools/apply_decisions.py` — aplica decisions JSON nos assets reais
- `docs/REFS_WANG.md` — bookmarks cr31 + Boris + classification taxonomy
- `tools/saves/` (gitignored) — JSONs locais

## Comandos pra retomar

```bash
# 1. Subir o servidor de tools (8090)
cd H:/Projects/ChapadaEscapade
python tools/gallery_server.py

# 2. Subir o servidor do game (8080) em outra aba
python -m http.server 8080

# 3. Abrir gallery no Brave
start http://localhost:8090/tools/asset_gallery.html
```

## Estética/UX que ficou definida

- 8080 = game, 8090 = tools (regra fixa)
- Botões coloridos com texto preto + opacity 0.85 (1.0 hover)
- Frame 480x480 estilo Manager stage com xadrez bg
- Popup flutuante position:fixed (não clipa overflow), orientado pro centro
- Group thumbs com badge contador, hover popup ordenado: parent → variations → anim reps → frames
- Cores por categoria: create=green, modify=blue, anim=purple, meta=yellow, delete=red
- Sections drag-handle ⋮⋮ no header, persiste ordem em localStorage
