# apps/api

API HTTP do marketplace farmacêutico Brócolis, construída com **NestJS 11** e **oRPC**. Responsável por toda a lógica de negócio, integração com FinPay, conformidade fiscal (AGT/SAF-T) e gestão multi-tenant.

## Pré-requisitos

| Ferramenta | Versão mínima | Notas |
|---|---|---|
| Node.js | >= 20 | Recomendado: 24.x (via Volta ou nvm) |
| pnpm | >= 11 | `corepack enable` ou `npm i -g pnpm@11` |
| PostgreSQL | >= 15 | Base de dados `brocolis` |
| Redis | >= 7 | Cache e sessões |

## Setup

```powershell
# Instalar dependências (na raiz do monorepo)
pnpm install

# Copiar variáveis de ambiente
Copy-Item -Path "../../.env.example" -Destination "../../.env"

# Gerar cliente Prisma e aplicar migrations
pnpm db:generate
pnpm db:migrate

# (Opcional) Popular dados de demonstração
pnpm db:seed
```

> **Nota:** O ficheiro `.env` vive na raiz do monorepo. As apps lêem de lá via `@dotenvx/dotenvx`.

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Arranca a API em modo watch (`nest start --watch`) |
| `pnpm build` | Compila para `dist/` (`nest build`) |
| `pnpm start` | Executa a build de produção (`node dist/main.js`) |
| `pnpm test:unit` | Testes unitários (Vitest) |
| `pnpm lint` | Lint com Biome (`biome check src`) |
| `pnpm typecheck` | Verificação de tipos (`tsc --noEmit`) |

A API escuta por defeito em `http://localhost:4000` com prefixo global `/api`.

## Variáveis de ambiente

| Variável | Default | Descrição |
|---|---|---|
| `NODE_ENV` | `development` | Ambiente de execução |
| `PORT` | `4000` | Porta HTTP |
| `WEB_ORIGIN` | `http://localhost:3000` | Origin permitida pelo CORS |
| `LOG_LEVEL` | `info` | Nível de log (pino) |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:15432/brocolis` | Ligação Postgres |
| `REDIS_URL` | `redis://localhost:16379` | Ligação Redis |
| `BETTER_AUTH_SECRET` | — | **Obrigatório.** Segredo do Better Auth |
| `BETTER_AUTH_URL` | `http://localhost:4000` | URL pública da API |
| `STORAGE_DRIVER` | `minio` | `minio` (dev) ou `supabase` (prod) |
| `MINIO_ENDPOINT` | `localhost` | Host MinIO |
| `MINIO_PORT` | `19000` | Porta MinIO |
| `MINIO_USE_SSL` | `false` | HTTPS para MinIO |
| `MINIO_ACCESS_KEY` | `brocolis` | Chave de acesso MinIO |
| `MINIO_SECRET_KEY` | `brocolis-minio` | Chave secreta MinIO |
| `MINIO_BUCKET` | `brocolis-documents` | Bucket de documentos |
| `SUPABASE_URL` | — | URL do projeto Supabase (storage prod) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Service role key Supabase |
| `SUPABASE_STORAGE_BUCKET` | `brocolis-documents` | Bucket Supabase |
| `BROCOLIS_MARKET` | `AO` | Código de mercado (Angola) |
| `BROCOLIS_LOCALE` | `pt-AO` | Locale por defeito |
| `BROCOLIS_CURRENCY` | `AOA` | Moeda base |
| `FINPAY_MODE` | `mock` | `mock` (dev) ou `live` (prod) |
| `FINPAY_API_URL` | `https://api.finpay.ao` | Endpoint FinPay |
| `FINPAY_API_KEY` | — | API key FinPay (obrigatório em `live`) |
| `FINPAY_WEBHOOK_SECRET` | — | Secret para validar webhooks FinPay |
| `SENTRY_DSN` | — | DSN do Sentry (opcional) |
| `SENTRY_ENVIRONMENT` | `development` | Ambiente Sentry |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Rate de tracing (0–1) |
| `OTEL_SDK_DISABLED` | — | Desativar OpenTelemetry (`true`) |
| `OTEL_SERVICE_NAME` | `brocolis-api` | Nome do serviço OTel |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:14318` | Collector OTLP |
| `THROTTLER_TTL_MS` | `60000` | TTL do rate limiter (ms) |
| `THROTTLER_LIMIT` | `100` | Requests por TTL |

## Arquitetura

A API segue uma arquitetura modular NestJS. Cada bounded context é um módulo independente com controller, service e testes.

```
src/
├── app.module.ts          # Módulo raiz — importa todos os módulos
├── main.ts                # Bootstrap: helmet, CORS, prefixo /api, telemetry
├── cuid.ts                # Gerador de IDs (CUID2)
├── audit/                 # Eventos de auditoria (LGPD)
├── auth/                  # Better Auth, guards de roles, session store
├── b2b2c/                 # Marketplace B2B2C (farmacias + fornecedores)
├── cart/                  # Carrinho de compras
├── catalog/               # Catálogo de produtos
├── checkout/              # Fluxo de checkout
├── common/                # Rate-limit module (throttler)
├── compliance/            # AGT, SAF-T, exportação fiscal
├── dispensing/            # Dispensação de medicamentos + prescrições
├── health/                # Health check (/api/health)
├── inventory/             # Gestão de stock
├── orders/                # Encomendas
├── payments/              # Integração FinPay + webhooks
├── pharmacy/              # Gestão de farmácias
├── prescription-digital/  # Prescrições digitais
├── procurement/           # Compras B2B (RFQ, cotações, POs, aprovações)
├── settlements/           # Liquidações financeiras
├── telemetry/             # Módulo OpenTelemetry
└── tenants/               # Isolamento multi-tenant (organizationId)
```

### Módulos registrados

`SentryModule` → `ConfigModule` → `RateLimitModule` → `HealthModule` → `AuthModule` → `TenantsModule` → `CatalogModule` → `CartModule` → `CheckoutModule` → `OrdersModule` → `PaymentsModule` → `InventoryModule` → `DispensingModule` → `SettlementsModule` → `PharmacyModule` → `PrescriptionDigitalModule` → `ComplianceModule` → `ProcurementModule` → `B2b2cModule` → `AuditModule`

### Padrões

- **Contracts-first:** todos os contratos de rota vivem em `@brocolis/contracts` (Zod + oRPC).
- **Tenant isolation:** `organizationId` e `marketCode` obrigatórios em todas as queries.
- **Audit trail:** mutações críticas registam `AuditEvent` na mesma `$transaction`.
- **FinPay:** processadora única de pagamentos — sem Stripe nem outros SDKs.

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `P1001: Can't reach database` | Postgres não está a correr | Verificar `DATABASE_URL` e iniciar o serviço |
| `P1002: Database does not exist` | Base não criada | `pnpm db:migrate` |
| `ECONNREFUSED 16379` | Redis offline | Iniciar Redis ou verificar `REDIS_URL` |
| `BETTER_AUTH_SECRET` missing | `.env` não configurado | Copiar `.env.example` e definir o secret |
| `CORS error` no browser | `WEB_ORIGIN` incorreto | Ajustar `WEB_ORIGIN` para o port do Next.js |
| `Module not found: @brocolis/*` | Workspace não linkado | `pnpm install` na raiz |
| Testes falham com `prisma` | Client não gerado | `pnpm db:generate` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` timeout | Collector offline | Desativar com `OTEL_SDK_DISABLED=true` |
