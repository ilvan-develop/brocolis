export const meta = {
  category: "molecule" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Alterna painéis relacionados (estados de pedido, entrega, catálogo) sem navegação.",
  variants: ["default"],
  props: {
    defaultValue: "tab activo inicial (uncontrolled)",
    value: "tab activo controlado",
    onValueChange: "(value: string) => void",
  },
  relationships: [
    "order-status",
    "product-detail",
    "account",
    "pharmacy-profile",
  ],
  tokens: {
    active: "color.surface.background",
    list: "color.surface.muted",
  },
  antiPatterns: [
    "usar Tabs para navegação de rotas (usar routing)",
    "mais de 5 tabs sem scroll",
    "texto de tab hardcoded (usar t())",
  ],
  accessibility: {
    keyboard: "setas ←/→ e Home/End entre tabs; Tab entra no painel",
    focus: "tab activo com ring visível",
    semantics: "role=tablist / tab / aria-selected / tabpanel",
  },
} as const;
