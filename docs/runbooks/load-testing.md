# Runbook — Load Testing (k6)

> Blueprint 09 §Fase 7 (staging: deploy + smoke + readiness + load test) e thresholds de blueprint 16 §9.

## 1. Script

`infra/load/k6-smoke.js` — smoke de carga: homepage web + `/health` da API,
rampa 1→5 VUs, ~70s total. Sem dependências do projecto; requer binário `k6`.

## 2. Executar

```bash
# Staging
k6 run \
  -e SMOKE_API_URL=https://staging-api.brocolis.ao \
  -e SMOKE_WEB_URL=https://staging.brocolis.ao \
  infra/load/k6-smoke.js

# Local (compose dev a correr)
k6 run -e SMOKE_API_URL=http://localhost:4000 -e SMOKE_WEB_URL=http://localhost:3000 infra/load/k6-smoke.js
```

## 3. Thresholds (gate)

| Métrica | Threshold | Fonte |
|---|---|---|
| `http_req_failed` | rate < 5% | blueprint 16 §9 |
| `http_req_duration` | p(95) < 500ms | alerta SEV2 (P95 > 500ms) |
| `smoke_failures` | rate < 5% | checks funcionais |

Exit code ≠ 0 = gate falhado → não promover para produção.

## 4. Quando correr

- Semanal em staging (cron/CI manual).
- Obrigatório antes de promoção staging → produção.
- Após mudanças em checkout, pagamentos FinPay ou inventário (rotas críticas).

## 5. Interpretar resultados

- **p95 alto mas erros baixos**: gargalo DB/Redis — verificar dashboard `api-overview`
  (latência por rota) e pool de conexões.
- **Erros 429**: throttler activo a funcionar — aumentar VUs gradualmente ou ajustar limites.
- **Erros 5xx sob carga**: incidente potencial; seguir `incident.md`, considerar rollback se pós-deploy.

## 6. Próximos passos (backlog F7 iterativo)

- Cenário E2E de checkout com k6 (`setup()` autenticado + grupos por passo).
- Chaos: terminação aleatória de instâncias em staging (blueprint 06 §chaos).
