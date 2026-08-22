# Runbook — Observabilidade (F7)

> Fonte de verdade técnica: `docs/tech-research/F7-LAUNCH/FACTOS.md` §1 (OTel CNCF Graduated 2026-05-21; traces/metrics **stable**, logs **experimental — pin!**).

## 1. Arquitectura

```
apps/api (NestJS)                          infra/observability/
├── instrumentation.ts (via --import)      ├── otel-collector-config.yaml
│   └── NodeSDK + auto-instrumentations    │   (receivers otlp 4317/4318,
│   └── sampler ParentBased(0.1) em prod   │    filter healthchecks, batch 10s)
│   └── bridge pino → trace_id/span_id     ├── prometheus.yml
├── pino logs (JSON)                       └── dashboards/api-overview.json
└── prom-client /metrics (:4000)
                    │ OTLP
                    ▼
        otel-collector ──► Prometheus (:8889) + backend APM (OTLP HTTP)
```

## 2. Como ligar a instrumentação (`--import` ANTES dos módulos)

O `instrumentation.js/ts` tem de ser carregado **antes de qualquer módulo da app**
(patches do module loader). Nunca importar do código da aplicação.

```bash
# Desenvolvimento
node --import ./dist/instrumentation.js ./dist/main.js

# Via script do app (apps/api/package.json):
#   "start:otel": "node --import ./dist/instrumentation.js ./dist/main.js"
```

Regra: `--require` para CJS puro; `--import` é o caminho ESM (este monorepo usa ESM).
Ver snippet completo pronto a colar em `apps/api/src/instrumentation.ts` no relatório F7
(e secção 5 abaixo).

## 3. Variáveis de ambiente (ver `.env.example`)

| Variável | Valor dev | Valor prod | Nota |
|---|---|---|---|
| `OTEL_SDK_DISABLED` | `true` | `false` | opt-out local |
| `OTEL_SERVICE_NAME` | `brocolis-api` | `brocolis-api` | também web/mobile |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:14318` | DNS interno do collector | **sem** `/v1/traces` |
| `OTEL_TRACES_SAMPLER` | `parentbased_traceidratio` | idem | |
| `OTEL_TRACES_SAMPLER_ARG` | `1` | `0.1` | head sampling 10% em prod |
| `OTEL_EXPORTER_OTLP_HEADERS` | — | `authorization=Bearer …` | segredo do APM |

Erros são **sempre** capturados independentemente do sampler (configurar no
processor/collector ou via Sentry, que é o sistema de erro primário).

## 4. Collector + Prometheus local

```bash
docker compose --profile observability up -d otel-collector prometheus
# Prometheus UI: http://localhost:19090
# OTLP: localhost:14317 (gRPC) / 14318 (HTTP)
```

- Filter `drop_healthchecks`: `/health` representa 30–50% do volume de traces.
- Batch timeout 10s (FACTOS).
- Cardinality: rotas têm de ser parametrizadas (`/users/:id`, nunca `/users/123`)
  senão o Prometheus explode em séries temporais.

## 5. Snippet de referência — `apps/api/src/instrumentation.ts`

```ts
// apps/api/src/instrumentation.ts — carregado com `node --import` ANTES de main.js.
// NÃO importar este ficheiro do código da aplicação.
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SEMRESATTRS_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { ParentBasedSampler, TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";

const isProd = process.env.NODE_ENV === "production";

export const sdk = new NodeSDK({
  resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "brocolis-api" }),
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? (isProd ? 0.1 : 1))),
  }),
  traceExporter: new OTLPTraceExporter(), // OTEL_EXPORTER_OTLP_ENDPOINT
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: 30_000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // noise (FACTOS): desactivar fs/dns
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
    }),
    // Bridge pino↔OTel: injeta trace_id/span_id nos logs sem mudar call-sites.
    // NÃO usar OpenTelemetryTransportV3 em simultâneo (logs duplicados).
    new PinoInstrumentation(),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown().finally(() => process.exit(0));
});
```

## 6. Dashboards e alertas

- Dashboard mínimo: `infra/observability/dashboards/api-overview.json`
  (request rate, latência P95, error rate, up por serviço).
- Regras de alerta: tabela em `blueprint/16-INCIDENT-MANAGEMENT.md` §9
  (P95 > 500ms = SEV2; uptime < 99.9% = SEV1; webhook FinPay failures > 3/10min = SEV2).
- Métricas custom ficam no `@brocolis/observability` (prom-client já catalogado 15.1.3).

## 7. Troubleshooting

| Sintoma | Causa provável | Acção |
|---|---|---|
| Sem traces no collector | endpoint errado | `OTEL_EXPORTER_OTLP_ENDPOINT` não leva `/v1/traces`; testar `curl :14318` |
| Logs duplicados | bridge pino + transport OTel juntos | remover `OpenTelemetryTransportV3` |
| Cardinality explosion | rota não parametrizada | corrigir route no controller |
| Collector não arranca | env APM ausente | definir `OTEL_EXPORTER_OTLP_ENDPOINT` antes do compose |
