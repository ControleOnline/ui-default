# DefaultForm

Formulário genérico create/edit orientado a **colunas** e `actions.save`.

**Arquivo:** `src/react/components/form/DefaultForm.js`

## Responsabilidade

- Filtrar colunas elegíveis ao formulário
- Montar **draft** a partir da row / defaults
- Salvar apenas campos alterados (edit) ou preenchidos (create)
- Renderizar cada campo com `DefaultInput` em `variant="form"`

## Props

| Prop | Default | Função |
| --- | --- | --- |
| `storeName` | `''` | i18n de labels/botões |
| `columns` | `[]` | Definição de campos |
| `row` | `{}` | Registro em edição |
| `mode` | `'edit'` | `'create'` \| `'edit'` |
| `actions` | `{}` | Precisa de `actions.save(payload)` |
| `getOptionsForColumn` | null | Options locais |
| `onBeforeOpen` | null | Antes de abrir select (`(column) => ...`) |
| `onCancel` | null | Cancelar |
| `onSaved` | null | `(savedItem, previousRow) => ...` |

## Inclusão de coluna no form

`shouldIncludeColumn(column, row, mode)`:

- precisa de `key`/`name`
- **exclui** `isIdentity === true`
- **exclui** `form === false` ou `multiline === true`
- em `create`: respeita `add === false`
- em `edit`: exige `isEditableColumn(column)`
- `visibleForm` (bool ou fn `(row, column) => boolean`)

## Draft e defaults

Ordem em `resolveDefaultValue`:

1. `row[field]`
2. `column.defaultValue` (valor ou fn)
3. `column.initialValue` (valor ou fn)

`resolveEditValue` normaliza para edição (list → option key, date → dmY, `editFormat`).

## Payload de save

**Create:** objeto só com campos que `hasValue`.  
**Edit:** sempre inclui `id` (`@id` ou `id` normalizado) + campos cujo texto normalizado **mudou**.

`formatSaveValue(column, value, row)`:

- `column.saveFormat` se existir
- objetos com `value` / `@id`
- datas → formato americano via `Formatter`
- números quando aplicável

Se não há nada a salvar → chama `onCancel` e não bate no backend.

## UI

- Grid scrollável de campos
- Botões Cancelar / Salvar (tema: store `theme`)
- Estado `isSaving` desabilita botão primário

## Exemplo

```jsx
<DefaultForm
  mode="create"
  storeName="customers"
  columns={store.getters.columns}
  actions={{ save: store.actions.save }}
  onCancel={close}
  onSaved={(item) => { close(); refresh(); }}
/>
```
