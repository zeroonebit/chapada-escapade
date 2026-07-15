# /salvar — Checkpoint completo + lembrete de /compact

Comando de conveniência do Thiago: roda o **checkpoint inteiro** do projeto e, no fim, lembra de rodar `/compact`.

> **Por que o `/compact` não roda sozinho aqui:** ele é um comando embutido do Claude Code que NÃO é exposto a skills (só `/init`, `/review` e `/security-review` são — ver a doc de slash-commands). Nenhuma skill, hook ou tool consegue disparar `/compact`; tem que ser você digitando. Este comando faz todo o trabalho pesado do checkpoint e te avisa na última linha pra você apertar `/compact` em seguida.

## Passos (executar em ordem)

1. **Rode o procedimento COMPLETO do `/checkpoint`.** Invoque a skill `checkpoint` (via a tool Skill) e cumpra TODOS os passos dela até o fim, sem pular:
   - Inventário da sessão (features, bugs, arte, decisões, prompts, próximos passos, pendências)
   - Atualizar `docs/PROGRESS.md` (entrada nova no topo, ou estender a do dia se já existir — idempotente)
   - Atualizar `CLAUDE.md` (seção "Estado atual" + próximos passos)
   - Atualizar `docs/PROMPTS.md` se houve prompt Nano Banana
   - Oferecer backup do HTML **só se** houve mudança de código no Phaser (não se aplica a trabalho na edição Bevy)
   - **Sync git**: commit na worktree → push → merge em `main` → push (docs). Código Bevy é LOCAL-ONLY, nunca push.
   - Reportar o que foi atualizado

2. **Última linha do relatório** — imprima literalmente o lembrete:

   > 💾 Checkpoint salvo. **Agora digite `/compact`** pra liberar o contexto (o Claude Code não me deixa disparar ele por você).

## Princípios

- Herda tudo do `/checkpoint`: honesto, idempotente (não duplica entrada do mesmo dia), conciso, PT-BR.
- Se a skill `checkpoint` já rodou nesta sessão, **estenda** a entrada existente em vez de criar outra.
