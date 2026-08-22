# 07 — FinPay Integration (Trilho de Pagamento)

> Aplica-se à **Fase 2** (B2C) e evolui em F3 (settlements), F4 (procurement) e F6 (B2B2C). Define como o Brócolis é **tenant da FinPay**: cria `PaymentIntent`, acompanha a validação e consome webhooks HMAC. **Sem Stripe. Nunca.**

---

## 1. Modelo de integração

O Brócolis **não processa pagamentos**. A FinPay é a processadora angolana nativa (money movement, OCR de comprovativos, compliance, fraude, trust score, ledger AGT/SAF-T). O Brócolis é um **tenant** da FinPay.

```
apps/mobile / apps/web
        │  oRPC (contratos Brócolis)
        ▼
apps/api (orders, checkout)
        │  @brocolis/finpay (FinPayAdapter)
        ▼
    FinPay  (PaymentIntent → validação → decisão)
        │  webhook HMAC (evento)
        ▼
apps/api (PaymentStatusHistory, Order update, Settlement)
```

> A superfície pública da FinPay (REST `/v1/` com API keys e webhooks HMAC) é consumida via `@brocolis/finpay`. Enquanto a FinPay v2 não publicar a F4 (Dev platform), o Brócolis roda com **`FinPayMockProvider`** em dev/test — o contrato do adapter nunca muda.

---

## 2. Fluxo canónico (checkout B2C)

```
1. Checkout (Brócolis)
   Order criado (PENDING) + Receita validada (se aplicável)
        │
        ▼
2. FinPayAdapter.createIntent({
     organizationId, marketCode: "AO",
     customerId, orderId,
     controlAmount: 12500,      // string Decimal(18,2), nunca float
     currency: "AOA",
     paymentMethod: "multicaixa",  // do Market AO
     expiresAt
   })
        │  PaymentIntentId retornado
        ▼
3. Brócolis guarda payment.finpayIntentId; Payment PENDING
        │
        ▼
4. Cliente paga (Multicaixa/TPA/transferência/referência)
   OU faz upload de comprovativo na UI do Brócolis
        │
        ▼
5. FinPay: evidência → OCR → compliance → fraude → trust → decisão
        │
        ▼
6. Webhook FinPay → Brócolis verifica HMAC
   payment.intent.status → PENDING/PROCESSING/CONFIRMED/EXPIRED/DECLINED
        │
        ▼
7. CONFIRMED → Order PROCEEDING → farmácia prepara entrega
   DECLINED/EXPIRED → Order devolve carrinho; notifica cliente
        │
        ▼
8. AuditEvent + PaymentStatusHistory na mesma $transaction
```

### Estados de pagamento (mapeamento Brócolis)

```
PENDING      intent criado
PROCESSING   validação FinPay em curso
CONFIRMED    decisão aprovada → pedido avança
EXPIRED      não pago no prazo
DECLINED     recusado/rejeitado
REFUNDED     reembolsado (RF-103)
```

---

## 3. `@brocolis/finpay` — contrato do adapter

### Interface

```ts
// packages/finpay/src/types.ts
export interface FinPayAdapter {
  createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
  getIntent(intentId: string): Promise<FinPayIntent | null>;
  listIntents(filter: ListIntentsInput): Promise<Paginated<FinPayIntent>>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(req: WebhookRequest): Promise<WebhookPayload>;
}
```

### Implementações

| Provider | Quando | Notas |
|----------|--------|-------|
| `FinPayMockProvider` | dev / test / CI | Determinístico; estados configuráveis; gera webhook localmente |
| `FinPayLiveProvider` | staging / prod | Chama `FINPAY_API_URL` com `FINPAY_API_KEY`; verifica HMAC real |

Selecção por env: `FINPAY_MODE=mock|live`. Injeção via `@nestjs/config` → `FinPayService`.

### Exemplo de criação (B2C)

```ts
const result = await finpayAdapter.createIntent({
  organizationId: order.organizationId,
  marketCode: "AO",
  customerId: order.customerId,
  orderId: order.id,
  controlAmount: "12500.00",     // string; nunca float
  currency: "AOA",
  paymentMethod: "multicaixa",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  idempotencyKey: `order_${order.id}`,   // RF-64
});
```

---

## 4. Webhooks (HMAC + retry + dead-letter)

### Regras

1. **Verificar HMAC** sempre (SHA-256 com `FINPAY_WEBHOOK_SECRET`); assinatura inválida → 401 e nunca processar.
2. `WebhookEndpoint` no Brócolis: `POST /webhooks/finpay`.
3. Processar com **idempotência** pelo `event.id` (nunca duplicar status).
4. Falha → retry exponencial (3 tentativas) via BullMQ → dead-letter.
5. Cada evento actualiza `PaymentStatusHistory` + `AuditEvent` na mesma `$transaction`.
6. `FinpayWebhookLog` guarda raw + resultado (auditoria).

