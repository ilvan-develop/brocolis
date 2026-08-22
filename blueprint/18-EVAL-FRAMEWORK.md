# 18 — Eval Framework (AI Agent Quality Metrics)

> Aplica-se a **todas as fases**. Define como medir e garantir a qualidade do output do pipeline AI: code quality, architecture compliance, test coverage, e benchmarking entre runs. Sem evals, o pipeline é caixa preta.

---

## 1. Princípios

| Princípio | Regra |
|-----------|-------|
| Measurable | Toda métrica tem target numérico |
| Automated | Evals correm automaticamente no CI |
| Reproducible | Mesmo input → resultado consistente |
| Transparent | Resultados visíveis no dashboard |
| Actionable | Cada métrica baixa tem fix documentado |

---

## 2. Eval Dimensions

### 2.1 Code Quality

| Métrica | Target | Ferramenta | Gate |
|---------|--------|------------|------|
| Biome lint errors | 0 | `pnpm lint` | Block |
| TypeScript errors | 0 | `pnpm typecheck` | Block |
| Test coverage | ≥80% | Vitest --coverage | Block |
| Cyclomatic complexity | ≤10 por função | biome complexity | Warn |
| Duplicate code | ≤3% | biome | Warn |
| Max file length | ≤500 linhas | Custom | Warn |
| Max function length | ≤50 linhas | Custom | Warn |

### 2.2 Architecture Compliance

| Métrica | Target | Ferramenta | Gate |
|---------|--------|------------|------|
| Contracts-first compliance | 100% rotas têm contrato | `check:drift` | Block |
| Tenant isolation | 0 queries sem `organizationId` | Custom lint | Block |
| Market isolation | 0 hardcoded country codes no Core | Custom lint | Block |
| Anti-pattern detection | 0 anti-patterns detectados | Custom rules | Block |
| Circular dependencies | 0 | Dependency cruiser | Warn |
| Import hierarchy | Sem imports de UI em domain | Custom lint | Block |

### 2.3 Test Quality

| Métrica | Target | Ferramenta | Gate |
|---------|--------|------------|------|
| Unit test pass rate | 100% | Vitest | Block |
| Integration test pass rate | 100% | Vitest + Docker | Block |
| E2E test pass rate | 100% | Playwright/Maestro | Block |
| Contract drift | 0 | `check:drift` | Block |
| Test execution time | < 5min unit, < 15min integration | Custom | Warn |
| Mutation score | ≥70% | Stryker | Warn |

### 2.4 Performance

| Métrica | Target | Ferramenta | Gate |
|---------|--------|------------|------|
| API P95 latency | < 300ms | Prometheus | Block |
| LCP (web) | < 2.5s | Lighthouse | Block |
| FID (web) | < 100ms | Lighthouse | Block |
| CLS (web) | < 0.1 | Lighthouse | Block |
| Lighthouse score | ≥90 | Lighthouse CI | Block |
| Bundle size (web) | < 250KB initial | Next.js analyzer | Warn |
| Bundle size (mobile) | < 15MB | Expo analyzer | Warn |

### 2.5 Security

| Métrica | Target | Ferramenta | Gate |
|---------|--------|------------|------|
| Critical vulnerabilities | 0 | CodeQL + Trivy | Block |
| High vulnerabilities | 0 | CodeQL + Trivy | Block |
| OWASP Top 10 | Mitigado | ZAP scan | Block |
| Secret leaks | 0 | Gitleaks | Block |
| Dependency review | 0 critical | GitHub dependency-review | Block |

### 2.6 AI Pipeline Efficiency

| Métrica | Target | Medição |
|---------|--------|---------|
| Tokens per phase | < 500K | `costs.json` |
| Cost per phase | < $10 | `costs.json` |
| Files changed per phase | Track | `evidence.json` |
| Tests added per phase | ≥ 10 | `evidence.json` |
| Human interventions | 0 (auto mode) | `execution.json` |
| Rework rate | < 10% | Evidência de fixes |
| Phase completion time | < 4h | `execution.json` |

---

## 3. Eval Suite Structure

```
.ai/evals/
├── eval-config.yaml          # Config de todas as evals
├── code-quality/
│   ├── lint.yaml             # Biome lint rules
│   ├── typecheck.yaml        # TypeScript strict
│   └── complexity.yaml       # Complexity thresholds
├── architecture/
│   ├── contracts-first.yaml  # Contracts compliance
│   ├── tenant-isolation.yaml # organizationId check
│   ├── market-isolation.yaml # No hardcoded country
│   └── anti-patterns.yaml    # Anti-pattern rules
├── testing/
│   ├── coverage.yaml         # Coverage thresholds
│   ├── drift.yaml            # Contract drift
│   └── mutation.yaml         # Mutation testing
├── performance/
│   ├── lighthouse.yaml       # Lighthouse budgets
│   ├── bundle.yaml           # Bundle size limits
│   └── api-latency.yaml      # P95 latency
├── security/
│   ├── codeql.yaml           # SAST
│   ├── trivy.yaml            # Container scan
│   └── gitleaks.yaml         # Secret scan
└── reports/
    └── dashboard.yaml        # Report aggregation
```

---

## 4. Eval Execution Flow

