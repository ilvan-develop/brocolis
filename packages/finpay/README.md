# @brocolis/finpay

`FinPayAdapter` (createIntent/getIntent/refund) + `FinPayMockProvider` + webhook verifier.

O Brócolis é tenant da FinPay: cria `PaymentIntent`, acompanha a validação e
consome webhooks HMAC. **Nunca instalar Stripe nem SDK de outra processadora**
(07-FINPAY-INTEGRATION.md). Dev/test sempre com o mock.