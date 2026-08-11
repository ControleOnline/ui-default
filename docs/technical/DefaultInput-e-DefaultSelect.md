# DefaultInput e DefaultSelect

Camada de campo único usada por **tabela** (`variant="cell"`) e **form** (`variant="form"`).

## DefaultInput

**Arquivo:** `src/react/components/inputs/DefaultInput.js`

### Roteamento por tipo de coluna

| Condição | Componente |
| --- | --- |
| `column.list` truthy | `DefaultSelect` |
| `isColorColumn(column)` | `DefaultColorInput` |
| `isDateLikeColumn(column)` | `DefaultDateInput` |
| leitura + extra data | `DefaultExtraData` |
| leitura + file | `DefaultFileColumn` |
| senão | `TextInput` ou modo leitura com badge/ícone/imagem |

### Props relevantes

| Prop | Função |
| --- | --- |
| `column` / `columns` / `row` | Contrato de coluna e contexto |
| `editing` | Alterna leitura × edição (cell) |
| `variant` | `'cell'` \| `'form'` |
| `autoSave` | `true`: `onSave` no blur/submit; `false`: só `onChangeValue` |
| `onStartEditing` / `onCancelEditing` / `onSave` | Ciclo de edição inline |
| `getOptionsForColumn` | Options injetadas |
| `showLabel` | Label acima do campo |
| `displayValue` | Override de texto lido |
| `accentColor` / `defaultColor` | Tema / cor default |

### Modo leitura

- `resolveCellText` + `resolveCellPresentation` (cor, ícone Feather, image, badge)
- Ícone de editar se `isEditableColumn` e existe `onStartEditing`
- Prefixo/sufixo da coluna

### Modo edição texto

- `keyboardType` numérico se `inputType` number/float
- Cancel (X) só fora de form

## DefaultSelect

**Arquivo:** `src/react/components/inputs/DefaultSelect.js`

### Fontes de opções

1. `getOptionsForColumn(column)`
2. `column.list` como **array** estática
3. `column.list` como string `"storeName/actionName"` → `getAllStores()[store].actions[action]`
4. Cache em memória por chave serializada de params

### Params de load remoto

`resolveColumnListLoadParams`:

- escopo empresa para `categories` (`company`), `paymentType` / `wallet` (`people`)
- `column.listRequestParams` (objeto ou fn)
- busca: `listSearchParam` \|\| `searchParam` \|\| `'search'`

### UX

- Toque abre `Modal` com busca e lista
- `autoSave`: `onSave({ value, label, object })`
- form: `onChangeValue(key, meta)`
- `onBeforeOpen` pode pré-carregar items

### Meta visual de opção

`formatList` / item pode expor `color`, `icon`, `image` para badges na lista e no valor selecionado.
