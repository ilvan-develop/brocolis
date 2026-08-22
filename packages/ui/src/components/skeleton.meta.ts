export const meta = {
  category: "atom" as const,
  models: ["b2c", "b2b", "b2b2c"] as const,
  purpose:
    "Placeholder de carregamento para conteúdo em redes lentas (3G/4G) — conectividade-aware.",
  variants: ["default"],
  props: {
    className: "dimensões do placeholder",
  },
  relationships: ["product-card", "pharmacy-card", "catalog", "search"],
  tokens: {
    background: "color.surface.muted",
  },
  antiPatterns: [
    "usar Skeleton em conteúdo já carregado",
    "animações pesadas (low bandwidth)",
    "sem fallback para erro (retry)",
  ],
  accessibility: {
    keyboard: "n/a",
    focus: "n/a",
    semantics: "aria-busy=true quando parte de um contentor em carregamento",
  },
} as const;
