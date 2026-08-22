# ADR-0008: Pagamentos exclusivamente via FinPay

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

Marketplace farmacêutico angolano precisa de pagamentos nativos (Multicaixa, TPA…).

## Decisão

`@brocolis/finpay` é o único adapter (createIntent/getIntent/refund), com
`FinPayMockProvider` para dev/test. **Proibido** instalar `stripe` ou outra SDK.
Card de pagamento nunca chega aos nossos servidores (delegado à FinPay, PCI-DSS).

## Consequências

Guard fitness-check nega SDKs de processadora no lockfile; webhooks HMAC
validados na F2.