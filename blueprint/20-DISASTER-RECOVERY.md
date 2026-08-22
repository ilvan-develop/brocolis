# 20 — Disaster Recovery (RTO/RPO, Backup, Failover)

> Aplica-se a **todas as fases**. Define a estratégia de disaster recovery: RTO/RPO targets, backup strategy, failover procedures, e testes periódicos. Sem DR testado, não há DR.

---

## 1. Princípios

| Princípio | Regra |
|-----------|-------|
| Tested DR | Backup sem restore testado é ilusão |
| RTO/RPO definidos | Targets claros por tipo de serviço |
| Automated recovery | Restore automatizado, não manual |
| Regular drills | Testes mensais de restore |
| Communication plan | Quem é notificado e quando |

---

## 2. RTO/RPO Targets

| Serviço | RPO (max data loss) | RTO (max downtime) | Prioridade |
|---------|---------------------|--------------------|--------------------|
| **PostgreSQL** | 5 min (WAL) | 1h | Crítico |
| **Redis** | 1h (snapshot) | 30 min | Alto |
| **API (NestJS)** | N/A (stateless) | 15 min | Crítico |
| **Web (Next.js)** | N/A (static) | 5 min | Alto |
| **Storage (S3/R2)** | 24h (versioning) | 2h | Médio |
| **FinPay integration** | N/A (externa) | 4h (manual reconciliation) | Alto |

### Definições

- **RPO (Recovery Point Objective):** Máximo de dados que podemos perder
- **RTO (Recovery Time Objective):** Máximo de downtime aceitável

---

## 3. Backup Strategy

### 3.1 PostgreSQL Backups

| Tipo | Frequência | Retenção | Armazenamento |
|------|-----------|----------|---------------|
| **WAL archiving** | Contínuo | 7 dias | S3/R2 (encrypted) |
| **Full backup** | Diário (02:00 UTC) | 30 dias | S3/R2 (encrypted) |
| **Incremental** | A cada 6h | 7 dias | S3/R2 (encrypted) |
| **Snapshot** | Semanal (dom) | 90 dias | S3/R2 (encrypted) |

### 3.2 Backup Script

```bash
#!/bin/bash
# scripts/backup-db.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="s3://brocolis-backups/postgres/${TIMESTAMP}"

# Full backup
pg_dump \
  --host=${DATABASE_HOST} \
  --port=${DATABASE_PORT} \
  --username=${DATABASE_USER} \
  --dbname=${DATABASE_NAME} \
  --format=custom \
  --compress=9 \
  --verbose \
  | aws s3 cp - "${BACKUP_DIR}/full_${TIMESTAMP}.dump"

# Verify backup
pg_restore --list "${BACKUP_DIR}/full_${TIMESTAMP}.dump" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "Backup verified: ${BACKUP_DIR}"
  # Cleanup old backups
  aws s3 ls "s3://brocolis-backups/postgres/" | \
    awk '{print $2}' | \
    head -n -30 | \
    xargs -I {} aws s3 rm "s3://brocolis-backups/postgres/{}" --recursive
else
  echo "Backup verification FAILED" >&2
  exit 1
fi
```

### 3.3 Redis Backups

| Tipo | Frequência | Retenção |
|------|-----------|----------|
| **RDB snapshot** | A cada 6h | 7 dias |
| **AOF** | Contínuo | 24h |

```yaml
# redis.conf
save 3600 1
save 300 100
save 60 10000
appendonly yes
appendfsync everysec
```

### 3.4 Storage Backups

| Tipo | Frequência | Retenção |
|------|-----------|----------|
| **Versioning** | Contínuo | 90 dias |
| **Lifecycle policy** | Automático | Delete non-current after 90d |
| **Cross-region复制** | Contínuo | Real-time |

---

## 4. Failover Procedures

### 4.1 Database Failover

```
POSTGRESQL PRIMARY DOWN
    │
    ▼
Detectar (health check falha 3x)
    │
    ├── Cloud (Supabase/RDS): Auto-failover para read replica
    │   └── Promover replica a primary
    │
    └── Self-hosted: Promover manualmente
        │
        ├── 1. Parar writes (app em modo read-only)
        ├── 2. Promover replica: pg_ctl promote
        ├── 3. Actualizar connection string
        ├── 4. Reconfigurar replicas
        ├── 5. Verificar integridade
        └── 6. Voltar a escrever
```

### 4.2 Redis Failover

