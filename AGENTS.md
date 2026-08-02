# ui-default

## Escopo

- Biblioteca base de componentes reutilizaveis do front.
- `DefaultTable` e o shell canonico de listagens React deste sistema.

## Contrato do DefaultTable

- A tela deve passar preferencialmente apenas `storeName` e contexto minimo, como `requestParams`, `onRowPress`, `renderCard`, `onAdd`, `onEdit` ou componentes extras realmente especificos.
- O componente pode receber componentes de composicao para variacoes visuais, como `renderCard`, add personalizado, toolbar customizada, acoes auxiliares e modais de apoio; isso nao muda o contrato de que a listagem continua sendo responsabilidade do `DefaultTable`.
- Quando `data` nao e informada e existe `storeName`, o `DefaultTable` trabalha em modo automatico e carrega os itens pelas actions do store.
- O componente e responsavel por busca, ordenacao, filtros, paginação, infinite scroll, loading, erro, resumo, visibilidade de colunas, modo desktop e modo card no mobile.
- Preferencias de usuario do `DefaultTable`, incluindo filtros, busca, ordenacao, modo de exibicao e visibilidade de colunas, devem ser salvas em `localStorage` na chave `default-table`, sempre no formato `[store][rota] = valores`. Nunca usar chave apenas por store ou apenas por rota.
- O store nao e fallback: ele e a regra. Se `columns` define um comportamento, o `DefaultTable` deve obedecer sem recriar uma segunda regra na tela.
- `columns` e a fonte de verdade para label, visibilidade, ordem, `editable`, `sortable`, `inputType`, `list`, `format`, `formatList`, `formatFilter`, `saveFormat`, `searchParam`, `externalFilter`, `summary` e `defaultSort`. `show:false` e um alias aceito para ocultar coluna, junto com `visible:false` e `table:false`.
- Se uma coluna vier como `editable: false`, ela continua nao editavel mesmo que seja ordenavel. Se vier como `sortable: true`, a ordenacao precisa continuar funcionando.
- `inputType: 'date-range'` exige filtro de intervalo. `externalFilter: true` habilita o filtro externo quando a listagem suporta esse contrato.
- Campos `list` e selects com listas nao devem ser pre-carregados no mount nem na abertura do modal inteiro. O carregamento das opcoes acontece no `onBeforeOpen` do proprio campo ou filtro, para evitar requests globais desnecessarios.
- Nada de search local, sort local, paginacao manual, contador local, total calculado por `reduce` ou cards paralelos quando o `DefaultTable` ja puder resolver isso pelo store.
- `requestParams` serve para contexto fixo do fluxo, nao para duplicar estado de filtro que ja vive no store.
- `pageSize` so deve ser usado quando o contrato externo exigir e com justificativa clara no modulo.
- `summary` e `totalItems` vem do backend/store e pertencem ao rodape interno do `DefaultTable`.
- `add: true` abre o `DefaultForm` quando a tela nao prover `onAdd`.
- Importacao generica pertence ao `DefaultTable`: o store declara `configs.import` com `importType` e chaves de traducao, e a tela nao deve criar botao ou modal local para CSV.
- `rowActionsComponent` e o slot canonico para acoes por linha quando a tela precisa renderizar mais do que o botao padrao de edicao. Ele pode ser componente, funcao ou elemento React, recebe `row`, `storeName`, `openEdit`, `openRow` e `helpers`, e a largura da coluna deve ser ajustada com `rowActionsWidth` quando houver mais de uma acao.
- O modo controlado continua existindo apenas para excecoes reais de integracao; o padrao do sistema e o modo store-driven.
- Loadings e erros devem seguir o fluxo central do sistema, sem banners ou estados paralelos na tela.
- O `get` do store default pode preservar o `item` atual durante refresh quando receber `__storeMeta.preserveItem = true`; use esse modo quando a tela precisa atualizar o registro sem desmontar o detalhe em exibição.
- Explicacoes permanentes de tela devem sair do corpo principal e ir para o `DefaultTooltip`, acionado por `?`, quando houver contexto necessario para o usuario.

