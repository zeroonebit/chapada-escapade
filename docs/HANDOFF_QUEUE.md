# Handoff Queue — Chapada Escapade

> Fila cross-session de tarefas. Sessão A (asset-gen via PixelLab MCP) adiciona items, Sessão B (in-game integration) consome. Source-of-truth: `docs/HANDOFF_QUEUE.json`. Use a skill `handoff-queue` ou edite direto.

**Convenção:** sempre `git pull` antes de ler, `git push` após editar. Conflitos JSON são fáceis de resolver manualmente.

---

## Status atual (snapshot — atualizado 2026-08-10)

**Abertos:**

| ID | Tipo | Status | Prio | Título |
|---|---|---|---|---|
| `grass-blades-integration` | in-game | 🔒 blocked | 🔴 high | Integrar 5 grass blades wind_sway in-game (20 frames BLOCKED no PixelLab) |
| `audit-cleanup-old-geometric-textures` | refactor | ⏳ pending | 🔴 high | Remover sprites geométricos legados de 03_textures.js (HUD v2 aliases já saíram em 2026-05-08) |
| `pixapro-mark-in-game-assets` | docs | ⏳ pending | 🟡 medium | Sort + decidir 626 PNGs em uso sem decisão Manager |

**Fechados:**

| ID | Status | Quando foi feito de fato |
|---|---|---|
| `scarecrow-droid-turrets-missile` | ✅ done | 2026-07-22 — backport F2: mechas 8-dir (3 skins, wake/sleep por histerese) + torpedos com anim de voo/explosão via `mecha_atlas`. Escalas ajustadas pra paridade Bevy em 2026-08-10 |
| `tutorial-7-9-finish` | ✅ done | 2026-07-22 (passos 09/10 no F2) + 2026-08-10 (passo 08 destravado: contava por array que o `_explode` esvazia → agora por `farmersTotal`) |
| `pixapro-spinoff-standalone` | ✅ done | 2026-05-02 — repo standalone `H:/Projects/PixaPro` + UI live no Pages |
| `tilesets-16px-slice-and-group` | ✅ done | 2026-04-30 noite — 8 tilesets sliced cr31, WANG_STYLES 3→11 |
| `currais-v2-test-and-tune` | ✅ done | 2026-05-02 — superado: burgers ao norte + 3 slots fixos + mascote |

**Legenda status:**
- ⏳ pending — disponível pra pegar
- 🔒 blocked — esperando algo externo (ex: PixelLab job cooking)
- 🚧 in-progress — sessão claimou e tá trabalhando
- 👀 review — precisa revisão antes de done
- ✅ done — concluído
- ❌ cancelled — cancelado

---

## Como usar (workflow das 2 sessões)

### Sessão A — asset generation (lado que produz)
1. Termina geração ou refactor numa sessão
2. Diz pro Claude: **"adiciona à handoff: integrar X in-game, deps são Y, paths são Z"**
3. Skill `handoff-queue` cria entry no JSON, commit + push
4. Sessão A continua gerando próximas coisas

### Sessão B — in-game implementation (lado que consome)
1. Abre nova sessão Claude Code no projeto
2. Diz: **"que pendências tem na handoff?"**
3. Skill lê JSON (faz `git pull` antes), formata lista priorizada
4. Escolhe item: **"vou pegar grass-blades-integration"**
5. Skill marca status `in-progress` + commits
6. Implementa
7. Diz: **"marca grass-blades-integration como done"**
8. Skill marca status `done` (ou `review` se precisa OK do user)

### Convenções importantes
- **`blocked_by_external`**: skill mostra mas avisa que tá esperando algo (ex: PixelLab job cooking)
- **Entry deve ter:** id, title, type, status, priority, context (summary + paths/IDs), spec (steps), files_to_touch, verification
- **Log**: cada mudança de status grava entry em `log[]` com ts + by + action

---

## Schema completo

```json
{
  "schema_version": 1,
  "project": "Chapada Escapade",
  "queue": [
    {
      "id": "kebab-case-slug",
      "title": "Frase curta descritiva",
      "type": "asset-generation | in-game-integration | refactor | bug-fix | docs | test",
      "status": "pending | blocked | in-progress | review | done | cancelled",
      "priority": "low | medium | high | critical",
      "created_at": "ISO 8601",
      "created_by": "session identifier",
      "blocked_by_external": "(optional) descrição do que tá bloqueando",
      "blocked_by": ["(optional) outros IDs da fila que precisam terminar antes"],
      "claimed_by": "(quando in-progress) session identifier",
      "claimed_at": "(quando in-progress) ISO 8601",
      "context": {
        "summary": "background curto",
        "...": "campos arbitrários: asset_ids, anim_ids, paths, urls, etc."
      },
      "spec": "string ou array de steps",
      "files_to_touch": ["paths"],
      "verification": "como saber que ficou ok",
      "verified": false
    }
  ],
  "log": [
    {"ts": "...", "action": "added | claimed | done | cancelled", "by": "session", "note": "..."}
  ]
}
```

---

## Próxima sessão B — bootstrap

Cole isso no início de uma nova sessão Claude Code do projeto:

> Quero implementar pendências da handoff queue. Lê `docs/HANDOFF_QUEUE.json`, mostra os items disponíveis priorizando high → medium → low, considerando blocks. Depois eu escolho qual pegar.

Ou se já tem skill instalada:

> /handoff list

ou natural language:

> Que tem na handoff?