```
REDIS PRIMARY DOWN
    │
    ▼
Detectar (health check falha 3x)
    │
    ├── Cloud (Upstash/ElastiCache): Auto-failover
    └── Self-hosted: Sentinel failover
        │
        ├── 1. Sentinel detecta primary down
        ├── 2. Elege novo primary
        ├── 3. Actualiza configuração
        └── 4. Verificar conectividade
```

### 4.3 API Failover

```
API INSTANCE DOWN
    │
    ▼
Load balancer detecta (health check falha)
    │
    ├── 1. Remove instance do pool
    ├── 2. Spawning nova instance (auto-scaling)
    ├── 3. Verify health
    └── 4. Volta ao pool

Se cluster:
    ├── 1. Outras instances absorvem tráfego
    ├── 2. Auto-scaling cria nova instance
    └── 3. Balanceamento restaurado
```

---

## 5. Recovery Procedures

### 5.1 Full Database Restore

```bash
#!/bin/bash
# scripts/restore-db.sh

BACKUP_ID=$1  # ex: 20260816_020000

# 1. Parar writes (modo read-only)
curl -X POST https://api.brocolis.ao/admin/mode/read-only

# 2. Restore do backup
pg_restore \
  --host=${DATABASE_HOST} \
  --port=${DATABASE_PORT} \
  --username=${DATABASE_USER} \
  --dbname=${DATABASE_NAME} \
  --clean \
  --if-exists \
  --verbose \
  "s3://brocolis-backups/postgres/${BACKUP_ID}/full_${BACKUP_ID}.dump"

# 3. Replay WAL (se necessário)
pg_wal_replay

# 4. Verificar integridade
psql -c "SELECT COUNT(*) FROM orders;" ${DATABASE_NAME}
psql -c "SELECT COUNT(*) FROM payments;" ${DATABASE_NAME}

# 5. Voltar a escrever
curl -X POST https://api.brocolis.ao/admin/mode/read-write

# 6. Verificar health
curl -s https://api.brocolis.ao/health | jq .status
```

### 5.2 Point-in-Time Recovery

```bash
# Restore para momento específico (ex: 2026-08-16 14:30:00)

# 1. Configurar restore
export TARGET_TIME="2026-08-16 14:30:00"

# 2. Restore do último full backup
pg_restore \
  --target-action=promote \
  "s3://brocolis-backups/postgres/20260816_020000/full_20260816_020000.dump"

# 3. Replay WAL até ao momento desejado
pg_wal_replay --target-time="${TARGET_TIME}"

# 4. Verificar
psql -c "SELECT MAX(created_at) FROM orders;" ${DATABASE_NAME}
```

---

## 6. Disaster Scenarios

### 6.1 Scenario: Complete Database Loss

| Passo | Acção | Responsável | Tempo |
|-------|-------|-------------|-------|
| 1 | Detectar (monitoring) | DevOps | 5 min |
| 2 | Notificar IC + team | DevOps | 5 min |
| 3 | Activar modo read-only | IC | 5 min |
| 4 | Restore do último full backup | DevOps | 30 min |
| 5 | Replay WAL | DevOps | 15 min |
| 6 | Verificar integridade | Backend | 15 min |
| 7 | Voltar a escrever | IC | 5 min |
| 8 | Verificar health | DevOps | 5 min |
| **Total** | | | **~85 min** |

### 6.2 Scenario: Data Corruption

| Passo | Acção | Responsável | Tempo |
|-------|-------|-------------|-------|
| 1 | Detectar (queries inconsistentes) | Backend | 15 min |
| 2 | Congelar dados (read-only) | IC | 5 min |
| 3 | Investigar scope da corrupção | Backend | 30 min |
| 4 | Point-in-time restore para antes da corrupção | DevOps | 45 min |
| 5 | Verificar integridade | Backend | 15 min |
| 6 | Reconciliar transações perdidas | Backend | 60 min |
| **Total** | | | **~170 min** |

### 6.3 Scenario: Security Breach

| Passo | Acção | Responsável | Tempo |
|-------|-------|-------------|-------|
| 1 | Detectar (WAF, IDS, report) | Security | 5 min |
| 2 | Containment: bloquear atacante | Security | 5 min |
| 3 | Revogar sessões comprometidas | Backend | 10 min |
| 4 | Notificar IC + CISO | Security | 5 min |
| 5 | Investigar scope | Security + Backend | 60 min |
| 6 | Restore se necessário | DevOps | 45 min |
| 7 | Rotacionar secrets | DevOps | 30 min |
| 8 | Post-mortem (16-INCIDENT-MANAGEMENT.md) | IC | 48h |
| **Total (containment)** | | | **~25 min** |

