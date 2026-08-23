# Brócolis

Marketplace farmacêutico multi-tenant para Angola. Monorepo gerido com **pnpm workspaces** e **Turborepo**.

## Visão geral

O Brócolis conecta farmácias, fornecedores e consumidores finais numa plataforma única, com processamento de pagamentos via **FinPay**, conformidade fiscal (**AGT/SAF-T**), proteção de dados (**LGPD**) e suporte multi-mercado.

### Princípios imutáveis

1. **Testes desde o princípio** — nenhum código merge sem testes
2. **Contracts-first** — nenhuma rota sem contrato oRPC + Zod em `@brocolis/contracts`
3. **Tenant + Market isolation** — `organizationId` e `marketCode` obrigatórios
4. **Build Global. Configure Local.** — nenhum detalhe de país no Core; tudo via `@brocolis/markets`
5. **Design tokens** — nunca hex cru; tokens semânticos do `design.json`
6. **Quality gates** — lint, typecheck, build e cobertura ≥80% verdes antes do commit
7. **Audit trail** — toda mutação crítica regista `AuditEvent` na mesma `$transaction`
8. **FinPay é a processadora** — sem Stripe nem outro SDK
9. **Conformidade** — AGT/SAF-T, LGPD e regras farmacêuticas desde o schema
10. **Evidence-based** — nada sem evidência em `.ai/state/evidence.json`
11. **Pesquisar antes de implementar** — sem skill instalada, pesquisar primeiro
12. **Experiência antes de UI** — F-EX antes de F-DS; nenhuma tela sem Experience Module
13. **Threat model formal** — STRIDE por bounded context antes da F1
14. **Monorepo governado** — sherif, madge, depcruise, fitness-check antes do push

## Estrutura do monorepo

```
brocolis/
├── apps/
│   ├── api/          # NestJS 11 + oRPC — API HTTP
│   ├── web/          # Next.js 16 — Frontend web
│   ├── mobile/       # Expo + React Native — App móvel
│   └── qa/           # Playwright + Maestro — Testes E2E
├── packages/
│   ├── auth/         # @brocolis/auth — Better Auth
│   ├── contracts/    # @brocolis/contracts — Contratos oRPC + Zod
│   ├── db/           # @brocolis/db — Prisma (único PrismaClient)
│   ├── finpay/       # @brocolis/finpay — SDK FinPay
│   ├── formatters/   # @brocolis/formatters — Moeda, datas, etc.
│   ├── i18n/         # @brocolis/i18n — Internacionalização
│   ├── markets/      # @brocolis/markets — Configuração por mercado
│   ├── observability/# @brocolis/observability — Sentry, OTel, pino
│   ├── test-helpers/ # @brocolis/test-helpers — Utilitários de teste
│   ├── ui/           # @brocolis/ui — Componentes shadcn + tokens
│   └── validation/   # @brocolis/validation — Schemas Zod partilhados
├── blueprint/        # Documentação de arquitetura (fonte canónica)
├── docs/             # Documentação de domínio (IAM, compliance, commerce, pharmacy)
├── scripts/          # Scripts de CI e governance
├── .env.example      # Template de variáveis de ambiente
├── turbo.json        # Configuração Turborepo
├── pnpm-workspace.yaml
└── package.json      # Root — scripts globais e devDependencies
```

## Gates de qualidade

Antes de cada commit, todos os gates devem estar verdes:

```powershell
# 1. Lint (Biome)
pnpm lint

# 2. Typecheck (TypeScript)
pnpm typecheck

# 3. Testes unitários (Vitest / Jest)
pnpm test:unit

# 4. Build
pnpm build

# 5. Fitness check (governança monorepo)
pnpm governance
```

### Gates adicionais (antes do push)

```powershell
# Verificar deriva de dependências
pnpm drift

# Detetar dependências circulares
pnpm circular

# Auditar grafo de dependências
pnpm depcruise
```

### Script de quality gate

```powershell
pnpm quality:gate
```

Executa lint + typecheck + test:unit + build em sequência.

## Como correr cada app

### Pré-requisitos globais

| Ferramenta | Versão mínima |
|---|---|
| Node.js | >= 20 (recomendado: 24.x) |
| pnpm | >= 11 |
| PostgreSQL | >= 15 |
| Redis | >= 7 |

### Setup inicial

```powershell
pnpm install
Copy-Item -Path ".env.example" -Destination ".env"
# Editar .env com os valores corretos (especialmente BETTER_AUTH_SECRET, DATABASE_URL)
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### API (`apps/api`)

```powershell
pnpm dev        # http://localhost:4000/api
pnpm build
pnpm test:unit
```

### Web (`apps/web`)

```powershell
pnpm dev        # http://localhost:3000
pnpm build
pnpm test:unit
```

### Mobile (`apps/mobile`)

```powershell
pnpm dev        # Abre Metro bundler — pressiona 'a' (Android) ou 'i' (iOS)
pnpm test:unit
```

### QA (`apps/qa`)

```powershell
pnpm test:e2e   # Playwright
```

## Como contribuir

1. **Criar branch** a partir de `main`: `git checkout -b feat/nome-da-feature`
2. **Desenvolver** com testes desde o início
3. **Verificar gates** localmente: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build`
4. **Verificar governance**: `pnpm governance`
5. **Commit** seguindo Conventional Commits (validado por commitlint)
6. **Push** e abrir PR

### Regras de monorepo

- `packages/db` é o **único** que instancia `PrismaClient`
- Nunca importar shadcn fora de `@brocolis/ui`
- Apps nunca importam apps
- Componentes novos na UI: `meta.ts` (4 pilares) + story + test
- Texto via `t()` (`@brocolis/i18n`); moeda via `@brocolis/formatters`; cores via tokens

### Commits

Os commits seguem [Conventional Commits](https://www.conventionalcommits.org/) e são validados por commitlint:

```
feat(api): add FinPay webhook handler
fix(web): correct cart total calculation
chore(mobile): update expo-router to 4.x
```

## Licença

Proprietário — Brócolis.
