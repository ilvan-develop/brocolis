# 17 — Cost Management (Budget, AI Token Tracking)

> Aplica-se a **todas as fases**. Define budget por fase, tracking de custos de infraestrutura, AI token costs, e alertas de orçamento. O pipeline AI pode escalar rápido sem monitoring de custos.

---

## 1. Princípios

| Princípio | Regra |
|-----------|-------|
| Visibility | Custo rastreado por fase, serviço e feature |
| Accountability | Cada fase tem orçamento; responsável reporta |
| Optimisation | Cache, batching, spot instances quando possível |
| Alerting | Alertas a 50%, 80%, 100% do budget |
| Forecasting | Previsão mensal baseada em consumo actual |

---

## 2. Cost Categories

| Categoria | Componentes | Medição |
|-----------|------------|---------|
| **Compute** | API servers, web build, mobile build | Horas/mês, CPU/RAM |
| **Database** | PostgreSQL (Supabase/RDS) | Storage + IOPS + connections |
| **Cache/Queue** | Redis (Upstash/ElastiCache) | Comando/mês, memory |
| **Storage** | Supabase Storage, R2, CDN | GB armazenados + transferência |
| **AI Pipeline** | OpenCode, Context7, LLM calls | Tokens/mês, custo por chamada |
| **CI/CD** | GitHub Actions, EAS | Minutos/mês |
| **Monitoring** | Sentry, Prometheus, logs | Eventos/mês |
| **External** | FinPay API, WhatsApp API, email | Chamadas/mês |
| **Domain/DNS** | Cloudflare | Anual |

---

## 3. Budget por Fase

### 3.1 MVP v1 (F0 → F3)

| Fase | Budget mensal estimado | Notas |
|------|------------------------|-------|
| F0 Foundation | $50 (dev infra) | Docker local + GitHub Actions free tier |
| F-EX + F-DS | $100 (dev infra) | Sem deploy; dev local |
| F1 IAM | $150 | Primeiro deploy staging |
| F2 B2C | $300 | Staging completo |
| F3 Pharmacy | $400 | Staging + testes |
| **Total MVP v1** | **~$1,000** | Dev/staging only |

### 3.2 pós-MVP (F4 → F7)

| Fase | Budget mensal estimado | Notas |
|------|------------------------|-------|
| F4 Procurement | $500 | Production readiness |
| F5 Mobile | $700 | EAS + stores |
| F6 B2B2C | $900 | Production completa |
| F7 Launch | $1,500 | Production + monitoring + CDN |

### 3.3 Production (pós-F7)

| Tier de utilizadores | Budget mensal estimado |
|----------------------|------------------------|
| 0-1K utilizadores | $1,500-2,500 |
| 1K-10K utilizadores | $3,000-5,000 |
| 10K-50K utilizadores | $8,000-15,000 |
| 50K+ utilizadores | Escalar com revenue |

---

## 4. AI Pipeline Cost Tracking

### 4.1 Componentes de custo AI

| Componente | Provider | Custo estimado/pipeline run |
|------------|----------|----------------------------|
| OpenCode (LLM calls) | OpenRouter/DeepSeek | $0.50-5.00 por fase |
| Context7 (docs retrieval) | Context7 MCP | Incluído |
| Code generation | OpenCode | Incluído no LLM |
| Eval runs | OpenCode | $0.10-0.50 por eval |

### 4.2 Tracking implementation

```ts
// .ai/state/costs.json
{
  "runs": [
    {
      "id": "run-f0-20260816",
      "phase": "F0",
      "startedAt": "2026-08-16T10:00:00Z",
      "completedAt": "2026-08-16T12:30:00Z",
      "costs": {
        "llm_input_tokens": 125000,
        "llm_output_tokens": 45000,
        "llm_cost_usd": 1.82,
        "ci_minutes": 12,
        "ci_cost_usd": 0.00,
        "infra_cost_usd": 0.15
      },
      "total_cost_usd": 1.97,
      "files_changed": 47,
      "tests_added": 23,
      "cost_per_file": 0.042,
      "cost_per_test": 0.086
    }
  ],
  "totals": {
    "phases_completed": 3,
    "total_cost_usd": 8.45,
    "avg_cost_per_phase": 2.82,
    "budget_remaining_usd": 991.55
  },
  "updatedAt": "2026-08-16T12:30:00Z"
}
```

### 4.3 Cost per phase gates

| Métrica | Target | Acção |
|---------|--------|-------|
| Custo por fase | < $10 | Warn se exceder |
| Custo por arquivo | < $0.10 | Warn se exceder |
| Custo por teste | < $0.20 | Warn se exceder |
| Tokens por fase | < 500K | Warn se exceder |
| Budget MVP v1 | < $1,000 | Block se exceder |

---

## 5. Infrastructure Cost Optimization

### 5.1 Strategies

| Estratégia | Implementação | Saving |
|------------|---------------|--------|
| **Right-sizing** | Monitorar CPU/RAM; ajustar instâncias | 20-40% |
| **Spot instances** | CI/CD e dev/staging em spot | 60-80% |
| **Reserved capacity** | Production: 1yr reserved (se estável) | 30-50% |
| **Auto-scaling** | Scale down em off-peak | 20-40% |
| **Cache aggressively** | Redis para queries frequentes | Reduz DB load |
| **CDN** | Cloudflare para assets estáticos | Reduz bandwidth |
| **Compression** | gzip/brotli em responses | 60-80% redução |

### 5.2 Monitoring tools

| Ferramenta | Uso |
|------------|-----|
| Supabase Dashboard | Database metrics |
| Upstash Dashboard | Redis metrics |
| GitHub Actions | CI/CD minutes |
| Cloudflare Analytics | Bandwidth + requests |
| Custom dashboard | AI pipeline costs |

---

## 6. Alerting Rules

| Condição | Severidade | Canal |
|----------|------------|-------|
| Budget fase > 50% | Info | Slack |
| Budget fase > 80% | Warn | Slack + email |
| Budget fase > 100% | Critical | Slack + email + block pipeline |
| Custo AI > $5/run | Warn | Slack |
| Infra > 20% acima da média | Warn | Slack |
| Database > 80% storage | Critical | Slack + email |

---

## 7. Cost Review Process

| Frequência | Actividade |
|------------|------------|
| Por fase | Review de custo vs budget; decidir continuar/pausar |
| Semanal | Dashboard de custos actualizado |
| Mensal | Forecast vs actual; optimizações |
| Trimestral | Budget revision; renegotiation com providers |

---

## 8. Anti-patterns de Cost Management

| Anti-pattern | Correto |
|--------------|---------|
| Sem tracking de custos AI | `costs.json` por run |
| Budget sem alertas | Alertas a 50/80/100% |
| Infra sem right-sizing | Monitorar e ajustar mensalmente |
| CI/CD sem optimization | Cache de dependências; parallel jobs |
| Storage sem lifecycle | Auto-eliminação de logs/backs antigos |
| Sem forecasting | Previsão baseada em consumo |

---

*Este documento é revisado mensalmente. Budgets são ajustados conforme escala e revenue.*
