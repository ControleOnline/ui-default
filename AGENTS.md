## Escopo
- Modulo base da arquitetura antiga com store default e utilitarios genericos.
- Serve como apoio para fluxos legados.

## Estado
- Este modulo concentra o contrato default de listagens, stores herdados e componentes genericos de filtro.
- A base Vue em `src/vue` e legado, mas ainda e referencia do comportamento de listagem/filtros.
- Componentes React que implementam comportamento default de listagem ficam em `src/react`.

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
- Novas telas React que substituam esse comportamento devem manter o mesmo contrato: filtros aparecem ou somem por configuracao de store/columns, e filtros compartilhados em `ui-default` devem receber `store` e `field` para resolverem a coluna/label internamente.
- `DateShortcutFilter` e `CompactFilterSelector` pertencem a `ui-default/src/react/components/filters`. Nao recriar esses componentes em `ui-common` ou nos modulos donos das telas.

## Sumarios
- Toda listagem que exibe totais deve consumir `getters.summary` preenchido pelo backend/store.
- Nao calcular totais de listagem com `reduce` sobre `items`, porque `items` contem apenas a pagina carregada e pode ignorar filtros, paginacao ou regras de seguranca do backend.
- Quando faltar um total, ajuste a entidade/backend usando `CollectionSummary` ou um resolver de summary especifico e deixe a action default gravar `data.summary` no store.
