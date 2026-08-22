# 08 — CI/CD, Quality Gates e Governança

> Aplica-se à **Fase 0** (CI base) e cresce em cada fase. Define workflows GitHub Actions (incl. EAS para mobile), os quality gates, o processo de ADRs, convenções de commit e a governança leve do projecto. Os gates são a **fonte de verdade** do `pipeline.yaml` do `11-PIPELINE-AUTONOMO.md`.

---

## 1. Quality gates (ordem fixa)

```
lint → typecheck → build → test:unit → test:integration → test:e2e → coverage ≥80% → security → contract
```

| Gate | Comando | Threshold | Acção em falha |
|------|---------|-----------|----------------|
| Lint | `pnpm lint` | 0 erros | Block |
| Typecheck | `pnpm typecheck` | 0 erros | Block |
| Build | `pnpm build` | 0 erros | Block |
| Unit | `pnpm test:unit` | 100% pass | Block |
| Integração | `pnpm test:integration` | 100% pass | Block |
| E2E web | `pnpm --filter @brocolis/qa test:e2e` | jornadas verdes | Block |
| E2E mobile | `maestro test apps/qa/maestro` (EAS/CI) | jornadas verdes | Block |
| Cobertura | `pnpm test -- --coverage` | ≥80% | Warn→Block em release |
| Segurança | codeql + dependency-review | 0 critical | Block |
| Contrato | `pnpm check:drift` | 0 drift | Block |
| DS audit | token schema + contrast + meta.ts | 0 erros | Block |

> Hooks locais: `pre-commit` = lint-staged (biome); `pre-push` = lint + typecheck + test.

---

## 2. GitHub Actions (workflows por fase)

### F0 — CI base (`ci.yml`)

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11.21.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
      - run: pnpm test:unit
      - run: pnpm check:drift
