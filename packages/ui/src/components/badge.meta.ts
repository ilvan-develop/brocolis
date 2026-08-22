export const meta = {
  category: "atom" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Etiqueta de estado/atributo de curta duração (Farmácia verificada, Promoção, Disponível).",
  variants: ["default", "secondary", "destructive", "outline"],
  props: {
    variant: "default | secondary | destructive | outline",
    asChild: "boolean — compõe dentro de Slot",
  },
  relationships: [
    "pharmacy-card",
    "product-card",
    "order-timeline",
    "payment-status",
  ],
  tokens: {
    background: "color.action.primary.bg",
    success: "color.status.success",
    text: "color.text.on-primary",
  },
  antiPatterns: [
    "usar Badge para acções (Badge é informação, não interacção)",
    "hardcode de cor",
    "texto hardcoded (usar t())",
  ],
  accessibility: {
    keyboard: "não interativo (não focusable)",
    focus: "n/a",
  },
} as const;
