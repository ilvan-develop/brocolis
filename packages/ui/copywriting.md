# Copywriting pt-AO — voz e tom

> Fixa a voz do produto. Texto NUNCA dentro de componentes; sempre via `t()` (`@brocolis/i18n`).

## Regras

- **Português de Angola primeiro** — evitar anglicismos e brasileirismos não naturais em Angola.
- Frases curtas, acção clara, tom humano e profissional (saúde × comércio × tech).
- Estados de erro/sistema: informativos, nunca técnicos ("Algo correu mal. Tente novamente.").
- Estados de confiança sempre explícitos: "Farmácia verificada", "Disponível", "Entregue".

## Glossário obrigatório

| ❌ Evitar | ✅ Usar |
|-----------|---------|
| Checkout | Finalizar pedido |
| Shipping | Entrega |
| Order | Pedido |
| Cart | Carrinho |
| Out of stock | Sem stock |
| Available | Disponível |
| Price | Preço |
| Add to cart / Add | Adicionar |
| Order summary | Resumo do pedido |
| Low stock | Stock baixo |
| Order status | Estado do pedido |
| Chat/Support | Falar com suporte |

## Estados de pedido

- **Preparando pedido** · **Em trânsito** · **Entregue**

## Estados de conectividade (blueprint §20)

- ⚠️ **Sem conexão** — "Algumas informações podem estar desatualizadas."
- 🟡 **A sincronizar...** — "Pedido guardado localmente"
- `[ Tentar novamente ]` — sempre com retry visível

## Moeda

- Nunca escreva o símbolo da moeda no texto; use `@brocolis/formatters` (`formatCurrency`).

## Farmácia & stock

- "Farmácia verificada" (nível de confiança)
- "Disponível" / "Sem stock" — estados de produto
- "Falar com suporte via WhatsApp" — canal de produto, não um link genérico