```

### F1-F2 — Integração (`e2e.yml`)

```yaml
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_DB: brocolis_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ["25432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres -d brocolis_test"
      redis:
        image: redis:8-alpine
        ports: ["26379:6379"]
    steps:
      - run: pnpm db:migrate:deploy
      - run: pnpm test:integration
```

### Mobile (EAS + Maestro)

- `eas-build.yml`: `eas build` (android/ios) + `eas submit` + `eas update` em canais.
- Maestro E2E em device virtual na CI.
- `FINPAY_MODE=mock` em CI; nunca live.

### Segurança (`codeql.yml`, `dependency-review.yml`)

- CodeQL: análise estática (javascript/typescript).
- Dependency review: blocagem de dependências vulneráveis.
- `security-audit-nightly`: audit de dependências + secrets scan.

### Pós-F2

- `deploy-staging.yml` / `deploy-production.yml`: push de imagens + smoke tests.
- `performance-budget.yml`: Lighthouse CI + bundle-size (web + mobile).
- `nightly-full-suite.yml`: suite completa diária.
- `flaky-test-detector.yml`: identifica testes flakies.

---

## 3. ADRs (Architecture Decision Records)

### Processo

1. Nova decisão arquitectural → `docs/decisions/ADR-00XX.md` com template.
2. Review de arquitectura obrigatório (persona architect).
3. Cada fase do blueprint abre com ADR(s) de baseline.

### Template

```markdown
# ADR-0001 — Baseline do monorepo

## Status
Aceite

## Contexto
Brócolis é recriado do zero num repo novo, em fases, com testes desde o início,
Angola-first e Africa by design.

## Decisão
- Monorepo pnpm + turbo, catálogo único de dependências.
- Contracts-first (oRPC + Zod) em @brocolis/contracts.
- FinPay é a processadora: sem Stripe; money movement via FinPay.
- Build Global. Configure Local. (mercados em @brocolis/markets).
- Design system AI-ready em packages/ui (Global Core + Market AO).

## Consequências
- Single source of truth de tipos e schema.
- Maior esforço inicial, menor custo de manutenção.
- Expansão de mercado = novo Country Pack, sem tocar no Core.
```

### ADRs de baseline (criados na F0)

| ADR | Decisão |
|-----|---------|
| ADR-0001 | Baseline do monorepo (pnpm + turbo + catálogo) |
| ADR-0002 | FinPay é a processadora — sem Stripe, money movement nativo |
| ADR-0003 | Contracts-first: nenhuma rota sem contrato oRPC + Zod |
| ADR-0004 | Design system AI-ready em `packages/ui` (Global Core + Market AO) |
| ADR-0005 | Tenant isolation: `organizationId` + `marketCode` obrigatórios |
| ADR-0006 | Auditoria append-only na mesma `$transaction` |
| ADR-0007 | Build Global. Configure Local.: mercados em `@brocolis/markets` |
| ADR-0008 | Mobile Expo SDK 57 offline-first, partilhando os mesmos tokens |
| ADR-0009 | AI Software Delivery Pipeline: OpenCode = runtime, gates = autoridade |

---

## 4. Convenções de commit

```bash
feat: add multicaixa payment flow via finpay
fix: enforce tenant isolation on list offers
security: raise scrypt work factor to OWASP
test: add integration coverage for webhook retry
docs: update ADR-0004 design system spec
refactor: extract market config to @brocolis/markets
perf: reduce storefront polling to 60s
```

- Tipos: `feat fix docs refactor test chore style security perf build ci`.
- Commitlint enforça no pre-commit (husky).
- `changesets` para versionamento de packages públicos (`@brocolis/ui`, `@brocolis/sdk`).

---

## 5. Branch e PR

| Regra | Valor |
|-------|-------|
| Branch default | `main` (protegida) |
| Naming | `feat/`, `fix/`, `chore/`, `security/`, `docs/` |
| PR | descrição 2-3 frases; checklist de gates |
| Revisão obrigatória | arquitectura (>5 módulos), security (pagamentos), QA (novas features) |
| Reviewers automáticos | `CODEOWNERS` por domínio |

```yaml
# .github/CODEOWNERS
apps/api/src/payments/    @brocolis-architect @brocolis-security @brocolis-backend
packages/contracts/       @brocolis-api
packages/ui/              @brocolis-design
packages/markets/         @brocolis-markets
packages/db/prisma/       @brocolis-database
apps/mobile/              @brocolis-mobile
docs/decisions/           @brocolis-architect
```

---

## 6. Governança leve (sem fricção)

| Área | Regra |
|------|-------|
| Novas dependências | Audit + justificação; catálogo; nunca versões divergentes |
| Mudança de contrato público | ADR + notificação; CI quebra |
| Migração de schema | PR separada + `db:migrate:deploy` em staging primeiro |
| Novo mercado | Novo Country Pack em `@brocolis/markets`; ADR se regra nova |
| Mudança de payment/trust | Revisão obrigatória de arquitecto + security |
| Segredos | dotenvx; `.refine()` rejeita placeholders; nunca em git |
| Docs | ADRs + README por domínio; drift de docs = falha de CI |

---

## 7. Deploy (staging → production)

| Ambiente | Trigger | Passos |
|----------|---------|--------|
| Staging | push em `staging` | build → migrate deploy → smoke tests → readiness |
| Production | PR merge em `main` + approval | build imagens → canary → smoke → monitor |
| Mobile | EAS | `eas update` (OTA) canais beta/prod; `eas submit` para stores |

- Smoke: `GET /health` (db, redis, finpay(mock→live), queue) após cada deploy.
- Rollback: script de rollback (revert tag + migrate reversa documentada).
- Runbooks em `docs/operations/`.

---

## 8. Observabilidade mínima

| Métrica | Implementação |
|---------|---------------|
| HTTP latency | histogram `brocolis_http_request_duration_seconds` |
| Pedidos criados/confirmados/entregues | counters |
| Pagamentos (intent status) | counters + histogram de duração |
| Checkout duration | histogram |
| Health | composite (db/redis/finpay/queue) |
| Logs | nestjs-pino, redacção de PII, `X-Request-Id` |
| Erros | Sentry (web + mobile) |
| Mobile | Sentry RN + EAS; crash-free rate |

---

## 9. Infrastructure as Code (IaC)

### 9.1 Ferramentas

| Ferramenta | Uso |
|------------|-----|
| Terraform / Pulumi | Provisioning de infraestrutura cloud |
| Docker Compose | Ambientes locais e CI |
| Helm Charts | Kubernetes (se necessário) |

### 9.2 Estrutura IaC

```
deploy/
├── terraform/
│   ├── modules/
│   │   ├── database/      # PostgreSQL (Supabase/RDS)
│   │   ├── cache/         # Redis (Upstash/ElastiCache)
│   │   ├── storage/       # S3/R2
│   │   ├── networking/    # VPC, subnets, security groups
│   │   └── monitoring/    # Sentry, Prometheus
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   └── main.tf
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.test.yml
│   └── docker-compose.staging.yml
└── helm/                  # se Kubernetes
```

### 9.3 Regras IaC

| Regra | Implementação |
|-------|---------------|
| Infraestrutura versionada | Terraform/Pulumi em git |
| Changes via PR | Review obrigatório |
| State remoto | S3 + DynamoDB lock (Terraform) |
| Drift detection | `terraform plan` no CI |
| Secrets no state | Encrypted at rest |

---

## 10. GitOps Workflow

### 10.1 Pipeline de deploy

```
PR merge em main
    │
    ▼
GitHub Actions build
    │
    ├── Build imagem Docker
    ├── Push para registry
    ├── Update Helm chart (se K8s)
    └── Trigger deploy
    │
    ▼
Deploy (staging)
    │
    ├── Smoke tests
    ├── Performance tests
    └── Security scan
    │
    ▼
Deploy (production) — canary
    │
    ├── 10% do tráfego (5 min)
    ├── Verificar métricas
    ├── 50% do tráfego (5 min)
    ├── Verificar métricas
    └── 100% do tráfego
    │
    ▼
Monitor (30 min)
    │
    ├── Health checks
    ├── Error rates
    └── Latency
```

### 10.2 Canary Deploy

```yaml
# canary config
canary:
  steps:
    - weight: 10
      pause: 300  # 5 min
    - weight: 50
      pause: 300
    - weight: 100
  analysis:
    metrics:
      - name: error_rate
        threshold: 1  # < 1%
      - name: latency_p95
        threshold: 300  # < 300ms
    interval: 30s
    threshold: 3  # 3 falhas → rollback
```

---

## 11. Feature Flags

### 11.1 Ferramentas

| Ferramenta | Uso |
|------------|-----|
| LaunchDarkly | Feature flags enterprise |
| Unleash | Self-hosted alternative |
| ConfigCat | Simple feature flags |

### 11.2 Uso no Brócolis

| Tipo de flag | Exemplo |
|--------------|---------|
| **Release flag** | `B2B_PROCUREMENT_ENABLED` — activa na v1.5 |
| **Experiment flag** | `CHECKOUT_SINGLE_PAGE` — A/B test |
| **Ops flag** | `MAINTENANCE_MODE` — bloqueia writes |
| **Permission flag** | `ADVANCED_ANALYTICS` — plano Business+ |

### 11.3 Implementação

```ts
// packages/contracts/src/feature-flags.ts
export const featureFlagSchema = z.enum([
  'B2B_PROCUREMENT_ENABLED',
  'B2B2C_NETWORK_ENABLED',
  'MOBILE_PUSH_ENABLED',
  'ADVANCED_ANALYTICS',
  'MAINTENANCE_MODE',
  'CHECKOUT_SINGLE_PAGE',
]);

// Uso em código
@Injectable()
export class FeatureFlagService {
  constructor(private readonly config: ConfigService) {}

  isEnabled(flag: FeatureFlag, orgId?: string): boolean {
    // 1. Verificar org-specific flag
    if (orgId) {
      const orgFlag = this.getOrgFlag(orgId, flag);
      if (orgFlag !== undefined) return orgFlag;
    }
    
    // 2. Verificar global flag
    return this.config.get(`FEATURE_${flag}`) === 'true';
  }
}
```

---

## 12. Deploy Observability

### 12.1 Deploy Metrics

| Métrica | Target | Alerta |
|---------|--------|--------|
| Deploy frequency | ≥ 1/dia | Info |
| Lead time for changes | < 1 hora | Warn |
| Change failure rate | < 5% | Block |
| Mean time to recovery | < 1 hora | Critical |

### 12.2 Post-Deploy Checklist

```
[ ] Health check OK
[ ] Smoke tests pass
[ ] Error rate < 1%
[ ] Latency P95 < 300ms
[ ] No new critical alerts
[ ] Canary metrics OK (se aplicável)
[ ] Rollback script tested
```
