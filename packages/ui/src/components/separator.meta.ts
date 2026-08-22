export const meta = {
  category: "atom" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Dividor visual entre secções ou itens (timeline de pedido, listas de cartão).",
  variants: ["horizontal", "vertical"],
  props: {
    orientation: "horizontal | vertical",
    decorative: "boolean (true por defeito — sem role separador)",
  },
  relationships: ["order-timeline", "cart-summary", "card", "list"],
  tokens: {
    border: "color.border.default",
  },
  antiPatterns: [
    "usar Separator para criar espaçamento (usar tokens de space)",
    "decorative=false sem aria semantics correctas",
  ],
  accessibility: {
    keyboard: "n/a",
    focus: "n/a",
    semantics: "não-semântico por defeito (decorative)",
  },
} as const;