## Componentes de feedback

- `StateStore` e o shell compartilhado para loading e saving de tela/seção.
- O `mode` do `StateStore` e um preset generico do shell e pode variar conforme a tela; exemplos validos incluem `compact`, `display` e outros modos reais do fluxo.
- `DefaultErrors` e o shell compartilhado para erro local/inline de tela ou tab; ele lê o `error` dos stores informados, aparece como popup, auto-fecha em 5 segundos e limpa o erro do store ao ser fechado.
- `showError` continua sendo feedback transitório global; nao deve substituir `DefaultErrors` quando o erro for inline ou local.
- Telas e componentes visuais nao devem usar `ActivityIndicator` direto quando o estado puder ser representado por `StateStore`.
- O contrato de explicacao permanente continua sendo `DefaultTooltip`, sempre acionado por `?` e fora do corpo principal da tela.

## Arquivos e imagens

- `DefaultFile` e o componente compartilhado para arquivos/imagens vindos do backend.
- Quando a fonte for um arquivo de download do backend, o componente deve resolver a URL com o dominio no path (`/{dominio}/files/{id}/download`) quando nao for possivel enviar header e enviar o mesmo valor em `headers` quando a plataforma permitir.
- Telas que exibem logo, fundo, avatar, banner ou qualquer arquivo de empresa devem preferir `DefaultFile` em vez de `Image` direto quando o contrato vier do backend.
- Colunas de listagem com arquivos devem declarar `inputType: "files"` ou variantes especificas como `images`, `pdf` ou `documents`; o renderer decide preview/icone pelo `fileType` e `extension` do arquivo, usando `column.fileType` apenas quando a celula trouxer somente ID.
- `DefaultUpload` e o gerenciador compartilhado para anexar, listar, vincular e remover arquivos por contexto.
- A tela deve passar o contrato do relacionamento via `relationStoreName`, `relationField`, `relationResource`, `entityId`, `companyId`, `context` e, quando houver, `libraryContexts`, `coverRelationId` e `onCoverChanged`.
- O componente usa o store de arquivos e o store de relacionamento para carregar a biblioteca, anexar itens existentes, subir novos arquivos e manter o backend como ponto unico de upload.
- Botoes especificos de tela, como camera de avatar ou importacao CSV, devem usar `renderTrigger` e `showInlineContent={false}`; o trigger nunca deve abrir seletor de arquivo direto, apenas o gerenciador.
- Contextos cujo vinculo e gerenciado pelo pai devem usar `onUploadFile`, `onAttachFile`, `onRemoveAttachment` e, quando o upload ja persistir o vinculo, `uploadResultAlreadyAttached`.
- `requireEntity={false}` e excecao para fluxos sem entidade persistida, como importacao, e deve continuar passando pelo gerenciador compartilhado.
- Sempre que existir mini gerenciador local com o mesmo comportamento, a primeira opcao e migrar para `DefaultUpload` em vez de copiar a logica.
- `DefaultFile` continua sendo o renderer preferencial dentro do `DefaultUpload` para previews de arquivos oriundos do backend.

## Regra de uso

- Telas antigas devem ser simplificadas para passar o store e apenas as excecoes declarativas que o store nao cobre.
- Se a listagem precisa de outra regra de exibicao, a primeira opcao e mover essa regra para `columns` ou para o store correspondente.
- Se duas telas repetem a mesma logica de listagem, a resposta e um componente default ou um ajuste no `DefaultTable`, nunca uma copia local do comportamento.

## Qualidade de código

- A barra comum de modularizacao, testes, smoke tests e limite de tamanho de componentes vive em `https://github.com/ControleOnline/agents-mcp/blob/master/skills/shared/code-quality.md`.
