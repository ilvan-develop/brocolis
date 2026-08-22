# 16 — Incident Management

> Aplica-se a **todas as fases, operacional a partir da F7**. Define níveis de severidade, processos de escalação, post-mortem template, e comunicação durante incidentes.objectivo: minimizar impacto, aprender com falhas, prevenir recorrência.

---

## 1. Princípios

| Princípio | Regra |
|-----------|-------|
| Speed of response | Severidade define tempo de resposta, não quem reporta |
| Blameless | Post-mortem sem culpas; foco em sistemas e processos |
| Transparency | Comunicação interna e externa conforme severidade |
| Learning | Cada incidente gera acções acionáveis com owner e deadline |
| Preparedness | Runbooks antes de incidentes; drills periódicos |

---

## 2. Severity Levels

| Severidade | Impacto | Tempo de resposta | Tempo de resolução | Exemplo |
|------------|---------|-------------------|--------------------|---------| 
| **SEV1 — Critical** | Serviço indisponível ou dados em risco para múltiplos tenants | 15 min | 2h | Database down, payment system compromised, data breach |
| **SEV2 — High** | Funcionalidade crítica degradada | 30 min | 4h | Checkout falha, webhook FinPay com retry excedido, auth service lento |
| **SEV3 — Medium** | Funcionalidade não-critica afectada | 2h | 24h | Relatórios atrasados, push notifications atrasadas, search lento |
| **SEV4 — Low** | Inconveniente menor | 8h | 1 semana | Bug cosmético, performance marginal, logging incompleto |

---

## 3. Incident Response Flow

```
DETECÇÃO (monitoring, alert, user report)
    │
    ▼
CLASSIFICAÇÃO (SEV1-4)
    │
    ├── SEV1/SEV2: Incident Commander (IC) nomeado
    └── SEV3/SEV4: Team lead assume
    │
    ▼
CONTAINMENT (imediato)
    │
    ├── Bloquear ataque (se segurança)
    ├── Rollback se deploy recente
    ├── Feature flag OFF se feature específica
    └── Escalar se necessário
    │
    ▼
COMMUNICATION
    │
    ├── SEV1: Status page + WhatsApp + email + Slack
    ├── SEV2: Status page + Slack
    ├── SEV3: Slack
    └── SEV4: Ticket no backlog
    │
    ▼
RESOLUÇÃO
    │
    ├── Fix deploy
    ├── Verify monitoring
    └── Confirm stability (30 min sem incidentes)
    │
    ▼
POST-MORTEM (até 48h após resolução)
    │
    ├── Timeline
    ├── Root cause analysis
    ├── Action items com owner + deadline
    └── Actualizar runbook + threat model
```

---

## 4. Roles During Incident

| Role | Responsabilidade | SEV1 | SEV2 | SEV3 | SEV4 |
|------|------------------|------|------|------|------|
| **Incident Commander (IC)** | Coordena resposta, decide prioridades | Obrigatório | Obrigatório | Opcional | Não |
| **Technical Lead** | Investigação e fix | Obrigatório | Obrigatório | Team lead | Developer |
| **Communications Lead** | Comunicação interna/externa | Obrigatório | Opcional | Não | Não |
| **Scribe** | Regista timeline e decisões | Obrigatório | Opcional | Não | Não |
| **Subject Matter Expert** | Expertise técnica específica | Conforme necessário | Conforme necessário | Não | Não |

---

## 5. Communication Templates

### 5.1 Status Page (SEV1/SEV2)

```markdown
**[Investigando] Investigando problemas de conectividade**

Estamos a investigar relatórios de dificuldade de acesso à plataforma.
A equipa está a trabalhar para identificar e resolver o problema.

Actualização: a cada 30 minutos até resolução.
```

### 5.2 Internal (Slack/WhatsApp)

```markdown
🔴 INCIDENT SEV1 — [Título]
IC: @nome
Início: HH:MM UTC
Impacto: [descrição]
Status: Investigando / Containment / Fix em curso
Próxima actualização: HH:MM UTC
```

### 5.3 External (email/WhatsApp para utilizadores)

