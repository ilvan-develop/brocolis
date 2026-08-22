# Runbook — Rollback

> Blueprint 08 §7 ("rollback: revert tag + migrate reversa documentada") e blueprint 11 §PRODUCTION. Decisão de rollback = incidente (ver `incident.md`); conter primeiro, investigar depois.

## 1. Web / API (docker)

### 1.1 Rollback de imagem (primeira opção, < 5 min)

```bash
# Listar tags anteriores
docker images ghcr.io/brocolis/api --format "{{.Tag}}"

# Voltar à última versão estável
export IMAGE_TAG=<tag-estavel-anterior>   # ex.: v2.0.1
docker compose -f deploy/docker-compose.staging.yml up -d --no-deps api web
```

Em produção substituir `-f deploy/docker-compose.staging.yml` pelo compose de produção.

### 1.2 Rollback por tag git

```bash
git tag                       # localizar última release estável
git revert <bad-release-tag>  # ou reverter o merge commit problemático
# PR urgente → CI verde → redeploy seguindo staging.md §1-4
```

## 2. Base de dados

**Nunca fazer rollback automático de migrações.**

1. Migrações Prisma são forward-only: para desfazer uma migração má, escrever
   **nova migração** que inverte as alterações (`prisma migrate dev --name revert_x`).
2. Se corrupção de dados: restore do último backup (blueprint 20-DISASTER-RECOVERY
   §backups; teste de restauração mensal obrigatório).
3. Documentar a migração reversa no PR com o link do incidente.

## 3. Mobile (EAS)

### 3.1 OTA update mau (JS bundle)

```bash
# Ver grupos publicados
eas update:list --channel production

# Republish do último grupo bom para o canal (instantâneo, sem nova build)
eas update:republish --group <grupo-bom-id> --destination-channel production
```

Efeito na próxima abertura da app pelos utilizadores (expo-updates faz fetch no restart).

### 3.2 Build nativa má

Não há "unsubmit" nas stores. Publicar build correctiva:

```bash
eas build --platform all --profile production
eas submit --platform ios --latest && eas submit --platform android --latest
```

Se o problema é só JS: usar 3.1 em vez de nova submissão.

## 4. Feature flag

Se a regressão veio de uma feature atrás de `OrgFeatureFlag`: desligar a flag
antes de qualquer rollback de imagem (mais rápido e sem downtime).

## 5. Checklist pós-rollback

- [ ] Smoke verde (`node scripts/smoke-staging.mjs`)
- [ ] Métricas normalizadas (error rate, P95 — dashboard api-overview)
- [ ] Incidente actualizado com timeline (incident.md)
- [ ] Post-mortem agendado (48h — blueprint 16 §8)
