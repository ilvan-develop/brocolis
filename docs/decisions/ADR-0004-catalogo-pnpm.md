# ADR-0004: Catálogo pnpm com catalogMode strict

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

(anti-pattern AP-05) duas versões da mesma library quebram contratos partilhados
(oRPC, vitest, react…).

## Decisão

`catalogMode: strict` + catálogo central em `pnpm-workspace.yaml` (uma versão por
dependência). Packages referenciam `catalog:`. Overrides para pinning crítico
(vitest 4.1.10, pino 9.14.0, prom-client 15.1.3). `allowBuilds` explícito.

## Consequências

Sherif valida a consistência no CI; codemod `pnpm/catalog` disponível para
migrações futuras.