```markdown
Olá [Nome],

Estamos a ter dificuldades técnicas que afectam [funcionalidade].
A equipa está a trabalhar para resolver o mais rapidamente possível.

Prévia de resolução: [hora estimada]
Alternativa temporária: [se existir]

Pedimos desculpa pelo inconveniente.
Equipa Brócolis
```

---

## 6. Escalation Matrix

| Severidade | Primeiro contacto | Escalação 30min | Escalação 1h | Escalação 2h |
|------------|-------------------|-----------------|--------------|--------------|
| SEV1 | On-call engineer | Tech lead | CTO | CEO (comunicação externa) |
| SEV2 | On-call engineer | Tech lead | CTO | — |
| SEV3 | Team lead | Tech lead | — | — |
| SEV4 | Developer | Team lead | — | — |

### On-call Schedule

```
Semana 1: [Engineer A] (primary) + [Engineer B] (backup)
Semana 2: [Engineer C] (primary) + [Engineer D] (backup)
...

Rotating weekly; handoff sexta-feira.
PagerDuty/OpsGenie para alertas fora de horário.
```

---

## 7. Runbooks

### 7.1 Runbook: Database Down (SEV1)

```markdown
# Runbook: Database Down

## Sinais
- Health check `/health` retorna 503
- Erros de conexão nos logs
- API返回 500 em todas as rotas

## Passos
1. Verificar status do PostgreSQL: `docker ps` ou cloud console
2. Se container down: `docker restart brocolis-postgres`
3. Se corrompido: restore do último backup (20-DISASTER-RECOVERY.md)
4. Se cloud: verificar alerts do provider (Supabase/RDS)
5. Notificar IC
6. Actualizar status page

## Tempo estimado: 15-30 min
```

### 7.2 Runbook: FinPay Webhook Failure (SEV2)

```markdown
# Runbook: FinPay Webhook Failure

## Sinais
- Webhooks a cair em dead-letter
- Pagamentos stuck em PROCESSING
- Alerts de retry excedido

## Passos
1. Verificar webhook endpoint: `curl -X POST https://api.brocolis.ao/webhooks/finpay`
2. Verificar logs: `pnpm logs:api | grep finpay`
3. Verificar FinPay status: status page ou API
4. Se Brócolis: fix endpoint, replay dead-letter
5. Se FinPay: contactar suporte + manual reconciliation
6. Notificar finance team

## Tempo estimado: 30-60 min
```

### 7.3 Runbook: Data Breach (SEV1)

```markdown
# Runbook: Data Breach

## Sinais
- Alert de segurança (WAF, IDS, user report)
- Acesso não autorizado detectado
- Dados sensíveis expostos

## Passos IMEDIATOS (primeiros 15 min)
1. **CONTAIN**: Bloquear IP/attacker
2. **REVOKE**: Revogar sessões afectadas
3. **NOTIFY**: CISO + IC
4. **CLASSIFY**: Que dados? Que tenants? (15-DATA-GOVERNANCE.md)

## Passos seguintes (até 24h)
1. Investigar scope completo
2. Classificar severidade (15-DATA-GOVERNANCE.md §8)
3. Preparar notificação autoridade (72h LGPD)
4. Preparar notificação titulares (se risco alto)

## Tempo estimado: 2h containment + 24h investigation
```

---

## 8. Post-Mortem Template

```markdown
# Post-Mortem: [Título do Incidente]

**Data:** dd/mm/aaaa
**Severidade:** SEV1/2/3/4
**Duração:** HH:MM — HH:MM (X horas)
**IC:** [nome]
**Author:** [nome]

## Resumo (1 parágrafo)
[Breve descrição do que aconteceu e impacto]

## Timeline (UTC)
| Hora | Evento |
|------|--------|
| HH:MM | Primeiro alerta detectado |
| HH:MM | IC nomeado |
| HH:MM | Root cause identificada |
| HH:MM | Fix implementado |
| HH:MM | Estabilidade confirmada (30 min) |
| HH:MM | Incidente fechado |

## Impacto
- Utilizadores afectados: [nº estimado]
- Downtime: [minutos]
- Pedidos perdidos: [nº]
- Receita afectada: [estimativa]
- Dados comprometidos: [sim/não + tipos]

