## Escopo
- Modulo base da arquitetura antiga com store default e utilitarios genericos.
- Serve como apoio para fluxos legados.

## Estado
- Este modulo hoje nao tem `src/react`; a implementacao disponivel fica em `src/vue` e nos stores herdados.
- Em novos prompts, priorizar modulos React equivalentes quando existirem.
- So mexer aqui se o pedido for explicitamente sobre esse fluxo antigo ou se nao houver alternativa atual.

## Quando usar
- Prompts sobre `default` store antigo, helpers herdados e base Quasar antiga.
