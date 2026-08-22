# Pharmacy, Inventory & Dispensing (Fase 3)

Documentação de módulo do backend — bounded contexts **Inventory**
(`inventory`), **Prescriptions & Dispensing** (`dispensing`,
`dispensing/prescription.service.ts`) e **Pharmacy Operations & Settlement**
(`pharmacy`, `settlements`). Ver também `ADR-0012-pharmacy-f3.md` e
`07-FINPAY-INTEGRATION.md` (payouts/refunds).

## Contratos (`@brocolis/contracts`)

| Ficheiro | Conteúdo |
|----------|----------|
| `src/inventory.ts` | `stockMovementTypeSchema`, `inventoryAlertTypeSchema`, `inventoryAlertThresholdsSchema`, `inventoryItemSchema`, `batchSchema`, `stockMovementSchema`, `inventoryAlertSchema`, `receiveBatchInputSchema`, `adjustStockInputSchema`, `searchInventoryInputSchema` |
| `src/prescription.ts` | `prescriptionStatusSchema` (PENDING→RESPONSE_REQUIRED→APPROVED/REJECTED/EXPIRED), `prescriptionAttachmentSchema`, `prescriptionSchema`, `uploadPrescriptionInputSchema`, `respondPrescriptionInputSchema`, `dispensePrescriptionInputSchema` |
| `src/pharmacy.ts` | `pharmacistSchema`, `pharmacyVerificationStatusSchema`, `verifyPharmacyInputSchema`, `settlementStatusSchema`, `pharmacySettlementSchema`, `createSettlementInputSchema`, `refundStatusSchema`, `refundSchema`, `createRefundInputSchema` |

Regras F-consistentes com F1/F2: `organizationId` + `marketCode` obrigatórios
em todo input scoped; montantes em **minor units** Int (zero floats); `z.infer`
para tipos; IDs de domínio **cuid** gerados via `apps/api/src/cuid.ts`.

## Schema (`@brocolis/db/prisma/schema.prisma`)

Modelos F3: `InventoryItem`, `Batch`, `StockMovement`, `InventoryAlert`,
`PharmacyVerification`, `PharmacySettlement`, `Refund`
(+ `CommissionRate` quando wireado). Todos `@@map("snake_case")`, montantes em
`*Minor` (Int). `StockMovement` com `type` enum (RECEIPT/ADJUSTMENT/DISPENSE/
REFUND/RESERVATION/RELEASE) e `batchId` opcional para FIFO por lote;
`InventoryAlert` por tipo LOW/CRITICAL/EXPIRING/EXPIRED.

## Serviços (`apps/api/src`)

| Módulo | Responsabilidade |
|--------|------------------|
| `inventory` | `InventoryService`: receber lotes (receiveBatch), movimentos de stock com reserva (DISPENSE) e ajuste (ADJUSTMENT), FIFO por `Batch.remainingQty`, alertas de nível (LOW/CRITICAL) e expiração (EXPIRING/EXPIRED) |
| `dispensing` | `PrescriptionService` (upload de receita até 4 ficheiros, approve/reject com notas, expiração) + `DispensingService` (validar prescrição exigida → reservar stock → emitir dispense; escopo tenant+mercado) |
| `pharmacy` | `PharmacyService`: verificação de farmácia (`verifyPharmacyInputSchema`) com estados VERIFIED/PREMIUM_VERIFIED/PENDING_VERIFICATION/SUSPENDED e documentUrls |
| `settlements` | `SettlementsService`: settlement semanal (RF-104) — agrega ordens DELIVERED do período por farmácia, `computeWeeklySettlement` (gross, comissão em bps, reserva de N dias, net, em minor units), persistência `PharmacySettlement` e payout via FinPay quando o adapter expõe `payout` |

### Settlement (RF-104)

- Comissão default **500 bps (5%)** `DEFAULT_COMMISSION_RATE_BPS` (07-FINPAY §5),
  configurável por organização+mercado via `setCommissionRate` (0..10000 bps).
- Reserva de caixa de **7 dias** `DEFAULT_RESERVE_DAYS`: ordens entregues há
  menos de N dias ficam em `reserveMinor` (não entram no payout imediato).
- `computeWeeklySettlement` é pura (injectável `now`) — testável em isolamento.
- Payout: se o adapter FinPay expuser `payout()`, chama com
  `{ settlementId, pharmacyId, amountMinor, currency: 'AOA', organizationId,
    marketCode }`; ref devolvida prefixa `payout_` → status **PAID**, caso
  contrário `pending_` → status **PENDING**.
- Auditoria (rule 7): cada `settlement.computed` emite `AuditEvent` via
  `@brocolis/db` (guardada em memória enquanto o DB não está wired) e fica
  visível em `settlements.auditEvents()`.

## FinPay — refunds

`createRefundInputSchema` + `refundSchema` em `pharmacy.ts`; o adapter FinPay
expõe `refund(intentId)` (apenas intents CONFIRMED → REFUNDED). A verdade do
fluxo de pagamento/estorno continua em `@brocolis/finpay` (ADR-0008) — os
serviços F3 nunca falam com outra processadora.

## Testes

- `apps/api/src/inventory/inventory.service.test.ts` — receção de lote, FIFO,
  reserva/dispense, alertas.
- `apps/api/src/dispensing/dispensing.service.test.ts` (+ `prescription.service.test.ts`)
  — fluxo receita→response→dispense e expedição com stock.
- `apps/api/src/settlements/settlements.service.test.ts` — cálculo semanal,
  reserva, payout, scoping tenant/market, validação da taxa e audit trail.

> Nota: os testes aguardam a instalação das deps do monorepo (bloqueio dos
> tarballs nativos) para correr sob `vitest`; o código é dependency-safe.

## Dependências de fase

Bonificado na F3: `@nestjs/common` (exceptions), `@brocolis/contracts`,
`@brocolis/finpay`. Sem SDK de processadora (rule 8).