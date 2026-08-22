# 01 — Stack e Monorepo

> Aplica-se à **Fase 0 (Fundação)**. Fixa a stack, o catálogo de dependências e os ficheiros de configuração reais que o novo repo copia. Inclui o **stack mobile** (Expo SDK 57) e o package `@brocolis/finpay` para a integração de pagamentos.

---

## 1. Stack fixada (versões canónicas)

### Runtimes

| Ferramenta | Versão | Motivo |
|------------|--------|--------|
| Node.js | `>=24.0.0` (LTS 24) | LTS, alinhado com Docker e CI |
| pnpm | `>=11.21.0` | Engine-strict, catálogo, workspaces; corrige junction Windows |
| Docker | `>=27` | Postgres + Redis locais |

> Não há `ocr-worker` Python no Brócolis: o OCR de comprovativos de pagamento é responsabilidade da **FinPay** (ver `07-FINPAY-INTEGRATION.md`).

### Web (Next.js 16)

| Pacote | Versão canónica | Nota |
|--------|-----------------|------|
| next | `^16.3.0` | App Router, React 19 |
| react / react-dom | `^19.2.6` | Sem forwardRef em shadcn |
| tailwindcss | `^4.3.1` | `@theme inline`, OKLCH |
| @tailwindcss/postcss | `^4.3.1` | PostCSS plugin |
| @tanstack/react-query | `^5.101.0` | **em dependencies** |
| @tanstack/react-table | `^8.21.3` | data-table |
| react-hook-form + @hookform/resolvers | catálogo | forms |
| better-auth | `^1.6.26` | servidor + cliente |
| sonner | `^2.0.7` | toasts |
| lucide-react | `^1.21.0` | ícones |
| next-themes | `^0.4.6` | temas |
| recharts | `^3.8` | gráficos (ver override react-is) |

### Mobile (Expo SDK 57)

| Pacote | Uso |
|--------|-----|
| expo | runtime SDK 57 |
| react-native | UI runtime (New Architecture obrigatória) |
| expo-router | file-based routing + deep links |
| nativewind | utility styling (Tailwind em RN) |
| @tanstack/react-query | server state |
| @orpc/client + @orpc/contract | API typed |
| better-auth + @better-auth/expo | auth/session |
| expo-secure-store | persistência segura de sessão |
| react-hook-form + zod | forms |
| zustand | UI/local state (quando justificado) |
| react-native-reanimated | animações/gestos |
| @shopify/flash-list | grandes listas |
| lucide-react-native | ícones |
| expo-image | loading/cache de imagens |
| expo-file-system | ficheiros |
| @react-native-community/netinfo | conectividade (offline) |
| expo-notifications | push |
| expo-camera + expo-image-picker | upload de receita/comprovativo |
| expo-local-authentication | biometria/PIN |
| i18next + react-i18next | i18n (pt-AO primeiro) |
| @tanstack/react-query-persist-client | cache offline |

### Backend (NestJS 11)

