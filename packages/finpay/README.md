# @brocolis/finpay

Adapter para integração com a **FinPay** (processadora de pagamentos).

## Implementações

| Adapter | Descrição |
|---------|-----------|
| `FinPayMockProvider` | Mock local para dev/test |
| `HttpFinPayAdapter` | Cliente HTTP para FinPay real |

## Uso

```ts
import { HttpFinPayAdapter } from "@brocolis/finpay";

const adapter = new HttpFinPayAdapter({
  baseUrl: process.env.FINPAY_API_URL,
  apiKey: process.env.FINPAY_API_KEY,
});

const intent = await adapter.createIntent({
  orderId: "order_123",
  amountMinor: 5000,
  currency: "AOA",
  paymentMethod: "CARD",
  organizationId: "org_123",
  marketCode: "AO",
  idempotencyKey: "order_123",
});
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `FINPAY_API_URL` | Não | URL base da FinPay. Se ausente, usa mock |
| `FINPAY_API_KEY` | Não | API key para autenticação |