## Root Cause
[Análise técnica da causa raiz]

## What went well
- [列表 1]
- [列表 2]

## What could be improved
- [列表 1]
- [列表 2]

## Action Items
| # | Acção | Owner | Deadline | Status |
|---|-------|-------|----------|--------|
| 1 | [descrição] | [nome] | [data] | Pendente |
| 2 | [descrição] | [nome] | [data] | Pendente |

## Lessons Learned
- [列表 1]
- [列表 2]

## Follow-up
- Review meeting: [data]
- Actualizar runbooks: [sim/não]
- Actualizar threat model: [sim/não]
- Actualizar monitoring: [sim/não]
```

---

## 9. Monitoring & Alerting Rules

### 9.1 Alert Rules

| Métrica | Condição | Severidade | Canais |
|---------|----------|------------|--------|
| API uptime | < 99.9% em 5 min | SEV1 | PagerDuty + Slack + WhatsApp |
| API latency P95 | > 500ms em 5 min | SEV2 | Slack |
| API error rate | > 5% em 5 min | SEV2 | Slack |
| Database connections | > 80% pool | SEV2 | Slack |
| Webhook FinPay failures | > 3 em 10 min | SEV2 | Slack + finance |
| Disk usage | > 85% | SEV3 | Slack |
| Memory usage | > 90% | SEV3 | Slack |
| Certificate expiry | < 14 dias | SEV3 | Email |
| Failed login attempts | > 100/min | SEV3 | Slack |
| Dependency vulnerability | Critical | SEV2 | Slack + security |

### 9.2 Health Checks

```yaml
# /health endpoint structure
{
  "status": "healthy" | "degraded" | "unhealthy",
  "version": "1.0.0",
  "timestamp": "2026-08-16T10:00:00Z",
  "checks": {
    "database": { "status": "up", "latencyMs": 5 },
    "redis": { "status": "up", "latencyMs": 2 },
    "finpay": { "status": "up", "latencyMs": 150 },
    "queue": { "status": "up", "pending": 12 },
    "storage": { "status": "up" }
  }
}
```

---

## 10. Incident Metrics

| Métrica | Target | Medição |
|---------|--------|---------|
| MTTD (Mean Time to Detect) | < 5 min | Tempo entre ocorrência e alerta |
| MTTR (Mean Time to Resolve) | SEV1: < 2h, SEV2: < 4h | Tempo entre alerta e resolução |
| MTBI (Mean Time Between Incidents) | > 30 dias | Dias entre incidentes SEV1/SEV2 |
| Post-mortem completion | 100% em 48h | % de incidentes com post-mortem |
| Action item completion | > 90% no prazo | % de acções concluídas |
| Escalation accuracy | > 95% | % de escalações correctas |

---

## 11. Drills

| Drill | Frequência | Participantes |
|-------|-----------|---------------|
| Tabletop exercise (SEV1 scenario) | Trimestral | IC + Tech leads + Comms |
| Database failover | Semestral | DevOps + Backend |
| Incident response simulation | Mensal | On-call engineers |
| Communication test | Trimestral | Comms + all |
| Backup restoration test | Mensal | DevOps |

---

## 12. Anti-patterns de Incident Management

| Anti-pattern | Correto |
|--------------|---------|
| Culpar indivíduos | Blameless post-mortem; foco em sistemas |
| Comunicação apenas interna | Comunicação externa conforme severidade |
| Post-mortem sem action items | Todo post-mortem tem owner + deadline |
| Rollback sem verificar causa | Investigar primeiro; rollback se necessário para conter |
| "Não há necessidade de runbook" | Runbook para todo cenário SEV1/SEV2 |
| Ignorar incidentes menores | SEV3/SEV4 registados e追跡 |
| Sem escalação formal | Matrix de escalação documentada |
| Alert fatigue (muitos falsos positivos) | Tuning de alertas; suppress rules |

---

*Este documento é revisado mensalmente e actualizado após cada post-mortem. Runbooks são testados nos drills trimestrais.*