### Eventos consumidos

```
payment.intent.created
payment.intent.status   (PROCESSING / CONFIRMED / EXPIRED / DECLINED)
payment.refund.completed
settlement.created      (settlements semanais)
```

### Fluxo de retry

```
Webhook recebido → verify HMAC → enfileira job
   → processa → sucesso: ACK
   → falha: retry com backoff (3x) → dead-letter → alerta Sentry/email
```

---

## 5. Settlements (farmácias)

| Regra | Valor |
|-------|-------|
| Frequência | Semanal |
| Reserva | 7 dias após pagamento confirmado |
| Comissão | 5% (configurável por tenant em `CommissionRate`) |
| Ledger | Ledger da FinPay (AGT/SAF-T) + `PharmacySettlement` no Brócolis |
| Trigger | `settlement.created` webhook da FinPay |

```
Pagamentos CONFIRMED da semana → deduz comissão → settlement à farmácia via FinPay
→ PharmacySettlement (total, comissão, líquido, status) → notificação à farmácia
```

---

## 6. Refunds

- Devolução (RF-73) → `finpayAdapter.refund({ intentId, amount, reason })`.
- `payment.refund.completed` → `Payment REFUNDED`, `Order` actualizado, `AuditEvent`.
- Refund apenas em intents `CONFIRMED`.

---

## 7. Pagamentos Angola (Market AO)

Os métodos de pagamento vêm do Market Pack, **nunca hardcoded**:

```ts
payments.methods // AO → multicaixa, tpa, bank-transfer, reference, cash-on-delivery
```

| Método | Tipo | Fluxo FinPay |
|--------|------|--------------|
| Multicaixa | referência | intent + comprovativo/referência |
| TPA | POS | confirmação via terminal; intent associado |
| Transferência bancária | bank | comprovativo → OCR FinPay |
| Dinheiro na entrega | COD | sem intent; pagamento registado na entrega |

> Regra de segurança: o Brócolis nunca vê dados de cartão. PCI-DSS é da FinPay.

---

## 8. Procurement B2B (crédito) e B2B2C

- **B2B (procurement)**: faturas podem ser saldadas via intent FinPay ou crédito da organização (`CreditAccount`); crédito pago → intent da FinPay.
- **B2B2C**: o pagamento do consumidor flui até à farmácia; a farmácia paga o fornecedor via **PO** e, no settlement, a comissão da plataforma é deduzida antes do crédito ao fornecedor.

```
Consumidor → FinPay (CONFIRMED) → Farmácia
Farmácia → FinPay (PO / crédito) → Distribuidor
Plataforma → comissão deduzida no settlement
```

---

## 9. Configuração (env)

```
FINPAY_MODE=mock            # mock | live
FINPAY_API_URL=https://api.finpay.ao
FINPAY_API_KEY=<secreto>    # só em live
FINPAY_WEBHOOK_SECRET=<secreto>
FINPAY_RETRY_MAX=3
FINPAY_RETRY_BACKOFF_MS=5000
```

> `.refine()` rejeita `FINPAY_API_KEY`/`FINPAY_WEBHOOK_SECRET` se forem placeholders em live.

---

## 10. Testes

| Nível | Cobre |
|-------|-------|
| Unit | `FinPayAdapter` (mock/live), HMAC verify, idempotência por event.id |
| Integração | checkout → createIntent (mock) → webhook CONFIRMED → order avança; retry → dead-letter |
| Integração | settlement semanal com comissão e reserva |
| Contrato | `@brocolis/finpay` contracts ↔ `FinPayMockProvider` (drift) |
| E2E | pagamento B2C via mock → status CONFIRMED na UI |

> **Gate da Fase 2**: E2E checkout → pagamento (mock FinPay) → pedido CONFIRMED → entrega. A FinPay real é exercitada apenas em staging quando a F4 dela existir.

---

## 11. Anti-patterns (proibidos)

| Anti-pattern | Correto |
|--------------|---------|
| Stripe/outro gateway no Brócolis | `@brocolis/finpay` |
| `fetch` directo à FinPay espalhado | Adapter único + mock |
| Webhook sem verificação HMAC | Sempre verificar |
| Montante float | `Decimal`/string no contrato |
| Estado de pagamento manual | `PaymentStatusHistory` + webhook |
| Sem idempotência de webhook | `event.id` dedup |
| Testes contra FinPay real | `FinPayMockProvider` |
