# Handoff — Sistema de Curadoria de Assets

**Data**: 2026-04-30
**Para**: Próxima sessão Claude Code focada em concluir a curadoria
**De**: Sessão `intelligent-euler-7a236d` (Thiago + Claude Opus 4.7)

---

## 🎯 Objetivo desta nova sessão

Concluir o sistema de **curadoria de assets v2** já parcialmente implementado em `tools/asset_gallery.html`. Curadoria = navegar entre os ~67 PNGs gerados via PixelLab e decidir individualmente:
- **✅ Promote** → mover do `inbox/` pra pasta categorizada (`objects/`, `vegetation/`, `enemies/`, `hud/`)
- **❌ Discard** → remover **agressivamente** (local + git + PixelLab remoto + grep refs no código)
- **✏️ Rename** → renomear arquivo

---

## 📂 Contexto das 2 sessões prévias

### Sessão A: `claude/sleepy-robinson-7b6621`
**Commit final**: `c824c21` — "WIP sleepy-robinson: scarecrow assets v2 + gallery (rescue commit)"

**O que fez**:
- Criou `tools/asset_gallery.html` v1 — manifesto de 67 assets com navegação ←/→ + grid + auto-refresh 8s
- Gerou ~25 PNGs de scarecrow (3 batches: original / v2 sem pernas com canhão / droid v3 e v4 com 5 variantes de cor)
- Outros assets v2 batch 1-7: bromelia, palm, mesa rocks, baldes, cercas, churches, gas cans coloridos, wrecked trucks coloridos, hay piles, scarecrows múltiplos, etc

**Status**: travou no Claude Code. Trabalho preservado via rescue commit.

### Sessão B: `claude/intelligent-euler-7a236d` (esta atual)
**Último commit**: `a754d19` — "WIP gallery: UI dos botoes (incompleto)"

**O que fez** (resumido — log completo em `docs/PROGRESS.md`):
- Engineering audit (15/18 fixes — Sprint 1+2+3)
- HUD redesign (radar sprite + barras setCrop) — bugs visíveis em `docs/TODO_HUD.md`
- Snow weather preset
- 9 objects v3 PixelLab integrados (church, windmill, truck, satellite, gas_can, barrel_rusty, buckets, dry_turf)
- Debug overlay F3
- Splash multi-stage com state machine PLAY/TUTORIAL → ENG/PTBR ou MOUSE/WASD
- Mobile responsivo (`<meta viewport>` + safe-area + fade buttons)
- i18n menu CONFIGS (~50 strings)
- Bugs críticos: SLOT_VALOR duplicado quebrava `08_curral.js` inteiro; `c.ready` legacy struct; listener leak global
- **Refator PT→EN Fase 1+2** (~565 replacements em 14 arquivos JS) — `tools/refactor_pt_to_en.py` + `tools/refactor_pt_phase2.py`
- Mergeou trabalho do sleepy-robinson no main

---

## 📦 Estado atual dos arquivos relevantes

### `tools/asset_gallery.html`
**Localização**: `H:/Projects/ChapadaEscapade/tools/asset_gallery.html`

**Já implementado**:
- Manifest com 67 assets (linha 60-139)
- Navegação ← → + grid de thumbs + auto-refresh 8s
- Stage 520×520 com pixel-art rendering
- **CSS dos novos botões** (`.btn-promote`, `.btn-discard`, `.btn-rename`, `.btn-export`)
- **HTML dos botões** (4 ações + export)
- **JS infraestrutura**:
  - `const DECISIONS_KEY = 'chapEscapadeAssetDecisions'` (localStorage)
  - `decisions = {}` (estado carregado)
  - `saveDecisions()` helper
  - `suggestTargetFolder(name)` — mapeia prefixo → pasta destino

**Falta implementar nessa nova sessão**:
1. **Wire dos 4 botões** com onclick handlers:
   - `btnPromote`: salva `decisions[id] = { action: 'promote', target: suggestTargetFolder(name) }`
   - `btnDiscard`: prompt confirmando, salva `{ action: 'discard' }`
   - `btnRename`: prompt pra novo nome, salva `{ action: 'rename', newName }`
   - `btnClear`: `delete decisions[id]`
