# B2C Commerce + FinPay (Fase 2)

Documentação de módulo do backend — bounded contexts **Catalog & Products**
(`catalog`), **Cart & Checkout** (`cart`, `checkout`), **Orders & Fulfillment**
(`orders`) e **Payments & Settlement** (`payments`). Ver também
`ADR-0011-commerce.md` e `07-FINPAY-INTEGRATION.md`.

## Contratos (`@brocolis/contracts`)

| Ficheiro | Conteúdo |
|----------|----------|
| `src/catalog.ts` | `categorySchema`, `brandSchema`, `globalProductSchema`, `countryProductSchema`, `marketOfferSchema`, `searchCatalogInputSchema` |
| `src/cart.ts` | `cartSchema`, `cartItemSchema`, `addToCartInputSchema`, `updateCartItemInputSchema`, `removeCartItemInputSchema`, `getCartInputSchema` |
| `src/order.ts` | `orderSchema`, `orderItemSchema`, `orderTotalsSchema`, `orderStatusEnumSchema` (PENDING→…→DELIVERED / CANCELED), `createOrderInputSchema`, `getOrderInputSchema`, `orderStatusHistorySchema` |
| `src/payment.ts` | `paymentSchema`, `paymentMethodSchema` (CARD/WALLET/REFERENCE/COD/MOBILE), `paymentStatusSchema`, `createPaymentInputSchema`, `finpayWebhookSchema` |

Regras: `organizationId` + `marketCode` obrigatórios em todo input scoped;
montante em **minor units** (`moneySchema` da `common.ts`); tipos via `z.infer`.

## Schema (`@brocolis/db/prisma/schema.prisma`)

Modelos F2: `Category`, `Brand`, `GlobalProduct`, `CountryProduct`,
`MarketOffer`, `Medicine`, `Pharmacy`, `PharmacyStaff`, `PharmacyHour`,
`PharmacyServiceArea`, `Cart`, `CartItem`, `CheckoutSession`, `Order`,
`OrderItem`, `OrderStatusHistory`, `OrderSplit`, `Payment`, `PaymentProof`,
`PaymentStatusHistory`, `FinpayWebhookLog`. Todos `@@map("snake_case")`,
montantes em `*Minor` (Int, centavos).

## Pagamentos (`@brocolis/finpay` mock)

`FinPayMockProvider` com store injectável:

```
createIntent({ orderId, amountMinor, currency, organizationId, marketCode,
               idempotencyKey?, paymentMethod? }) → FinpayIntent (PENDING)
webhookConfirm(intentId)  → FinpayWebhookEvent { eventType: 'CONFIRMED' }
webhookFail(intentId)     → FinpayWebhookEvent { eventType: 'FAILED' }
```

Idempotente por `idempotencyKey` e por `orderId+amount`; exporta o cliente
singleton `finpay`. HMAC real + URL live ficam para o `FinPayLiveProvider`
(com deps instaladas), ver `07-FINPAY-INTEGRATION.md §3`.

## API (`apps/api`)

```
src/catalog/  catalog.module.ts  CatalogService.search (filtros puros) + GET /catalog/search
src/cart/     cart.module.ts     CartService add/update/remove/get (multi-farmácia, por sessão)
src/checkout/ checkout.module.ts CheckoutService.createOrder (fee por zona, idempotente, audit)
src/orders/   orders.module.ts   OrdersService getOrder/listByOrg/advanceStatus + transições
src/payments/ payments.module.ts PaymentsService createPayment + handleWebhook (replay-safe)
             + POST /payments e POST /finpay/webhook
src/cuid.ts   nextCuid()         ids de domínio compatíveis com z.string().cuid()
```

Fluxo: `GET /catalog/search` → `POST /cart/items` → `POST /checkout`
(idempotencyKey) → `POST /payments` (createIntent) → simulador FinPay →
`POST /finpay/webhook` (CONFIRMED) → Order `PENDING → CONFIRMED`.

## Montantes

Int minor units em todo o stack (contratos, services, schema). Ao chegar a
DB: mapear `*Minor` para colunas `Int` — nunca converter para float.

## Wiring futuro (pós-instalação de deps)

- Stores em memória (`CatalogService.offers`, `CartService.carts`,
  `OrdersService.orders`, `PaymentsService.payments`) → Prisma via
  `@brocolis/db`.
- `db.auditEvent.create` já emitido em `checkout`/`payments` (try/catch) passa a
  correr dentro da `$transaction` da mutação (rule 7).
- `FinPayMockProvider` → `FinPayLiveProvider` por `FINPAY_MODE` (env), com
  verificação HMAC e retry/exponencial via BullMQ.