# ARCHITECTURE.md — Resumo da arquitectura

Versão detalhada: `blueprint/02-ARQUITETURA-CONTRATOS.md`.

## Conceito

Marketplace farmacêutico multi-tenant **Angola-first, Africa by design**.
Money movement delegado à FinPay; o Brócolis cria `PaymentIntent` e consome
webhooks. 5 produtos: Consumer (B2C), Pharmacy Portal, Supplier (B2B),
Business (B2B), Admin/Platform — todos no mesmo Core.

## C1 → C3

- **C1:** Utilizadores → Brócolis → PostgreSQL, Redis, MinIO/Supabase Storage; Brócolis → FinPay.
- **C2:** `web` e `mobile` falam com `api` via oRPC; `api` → Postgres/Redis/Storage/FinPay;
  `packages/contracts` é o shared kernel.
- **C3:** Módulos NestJS 1:1 com bounded contexts; guard oRPC valida sessão + role + market.

## Abstração Market

```
GLOBAL CORE → COUNTRY PACK (AO) → MARKETS (MZ, KE, NG…)
```

Core nunca contém `if (country === "AO")`. Tudo via `@brocolis/markets`.

## Contracts-first

Nenhuma rota sem contrato em `@brocolis/contracts` (Zod + oRPC). Tipos derivados
por `z.infer`; mesmo versão de oRPC em todo o monorepo.

## Padrões críticos (ver detalhes no blueprint)

- Event Sourcing: Orders, Payments, Prescriptions, AuditEvent.
- CQRS para portais read-heavy.
- Saga no checkout (Order → Payment → Stock → Prescription).
- Circuit breaker + retry nas chamadas FinPay.
- `AuditEvent` append-only na mesma `$transaction` da mutação.

## Schema Prisma

Schema central em `packages/db/prisma/schema.prisma` (Prisma 7 + PrismaPg).
`Decimal(18,2)` para montantes; índices compostos `(organizationId, marketCode, …)`.