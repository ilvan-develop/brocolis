# 02 — Arquitectura e Contratos

> Aplica-se às fases **F0 → F6**. Define o conceito Brócolis, a abstracção **Market**, o C4, os bounded contexts, o contracts-first (oRPC + Zod) e a estratégia de schema Prisma.

---

## 1. O conceito Brócolis (definição canónica)

**Brócolis é um marketplace farmacêutico multi-tenant, Angola-first e Africa by design.** Liga consumidores, farmácias, clínicas, hospitais, empresas, distribuidores e fornecedores. O money movement é delegado à **FinPay** (a processadora): o Brócolis cria `PaymentIntent` e consome webhooks; nunca processa pagamentos directamente.

### Principios de domínio (DDD)

| Princípio | Regra |
|-----------|-------|
| Ubiquitous language | Cada contexto tem o seu vocabulário (Order, PurchaseOrder, Prescription, Stock, Settlement…) |
| Aggregate roots | `Organization`, `Pharmacy`, `Supplier`, `Product`, `Order`, `PurchaseOrder`, `Cart`, `Prescription`, `Payment`, `Delivery`, `User` |
| Data ownership | Cada contexto é dono da sua persistência |
| Independent deployability | Contextos evoluem via contratos sem quebrar os outros |
| Tenant isolation | `organizationId` obrigatório em toda query e todo contrato |
| Market isolation | `marketCode` obrigatório em todo contrato scoped por mercado |

### Build Global. Configure Local.

```
GLOBAL CORE          → domínio e UI universais (Product, Order, Cart, Payment, Delivery…)
COUNTRY CONFIG       → @brocolis/markets (currency, payments, address, phone, regulation…)
LOCALE               → @brocolis/i18n (pt-AO, pt-MZ, en-KE, sw-KE, fr-SN, ar-EG…)
TENANT               → overrides de brand/features por organização (Brand, Logo, Colors)
```

O Core **nunca** contém `if (country === "AO")`. Toda regra de país vive no Country Pack.

---

## 2. A abstracção `Market`

### 2.1 O que é um Market

Um mercado é mais que um país: é a combinação de `country + region + language + currency + regulation + payments + logistics`.

```ts
// packages/markets/src/types.ts
export type Market = {
  countryCode: string;            // "AO"
  region: string;                 // "Southern Africa"
  locale: string;                 // "pt-AO"
  currency: CurrencyConfig;       // { code: "AOA", symbol: "Kz", decimals: 0, groupSeparator: " " }
  phone: PhoneConfig;             // { countryCode: "+244", nationalFormat: "9XX XXX XXX" }
  address: AddressConfig;         // { levels: ["province","municipality","district","neighborhood"], referencePoint: true }
  payments: PaymentConfig;        // { methods: [{ id: "multicaixa", type: "reference" }, …] }
  taxation: TaxConfig;            // { vatRate: 14, safT: true }
  pharmacy: PharmacyConfig;       // { verificationLevels: [...], documentTypes: [...] }
  prescription: PrescriptionConfig;// { types, validityDays, pharmacistApproval, controlledRules }
  logistics: LogisticsConfig;     // { deliveryUnit: "km", zones: [...], partners: [...] }
};
```

### 2.2 Angola como Market de referência

```ts
export const aoMarket: Market = {
  countryCode: "AO",
  region: "Southern Africa",
  locale: "pt-AO",
  currency: { code: "AOA", symbol: "Kz", decimals: 0, groupSeparator: " " },
  phone: { countryCode: "+244", nationalFormat: "9XX XXX XXX" },
  address: {
    levels: ["province", "municipality", "district", "neighborhood"],
    fields: ["street", "houseNumber", "referencePoint", "latitude", "longitude"],
    referencePoint: true,
  },
  payments: {
    methods: [
      { id: "multicaixa", type: "reference", label: "Multicaixa" },
      { id: "tpa", type: "pos", label: "TPA" },
      { id: "bank-transfer", type: "bank", label: "Transferência bancária" },
      { id: "cash-on-delivery", type: "cod", label: "Dinheiro na entrega" },
    ],
  },
  taxation: { vatRate: 14, safT: true },
  pharmacy: {
    verificationLevels: ["VERIFIED", "PREMIUM_VERIFIED", "PENDING_VERIFICATION", "SUSPENDED"],
    documentTypes: ["license", "identity", "tax-id"],
  },
  prescription: {
    types: ["digital", "physical"],
    validityDays: 30,
    pharmacistApproval: true,
    controlledRules: true,
  },
  logistics: { deliveryUnit: "km", zones: ["urban", "suburban"], partners: ["brocolis-fleet"] },
};
```

