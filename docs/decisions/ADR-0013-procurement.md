# ADR-0013: Procurement B2B — RFQ, Cotações e Ordens de Compra

- **Estado:** Aceite
- **Data:** 2026-08-21
- **Fase:** F4 (v1.5)

## Contexto

O marketplace farmacêutico precisa de suportar o fluxo B2B completo: fornecedores
publicam catálogo e preços por tier, empresas enviam RFQs, fornecedores submetem
cotações, e a plataforma gere ordens de compra com aprovação multi-nível e crédito.

## Decisão

### Fluxo RFQ → Quotation → PurchaseOrder

1. **RFQ (Request for Quotation):** A empresa cria um pedido de cotação para um
   fornecedor com subject, validade e notas. Estado inicial: `DRAFT` → `OPEN`.
2. **Quotation:** O fornecedor submete uma cotação com itens (productId, qty,
   unitPrice). A empresa aceita ou rejeita. Estado: `DRAFT` → `SUBMITTED` →
   `ACCEPTED|REJECTED`.
3. **PurchaseOrder:** Gerada a partir de uma cotação aceite. Estado:
   `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `CONFIRMED` → `IN_DELIVERY` →
   `DELIVERED` → `COMPLETED`.

### Aprovação Multi-nível

- Cada PurchaseOrder pode ter múltiplos `ApprovalWorkflow` records.
- Cada aprovação tem `level`, `approverId` e `status`.
- PO só avança para `CONFIRMED` quando todas as aprovações estão `APPROVED`.

### Crédito

- `CreditAccount` por organização+fornecedor com `creditLimitMinor` e
  `balanceMinor`.
- Antes de confirmar PO, verificar disponibilidade via `CreditService.check()`.
- Débito automático ao confirmar PO, crédito ao entregar.

### Preços por Tier e Volume

- `PriceTier`: preço unitário por faixa de quantidade (minQty, maxQty).
- `VolumePrice`: desconto em basis points por volume mínimo.
- Cálculo: seleciona tier aplicável, aplica desconto de volume se elegível.

## Schema

Novos modelos Prisma (append ao final do schema):
- `Supplier`, `Rfq`, `Quotation`, `PurchaseOrder`, `PurchaseOrderItem`
- `ApprovalWorkflow`, `CreditAccount`, `PriceTier`, `VolumePrice`

Enums: `RfqStatus`, `QuotationStatus`, `PoStatus`, `ApprovalStatus`,
`CreditStatus`, `SupplierStatus`.

## Contracts

- `@brocolis/contracts/procurement`: schemas de RFQ, Quotation, PO, Approval
- `@brocolis/contracts/pricing`: schemas de PriceTier, VolumePrice, Credit

## API

Módulo NestJS `ProcurementModule` com controllers REST e services em memória
(consistente com padrão F2 Orders).

## Consequências

- Fluxo B2B completo em阶层 separados (RFQ → Quote → PO → Approval → Credit).
- Aprovação multi-nível suporta governance empresarial.
- Crédito integrado impede overcommit.
- Preços por tier suportam negociação B2B.
- Portais Supplier e Business no web com i18n completo.
