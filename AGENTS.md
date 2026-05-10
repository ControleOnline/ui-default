## Escopo
- Modulo base da arquitetura antiga com store default e utilitarios genericos.
- Serve como apoio para fluxos legados.

## Estado
- Este modulo concentra o contrato default de listagens, stores herdados e componentes genericos de filtro.
- A base Vue em `src/vue` e legado, mas ainda e referencia do comportamento de listagem/filtros.
- Componentes React que implementam comportamento default de listagem ficam em `src/react`.

## Quando usar
- Prompts sobre `default` store antigo, helpers herdados e base Quasar antiga.

## Regra obrigatoria de componentes default
- `ui-default` e o modulo dono dos componentes padrao de listagem, toolbar, filtros, inputs e edicao inline. Tudo o que for possivel deve ter um componente default aqui para que as telas do sistema sejam reutilizaveis, pequenas e componentizadas.
- Toda tela nova ou alterada deve partir dos defaults e dos stores, sem excecao. A tela dona pode organizar contexto e visual especifico, mas nao deve recriar comportamento default de tabela, filtro, toolbar, input, select, formatacao ou edicao.
- Desktop deve seguir o padrao do `DefaultTable`: visao em tabela, colunas vindas do store, edicao por celula/linha e botoes de acao no toolbar.
- Mobile deve ser responsabilidade do `DefaultTable`: em React, ele alterna para cards em largura compacta e pode receber um renderer/componente de card customizado da tela. A tela dona nao deve criar `FlatList`/cards paralelos para substituir a listagem default.
- Toda edicao do `DefaultTable` React deve usar `DefaultInput`/`DefaultSelect` deste modulo. Isso vale para celulas desktop, campos de card customizado via `renderField` e modal fallback.
- A configuracao de cada coluna vem do store. Use `columns` para `list`, `label`, `format`, `formatList`, `formatFilter`, `saveFormat`, `inputType`, `visible`, `editable`, `filter`, `externalFilter`, `filterClass` e metadados equivalentes. Nao duplicar lista, label, formatacao ou regra de edicao na tela.
- Acoes globais da listagem e atalhos de contexto pertencem ao toolbar default. Quando houver espaco, devem ficar na mesma linha da toolbar para economizar altura vertical.
- Contagens de listagem (`totalItems`) pertencem ao rodape sticky interno do `DefaultTable`; telas consumidoras nao devem renderizar pilulas de total soltas acima da tabela.
- O botao de adicionar pertence a barra inferior do `DefaultTable` React, nunca solto/flutuante na tela. Ele deve ler `add` do store da listagem e receber da tela apenas o callback contextual quando a criacao exigir navegacao ou fluxo especifico.

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
- Busca textual padrao em listagens React deve entrar via `searchProps` do `DefaultTable`, renderizada pequena na toolbar com `DefaultSearch` de `ui-default/src/react/components/filters`, sincronizando `filters.search` quando a listagem usa store/default filters.
- Quando uma tela React usar `DefaultTable`, o backend/store correspondente tambem precisa expor o contrato completo da listagem: ordenacao, pesquisa, filtros e paginacao. Campos de data devem ordenar pelo valor real no backend, e a busca deve ser implementada no backend com `CustomOrFilter` ou mecanismo equivalente, nunca por filtragem local escondida na tela.
- Em React, `DefaultExternalFilters` e responsavel pelo comportamento responsivo dos filtros externos: desktop exibe os campos inline; largura compacta exibe um botao que abre modal. Telas consumidoras nao devem criar accordion/header mobile paralelo para esses filtros.

## Sumarios
- Toda listagem que exibe totais deve consumir `getters.summary` preenchido pelo backend/store.
- Nao calcular totais de listagem com `reduce` sobre `items`, porque `items` contem apenas a pagina carregada e pode ignorar filtros, paginacao ou regras de seguranca do backend.
- Quando faltar um total, ajuste a entidade/backend usando `CollectionSummary` ou um resolver de summary especifico e deixe a action default gravar `data.summary` no store.
