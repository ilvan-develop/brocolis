export const meta = {
  category: "atom" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Dispara a acção primária de um fluxo (adicionar ao carrinho, finalizar pedido, submeter receita).",
  variants: ["default", "destructive", "outline", "secondary", "ghost", "link"],
  props: {
    variant: "default | destructive | outline | secondary | ghost | link",
    size: "default | sm | lg | icon",
    asChild: "boolean — compõe dentro de Slot (Link, a)",
  },
  relationships: ["product-card", "cart", "checkout", "forms", "pharmacy-card"],
  tokens: {
    background: "color.action.primary.bg",
    hover: "color.action.primary.hover",
    text: "color.text.on-primary",
  },
  antiPatterns: [
    "criar 12 variantes de botão (4 semânticas bastam)",
    "hardcode de cor (hex cru)",
    "texto de botão hardcoded (usar t())",
  ],
  accessibility: {
    keyboard: "Enter/Space",
    focus: "focus-visible ring via token --ring; nunca remover",
    touch: "target ≥44×44 px",
  },
} as const;