> Outros mercados (MZ, KE, NG…) seguem o **mesmo contrato** `Market`, como `mzMarket`, `keMarket`, `ngMarket`. Ver `packages/markets/src/ao/`, `mz/`, `ke/`, `ng/` no padrão de pack.

### 2.3 Estrutura de Country Pack

```
packages/markets/src/
├── types.ts
├── index.ts            # getMarket(marketCode) → Market
├── ao/
│   ├── config.ts       # aoMarket
│   ├── currency.ts
│   ├── payments.ts
│   ├── address.ts
│   ├── phone.ts
│   ├── taxation.ts
│   ├── pharmacy.ts
│   ├── prescription.ts
│   └── logistics.ts
├── mz/   …             # mesmo padrão
├── ke/   …
└── ng/   …
```

---

## 3. Bounded contexts (13)

| Contexto | Módulo | Aggregate roots | Modelos Prisma |
|----------|--------|-----------------|----------------|
| **Identity & Access (IAM)** | `auth` | `User` | User, Session, Account, Verification, TwoFactor, Role, Permission, RolePermission |
| **Tenants & Organizations** | `tenants` | `Organization` | Organization, OrgSetting, OrgFeatureFlag, Member, Invitation, WhiteLabelConfig |
| **Market & Compliance** | `markets`, `compliance` | — (config) | Market, CountryProduct, RegulatoryPolicy, PharmacyVerification, ConsentRecord |
| **Catalog & Products** | `catalog` | `Product` | GlobalProduct, CountryProduct, MarketOffer, Category, Brand, Medicine, ActiveIngredient |
| **Pharmacy** | `pharmacy` | `Pharmacy` | Pharmacy, PharmacyStaff, PharmacyHour, PharmacyServiceArea, PharmacyDocument |
| **Inventory & Batch** | `inventory` | — | InventoryItem, Batch, StockMovement, InventoryAlert, StockIndicator |
| **Pricing & Offers** | `pricing` | — | PriceTier, VolumePrice, Coupon, Promo, CommissionRate |
| **Cart & Checkout** | `cart` | `Cart` | Cart, CartItem, CheckoutSession, OrderSplit |
| **Orders & Fulfillment** | `orders` | `Order` | Order, OrderItem, OrderStatusHistory, OrderReturn, OrderSplit |
| **Procurement (B2B)** | `procurement` | `PurchaseOrder` | PurchaseOrder, PurchaseOrderItem, Rfq, Quotation, ApprovalWorkflow, CreditAccount |
| **Prescriptions** | `prescriptions` | `Prescription` | Prescription, PrescriptionItem, PrescriptionVerification, HealthcareProfessional |
| **Payments & Settlement** | `payments` | `Payment` | Payment, PaymentProof, PaymentStatusHistory, Refund, PharmacySettlement, FinpayWebhookLog |
| **Delivery & Logistics** | `delivery` | `Delivery` | Delivery, DeliveryDriver, DeliveryZone, DeliveryProof, DriverEarning, DeliveryStatusHistory |
| **Notifications** | `notifications` | `Notification` | Notification, NotificationPreference, WhatsAppMessage |
| **Audit & Platform** | `audit`, `platform` | — | AuditEvent, SupportTicket, Dispute, PlatformSetting, FeatureFlag, AnalyticsEvent, OutboxEvent |

### Mapa de relações

```
IAM ──► todos                                   (autentica, RBAC)
Tenants ──► Orders, Procurement, Payments, Catalog   (organizationId scoping)
Market ──► Catalog, Payments, Pharmacy, Delivery      (marketCode scoping)
Catalog ──► Pharmacy ──► Inventory ──► Orders
Procurement ──► Inventory (PO aprovada → stock) ──► Orders (B2B2C)
Orders ──► Payments (FinPay) ──► Settlement ──► Ledger
Prescriptions ──► Orders (receita obrigatória → validação → dispensa)
Delivery ──► Orders (tracking)
Compliance & Audit ──► todos                     (Conformist, consome eventos)
```

---

## 4. C4 Model

### C1 — Context

```
[Consumidores, Farmacêuticos, Compradores B2B, Fornecedores, Drivers, Admin] ──► Brócolis System
Brócolis System ──► PostgreSQL, Redis, MinIO (dev/test) / Supabase Storage (staging/prod)
Brócolis System ──► FinPay (pagamentos) ──► SMTP, Sentry, WhatsApp API
```

### C2 — Container

