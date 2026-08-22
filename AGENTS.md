# AGENTS.md — Regras de trabalho do Brócolis

> Versão canónica: blueprint/README.md (regras imutáveis) e blueprint/10-BEST-PRACTICES.md.

## Regras imutáveis

1. **Testes desde o princípio** — nenhum código merge sem testes.
2. **Contracts-first** — nenhuma rota sem contrato oRPC + Zod em `@brocolis/contracts`.
3. **Tenant + Market isolation** — `organizationId` e `marketCode` obrigatórios.
4. **Build Global. Configure Local.** — nenhum detalhe de país no Core; tudo via `@brocolis/markets`.
5. **Design tokens** — nunca hex cru; tokens semânticos do `design.json`.
6. **Quality gates** — lint, typecheck, build e cobertura ≥80% verdes antes do commit.
7. **Audit trail** — toda mutação crítica regista `AuditEvent` na mesma `$transaction`.
8. **FinPay é a processadora** — sem Stripe nem outra SDK.
9. **Conformidade** — AGT/SAF-T, LGPD e regras farmacêuticas desde o schema.
10. **Evidence-based** — nada sem evidência em `.ai/state/evidence.json`.
11. **Pesquisar antes de implementar** — sem skill instalada, pesquisar (context7/docs) primeiro.
12. **Experiência antes de UI** — F-EX antes de F-DS; nenhuma tela sem Experience Module.
13. **Threat model formal** — STRIDE por bounded context antes da F1.
14. **Monorepo governado** — sherif, madge, depcruise, fitness-check antes do push.

## Arquitetura monorepo

- Apps: `apps/web` (Next.js), `apps/api` (NestJS + oRPC), `apps/mobile` (Expo), `apps/qa` (Playwright/Maestro).
- Packages `@brocolis/*`: `contracts`, `db`, `auth`, `ui`, `i18n`, `markets`, `formatters`, `finpay`, `validation`, `observability`, `test-helpers`.
- `packages/db` é o **único** que instancia `PrismaClient`. Nunca importar shadcn fora de `@brocolis/ui`. Apps nunca importam apps.
- Componentes shadcn instalados pelo CLI **dentro de `apps/web`** (rota automática para `packages/ui`).

## Componentes novos na UI

- Sempre `meta.ts` (4 pilares) + story + test; indicar `models` (b2c|b2b|b2b2c).
- Texto via `t()` (`@brocolis/i18n`); moeda via `@brocolis/formatters`; cores via tokens.

## Gates antes de commitar

```
pnpm lint && pnpm typecheck && pnpm test:unit && node scripts/fitness-check.mjs
```

## graphify

O projeto **Brócolis** (`brocolis`, marketplace farmacêutico multi-tenant) tem um knowledge graph em `graphify-out/` com god nodes, community structure e cross-file relationships (código AST + docs do `blueprint/` e `docs/`).

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
