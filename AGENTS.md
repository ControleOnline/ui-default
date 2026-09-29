## Ponto de entrada

- A documentação funcional e de regras deste modulo vive na **wiki do proprio repositório** e na wiki principal do app.
- Regras transversais de qualidade, modularizacao e limites de componente vivem em `https://github.com/ControleOnline/agents-mcp/blob/master/skills/shared/code-quality.md`.
- Quando houver detalhe especifico de implementacao, prefira comentar no codigo em ingles perto da regra.
- Este arquivo deve ficar curto e servir apenas como ponte para as fontes oficiais.

## Documentação (navegação humana)

| Categoria | Destino |
| --- | --- |
| Home do módulo | https://github.com/ControleOnline/ui-default/wiki |
| Wiki principal do app | https://github.com/ControleOnline/app-community/wiki |

### Componentes Default*

| Página | O que documenta |
| --- | --- |
| [Índice Default*](https://github.com/ControleOnline/ui-default/wiki/Default-Components) | Mapa da família e arquitetura |
| [DefaultTable](https://github.com/ControleOnline/ui-default/wiki/DefaultTable) | Listagens, store contract, view modes, **hydrate único de filtros** (`useDefaultTableStoreSync`, anti #185) |
| [DefaultForm](https://github.com/ControleOnline/ui-default/wiki/DefaultForm) | Create/edit genérico |
| [DefaultInput e DefaultSelect](https://github.com/ControleOnline/ui-default/wiki/DefaultInput-e-DefaultSelect) | Campos e listas |
| [Contrato de colunas](https://github.com/ControleOnline/ui-default/wiki/Contrato-de-colunas) | Flags e serialização |

Cópias versionadas: `docs/technical/*.md`

### Visão deste módulo

`ui-default` é a **biblioteca de UI genérica** (tabela, form, inputs, filtros, upload, mapa) consumida pelos submódulos do `app-community`. Não carrega regra de domínio de um `APP_TYPE` específico; o domínio entra via `storeName` + `columns`.

### DefaultUpload (app-community#296)

| Página / arquivo | O que documenta |
| --- | --- |
| `src/react/components/upload/DefaultUpload.js` | Mini gerenciador de arquivos por **contexto** (biblioteca + anexos da entidade) |
| `DefaultUploadManagerModal.js` | Modal de biblioteca / upload / attach |
| `DefaultUploadAttachmentsList.js` | Lista inline de anexos + capa |
| `defaultUploadHelpers.js` / `defaultUploadLibrary.js` / `fileUpload.js` | Helpers puros e fetch da biblioteca |

**Contrato de uso**

- Props principais: `context` (obrigatório — escopo dos arquivos), `companyId` / people da empresa, `entityId` + `relationResource` / `relationField` para vínculo, `fileActions` / `relationActions` (stores), `fileType`, `maxFiles`, `attachmentRows`, callbacks `onChanged` / `onCoverChanged` / `onAttachFile` / `onUploadFile`.
- Todo upload abre o mini gerenciador já limitado ao `context` (e `people` da company quando informado).
- Listagem da biblioteca chama `fileActions.getItems({ context, people, ... })` — o backend aplica `FileService::securityFilter` (company-scoped).
- Não chamar API de files diretamente nas telas consumidoras; usar stores/actions.
- Reutilizar `DefaultFile` para preview/download.
