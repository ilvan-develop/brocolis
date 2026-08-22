# ADR-0011: B2C Commerce F2 — minor units, catálogo/carrinho/checkout e FinPay mock

- **Estado:** Aceite
- **Data:** 2026-08-20
- **Fase:** F2 — B2C Commerce (Core + Pagamentos FinPay) (09-ROADMAP-FASES.md)

## Contexto

O MVP v1 exige um storefront B2C funcional: catálogo pesquisável, carrinho
multi-farmácia, checkout idempotente, pedidos com estado e pagamento via FinPay.
As dependências de runtime (`@prisma/client`, `@orpc/*`, etc.) ainda não estão
instaladas no monorepo, pelo que (como na F1) a F2 deve ser **dependency-safe**:
código que corre já, com wirings de DB/queue adiados.

## Decisão

1. **Montantes em `Int` minor units** (centavos) em vez de `Decimal(18,2)`:
   colunas `*AmountMinor`/`*PriceMinor` no Prisma, `amountMinor` nos contratos e
   `priceMinor` no serviço de catálogo. Zero floats em dinheiro
   (10-BEST-PRACTICES #2, 07-FINPAY §11). O currency é sempre `AOA` no Market AO.
2. **Contracts-first:** `catalog.ts`, `cart.ts`, `order.ts`, `payment.ts` em
   `@brocolis/contracts`, todos com `organizationId` + `marketCode` obrigatórios
   em inputs scoped e tipagem via `z.infer`. IDs de domínio são **cuid**
   (schema Zod) — os serviços geram `c` + 24 hex via `apps/api/src/cuid.ts`.
3. **Schema Prisma:** modelos B2C
   (GlobalProduct, CountryProduct, MarketOffer, Medicine, Category, Brand,
   Pharmacy e subordinados, Cart/CartItem, CheckoutSession, Order/OrderItem/
   OrderStatusHistory/OrderSplit, Payment/PaymentProof/PaymentStatusHistory,
   FinpayWebhookLog) com `@@map` snake_case, `@id @default(cuid())` e índices
   `(organizationId, marketCode, ...)`. `Medicine` é um subset farmacêutico do
   produto global (composição, forma, classificação ATC, receita obrigatória).
4. **Serviços em memória** (chaveados por sessão+tenant+mercado) até ao wiring
   Prisma: `CatalogService` (filtros puros + paginação), `CartService`
   (multi-farmácia; preço só vem do catálogo), `OrdersService` (scoping,
   transições validadas, histórico), `CheckoutService` (totais em minor units,
   fee por zona de entrega, idempotência por `idempotencyKey`, AuditEvent),
   `PaymentsService` (FinPay `createIntent` + webhooks idempotentes).
5. **FinPay é a processadora (rule 8):** `@brocolis/finpay` exporta o
   `FinPayMockProvider` (`createIntent`, `webhookConfirm`, `webhookFail`) com
   store injectável e idempotência por `idempotencyKey`/`orderId+amount`.
   `POST /finpay/webhook` consome `CONFIRMED`/`FAILED` replay-safe por `eventId`.
6. **Auditoria (rule 7):** `CheckoutService.order.created` e
   `PaymentsService.payment.*` emitem `db.auditEvent.create` via `@brocolis/db`
   em try/catch — registada em memória enquanto o DB não está wired.
7. **DI-safe:** params opcionais com `@Optional()` + fallback (`??`), mesmo
   padrão da F1 (`AuthService`), para arranque Nest sem crashes de resolução.

## Alternativas

- `Decimal(18,2)` no Prisma: padrão blueprint §6, mas exige serializer/parser
  estável; minor units ints matam a classe de bugs de precisão no MVP.
- IDs UUID para order/cart/payment: descartados — os contratos Zod validam
  cuid (`^c[^\s-]{8,}$`); uuid criava retorno incompatível com `getOrder`.
- Persistência Prisma já na F2: inviável sem deps instaladas — fica o proxy
  `@brocolis/db` como único ponto de instância (AP-01).

## Consequências

- Positivo: F2 testável hoje, sem deps novas; contratos + schema servem de
  fonte da verdade para web/mobile/qa; migração decimal→DB apenas troca o
  store, nunca contratos.
- Negativo: stores em memória não escalam multi-instância nem sobrevivem a
  restart — substituídos por Prisma quando o DB estiver wired (ver README).