```
apps/web (Next.js 16)  ──oRPC──►  apps/api (NestJS 11 + oRPC + Prisma 7)
apps/mobile (Expo SDK 57) ──oRPC──►  apps/api
apps/api ──► Postgres 17 | Redis 8 | MinIO (dev/test) / Supabase Storage (staging/prod)
apps/api ──► @brocolis/finpay ──► FinPay (PaymentIntent, webhooks)
apps/api ──► SMTP | WhatsApp API | Sentry
packages/contracts (Zod + oRPC) ── shared kernel ──► web, api, mobile, qa
```

### C3 — Component (dentro da API)

Módulos NestJS mapeiam 1:1 com bounded contexts. Cada módulo = `controller + service + store(Prisma) + contract`. oRPC middleware valida sessão + role + `marketCode` por rota.

---

## 5. Contracts-first (oRPC + Zod)

### Regra de ouro

> **Nenhuma rota sem contrato.** Todo input/output da API é definido em `@brocolis/contracts` com Zod + oRPC, e é a única fonte da verdade de tipos entre web, api, mobile e qa.

### Estrutura de `packages/contracts/src`

```
index.ts              # re-exports públicos
common.ts             # organizationIdSchema, marketCodeSchema, moneySchema, addressSchema, phoneSchema
market.ts             # schemas de Market + CountryPack
catalog.ts            # produto global / country product / market offer
pharmacy.ts           # farmácia, verificação, horário, zona
inventory.ts          # stock, lote, validade, movimentos
pricing.ts            # preço, volume price, tier
cart.ts               # carrinho, checkout
orders.ts             # pedido, items, status, devolução
procurement.ts        # RFQ, cotação, PurchaseOrder, crédito
prescription.ts       # receita, verificação
payments.ts           # Payment (FinPay), refund, settlement
delivery.ts           # entrega, driver, zona, prova
notifications.ts      # notificações, WhatsApp
audit.ts              # AuditEvent
orpc-contract.ts      # contratos oRPC (procedures)
procedures.ts         # definição das procedures
```

### Padrão de contrato

```ts
// packages/contracts/src/catalog.ts (excerto)
import { z } from "zod";
import { organizationIdSchema, marketCodeSchema, moneySchema } from "./common";

export const listMarketOffersInputSchema = z.object({
  organizationId: organizationIdSchema,   // tenant isolation obrigatório
  marketCode: marketCodeSchema,           // market isolation obrigatório
  query: z.string().max(100).optional(),
  categoryId: z.string().cuid().optional(),
  prescriptionRequired: z.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type ListMarketOffersInput = z.infer<typeof listMarketOffersInputSchema>;
```

```ts
// packages/contracts/src/orpc-contract.ts (excerto)
import { oc } from "@orpc/contract";

export const catalogContract = oc
  .route({ method: "GET", path: "/catalog/offers", input: listMarketOffersInputSchema, tags: ["catalog"] });
```

### Regras de contratos

1. **`organizationId` + `marketCode` obrigatórios** em todo input scoped.
2. **Zod v4** para validação; tipos derivados via `z.infer` — nunca tipos manuais duplicados.
3. **oRPC mesma versão** em todo o monorepo (catálogo).
4. **Guard middleware** por defeito: `OrpcMiddleware` valida sessão + role + market.
5. Mutations idempotentes (`IdempotencyKey`) e audited; queries paginadas por cursor.
6. O mobile consome os **mesmos contratos** via `@orpc/client` — nunca `fetch()` manual.

---

## 6. Estratégia de schema (Prisma 7)

### Princípios

1. **Única fonte da verdade**: schema central em `packages/db/prisma/schema.prisma`.
2. **Driver adapter**: `PrismaPg` (Prisma 7 não usa engine binário Node).
3. **Decimal** para montantes (nunca float) com precisão (18,2).
4. **Índices compostos** para queries de `(organizationId, marketCode, tipo, data)`.
5. **Append-only** para `AuditEvent` e históricos de status (sem UPDATE/DELETE; criados na mesma `$transaction` da mutação).
6. **Modelos por domínio** crescem por fase (ver `09-ROADMAP-FASES.md`).

### Regras de modelo