2. **Render badges**: no stage e nas thumbs (verde/vermelho/azul) baseado em `decisions[id]`
3. **Botão Export**: gera download de `decisions.json` no formato:
   ```json
   {
     "asset-id-uuid": {
       "name": "scarecrow_droid_td_dark",
       "path": "assets/.../inbox/scarecrow_droid_td_dark.png",
       "action": "promote",
       "target": "enemies"
     },
     ...
   }
   ```
4. **Stats counter**: "X promoted / Y discarded / Z renamed / W pending"

### Python script a criar: `tools/apply_decisions.py`
Processa o JSON exportado:
```python
# Pseudo:
for asset_id, decision in decisions.items():
    if decision['action'] == 'promote':
        # shutil.move inbox -> chars/nature/<target>/<name>.png
        # git add path destino
    elif decision['action'] == 'discard':
        # 1. git rm path do arquivo no inbox
        # 2. Procura por nome em js/*.js (grep -r) → avisa se há refs (não muta código auto)
        # 3. mcp__pixellab__delete_object(asset_id, confirm=True) pra deletar remoto
    elif decision['action'] == 'rename':
        # git mv inbox/<old>.png inbox/<newName>.png
```

**Importante (discard agressivo)**:
- Verifica se o arquivo já está em outras pastas (já promoted antes) — também remove
- `mcp__pixellab__delete_object` é tool MCP — script Python não chama direto. Solução: gera lista de IDs a deletar e usuário roda comandos via MCP no Claude. OU script só faz local + git e Claude faz delete remoto manual.

---

## 🔧 Como abrir a nova sessão lendo o contexto

### Opção 1: Mesmo worktree (recomendado)
```bash
cd "H:/Projects/ChapadaEscapade"
claude
```
Daí na primeira mensagem manda:
> "Lê `docs/HANDOFF_CURADORIA.md` e continua de onde a sessão anterior parou. Foco: completar o sistema de curadoria de assets em `tools/asset_gallery.html` + criar `tools/apply_decisions.py`."

### Opção 2: Novo worktree
```bash
cd "H:/Projects/ChapadaEscapade"
git worktree add .claude/worktrees/curadoria-novo claude/curadoria
cd .claude/worktrees/curadoria-novo
claude
```

---

## 📝 Resumo dos 67 assets disponíveis (por categoria sugerida)

Veja manifest completo em `tools/asset_gallery.html:60-139`. Distribuição:

| Pasta destino | Itens (prefixo do nome) |
|---|---|
| **objects** | bucket_*, milk_*, feed_*, water_trough_*, gas_can_*, barrel_*, crate_*, radio_tower_*, meat_grinder_*, windmill_*, wrecked_truck_*, satellite_*, lantern_*, alien_artifact_*, bone_*, church_*, hay_*, crop_circle_* |
| **vegetation** | palm_*, tree_*, flower_*, bromelia_*, grass_*, burned_*, mesa_* |
| **enemies** | scarecrow_* (3 variantes × idades + droid v3/v4 com 5 cores) |
| **hud** | combustivel_v2, graviton_v2 (estes não existem com esse nome — atual é `_full_v2.png` e `_empty_v2.png`) |

---

## ⚠️ Bugs/Tasks pendentes não-relacionadas (de outras sessões)

Estão em `docs/TODO_HUD.md` e `docs/AUDIT_2026-04-29.md`. Não são prioridade dessa nova sessão de curadoria.

---

## 🚀 Próximos passos sugeridos pra nova sessão

1. Ler este doc inteiro
2. Ler `tools/asset_gallery.html` pra entender o estado parcial
3. Abrir o gallery no Brave (`file:///H:/Projects/ChapadaEscapade/tools/asset_gallery.html`) pra ver visualmente
4. Implementar os 4 wires + badges + export
5. Criar `tools/apply_decisions.py`
6. Documentar workflow: "user roda gallery → marca tudo → export → user roda apply_decisions.py + claude faz delete PixelLab via MCP"

Boa sorte! 🛸
