# Runbook — Rotação de Segredos

> Blueprint 15-DATA-GOVERNANCE (LGPD) + F7. Princípio: nenhum segredo em código,
> tfvars ou issues; rotação trimestral e imediata em suspeita de fuga.

## 1. Inventário de segredos

| Segredo | Onde vive | Rotação | Impacto se vazado |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | GitHub Environment secret + dotenvx encriptado | 90 dias | forja de sessões — **SEV1** |
| `DATABASE_URL` / password Postgres | secret manager do ambiente | 90 dias | acesso total a dados — **SEV1** |
| `SUPABASE_SERVICE_ROLE_KEY` | CI environment | 90 dias | bypass de RLS — **SEV1** |
| `MINIO_SECRET_KEY` (dev) | `.env` local apenas | n/a (dev) | baixo |
| `FINPAY_API_KEY` | CI environment staging/prod | conforme contrato FinPay + imediata se fuga | fraude transacional — **SEV1** |
| `FINPAY_WEBHOOK_SECRET` | CI environment | rotação coordenada com FinPay | webhooks falsificados — **SEV2** |
| `SENTRY_AUTH_TOKEN` | GitHub Secret (só upload sourcemaps) | 90 dias | baixo-médio |
| `EXPO_TOKEN` / EAS credentials | GitHub Secret + EAS Secure Store | 90 dias | publish OTA malicioso — **SEV1** |
| `GITHUB_TOKEN` | automático (workflow) | automático | escopo do workflow |
| `OTEL_EXPORTER_AUTH_HEADER` | CI environment | 90 dias | injeção de telemetria — **SEV3** |

## 2. Procedimento padrão de rotação

1. **Gerar** novo valor no provider (Supabase dashboard, FinPay portal, EAS, etc.).
2. **Actualizar** o GitHub Environment secret (`staging` primeiro).
3. **Fazer redeploy** do serviço que consome (rolling; ver `rollback.md` se falhar).
4. **Verificar** smoke: `node scripts/smoke-staging.mjs`.
5. **Revogar** o valor antigo.
6. **Registar** no log de rotações (secção 5).

Ordem não-negociável: novo activo → deploy → validar → revogar antigo. Nunca revogar antes do deploy.

## 3. Rotação de emergência (suspeita de fuga)

1. Abrir incidente (ver `incident.md`; mínimo SEV2, dados clínicos = SEV1).
2. Revogar **imediatamente** o segredo comprometido (aceitando downtime parcial).
3. Emitir novo segredo e seguir secção 2 (passos 2–4).
4. Se envolveu dados pessoais: notificação LGPD em 72h (blueprint 15 §8;
   runbook Data Breach em blueprint 16 §7.3).
5. Correr `gitleaks git --pre-commit --redact --staged --verbose` + histórico
   completo no CI para confirmar que não há cópia em commits.

## 4. Boas práticas

- `.env.example` contém apenas placeholders — nunca valores reais.
- Local: `dotenvx encrypt` para partilhar envs de dev dentro da equipa.
- CI: GitHub Environments por ambiente (staging/production) com reviewers obrigatórios em production.
- Terraform: segredos via `TF_VAR_*`, state em S3 com `encrypt = true`.
- Nunca colar segredos em tickets, Slack, WhatsApp ou post-mortems.

## 5. Log de rotações

| Data | Segredo | Ambiente | Quem | Próxima rotação |
|---|---|---|---|---|
| — | — | — | — | — |