```prisma
model MarketOffer {
  id              String        @id @default(cuid())
  organizationId  String
  marketCode      String        // "AO"
  countryProductId String
  pharmacyId      String
  price           Decimal       @db.Decimal(18, 2)
  currency        String        @default("AOA")
  stock           Int           @default(0)
  prescriptionRequired Boolean   @default(false)
  status          OfferStatus   @default(ACTIVE)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([organizationId, marketCode, status, createdAt])
  @@map("market_offers")
}

model PurchaseOrder {
  id              String        @id @default(cuid())
  organizationId  String        // comprador (farmácia/clínica/hospital/empresa)
  marketCode      String
  supplierId      String
  status          PoStatus      @default(DRAFT)
  subtotal        Decimal       @db.Decimal(18, 2)
  vat             Decimal       @db.Decimal(18, 2)
  total           Decimal       @db.Decimal(18, 2)
  currency        String        @default("AOA")
  approvalFlowId  String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  items           PurchaseOrderItem[]
  @@index([organizationId, marketCode, status, createdAt])
  @@map("purchase_orders")
}

model AuditEvent {
  id              String        @id @default(cuid())
  organizationId  String
  marketCode      String
  actorType       String        // user | system
  actorId         String
  action          String
  resourceType    String
  resourceId      String
  payload         Json?
  createdAt       DateTime      @default(now())

  @@index([organizationId, action, createdAt])
  @@map("audit_events")
}
```

### Mapa de modelos por contexto

| Contexto | Modelos |
|----------|---------|
| IAM | User, Session, Account, Verification, TwoFactor, Role, Permission, RolePermission |
| Tenants | Organization, OrgSetting, OrgFeatureFlag, Member, Invitation, WhiteLabelConfig |
| Market/Compliance | Market, RegulatoryPolicy, PharmacyVerification, ConsentRecord |
| Catalog | GlobalProduct, CountryProduct, MarketOffer, Category, Brand, Medicine, ActiveIngredient |
| Pharmacy | Pharmacy, PharmacyStaff, PharmacyHour, PharmacyServiceArea, PharmacyDocument |
| Inventory | InventoryItem, Batch, StockMovement, InventoryAlert |
| Pricing | PriceTier, VolumePrice, Coupon, Promo, CommissionRate |
| Cart/Checkout | Cart, CartItem, CheckoutSession, OrderSplit |
| Orders | Order, OrderItem, OrderStatusHistory, OrderReturn |
| Procurement | PurchaseOrder, PurchaseOrderItem, Rfq, Quotation, ApprovalWorkflow, CreditAccount |
| Prescriptions | Prescription, PrescriptionItem, PrescriptionVerification, HealthcareProfessional |
| Payments | Payment, PaymentProof, PaymentStatusHistory, Refund, PharmacySettlement, FinpayWebhookLog |
| Delivery | Delivery, DeliveryDriver, DeliveryZone, DeliveryProof, DriverEarning, DeliveryStatusHistory |
| Notifications | Notification, NotificationPreference, WhatsAppMessage |
| Audit/Platform | AuditEvent, SupportTicket, Dispute, PlatformSetting, FeatureFlag, AnalyticsEvent, OutboxEvent |

---

## 7. Global Product vs Country Product vs Market Offer

```
GLOBAL PRODUCT                    COUNTRY PRODUCT                 MARKET OFFER
Paracetamol 500mg ───────────────► AO: Paracetamol 500mg ───────► Farmácia X: 2 500 Kz, stock 48
  DCI: paracetamol                 registo local, classificação   Farmácia Y: 2 700 Kz, stock 12
  dosagem, forma, fabricante       preço de referência,
  identificadores globais          regra de receita
```

Regra: identidade global do produto nunca se mistura com regras/preços locais.

---

## 8. Segurança por defeito (arquitectural)

| Ameaça | Controlo |
|--------|----------|
| Cross-tenant IDOR | `organizationId` obrigatório + `x-organization-id` validado contra membership |
| Cross-market leak | `marketCode` obrigatório; produto/regra só visível no seu mercado |
| Rotas oRPC sem auth | Middleware auth + RBAC por defeito (routeRoles) |
| Upload abusivo | 10MB máx + MIME whitelist (pdf, png, jpeg, webp) + signed URLs |
| Secrets em código | dotenvx + `.refine()` rejeita placeholders |
| DoS / brute force | Helmet + Throttler (Redis) + rate limits por rota |
| XSS / CSRF | Headers (CSP, HSTS, XFO, XCTO, Referrer-Policy) + cookies SameSite=Strict |
| Passwords fracos | Scrypt N=32768, maxmem 128MB (OWASP) + MFA TOTP |
| Dados de pagamento | Nunca no Brócolis; delegado à FinPay (PCI-DSS) |
| Sessão roubada | Sessão server-side, idle timeout 30min, revogação |
| Erros de health leak | Health endpoint sanitizado |

---

## 9. Padrões Arquitecturais Avançados

### 9.1 Event Sourcing (domínios críticos)

Para domínios onde o histórico completo é crítico (Orders, Payments), usar Event Sourcing:

```ts
// packages/contracts/src/events.ts
export const orderEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ORDER_CREATED'),
    aggregateId: z.string(),
    payload: z.object({ order: orderSchema }),
    timestamp: z.date(),
    version: z.number(),
  }),
  z.object({
    type: z.literal('ORDER_PAYMENT_CONFIRMED'),
    aggregateId: z.string(),
    payload: z.object({ paymentId: z.string(), amount: z.number() }),
    timestamp: z.date(),
    version: z.number(),
  }),
  z.object({
    type: z.literal('ORDER_STATUS_CHANGED'),
    aggregateId: z.string(),
    payload: z.object({ from: orderStatusSchema, to: orderStatusSchema }),
    timestamp: z.date(),
    version: z.number(),
  }),
]);
```

**Quando usar Event Sourcing:**
- Orders (histórico completo de estados)
- Payments (audit trail obrigatório)
- Prescriptions (rastreabilidade de validação)
- AuditEvent (já append-only por design)

**Quando NÃO usar:**
- Catalog (dados derivados, recriáveis)
- Settings (configuração simples)
- Sessions (dados temporários)

### 9.2 CQRS (Command Query Responsibility Segregation)

Separar writes (commands) de reads (queries) para portais read-heavy:

```
PHARMACY PORTAL
    │
    ├── Commands (writes)
    │   ├── UpdateOrderStatus
    │   ├── AddInventoryItem
    │   └── ProcessPayment
    │
    └── Queries (reads)
        ├── Dashboard KPIs (cache 30s)
        ├── Order list (paginated, filtered)
        └── Inventory report (aggregated)
```

**Implementação:**
```ts
// Command handler
@Injectable()
export class UpdateOrderStatusHandler {
  async execute(command: UpdateOrderStatusCommand): Promise<void> {
    // 1. Validar estado anterior
    // 2. Aplicar regra de negócio
    // 3. Registar evento
    // 4. Projectar para read model
    await this.eventStore.append(new OrderStatusChangedEvent(command));
    await this.readModel.update(command.orderId, command.newStatus);
  }
}

// Query handler (cacheável)
@Injectable()
export class GetDashboardQueryHandler {
  async execute(query: GetDashboardQuery): Promise<Dashboard> {
    // Cache 30s — dados read-only
    return this.cache.getOrSet(`dashboard:${query.orgId}`, async () => {
      return this.readModel.getDashboard(query.orgId);
    }, 30_000);
  }
}
```

### 9.3 Saga Pattern (checkout cross-service)

Coordenar transações distribuídas entre Order, Payment, Delivery:

```
CHECKOUT SAGA
    │
    ├── Step 1: Criar Order (PENDING)
    │   └── Success → Step 2
    │   └── Failure → Compensar (cancelar reservation)
    │
    ├── Step 2: Criar PaymentIntent (FinPay)
    │   └── Success → Step 3
    │   └── Failure → Compensar (cancelar Order)
    │
    ├── Step 3: Reservar Stock
    │   └── Success → Step 4
    │   └── Failure → Compensar (cancelar Payment + Order)
    │
    └── Step 4: Registar Prescription (se aplicável)
        └── Success → DONE (ORDER_CONFIRMED)
        └── Failure → Compensar (libertar Stock + cancelar Payment + Order)
```

```ts
// Saga orchestrator
@Injectable()
export class CheckoutSaga {
  async execute(cart: Cart): Promise<Order> {
    const saga = new SagaBuilder()
      .step('createOrder', () => this.orderService.create(cart))
      .compensate('cancelOrder', (ctx) => this.orderService.cancel(ctx.orderId))
      .step('createPayment', (ctx) => this.paymentService.createIntent(ctx.order))
      .compensate('cancelPayment', (ctx) => this.paymentService.cancelIntent(ctx.paymentId))
      .step('reserveStock', (ctx) => this.inventoryService.reserve(ctx.order))
      .compensate('releaseStock', (ctx) => this.inventoryService.release(ctx.orderId))
      .step('processPrescription', (ctx) => this.prescriptionService.validate(ctx.order))
      .compensate('cancelPrescription', (ctx) => this.prescriptionService.cancel(ctx.prescriptionId))
      .build();

    return saga.execute();
  }
}
```

### 9.4 Circuit Breaker (chamadas FinPay)

Prevenir cascata de falhas quando a FinPay está indisponível:

```ts
// packages/finpay/src/circuit-breaker.ts
@Injectable()
export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 30_000, // 30s
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitBreakerOpenException('FinPay circuit is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### 9.5 Retry Policy (configurável)

```ts
// packages/common/src/retry.ts
export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 30_000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < cfg.maxRetries) {
        const delay = Math.min(
          cfg.backoffMs * Math.pow(cfg.backoffMultiplier, attempt),
          cfg.maxBackoffMs,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}
```
