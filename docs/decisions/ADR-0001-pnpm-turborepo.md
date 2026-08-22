# ADR-0001: Usar pnpm + Turborepo para o monorepo

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

Três apps (Next.js, NestJS, Expo) partilham um core de packages. Sem versionamento
único, ocorrem bugs de runtime por deriva de versões.

## Decisão

pnpm workspaces (11) com Turborepo 2.x para orquestrar tasks (build/lint/test) e
pnpm **catalogs** com `catalogMode: strict` para garantir uma versão por dependência.

## Alternativas

- Nx: mais features, mais complexidade.
- Yarn workspaces: sem catalogs.

## Consequências

- Positivo: deriva eliminada, cache incremental, gates mais rápidos.
- Negativo: equipa deve aprender catalogs; base em `turbo.json` fixa o grafo.