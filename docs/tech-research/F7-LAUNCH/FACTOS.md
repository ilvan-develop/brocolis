# FACTOS — Bloco F7 (Endurecimento/Launch: Observabilidade, OTA, Release)

> Pesquisa oficial antes da F7. Fontes: opentelemetry.io (CNCF Graduated 2026-05-21), docs.expo.dev
> (EAS Update, deployment, channel surfing), devtoollab/sematext OTel guides 2026, blueprint 18-EVAL
> (Lighthouse ≥90, budgets). Auditado em 2026-08-20.

## 1. OpenTelemetry — @brocolis/observability (API NestJS)

### Factos (2026-08)
- **OTel atingiu Graduated no CNCF em 2026-05-21** (mesmo nível de Prometheus/K8s). SDK JS: traces e metrics **stable**, logs **development** (experimental — pin!).
- Setup Node/NestJS:
  - `instrumentation.js` carregado via `--require`/`--import` **ANTES de qualquer módulo** (patches do module loader). Nunca importar do app code.
  - Packages: `@opentelemetry/api@^1.9.0`, `@opentelemetry/sdk-node@^0.219.0`, `@opentelemetry/auto-instrumentations-node@^0.60.0`, exporters `-otlp-http` traces/metrics/logs `^0.219.0`, `@opentelemetry/semantic-conventions@^1.28.0`.
  - Instrumentações a desativar p/ reduzir noise: `@opentelemetry/instrumentation-fs`, `-dns`; **filtrar health checks** (30-50% do volume de traces) via Collector (filter/drop_healthchecks).
  - Sampling prod: `OTEL_TRACES_SAMPLER_ARG=0.1` (head sampling, 10%) — capturar sempre errors.
- Logs: usar **brigde de loggers** (`@opentelemetry/instrumentation-pino` — o stack usa pino `9.14.0` catalogado) → injeta `trace_id`/`span_id` nos logs com zero mudanças de call-site. **Não** adicionar `OpenTelemetryTransportV3` ao mesmo tempo (logs duplicados).
- Metrics: custom counters no `@brocolis/observability` (prom-client `15.1.3` catalogado ✓) + exporter metrics OTLP.
- Collector: `otel-collector-config.yaml` (receivers otlp grpc/http 4317/4318; batch timeout 10s; filter healthchecks). `OTEL_EXPORTER_OTLP_ENDPOINT` aponta ao service DNS em container.
- Cardinality: garantir rotas parametrizadas (`/users/:id` não `/users/123`) senão soluções de timeseries no Prometheus.

### Gaps catálogo
- Nenhum pacote `@opentelemetry/*` no catálogo — **adicionar** na F7 (sdk-node, auto-instrumentations-node, exporters, instrumentation-pino, instrumentation-express já incluso no meta).
- `nestjs-pino` não está catalogado (o stack lista; blueprint usa pino + nestjs-pino) — adicionar.
- `sentry` SDKs não catalogados (NestJS + React + RN) — adicionar na F7 (fontes: docs.sentry.io).

## 2. EAS Update — OTA mobile (blueprint 08 §Mobile)

### Factos (v57 SDK no catálogo, docs 2026-07/08)
- Fluxo: instalar `expo-updates` (`npx expo install expo-updates`) + `eas update:configure` → cria runtimeVersion + projectId. **Require nova build** (binário) para incorporar native module depois publica-se JS.
- Comandos: `eas update --channel production --message "..."`; `eas update --channel staging`; promover: `eas update:republish --destination-channel production` (mesma bundle, staging→prod).
- **runtimeVersion policy**: DEFAULT `"appVersion"` (recomendado) — muda quando muda a versão da app (não inclui build number). "fingerprint" é o futuro, não recomendado ainda.
- **Canais por ambiente**: canal embutido não muda após build; mas **SDK 54+ suporta "channel surfing"** (mudar canal em runtime via override API, expo-updates ≥0.29.0; efeito após restart).
- Perfil eas.json: `development` (developmentClient, internal), `preview`/`staging` (internal, channel), `production` (autoIncrement, channel). CI: `eas build` (android/ios) + `eas submit` + `eas update` em canais beta/prod (blueprint §Mobile).
- OTA SÓ em release/preview builds (não em Expo Go/debug).
- Code signing end-to-end disponível (integridade do bundle).
- **Gap catálogo**: `expo-updates` NÃO está catalogado — adicionar `expo-updates@^57.0.0` na F5 ou F7. `@brocolis/observability` também não.

## 3. Lighthouse / bundle (blueprint 06, 18-EVAL)

### Factos
- Budgets: LCP < 2.5s, FID < 100ms, CLS < 0.1, **Lighthouse ≥ 90** (performance-budget.yml).
- Lighthouse CI: `000lighthouseci` action + budgets.json. Web pode usar `lhci autorun` no GitHub Actions.
- F-DS exige "DS tests + Lighthouse base" (README F-DS).
- **Gap**: ficheiro `performance-budget.yml` previsto no blueprint 18 (lighthouse.yaml section) ainda não existe no repo (F0 research confirmou só ci.yml + supply-chain.yaml).

## 4. IaC (blueprint 08 §9) — Supabase/Terraform vs Pulumi

### Factos
- O blueprint permite **Terraform OU Pulumi** (decisão livre). Regras: infra versionada em git, state remoto (S3 + DynamoDB lock), drift detection via `terraform plan` no CI.
- Estrutura: `infra/terraform/{core,database,storage,domain}/...`.
- Stack real usa **Supabase** (Postgres + Storage S3-compatible; MinIO para dev/test — `docker-compose` já disponível). Supabase como backend provido por provider próprio; API fala S3-compatible via `minio` client → troca de backend é configuração, não código (§01).
- **Gap**: não há directório `infra/` nem IaC no repo ainda — criar na F7 com casal provider Supabase/Terraform (ou Pulumi). Registar a decisão em ADR (arq-0013+).

## 5. Sentry — erro/performance (blueprint 16/18)

### Factos
- Sentry para API (NestJS), Web (Next.js) e RN (Expo): SDKs `@sentry/nestjs`, `@sentry/nextjs`, `@sentry/react-native`. Crash-free rate como NFR (blueprint §Incident).
- Mobile: `npx sentry-expo` (ou via EAS) com source maps; release via `eas update`/`eas build` associada a release Sentry.
- **Gaps catálogo**: `@sentry/*` ausentes.

## Conclusão (checklist acção F7)
1. Adicionar ao catálogo: `@opentelemetry/*` (sdk-node, auto-instrumentations-node, exporters otlp-http, instrumentation-pino, semantic-conventions), `nestjs-pino`, `expo-updates`, `@sentry/nestjs`+`@sentry/nextjs`+`@sentry/react-native`.
2. `instrumentation.js` standalone carregado com `--import`; filtrar fs/dns/health; sampling prod 0.1; bridge pino (tracem span_ids).
3. eas.json com 3 canais (development/preview/production) + runtimeVersion policy appVersion; workflow eas-build.yml (`eas build`+`eas submit`+`eas update --channel`).
4. performance-budget.yml (Lighthouse ≥90) para web; `lhci` no CI.
5. IaC em `infra/` (Terraform ou Pulumi) com Supabase provider + state remoto + drift no CI; ADR para a escolha.
6. Sentry SDKs para API/Web/Mobile com source maps e releases associadas.