| Pacote | Versão canónica | Nota |
|--------|-----------------|------|
| @nestjs/* | `^11.1.24` | core, common, config, platform-express |
| @nestjs/platform-socket.io | `^11.1.24` | notificações in-app (RF-80) |
| @orpc/contract / @orpc/server | decidida em F0 | **mesma versão em todo o monorepo** |
| prisma / @prisma/client | `^7.9.1` | Prisma 7 com driver adapter |
| @prisma/adapter-pg | `^7.9.1` | PrismaPg |
| pg | `^8.22.0` | driver |
| better-auth | `^1.6.26` | server |
| zod | `^4.4.3` | validação |
| socket.io / socket.io-client | catálogo | notificações |
| minio | catálogo | storage S3-compatible dev/test |
| nestjs-pino + pino | `9.14.0` (pinned) | logging estruturado |
| prom-client | `15.1.3` (pinned) | métricas |
| helmet | `^8.0.0` | headers |
| @nestjs/throttler | `^6.5.0` | rate limiting |
| bullmq | `^5.79.1` | filas + Redis |
| ioredis | `^5.11.1` | Redis |
| otplib | `13.4.1` (pinned) | TOTP/MFA |
| nodemailer | `^9.0.3` | email transaccional |

### Pagamentos (FinPay)

| Pacote | Uso |
|--------|-----|
| `@brocolis/finpay` | FinPayAdapter (createIntent/getIntent/refund) + FinPayMockProvider + webhook verifier |

> O Brócolis **não** instala `stripe` nem qualquer SDK de processadora. O trilho de pagamento é a FinPay. Ver `07-FINPAY-INTEGRATION.md`.

### Ferramentas

| Pacote | Versão canónica | Nota |
|--------|-----------------|------|
| typescript | `^7.0.0` (fallback `^6.0.3`) | typecheck via tsc |
| @biomejs/biome | `^2.5.4` | lint + format |
| turbo | `^2.9.18` | task orchestration |
| vitest | `4.1.10` (override pinned) | **um único vitest** |
| @playwright/test | `^1.61.0` | E2E web |
| jest + @testing-library/react-native | catálogo | unit mobile |
| maestro | catálogo | E2E mobile |
| tsup | `^8.5.1` | build ESM + DTS |
| tsx | `^4.22.4` | exec TS |
| @changesets/cli | catálogo | versionamento |
| @dotenvx/dotenvx | `^1.75.1` | env seguro |
| husky + lint-staged | catálogo | git hooks |

### Infraestrutura

| Serviço | Versão | Uso |
|---------|--------|-----|
| PostgreSQL | `17` | banco principal |
| Redis | `8-alpine` | filas + cache + rate limit |
| MinIO | `latest` (RELEASE) | storage S3-compatible **dev/test** |
| Supabase Storage | S3-compatible | documentos (receitas, comprovativos) em staging/prod |

> Regra storage: MinIO local para dev/test (docker-compose), Supabase Storage apenas em staging/prod. A API fala S3-compatible via `minio` client; troca de backend é configuração, não código.

---

## 2. Catálogo pnpm (`pnpm-workspace.yaml`)

Regras do catálogo:
- **Uma versão por dependência** no monorepo inteiro.
- `allowBuilds` explícito para pacotes com scripts nativos.
- `overrides` para segurança e pinning crítico.
- `engines` em package.json: `node >=24.0.0`, `pnpm >=11.21.0`.

```yaml
packages:
  - "apps/*"
  - "packages/*"
catalog:
  "@biomejs/biome": "^2.5.4"
  "@better-auth/expo": "^1.2.0"
  "@changesets/cli": "^2.31.0"
  "@dotenvx/dotenvx": "^1.75.1"
  "@hookform/resolvers": "^5.1.0"
  "@nestjs/common": "^11.1.24"
  "@nestjs/config": "^4.0.4"
  "@nestjs/core": "^11.1.24"
  "@nestjs/platform-express": "^11.1.24"
  "@nestjs/platform-socket.io": "^11.1.24"
  "@nestjs/throttler": "^6.5.0"
  "@orpc/contract": "^1.14.10"
  "@orpc/server": "^1.14.10"
  "@playwright/test": "^1.61.0"
  "@prisma/adapter-pg": "^7.9.1"
  "@prisma/client": "^7.9.1"
  "@shopify/flash-list": "^1.7.0"
  "@tanstack/react-query": "^5.101.0"
  "@tanstack/react-table": "^8.21.3"
  "@types/node": "^24.0.0"
  "@types/react": "^19.2.17"
  "@types/react-dom": "^19.2.3"
  "better-auth": "^1.6.26"
  "bullmq": "^5.79.1"
  "class-variance-authority": "^0.7.1"
  "clsx": "^2.1.1"
  "expo": "^57.0.0"
  "expo-camera": "^57.0.0"
  "expo-file-system": "^57.0.0"
  "expo-image": "^57.0.0"
  "expo-image-picker": "^57.0.0"
  "expo-local-authentication": "^57.0.0"
  "expo-notifications": "^57.0.0"
  "expo-router": "^57.0.0"
  "expo-secure-store": "^57.0.0"
  "helmet": "^8.0.0"
  "i18next": "^25.0.0"
  "ioredis": "^5.11.1"
  "lucide-react": "^1.21.0"
  "minio": "^8.0.0"
  "next": "^16.3.0"
  "next-themes": "^0.4.6"
  "pg": "^8.22.0"
  "pino": "9.14.0"
  "postcss": "^8.5.18"
  "prisma": "^7.9.1"
  "prom-client": "15.1.3"
  "react": "^19.2.6"
  "react-dom": "^19.2.6"
  "react-hook-form": "^7.60.0"
  "react-native": "^0.83.0"
  "react-native-reanimated": "^4.0.0"
  "react-i18next": "^15.0.0"
  "reflect-metadata": "^0.2.2"
  "socket.io": "^4.8.0"
  "socket.io-client": "^4.8.0"
  "sonner": "^2.0.7"
  "tailwind-merge": "^3.6.0"
  "tailwindcss": "^4.3.1"
  "tsup": "^8.5.1"
  "tsx": "^4.22.4"
  "turbo": "^2.9.18"
  "typescript": "^7.0.0"
  "vitest": "4.1.10"
  "zod": "^4.4.3"
  "zustand": "^5.0.0"
allowBuilds:
  "@nestjs/core": true
  "@parcel/watcher": true
  "@prisma/engines": true
  "@swc/core": true
  better-sqlite3: true
  esbuild: true
  prisma: true
  sharp: true
overrides:
  brace-expansion: ">=5.0.8"
  sharp: ">=0.35.0"
  multer: "2.2.0"
  vitest: "4.1.10"
  react-is: "^19.0.0"
```

---

## 3. Estrutura do monorepo

```
brocolis/
├── apps/
│   ├── web/            # Next.js 16 (App Router) — Consumer Web + Portais (Admin/Pharmacy/Supplier/Business)
│   ├── api/            # NestJS 11 + oRPC — API
│   ├── mobile/         # Expo SDK 57 (React Native) — Consumer App
│   └── qa/             # Suites E2E/contrato (Playwright + Maestro)
├── packages/
│   ├── contracts/      # Zod + oRPC contracts (shared kernel)
│   ├── db/             # Prisma 7 client + schema (única fonte da verdade)
│   ├── auth/           # Better Auth server + client + RBAC
│   ├── ui/             # Africa Pharmacy Commerce Design System (design.json, meta.ts)
│   ├── i18n/           # Locales (pt-AO primeiro; en/fr/sw/ar prontos)
│   ├── markets/        # Country Packs (Market AO completo; MZ/KE/NG padrão)
│   ├── formatters/     # Money, Date, Phone, Address, Percentage (pt-AO first)
│   ├── finpay/         # FinPayAdapter + mock + webhook verifier
│   ├── validation/     # Zod schemas de env partilhados
│   ├── observability/  # tipos de auditoria + métricas (única fonte de logging)
│   └── test-helpers/   # mocks e fixtures partilhados de teste
├── docs/
│   ├── architecture/   # C4, bounded contexts, ADRs
│   ├── requirements/   # PRDs, regras de negócio, NFRs
│   ├── design-system/  # specs de design, tokens, markets
│   ├── testing/        # estratégia de testes
│   ├── security/       # ameaças, hardening
│   └── operations/     # runbooks, deploys
├── .ai/                # AI Software Delivery Pipeline (agents, skills, protocols, pipeline, state)
├── .opencode/          # agentes e skills do runtime opencode
├── .github/workflows/  # CI/CD
├── deploy/             # docker-compose (dev/test/staging/prod)
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json
├── tsconfig.base.json
├── components.json
├── docker-compose.yml
├── opencode.json       # policy allow/deny do pipeline
└── package.json
```

---

## 4. Ficheiros de configuração reais

### `tsconfig.base.json` (strict, base de todos)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false
  }
}
```

### `turbo.json` (task graph)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "lint": { "dependsOn": ["^lint"], "outputs": [] },
    "typecheck": { "dependsOn": ["^typecheck"], "outputs": [] },
    "test": { "dependsOn": ["^test"], "outputs": [] },
    "test:unit": { "dependsOn": ["^build"], "outputs": [] },
    "test:integration": { "dependsOn": ["^build"], "cache": false },
    "test:e2e": { "dependsOn": ["build"], "cache": false },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false },
    "docs:generate": { "dependsOn": ["build"], "outputs": ["docs/api/**"] }
  }
}
```

### `biome.json` (lint + format)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true },
  "formatter": { "indentStyle": "space", "indentWidth": 2 },
  "linter": {
    "rules": {
      "recommended": true,
      "nursery": {
        "noUnusedImports": "error",
        "noFloatingPromises": "error"
      }
    }
  }
}
```

### `docker-compose.yml` (dev base)

```yaml
services:
  postgres:
    image: postgres:17
    container_name: brocolis-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: brocolis
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["${BROCOLIS_POSTGRES_PORT:-15432}:5432"]
    volumes: [brocolis-postgres17-data:/var/lib/postgresql]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d brocolis"]
      interval: 5s
      timeout: 5s
      retries: 10
  redis:
    image: redis:8-alpine
    container_name: brocolis-redis
    restart: unless-stopped
    ports: ["${BROCOLIS_REDIS_PORT:-16379}:6379"]
    volumes: [brocolis-redis-data:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10
  minio:
    image: minio/minio:latest
    container_name: brocolis-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: brocolis
      MINIO_ROOT_PASSWORD: brocolis-minio
    ports: ["${BROCOLIS_MINIO_PORT:-19000}:9000", "19001:9001"]
    volumes: [brocolis-minio-data:/data]
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 10
volumes:
  brocolis-postgres17-data:
  brocolis-redis-data:
  brocolis-minio-data:
```

> O `docker-compose.test.yml` (Postgres+Redis para integração) e `docker-compose.staging/production.yml` seguem o padrão de `08-CICD-GOVERNANCA.md`.

### `.npmrc`

```
engine-strict=true
```

### `components.json` (shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "apps/web/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@brocolis/ui/components",
    "utils": "@brocolis/ui/lib/utils",
    "ui": "@brocolis/ui/components",
    "lib": "@brocolis/ui/lib",
    "hooks": "apps/web/src/hooks"
  },
  "iconLibrary": "lucide"
}
```

### `.env.example` (raiz)

```
# App
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:15432/brocolis

# Redis
REDIS_URL=redis://localhost:16379

# Auth
BETTER_AUTH_SECRET=<trocar_obrigatoriamente>
BETTER_AUTH_URL=http://localhost:4000

# Storage (dev/test: MinIO local; staging/prod: Supabase Storage)
STORAGE_DRIVER=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=19000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=brocolis
MINIO_SECRET_KEY=brocolis-minio
MINIO_BUCKET=brocolis-documents
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=brocolis-documents

# Market (referência)
BROCOLIS_MARKET=AO
BROCOLIS_LOCALE=pt-AO
BROCOLIS_CURRENCY=AOA

# FinPay (adapter)
FINPAY_MODE=mock            # mock | live
FINPAY_API_URL=https://api.finpay.ao
FINPAY_API_KEY=
FINPAY_WEBHOOK_SECRET=

# Mobile (EAS)
EXPO_PUBLIC_API_URL=http://localhost:4000
```

> Regra: `BETTER_AUTH_SECRET` e `FINPAY_WEBHOOK_SECRET` são rejeitados por `.refine()` se forem placeholders. Nunca comitar secrets; usar dotenvx.

---

## 5. Git e commits

### `commitlint.config.js`

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "docs", "refactor", "test", "chore", "style", "security", "perf", "build", "ci"]],
  },
};
```

### `lint-staged`

```
*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,css,md,mdx,yml,yaml}: biome check --write --no-errors-on-unmatched --files-ignore-unknown=true
```

### Hooks husky

- `pre-commit`: `lint-staged`
- `pre-push`: `pnpm lint && pnpm typecheck && pnpm test`

---

## 6. Anti-patterns de monorepo (proibidos)

| Anti-pattern | Correto |
|--------------|---------|
| Dependência em `devDependencies` usada em runtime (react-query, zustand) | `dependencies` |
| Duas versões da mesma lib (oRPC, vitest) | Catálogo + override pinned |
| Dois logger | `@brocolis/observability` única fonte |
| Config duplicada por app | Raiz partilhada + catálogo |
| Pacote que cria `new PrismaClient()` próprio | Proxy `@brocolis/db` |
| Cores hardcoded no mobile diferente do web | Mesmo `design.json` via NativeWind |
| Lógica de país espalhada (`if market === AO`) | `@brocolis/markets` |
| `fetch()` espalhado em vez de oRPC client | oRPC + TanStack Query |
| SDK Stripe presente | Proibido; usar `@brocolis/finpay` |

---

## 7. Supply Chain Security

### 7.1 SBOM (Software Bill of Materials)

| Ferramenta | Uso | Gate |
|------------|-----|------|
| `cyclonedx` | Gerar SBOM em formato CycloneDX | CI (a cada build) |
| `trivy` | Scan de vulnerabilities no SBOM | Block se critical |
| `npm audit` | Vulnerabilidades de dependências | Block se high |
| `snyk` | Monitorização contínua | Alertas diários |

```bash
# Gerar SBOM
pnpm dlx cyclonedx-npm --output-file sbom.json

# Scan de vulnerabilidades
trivy sbom sbom.json --severity CRITICAL,HIGH --exit-code 1
```

### 7.2 Container Scanning

| Ferramenta | Uso | Gate |
|------------|-----|------|
| `trivy` | Scan de imagens Docker | CI (a cada build) |
| `docker scout` | Análise de supply chain | CI |
| `grype` | Vulnerabilidades em containers | Block se critical |

```yaml
# GitHub Actions workflow
- name: Build and scan container
  run: |
    docker build -t brocolis-api:latest .
    trivy image --severity CRITICAL,HIGH --exit-code 1 brocolis-api:latest
```

### 7.3 Dependency Management

| Ferramenta | Uso | Frequência |
|------------|-----|------------|
| `renovate` | Automated dependency updates | Diário |
| `pnpm audit` | Vulnerability check | CI + semanal |
| `github dependabot` | Security alerts | Contínuo |

### 7.4 Bundle Analysis

| Ferramenta | Uso | Target |
|------------|-----|--------|
| `@next/bundle-analyzer` | Web bundle analysis | < 250KB initial |
| `expo-bundle-analyzer` | Mobile bundle analysis | < 15MB |
| `source-map-explorer` | Analisar source maps | Debug only |

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({});
```

### 7.5 Pre-commit Security Hooks

```bash
# .husky/pre-commit
pnpm lint-staged
pnpm gitleaks detect --staged --verbose
```

### 7.6 Regras de Supply Chain Security

| Regra | Implementação |
|-------|---------------|
| Nunca instalar pacotes não verificados | `allowBuilds` explícito no catálogo |
| Lockfile imutável | `pnpm install --frozen-lockfile` em CI |
| Private registry para dependências internas | `.npmrc` com registry |
| Version pinning para dependências críticas | Overrides no catálogo |
| Scan antes de merge | Trivy + CodeQL no CI |
