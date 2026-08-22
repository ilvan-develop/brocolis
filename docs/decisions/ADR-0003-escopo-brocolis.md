# ADR-0003: Escopo `@brocolis/*` para packages

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

Packages partilhados precisam de escopo consistente e identificável.

## Decisão

Todos os packages usam escopo `@brocolis/*`. Apps (web, api, mobile, qa) **sem**
escopo. Hifenização (ex.: `test-helpers`). Nomes descritivos, sem `utils`/`shared`
genéricos (regra AP-08).

## Consequências

`@brocolis/contracts`, `@brocolis/db`, `@brocolis/ui`, etc. Consumidos por `workspace:*`.