# ADR-0012: Pharmacy F3 — inventory rigoroso, dispensação e settlements em minor units

- **Estado:** Aceite
- **Data:** 2026-08-20
- **Fase:** F3 — Pharmacy Operations (09-ROADMAP-FASES.md)

## Contexto

O marketplace farmacêutico exige rigor sobre stock (validade de lotes,
alerta de expiração), dispensação com receita obrigatória e liquidação
semanal por farmácia, tudo escoped por `organizationId` + `marketCode` e em
minor units de moeda, sem floats (regras 3 e 10-BEST-PRACTICES #2).

## Decisão

1. **Contracts-first (rule 2):** `inventory.ts`, `prescription.ts`,
   `pharmacy.ts` em `@brocolis/contracts`, todos com scoping
   tenant+mercado, montantes `Int` **minor units**, tipagem `z.infer`,
   IDs **cuid** via `apps/api/src/cuid.ts` (`c` + 24 hex).
2. **Inventário com lotes FIFO:** `InventoryService` opera por
   `Batch.remainingQty` (FIFO por validade); `StockMovement` tem `type` enum
   (RECEIPT/ADJUSTMENT/DISPENSE/REFUND/RESERVATION/RELEASE) e `batchId`
   opcional. Alertas `InventoryAlert` por LOW/CRITICAL/EXPIRING/EXPIRED,
   com limiares configuráveis (`inventoryAlertThresholdsSchema`).
3. **Receita como gate de dispensação:** `PrescriptionService` regista
   upload (máx. 4 ficheiros por receita) e approve/reject com notas;
   `DispensingService` só dispensa produto `requiresPrescription` com receita
   aprovada e stock disponível (reserva → dispense).
4. **Verificação de farmácia:** estados VERIFIED/PREMIUM_VERIFIED/
   PENDING_VERIFICATION/SUSPENDED via `verifyPharmacyInputSchema` +
   `documentUrls` de validação.
5. **Settlement semanal (RF-104) com reserva e comissão claras:**
   - `computeWeeklySettlement` pura: gross = soma de ordens DELIVERED do
     período com pagamento vencido; comissão = `gross * rate_bps / 10000`
     (default **500 bps**, configurável por org+mercado 0..10000);
     `netMinor = gross - commissionMinor`.
   - Reserva de caixa de **7 dias**: pagamentos recentes ficam em
     `reserveMinor` e não entram no payout imediato.
   - Payout via FinPay quando o adapter expuser `payout()`; sem payout,
     `pending_` e status **PENDING**.
6. **Auditoria (rule 7):** `settlement.computed` emite `AuditEvent` na mesma
   transação (guardada em memória enquanto o DB não está wired) e exposta via
   `settlements.auditEvents()`.
7. **FinPay única (rule 8):** refunds via `FinPayAdapter.refund(intentId)`;
   nunca SDKs de terceiros.

## Alternativas

- `Decimal(18,2)` para valores de settlement (blueprint §6): descartado —
  minor units ints eliminam erros de arredondamento e são coerentes com F2.
- Payout inline no serviço de checkouts (F2): descartado — settlement é
  ciclo temporal seu (semanal), requer separação do contexto Payments.
- Persistência Prisma imediata: adiada pelo bloqueio de instalação — mantém-se
  o padrão de serviços em memória com `@brocolis/db` como proxy único (AP-01).

## Consequências

- Positivo: F3 testável offline (matemática pura), contratos + schema servem
  de fonte da verdade para web/mobile/qa; cobrem AGT/SAF-T (audit trail) e
  regras farmacêuticas (expiração/stock) desde o schema (regra 9).
- Negativo: reserva de cash-flow de 7 dias é opção de negócio fixa em
  `DEFAULT_RESERVE_DAYS`; ajuste futuro via `setReserveDays` sem breaking.
- Risco: lotes sem `batchId` em `StockMovement` quebram o FIFO por validade —
  mitigado mantendo `batchId` obrigatório nos fluxos de dispense.