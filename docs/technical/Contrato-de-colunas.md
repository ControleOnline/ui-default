# Contrato de colunas (`defaultInputUtils`)

**Arquivo:** `src/react/components/inputs/defaultInputUtils.js`

A coluna é o **contrato de UI + serialização** compartilhado por Table, Form e Inputs.

## Identidade

| Campo | Uso |
| --- | --- |
| `key` ou `name` | Nome do campo (`getColumnKey`) |
| `label` | Rótulo (i18n via `formatStoreColumnLabel`) |
| `isIdentity` | PK visual; fora do form; largura própria na tabela |

## Visibilidade e edição

| Flag | Efeito |
| --- | --- |
| `show` / `visible` / `table` | Inclusão na tabela (`shouldIncludeColumn` em utils da table) |
| `form` | `false` remove do form |
| `add` | `false` remove do create |
| `editable` | `false` bloqueia edição |
| `visibleForm` | bool ou fn |
| `multiline` | excluído do DefaultForm atual |
| `sortable` / `sortField` / `defaultSort` | Sort |
| `summary` | Agregações no footer |

## Tipos de input

| `inputType` / `type` | Comportamento |
| --- | --- |
| `date` / `date-range` / `range-date` | `DefaultDateInput`; save via `Formatter` |
| `color` / `hexcolor` ou nome color-like | `DefaultColorInput` |
| `file` / `image` / `document` / … | `DefaultFileColumn` (não editável inline) |
| `extradata` | `DefaultExtraData` |
| `number` / `float` | teclado numérico |
| `increase` | não editável |

## Listas (select)

| Campo | Uso |
| --- | --- |
| `list` | Array local **ou** `"store/action"` |
| `listRequestParams` | Filtros extras do load |
| `listSearchParam` / `searchParam` | Query de busca |
| `formatList` | Normaliza item → label/meta |
| `translate` | Força/desliga i18n de labels de opção |

## Formatação

| Campo | Uso |
| --- | --- |
| `format` | Apresentação de célula (pode retornar objeto com color/icon) |
| `editFormat` | Valor ao entrar em edição |
| `saveFormat` | Valor ao persistir |
| `prefix` / `sufix`/`suffix` | Decoração textual |
| `style` | estilo estático ou fn(row) |
| `width` / `minWidth` / `flexBasis` | Layout de coluna na table |
| `defaultValue` / `initialValue` / `defaultColor` | Defaults de form/cor |

## Helpers exportados (referência rápida)

`normalizeText`, `getColumnKey`, `isEditableColumn`, `isDateLikeColumn`, `isColorColumn`, `isFileColumn`, `isExtraDataColumn`, `normalizeId`, `normalizeOptionKey`, `mapOptions`, `buildOptionsFromColumn`, `resolveCellText`, `resolveCellPresentation`, `buildReadPresentationStyles`, `resolveEditValue`, `formatSaveValue`, `resolveStoreNameFromList`, `resolveColorToken`

## Campos traduzíveis por convenção

Sem `translate: true`, ainda traduz labels de opção se o nome do campo estiver em: `active`, `app`, `channel`, `status`, `ordertype`, `peopletype`, etc. (`DEFAULT_TRANSLATABLE_FIELDS`).
