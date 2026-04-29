# TODO Futuro — itens citados em quips mas sem implementação no jogo

> Lines escritas pra `js/20_quips.js` mas que referenciam objetos/mecânicas que não existem ainda. Quando implementar qualquer um, adicionar pool no QUIP_POOLS e hookar no call site.

## 1. Warning Signs / Placas
**Lines existentes** (em `QUIP_POOLS.fence` por enquanto):
- "Boundary not respected."
- "Do not cross. Seriously."
- "We tried."
- "Next upgrade: roof."

**Implementação sugerida**:
- Gerar via PixelLab `create_object` — placa de madeira tipo "PROPRIEDADE PRIVADA" estilo cangaceiro
- Espalhar perto de cercas (`nat_fence_*`) durante `_setupScenery` em `04_cenario.js`
- Nova categoria `QUIP_POOLS.sign` se quiser separar do fence pool
- Trigger: beam encosta na placa → quip

## 2. Grill / Cooking station
**Lines existentes** (em `QUIP_POOLS.burger` por enquanto):
- "Now serving: confusion."
- "Order canceled."

**Implementação sugerida**:
- Sprite de churrasqueira PixelLab `create_object` com carne/fumaça
- Posicionar em cada curral (entre os 3 slots de burger ou no centro)
- Visual de estado: idle, smoking, ready
- Mecânica atual já tem timer 3s loading→ready; o grill seria só um sprite decorativo
- Pool dedicado `QUIP_POOLS.grill`
- Trigger: quando `_processSlot` muda state pra 'ready' → quip

## 3. Meat Grinder / Machine (mudaria game design)
**Lines existentes** (em `QUIP_POOLS.burger` por enquanto):
- "Insert cow."
- "Supply chain failure." (também em farmer)
- "System idle."
- "Awaiting livestock."
- "Input missing."

**Implementação sugerida** (mais complexa, decidir antes de implementar):
- **Opção A**: máquina como prop puramente decorativo no curral, sem mudança de gameplay
- **Opção B**: muda mecânica — em vez de timer 3s automático, cow precisa passar PELA máquina pra virar burger. Requer:
  - Sprite máquina + bbox de "input"
  - Detecção de cow entrando na bbox
  - Animação de processamento
  - Counter de cows-na-fila se múltiplas cows
- Pool dedicado `QUIP_POOLS.grinder`

## Quando implementar
1. Verificar se a mecânica/sprite faz sentido com a estética do Cerrado/Chapada
2. Gerar sprite via PixelLab MCP (create_object com prompt curto)
3. Integrar como prop estático em `04_cenario.js` (idem objetos v3)
4. Adicionar `QUIP_POOLS.<categoria>` em `js/20_quips.js`
5. Hookar trigger (proximity, collision, ou state change)

## Outros quips compartilhados
- "Milk today, gone tomorrow." está em `cow` E `dairy` — intencional
- "You can't grill what you can't keep." em `cow` E `burger` — intencional
- "Not on the menu." em `cow` E `burger` — intencional
- "Fresh beef, questionable origin." em `burger` E `generic` — intencional
- "Keep calm and watch the sky." em `farmer` E `generic` — intencional
