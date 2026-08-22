# Runbook — Gestão de Incidentes

> Resumo operacional; fonte de verdade: `blueprint/16-INCIDENT-MANAGEMENT.md` (severidades, templates, post-mortem). Operacional a partir da F7.

## 1. Severidades (blueprint 16 §2)

| Severidade | Impacto | Resposta | Exemplo Brócolis |
|---|---|---|---|
| **SEV1** | Indisponível / dados em risco, múltiplos tenants | 15 min | DB down, breach de dados clínicos, FinPay comprometido |
| **SEV2** | Funcionalidade crítica degradada | 30 min | checkout falha, webhooks FinPay em dead-letter, auth lenta |
| **SEV3** | Não-crítica afectada | 2h | push atrasadas, search lenta |
| **SEV4** | Menor | 8h | bug cosmético |

## 2. Fluxo (blueprint 16 §3)

```
Detecção (Sentry/Prometheus/alerta/utilizador)
→ Classificar SEV1-4
→ SEV1/SEV2: nomear Incident Commander + Scribe
→ Containment: rollback (rollback.md) · feature flag OFF · bloquear ataque
→ Comunicação por severidade (SEV1: status page+WhatsApp+email+Slack; SEV2: status page+Slack)
→ Resolução + 30 min de estabilidade
→ Post-mortem blameless em ≤48h com action items (owner + deadline)
```

## 3. Escalação e on-call

- On-call semanal (handoff sexta); PagerDuty para fora de horário.
- SEV1: on-call → tech lead (30min) → CTO (1h) → CEO/comunicação externa (2h).
- Matriz completa e templates de comunicação: blueprint 16 §5-6.

## 4. Detecção — onde olhar primeiro

| Fonte | O quê |
|---|---|
| Sentry | erros novos, crash-free rate < alvo |
| Prometheus (`infra/observability/dashboards/api-overview.json`) | error rate > 5%, P95 > 500ms, up=0 |
| Alertas blueprint 16 §9 | tabela de regras por severidade |
| Logs pino (com trace_id via bridge OTel) | correlacionar request → trace → erro |

## 5. Ações rápidas por cenário

- **Deploy recente suspeito**: `rollback.md` §1 (imagem anterior) antes de investigar a fundo.
- **Feature específica**: desligar `OrgFeatureFlag`.
- **Ataque/abuso**: confirmar throttler activo; bloquear IP no edge; SEV1 se dados em risco.
- **Webhooks FinPay**: replay da dead-letter após fix (blueprint 16 §7.2).

## 6. Anti-patterns (blueprint 16 §12)

Culpar pessoas · comunicar só internamente em SEV1 · post-mortem sem action items ·
rollback sem registar causa · ignorar SEV3/4 · alert fatigue sem tuning.

## 7. Drills

Trimestral: tabletop SEV1 · Mensal: simulação de resposta + restore de backup ·
Semestral: database failover. Participantes e detalhes: blueprint 16 §11.
