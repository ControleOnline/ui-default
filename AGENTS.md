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
| [DefaultTable](https://github.com/ControleOnline/ui-default/wiki/DefaultTable) | Listagens, store contract, view modes |
| [DefaultForm](https://github.com/ControleOnline/ui-default/wiki/DefaultForm) | Create/edit genérico |
| [DefaultInput e DefaultSelect](https://github.com/ControleOnline/ui-default/wiki/DefaultInput-e-DefaultSelect) | Campos e listas |
| [Contrato de colunas](https://github.com/ControleOnline/ui-default/wiki/Contrato-de-colunas) | Flags e serialização |

Cópias versionadas: `docs/technical/*.md`

### Visão deste módulo

`ui-default` é a **biblioteca de UI genérica** (tabela, form, inputs, filtros, upload, mapa) consumida pelos submódulos do `app-community`. Não carrega regra de domínio de um `APP_TYPE` específico; o domínio entra via `storeName` + `columns`.
