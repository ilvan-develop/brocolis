# Runbook — Deploy Staging

> Blueprint 08 §7 (staging: build → migrate deploy → smoke → readiness) + F7.

## 0. Pré-requisitos

- Acesso ao GitHub Environment `staging` (secrets: `POSTGRES_PASSWORD`, `FINPAY_*`, `BETTER_AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_*`, `OTEL_*`).
- Imagens publicadas em `ghcr.io/brocolis/{api,web}:staging` pelo CI.
- Infra provisionada (`infra/terraform`, ver `environments/staging.tfvars`).

## 1. Build (automático pelo CI)

1. PR merge para `main` → ci.yml verde (lint, typecheck, build, unit ≥80%, governança).
2. Imagens docker construídas e pushed com tag `staging`.

## 2. Migrate deploy (antes das apps)

```bash
docker compose -f deploy/docker-compose.staging.yml pull
pnpm --filter @brocolis/db exec prisma migrate deploy
```

Regra blueprint 10: migração de schema é **PR separada** e corre primeiro em staging.

## 3. Subir stack

```bash
export IMAGE_TAG=staging
export POSTGRES_PASSWORD=<do secret manager>
docker compose -f deploy/docker-compose.staging.yml up -d --wait
```

`--wait` bloqueia até os healthchecks passarem (readiness).

## 4. Smoke + readiness

```bash
SMOKE_API_URL=https://staging-api.brocolis.ao \
SMOKE_WEB_URL=https://staging.brocolis.ao \
node scripts/smoke-staging.mjs
```

Exit 0 = pronto. Exit 1 = **não promover**; seguir `rollback.md` se já havia tráfego.
O job `smoke-staging` do release.yml corre isto automaticamente após cada release.

## 5. Load test (semanal / antes de promoção a prod)

```bash
k6 run -e SMOKE_API_URL=https://staging-api.brocolis.ao -e SMOKE_WEB_URL=https://staging.brocolis.ao infra/load/k6-smoke.js
```

Thresholds: P95 < 500ms, erros < 5% (ver `load-testing.md`).

## 6. Verificação pós-deploy

- [ ] `/health` da API responde `status: ok`
- [ ] Sentry a receber eventos (transação de teste)
- [ ] Traces no collector (dashboard `api-overview`)
- [ ] Rate limiting activo (429 após burst)
- [ ] Headers de segurança presentes (`curl -I https://staging.brocolis.ao`)

## 7. Falha no deploy?

| Sintoma | Acção |
|---|---|
| Migrate falha | NÃO forçar; verificar estado `_prisma_migrations`; rollback de código |
| Healthcheck não passa | `docker compose logs api`; verificar DATABASE_URL/REDIS_URL |
| Smoke exit 1 | reexecutar 1x (flaky rede); se persistir, rollback |
| Imagem não existe | confirmar que o job de build do CI terminou verde |
