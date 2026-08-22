# Fase 7 — Hardening + Launch — Report

## 1. Files Created / Updated

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/common/rate-limit/rate-limit.module.ts` | **NEW** | ThrottlerModule with named throttlers (default: 10/60s, auth: 5/60s) |
| `apps/api/src/common/rate-limit/throttler-storage.service.ts` | **NEW** | Redis-backed ThrottlerStorage via ioredis |
| `apps/api/src/observability/sentry.ts` | **NEW** | Sentry NestJS init (error + perf tracing) |
| `apps/api/src/app.module.ts` | **UPDATED** | Added SentryModule.forRoot() + RateLimitModule imports |
| `apps/api/src/main.ts` | **UPDATED** | Helmet with CSP/HSTS/frameguard, Sentry import |
| `apps/web/sentry.client.config.ts` | **NEW** | Sentry client-side init (traces + replay) |
| `apps/web/sentry.server.config.ts` | **NEW** | Sentry server-side init |
| `apps/web/sentry.edge.config.ts` | **NEW** | Sentry edge runtime init |
| `apps/web/next.config.ts` | **UPDATED** | Security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `.lighthouserc.json` | **NEW** | Root Lighthouse CI config (≥90 scores) |
| `apps/web/lighthouserc.json` | **NEW** | Web-specific Lighthouse (JS <200KB, CSS <50KB) |
| `.changeset/config.json` | **NEW** | Changesets config (conventional commits, main branch) |
| `.gitleaks.toml` | **NEW** | Secrets scanning rules + allowlist |
| `docs/runbooks/hardening-runbook.md` | **NEW** | Rate limiting, Sentry, headers, Lighthouse, changesets procedures |
| `docs/runbooks/incident-response.md` | **NEW** | P1-P4 incident playbook + escalation paths |
| `.ai/f7-hardening-report.md` | **NEW** | This report |

## 2. Security Features Implemented

### Rate Limiting
- **Default throttler**: 10 requests per 60s per IP
- **Auth throttler**: 5 requests per 60s per IP (login, register, password reset)
- **Storage**: Redis-backed via `RedisThrottlerStorage` — distributed across instances
- **Block duration**: Exceeded limits trigger block period
- **Configurable**: `THROTTLER_TTL_MS`, `THROTTLER_LIMIT` env vars
- **Monitoring**: `ignoreUserAgents` for healthchecks

### Sentry (Error Tracking + Performance)
- **API**: `@sentry/nestjs` with `SentryModule.forRoot()`, initialized before all modules
- **Web**: `@sentry/nextjs` client/server/edge configs with `NEXT_PUBLIC_SENTRY_DSN`
- **Sampling**: 100% in dev, 10% in production (configurable via `SENTRY_TRACES_SAMPLE_RATE`)
- **PII scrubbing**: Authorization headers filtered in `beforeSend`
- **Session replay**: 10% of sessions, 100% on error (client-side)
- **Trace propagation**: Targets `localhost` and `*.brocolis.ao`

### Security Headers
- **API (Helmet)**: CSP, HSTS (2 years + preload), X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy
- **Web (Next.js headers)**: Same set + X-DNS-Prefetch-Control, Permissions-Policy (camera/mic/geo off), X-XSS-Protection

### Lighthouse CI
- **Scores**: ≥90 for performance, accessibility, best practices, SEO
- **Budgets**: JS <200KB, CSS <50KB
- **Pages tested**: `/`, `/catalog`, `/auth/login`

### Changesets
- **Config**: Conventional commits, restricted access, main branch
- **Packages**: All workspace packages via `updateInternalDependencies: "patch"`

### Secrets Scanning
- **Gitleaks**: Rules for API keys, secrets, private keys, AWS/GitHub/Sentry tokens
- **Allowlist**: `node_modules/`, `dist/`, `pnpm-lock.yaml`, `.env.example`, `graphify-out/`
- **Sentry DSN**: Allowlisted in config files only

## 3. WIRING Notes

### API `main.ts`
```typescript
import "./observability/sentry.js";  // ← Sentry init (top-level side effect)
import { AppModule } from "./app.module.js";
```
Helmet is applied via `app.use(helmet({...}))` before `setGlobalPrefix`.

### API `app.module.ts`
```typescript
imports: [
  SentryModule.forRoot(),   // ← FIRST (Sentry intercepts all exceptions)
  RateLimitModule,          // ← BEFORE feature modules (rate limits all routes)
  // ...feature modules
]
```

### Web `next.config.ts`
Headers are applied via `headers()` returning a catch-all `/(.*)` pattern. CSP includes Sentry CDN origins.

### Sentry Env Vars
```bash
# API (.env)
SENTRY_DSN=https://...@ingest.sentry.io/...
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Web (.env)
NEXT_PUBLIC_SENTRY_DSN=https://...@ingest.sentry.io/...
SENTRY_DSN=https://...@ingest.sentry.io/...
```

## 4. Test Results

- **TypeScript**: All F7 files compile with zero errors (`tsc --noEmit`)
- **Biome**: No new lint violations from F7 files
- **Pre-existing issues**: Non-null assertions in test files, formatting in `app/(dashboard)/business/` pages — not introduced by this phase

## 5. Deviations

| Item | Expected | Actual | Reason |
|------|----------|--------|--------|
| `ThrottlerStorageRecord` import | From `@nestjs/throttler` | Inline type definition | v6 doesn't re-export `ThrottlerStorageRecord` from main index |
| ioredis import | `import Redis from "ioredis"` | `createRequire` + type cast | ESM/CJS interop — ioredis has no `exports` field, default import resolves as namespace |
| Sentry profiling | `@sentry/profiling-node` | Omitted | Not in dependencies; can be added later for CPU profiling |
| `SentryInterceptrs` / `SentryFilter` | Applied in main.ts | Omitted (future) | Current Sentry NestJS SDK auto-instruments via `SentryModule.forRoot()` |