---

## 7. DR Testing

### 7.1 Test Schedule

| Teste | Frequência | Participantes |
|-------|-----------|---------------|
| Backup restore test | Mensal | DevOps |
| Database failover test | Trimestral | DevOps + Backend |
| Full DR drill | Semestral | Toda a equipa |
| Security incident simulation | Semestral | Security + IC |
| Communication test | Trimestral | Comms + IC |

### 7.2 Backup Restore Test Script

```bash
#!/bin/bash
# scripts/test-restore.sh

echo "=== DR TEST: Backup Restore ==="

# 1. Criar ambiente de teste
TEST_DB="brocolis_dr_test"
createdb ${TEST_DB}

# 2. Restore do último backup
LATEST_BACKUP=$(aws s3 ls s3://brocolis-backups/postgres/ | sort | tail -1 | awk '{print $2}')
pg_restore --dbname=${TEST_DB} "s3://brocolis-backups/postgres/${LATEST_BACKUP}"

# 3. Verificar integridade
TABLES=$(psql -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" ${TEST_DB})
echo "Tables restored: ${TABLES}"

ORDERS=$(psql -t -c "SELECT COUNT(*) FROM orders;" ${TEST_DB})
echo "Orders restored: ${ORDERS}"

PAYMENTS=$(psql -t -c "SELECT COUNT(*) FROM payments;" ${TEST_DB})
echo "Payments restored: ${PAYMENTS}"

# 4. Verificar RTO
RESTORE_TIME=$(($(date +%s) - START_TIME))
echo "Restore time: ${RESTORE_TIME}s (target: <3600s)"

if [ ${RESTORE_TIME} -lt 3600 ]; then
  echo "✅ DR TEST PASSED"
else
  echo "❌ DR TEST FAILED: RTO exceeded"
fi

# 5. Cleanup
dropdb ${TEST_DB}
```

### 7.3 DR Test Results

```json
{
  "testDate": "2026-08-16",
  "testType": "backup_restore",
  "result": "PASSED",
  "metrics": {
    "backupAge": "12h",
    "restoreTime": "2847s",
    "rtoTarget": "3600s",
    "rpoTarget": "300s",
    "dataIntegrity": "VERIFIED",
    "tablesRestored": 42,
    "ordersRestored": 15420,
    "paymentsRestored": 12340
  },
  "issues": [],
  "nextTest": "2026-09-16"
}
```

---

## 8. Communication During DR

### 8.1 Notification Matrix

| Evento | Quem | Canal | SLA |
|--------|------|-------|-----|
| DR activado | IC + Tech leads | Slack + PagerDuty | Imediato |
| Database down | IC + Backend + DevOps | Slack | 5 min |
| Data corruption | IC + Backend + Security | Slack | 5 min |
| Security breach | IC + CISO + Legal | Slack + Phone | 5 min |
| Status actualizado | Toda a equipa | Slack | A cada 30 min |
| Resolução | Toda a equipa + stakeholders | Slack + Email | Imediato |

### 8.2 Status Page Updates

```
[Investigando] Database connectivity issues
→ [Identificado] Primary database unresponsive; initiating failover
→ [Em progresso] Failover to replica in progress
→ [Resolvido] Failover complete; all systems operational
→ [Post-mortem] Root cause: [description]; preventive measures: [actions]
```

---

## 9. DR Checklist (antes de cada release)

```
[ ] Último backup verificado (< 24h)
[ ] WAL archiving activo
[ ] Restore test passou (< RTO target)
[ ] Failover procedure documentado e actualizado
[ ] Comunicação contacts actualizados
[ ] Runbooks revistos
[ ] DR drill agendado para próximo trimestre
[ ] Secrets backup encriptado e verificado
```

---

## 10. Anti-patterns de DR

| Anti-pattern | Correto |
|--------------|---------|
| Backup sem restore test | Restore test mensal |
| RTO/RPO sem definição | Targets claros por serviço |
| DR procedure não documentada | Runbook com passos exactos |
| Sem communication plan | Matrix de notificação documentada |
| DR test sem follow-up | Action items com owner + deadline |
| Backup em só uma região | Cross-region replication |
| Secrets em backup sem encriptação | Encrypted at rest + access audit |
| DR test manual | Scripts automatizados |

---

*Este documento é revisado trimestralmente. DR tests são agendados e resultados registados em `docs/operations/dr-tests/`.*
