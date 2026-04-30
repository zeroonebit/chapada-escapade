---
description: Salvar progresso da sessão antes de desligar — atualiza CLAUDE.md, PROGRESS.md, PROMPTS.md e oferece backup do HTML
---

# /checkpoint — Salvar progresso da sessão

Você está sendo invocado pelo Thiago no fim de uma sessão de trabalho do projeto **Chapada Escapade**. Sua tarefa é garantir que **nada do que foi feito nesta sessão se perca** quando o computador desligar.

## Passos (executar em ordem)

### 1. Inventário da sessão

Revise o histórico desta conversa e identifique **tudo** que aconteceu nesta sessão:

- ✅ Features implementadas (código novo)
- 🐛 Bugs corrigidos
- 🎨 Mudanças de arte (novos sprites, cores, layouts)
- 🎯 Decisões de design tomadas
- 📝 Prompts Nano Banana criados ou modificados
- 🔮 Próximos passos definidos
- ⚠️ Pontos pendentes / problemas conhecidos

Não invente — só registre o que de fato aconteceu na sessão atual.

### 2. Ler o estado atual dos docs

Leia os 3 arquivos antes de modificá-los:

- `CLAUDE.md`
- `docs/PROGRESS.md`
- `docs/PROMPTS.md`

### 3. Atualizar `docs/PROGRESS.md`

Adicione uma **nova entrada no topo** (logo após o título "# Progresso — Chapada Escapade") com:

```markdown
## Sessão YYYY-MM-DD — [título curto descritivo]

- Bullet do que foi feito
- Outro bullet
- ...
```

Use a data de hoje no formato ISO (YYYY-MM-DD). Não apague entradas antigas.

### 4. Atualizar `CLAUDE.md`

Na seção **"Estado atual"**:

- Mover items de **🚧 Em andamento** → **✅ Pronto** se foram completados
- Adicionar novos items em 🚧 se foram iniciados mas não terminados
- Atualizar **🔜 Próximos passos** refletindo o novo estado real
- Não mexer em outras seções a menos que algo fundamental tenha mudado (stack, convenções, identidade do usuário)

### 5. Atualizar `docs/PROMPTS.md` (se aplicável)

Se algum prompt Nano Banana foi criado/modificado nesta sessão:

- Atualizar o status (⚠️ / ✅ / 🕒) do sheet correspondente
- Adicionar versão revisada do prompt se mudou
- Adicionar notas sobre o resultado se a sheet foi gerada

Se nenhuma mudança em prompts, pular este passo.

### 6. Backup do HTML (oferecer, não fazer automático)

Se houve **mudanças significativas no código** (não só docs), pergunte ao usuário:

> "Houve mudanças no `ChapadaEscapade.html` nesta sessão. Quer que eu crie um backup `ChapadaEscapade_v[N].html` antes de você desligar? (s/n)"

Se ele confirmar, copie com o próximo número incremental disponível (v2, v3, etc.).

### 7. Reportar

Resuma o que foi atualizado em formato curto e claro:

```
✅ Checkpoint salvo:
  • PROGRESS.md: nova entrada "[título]" adicionada
  • CLAUDE.md: 2 items movidos de 🚧 → ✅, próximos passos atualizados
  • PROMPTS.md: Sheet 1 marcada como ✅ (gerada e aprovada)
  • Backup: ChapadaEscapade_v2.html criado

Pode desligar tranquilo. Na próxima sessão, abra o Claude Code dentro
desta pasta e o CLAUDE.md carrega o contexto automaticamente.
```

### 8. Compactar contexto automaticamente

Após reportar o checkpoint, **invoque `/compact`** pra liberar tokens da sessão atual. O contexto crítico já está persistido em CLAUDE.md/PROGRESS.md, então comprimir o histórico não perde nada importante.

Diga ao usuário: "Vou compactar o contexto agora pra liberar tokens (`/compact`)." e execute.

## Princípios

- **Honesto:** se a sessão foi curta e nada substancial aconteceu, diga isso e atualize só o que faz sentido. Não enrole.
- **Idempotente:** rodar `/checkpoint` duas vezes na mesma sessão não deve duplicar entradas — detecte e atualize a entrada existente.
- **Conciso:** cada bullet do PROGRESS.md deve ser uma linha. Sem prosa longa.
- **PT-BR** em tudo, mantendo o tom direto do resto do projeto.