```
CODE COMMIT
    │
    ▼
CI PIPELINE
    │
    ├── Lint eval (biome)
    ├── Typecheck eval (tsc)
    ├── Unit test eval (vitest)
    ├── Integration test eval (vitest + docker)
    ├── Contract drift eval
    ├── Architecture compliance eval
    ├── Coverage eval
    ├── Security eval (codeql + trivy + gitleaks)
    ├── Performance eval (lighthouse)
    └── Bundle eval
    │
    ▼
EVAL RESULTS
    │
    ├── ALL PASS → ✅ Merge permitido
    └── ANY FAIL → ❌ Block merge + report
    │
    ▼
DASHBOARD
    │
    ├── Score por dimensão (0-100)
    ├── Trend (melhorando/piorando)
    └── Action items
```

---

## 5. Eval Score Calculation

### Score por dimensão

```ts
interface EvalScore {
  dimension: string;
  metrics: {
    name: string;
    value: number;
    target: number;
    passed: boolean;
    weight: number; // 0-1
  }[];
  score: number; // 0-100
}

// Cálculo do score
function calculateScore(metrics: EvalScore['metrics']): number {
  const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
  const weightedScore = metrics.reduce((sum, m) => {
    const ratio = Math.min(m.value / m.target, 1);
    return sum + ratio * m.weight;
  }, 0);
  return Math.round((weightedScore / totalWeight) * 100);
}
```

### Score overall

| Dimensão | Peso |
|----------|------|
| Code Quality | 25% |
| Architecture Compliance | 25% |
| Test Quality | 20% |
| Security | 15% |
| Performance | 10% |
| AI Efficiency | 5% |

**Target overall: ≥ 85/100**

---

## 6. Eval Reports

### 6.1 Report format

```json
{
  "runId": "eval-20260816-f2",
  "phase": "F2",
  "timestamp": "2026-08-16T14:00:00Z",
  "overallScore": 92,
  "dimensions": {
    "codeQuality": { "score": 95, "passed": true },
    "architecture": { "score": 90, "passed": true },
    "testing": { "score": 88, "passed": true },
    "security": { "score": 100, "passed": true },
    "performance": { "score": 85, "passed": true },
    "aiEfficiency": { "score": 80, "passed": true }
  },
  "gates": {
    "passed": 12,
    "failed": 0,
    "warnings": 2
  },
  "trend": {
    "vsPreviousRun": "+3",
    "vsBaseline": "+12"
  }
}
```

### 6.2 Dashboard

```
BRÓCOLIS EVAL DASHBOARD
═══════════════════════════════════════

Phase: F2 B2C Commerce        Score: 92/100 ✅

Code Quality      ████████████████████░░  95
Architecture      ██████████████████░░░░  90
Testing           █████████████████░░░░░  88
Security          ██████████████████████ 100
Performance       █████████████████░░░░░  85
AI Efficiency     ████████████████░░░░░░  80

Gates: 12/12 passed, 0 failed, 2 warnings
Trend: +3 vs previous run

Warnings:
- Bundle size: 258KB (target: 250KB)
- Mutation score: 68% (target: 70%)
```

---

## 7. Benchmarking Between Runs

### Comparativo entre fases

| Fase | Score | Tokens | Cost | Files | Tests | Duração |
|------|-------|--------|------|-------|-------|---------|
| F0 | 88 | 125K | $1.82 | 47 | 23 | 2.5h |
| F-EX | 85 | 180K | $2.61 | 32 | 15 | 3.0h |
| F-DS | 90 | 200K | $2.90 | 55 | 30 | 3.5h |
| F1 | 92 | 150K | $2.18 | 38 | 25 | 2.8h |
| **Target** | ≥85 | <500K | <$10 | — | ≥10 | <4h |

### Regression detection

```ts
// Auto-detect regressão
function detectRegression(current: EvalScore, previous: EvalScore): string[] {
  const regressions: string[] = [];
  for (const dim of current.dimensions) {
    const prev = previous.dimensions.find(d => d.name === dim.name);
    if (prev && dim.score < prev.score - 5) { // >5% regression
      regressions.push(`${dim.name}: ${prev.score} → ${dim.score}`);
    }
  }
  return regressions;
}
```

---

## 8. Eval Gates for AI Pipeline

| Gate | Condição | Acção |
|------|----------|-------|
| Overall score | ≥ 85 | Block se < 85 |
| Any dimension | ≥ 70 | Block se < 70 |
| Security score | 100 | Block se < 100 |
| Regression | ≤ +5% | Warn; ≤ -10% Block |
| Critical metric fail | 0 | Block imediato |

---

## 9. Anti-patterns de Eval

| Anti-pattern | Correto |
|--------------|---------|
| Sem evals no pipeline | Evals automáticas no CI |
| Targets sem baseline | Estabelecer baseline na F0 |
| Evals que não bloqueiam | Gates com acção real |
| Muitas métricas (noise) | Focar nas 6 dimensões principais |
| Evals manuais | 100% automatizadas |
| Sem trending | Dashboard com histórico |
| Sem action items | Cada falha tem fix documentado |

---

*Este framework é calibrado na F0 com baseline e refinado a cada fase. Evals evoluem com o projeto.*
