# 12 — Documentação de Arquitetura (humanos + AI, sem drift)

> Aplica-se a **todas as fases**. Define a estratégia de docs do Brócolis: humanas **e** para agentes AI, geradas dos contratos (fonte única), publicadas em VitePress, com `llms.txt`, secção de **markets** e guarda contra drift.

---

## 1. Princípios

1. **Docs geradas dos contratos, nunca duplicadas.** O spec OpenAPI é gerado do router oRPC (`@orpc/openapi`), nunca escrito à mão.
2. **Duas audiências**: humanos (VitePress) e agentes AI (`AGENTS.md` + `llms.txt` + `specs/*.md` por componente).
3. **Zero drift**: mudou contrato → CI regenera docs → PR quebra se docs ficarem obsoletas.
4. **Docs obrigatórias por componente**: `meta.ts` (4 pilares) é a fonte; a página do componente é derivada.
5. **Um documento canónico por decisão** (ADR); decisão nova sem ADR é bug de processo.
6. **Markets**: cada Country Pack tem a sua página derivada de `packages/markets`.

---

## 2. Stack de docs

| Ferramenta | Uso |
|------------|-----|
| **VitePress** | Site estático de docs (humanas) |
| **Scalar / Swagger UI** | Spec OpenAPI gerado do router oRPC |
| **@orpc/openapi** | `OpenAPIGenerator` + `OpenAPIHandler` (`docsProvider: "swagger"`) |
| **@orpc/tanstack-query** | `createTanstackQueryUtils` — query keys tipadas derivadas dos contratos |
| **Mermaid** | Diagramas C4 nos ADRs |

---

## 3. Estrutura de docs

```
docs/
├── vitepress/            # site VitePress (humanas)
├── api/                  # gerado de @orpc/openapi (nunca manual)
│   ├── openapi.json
│   └── scalar/  (Scalar UI)
├── architecture/         # C4, bounded contexts, ADRs (ADR-0001..)
├── experience/           # Experience Modules (03): personas, módulos, gates
│   ├── personas/         # persona sheet por ator
│   └── modules/          # EXP-<NN>-<slug> por Experience Module
├── design-system/        # derivado de packages/ui (meta.ts → página)
│   └── journey-patterns/ # specs dos journey-patterns oficiais
├── markets/              # derivado de packages/markets (AO, MZ, KE, NG…)
│   └── ao/               # currency, payments, address, phone, regulation, logistics
├── requirements/         # PRDs, regras de negócio, NFRs
├── testing/              # estratégia de testes
├── security/             # ameaças, hardening
└── operations/           # runbooks, deploys
llms.txt                  # índice para agentes AI
AGENTS.md                 # regras de agente (raiz do repo)
```

---

## 4. Geração automática

| Fonte | Saída | Comando |
|-------|-------|---------|
| Router oRPC (contracts Zod) | `docs/api/openapi.json` + Scalar | `pnpm docs:generate` |
| `packages/ui/**/*.meta.ts` | página de componente no VitePress | `pnpm docs:ds` |
| `packages/markets/src/**` | páginas de mercado | `pnpm docs:markets` |
| ADRs (markdown) | secção Architecture | manual (única exceção) |
| `turbo` | `check:drift` falha se docs desatualizadas | `pnpm check:drift` |

### Spec OpenAPI — regras

- Fonte única: router oRPC em `packages/contracts`. Nunca ficheiro `.yaml` à mão.
- Expor Scalar por defeito, Swagger opcional.
- Coerção REST via `ZodSmartCoercionPlugin`; SSR/hydration via `StandardRPCJsonSerializer`.
- TanStack Query docs geradas com `createTanstackQueryUtils`.

---

## 5. Docs para agentes AI

- `AGENTS.md` (raiz): regras de trabalho, regras imutáveis, comandos de gates.
- `llms.txt`: índice de todos os documentos do repo, incluindo a secção `markets`.
- `docs/experience/modules/`: spec de cada Experience Module (`03-EXPERIENCE-ARCHITECTURE.md`).
- `specs/*.md` por journey-pattern: `journey.spec.md` é a referência antes de desenhar UI.
- Meta-dados por componente (`meta.ts`) são legíveis por agentes.
- `docs/markets/ao/` é a referência de Market do agente antes de implementar regras de país.

### `llms.txt` (excerto)

```text
# Brócolis

## Blueprint
- blueprint/README.md
- blueprint/00-VISAO-PRODUTO.md
- blueprint/01-STACK-MONOREPO.md
- blueprint/02-ARQUITETURA-CONTRATOS.md
- blueprint/03-EXPERIENCE-ARCHITECTURE.md
- blueprint/04-DESIGN-SYSTEM.md
- blueprint/05-REQUISITOS-JORNADAS.md
- blueprint/06-TESTES.md
- blueprint/07-FINPAY-INTEGRATION.md
- blueprint/08-CICD-GOVERNANCA.md
- blueprint/09-ROADMAP-FASES.md
- blueprint/10-BEST-PRACTICES.md
- blueprint/11-PIPELINE-AUTONOMO.md
- blueprint/12-DOCS-ARQUITETURA.md
- blueprint/13-ANALISE-CONCORRENCIA.md
- blueprint/14-THREAT-MODEL.md
- blueprint/15-DATA-GOVERNANCE.md
- blueprint/16-INCIDENT-MANAGEMENT.md
- blueprint/17-COST-MANAGEMENT.md
- blueprint/18-EVAL-FRAMEWORK.md
- blueprint/19-MULTI-TENANT-STRATEGY.md
- blueprint/20-DISASTER-RECOVERY.md

## Markets
- docs/markets/ao/
- docs/markets/mz/
- docs/markets/ke/

## Architecture decisions
- docs/decisions/ADR-0001.md … ADR-0009.md
```

---

## 6. Anti-patterns de docs

| Anti-pattern | Correto |
|--------------|---------|
| Spec OpenAPI escrito à mão | Gerado do router oRPC |
| Docs de componente sem `meta.ts` | `meta.ts` + página derivada |
| Drift contrato ↔ docs | `check:drift` quebra CI |
| Decisão sem ADR | ADR obrigatório (ver `08-CICD-GOVERNANCA.md`) |
| Docs humanas vs docs AI divergentes | Uma fonte (`docs/`), `llms.txt` como índice |
| Regra de país em doc genérico | Página no `docs/markets/<cc>/` |
| Figma como verdade | Código (`design.json`, `meta.ts`) |
| Pipeline sem registo | `state/evidence.json` como doc operacional |
