# Runbook — Security Hardening (F7)

> Blueprint 09 §Fase 7 (rate limiting Redis, signed URLs, Sentry, headers, secrets scan) + blueprint 14-THREAT-MODEL. Os snippets abaixo estão **prontos a aplicar** em `apps/api` (ownership de outro agente — ver relatório F7 §3).

## 1. Rate limiting (Redis) — `@nestjs/throttler` v6

Aplicar em `apps/api/src/app.module.ts`. Storage Redis partilhado entre instâncias
(in-memory quebra multi-instância e deixa passar bursts).

```ts
// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          // throttlers NOMEADOS (v6): curto anti-burst, longo anti-abuso
          { name: "short", ttl: 1_000, limit: 10 },
          { name: "medium", ttl: 60_000, limit: 100 },
          { name: "long", ttl: 900_000, limit: 500 },
        ],
        storage: new ThrottlerStorageRedisService(new Redis(process.env.REDIS_URL)),
        // exceder devolve 429 com Retry-After
      }),
      inject: [], // injectar REDIS_URL via ConfigService se preferir DI
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

Notas:
- Package de storage: `@nest-lab/throttler-storage-redis` (companheiro oficial do throttler v6).
- Rotas sensíveis (login, registo, verificação MFA): `@Throttle({ short: { limit: 3, ttl: 60_000 } })`.
- Health checks: `@SkipThrottle()` no `HealthController`.
- Variáveis: `THROTTLER_TTL_MS`, `THROTTLER_LIMIT` (ver `.env.example`).

## 2. Headers hardening

### 2.1 NestJS (`apps/api/src/main.ts`) — helmet (já catalogado ^8.0.0)

```ts
// apps/api/src/main.ts
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // imagens/uploads servidos ao web
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
```

### 2.2 Next.js (`apps/web/next.config.ts`) — headers globais

```ts
// apps/web/next.config.ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://api.brocolis.ao wss://api.brocolis.ao",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
```

> `'unsafe-inline'` em scripts é temporário (Next.js App Router exige até adoptar nonces).
> Migração para CSP com nonce: backlog F7 iterativo.

## 3. Signed URLs (object storage)

Receitas e comprovativos **nunca** são públicos. Acesso só via presigned URL de
curta duração gerada pela API (client `minio` já catalogado):

```ts
const url = await minioClient.presignedGetObject(bucket, objectKey, 300); // 5 min
```

Regras:
- Bucket privado (`public = false`); CDN só com signed cookies se existir.
- Validar ownership do documento antes de gerar URL (RBAC por tenant/market).
- Expiração ≤ 5 min para documentos clínicos; ≤ 15 min para comprovativos.

## 4. Secrets scan

| Camada | Ferramenta | Onde |
|---|---|---|
| Pre-commit local | gitleaks | `.husky/pre-commit` (correção F0-c — ver relatório) |
| CI PR + weekly | gitleaks-action@v2 | `.github/workflows/security.yml` |
| Dependências/imagem | trivy fs+config | `.github/workflows/security.yml` |
| SBOM + vuln | pnpm sbom cyclonedx + trivy sbom | `.github/workflows/supply-chain.yaml` |

## 5. Sentry (erros/performance)

SDKs por app: `@sentry/nestjs` (API), `@sentry/nextjs` (Web), `@sentry/react-native`
(Mobile). DSNs não são segredos críticos mas ficam em env; auth token de upload de
sourcemaps é segredo de CI (`SENTRY_AUTH_TOKEN`). Crash-free rate é NFR
(blueprint 16). Releases Sentry associadas a tags git (ver release.yml).

## 6. Checklist de endurecimento (gate F7)

- [ ] Throttler global activo com storage Redis (429 observável)
- [ ] Helmet na API + headers no Next (verificar com `curl -I`)
- [ ] HSTS activo; TLS terminado no edge
- [ ] Buckets privados; só presigned URLs
- [ ] gitleaks verde em pre-commit e CI
- [ ] Trivy sem CRITICAL/HIGH unfixed
- [ ] Sentry a receber eventos nos 3 apps
- [ ] Rate limits cobrem login/MFA/webhooks FinPay
