export const meta = {
  category: "molecule" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Contém um agrupamento de conteúdo (produto, farmácia, resumo do pedido) com header/descrição/footer.",
  variants: ["default"],
  props: {
    content: "ReactNode — corpo do cartão",
    footer: "ReactNode — acções do cartão",
    title: "ReactNode — título do cartão",
  },
  relationships: [
    "product-card",
    "pharmacy-card",
    "cart-summary",
    "order-card",
  ],
  tokens: {
    background: "components.card.bg",
    border: "components.card.border",
  },
  antiPatterns: [
    "usar Card para paginações inteiras",
    "cores hardcoded por variante de portal",
    "texto hardcoded no conteúdo (usar t())",
  ],
  accessibility: {
    keyboard: "n/a (contentor)",
    focus: "n/a",
    semantics: "usar headings reais (CardTitle) para estrutura",
  },
} as const;
