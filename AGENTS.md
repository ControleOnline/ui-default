## Escopo
- Modulo base da arquitetura antiga com store default e utilitarios genericos.
- Serve como apoio para fluxos legados.

## Estado
- Este modulo hoje nao tem `src/react`; a implementacao disponivel fica em `src/vue` e nos stores herdados.
- Em novos prompts, priorizar modulos React equivalentes quando existirem.
- So mexer aqui se o pedido for explicitamente sobre esse fluxo antigo ou se nao houver alternativa atual.

## Quando usar
- Prompts sobre `default` store antigo, helpers herdados e base Quasar antiga.

## Filtros
- `filters` e o estado aplicado da listagem. Ele vive no store acessado por `${configs.store}/filters` e deve ser alterado por `SET_FILTERS`/`applyFilters`, nao por estado local paralelo como fonte da verdade.
- `configs.filters` habilita ou desabilita a infraestrutura de filtros da listagem.
- `configs.externalFilters` controla o painel externo de filtros. Em `DefaultTable.vue`, `DefaultExternalFilters` aparece apenas quando `configs.filters`, `configs.externalFilters != false`, `configs.headers != false` e a tela e desktop (`$q.screen.gt.sm`).
- `DefaultExternalFilters.vue` nao inventa campos: ele percorre `columns` do store e exibe apenas colunas que passam por `shouldIncludeColumn(column)` e possuem `column.externalFilter == true`. Tambem adiciona filtros extras de `configs.components.customFilters`.
- Filtros inline/de cabecalho da tabela aparecem por coluna quando `configs.filters` esta ativo e `column.filter != false`.
- A configuracao visual e funcional de cada filtro deve vir da coluna do store: `key`/`name`, `label`, `filterClass`, `inputType`, `list`, `prefix`, `sufix`, `formatFilter`, `visible`, `filter` e `externalFilter`.
- `FilterInputs.vue` escolhe o tipo de campo pela coluna: `inputType == 'date-range'` usa `DateRangeInput`, colunas com `list` usam `SelectInput`, e o restante usa `q-input`.
- Novas telas React que substituam esse comportamento devem manter o mesmo contrato: filtros aparecem ou somem por configuracao de store/columns, e filtros compartilhados em `ui-common` devem receber `store` e `field` para resolverem a coluna/label internamente.
