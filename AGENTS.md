# ui-default

## Escopo
- Biblioteca base de componentes reutilizaveis do front.
- `DefaultTable` e o shell canonico de listagens React deste sistema.

## Contrato do DefaultTable
- A tela deve passar preferencialmente apenas `storeName` e contexto minimo, como `requestParams`, `onRowPress`, `renderCard`, `onAdd`, `onEdit` ou componentes extras realmente especificos.
- O componente pode receber componentes de composicao para variacoes visuais, como `renderCard`, add personalizado, toolbar customizada, acoes auxiliares e modais de apoio; isso nao muda o contrato de que a listagem continua sendo responsabilidade do `DefaultTable`.
- Quando `data` nao e informada e existe `storeName`, o `DefaultTable` trabalha em modo automatico e carrega os itens pelas actions do store.
- O componente e responsavel por busca, ordenacao, filtros, paginação, infinite scroll, loading, erro, resumo, visibilidade de colunas, modo desktop e modo card no mobile.
- O store nao e fallback: ele e a regra. Se `columns` define um comportamento, o `DefaultTable` deve obedecer sem recriar uma segunda regra na tela.
- `columns` e a fonte de verdade para label, visibilidade, ordem, `editable`, `sortable`, `inputType`, `list`, `format`, `formatList`, `formatFilter`, `saveFormat`, `searchParam`, `externalFilter`, `summary` e `defaultSort`. `show:false` e um alias aceito para ocultar coluna, junto com `visible:false` e `table:false`.
- Se uma coluna vier como `editable: false`, ela continua nao editavel mesmo que seja ordenavel. Se vier como `sortable: true`, a ordenacao precisa continuar funcionando.
- `inputType: 'date-range'` exige filtro de intervalo. `externalFilter: true` habilita o filtro externo quando a listagem suporta esse contrato.
- Nada de search local, sort local, paginacao manual, contador local, total calculado por `reduce` ou cards paralelos quando o `DefaultTable` ja puder resolver isso pelo store.
- `requestParams` serve para contexto fixo do fluxo, nao para duplicar estado de filtro que ja vive no store.
- `pageSize` so deve ser usado quando o contrato externo exigir e com justificativa clara no modulo.
- `summary` e `totalItems` vem do backend/store e pertencem ao rodape interno do `DefaultTable`.
- `add: true` abre o `DefaultForm` quando a tela nao prover `onAdd`.
- O modo controlado continua existindo apenas para excecoes reais de integracao; o padrao do sistema e o modo store-driven.
- Loadings e erros devem seguir o fluxo central do sistema, sem banners ou estados paralelos na tela.
- O `get` do store default pode preservar o `item` atual durante refresh quando receber `__storeMeta.preserveItem = true`; use esse modo quando a tela precisa atualizar o registro sem desmontar o detalhe em exibição.

## Regra de uso
- Telas antigas devem ser simplificadas para passar o store e apenas as excecoes declarativas que o store nao cobre.
- Se a listagem precisa de outra regra de exibicao, a primeira opcao e mover essa regra para `columns` ou para o store correspondente.
- Se duas telas repetem a mesma logica de listagem, a resposta e um componente default ou um ajuste no `DefaultTable`, nunca uma copia local do comportamento.
