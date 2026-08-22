export const meta = {
  category: "provider" as const,
  models: ["b2b", "b2b2c"] as const,
  purpose:
    "Prove QueryClient e Toaster para o portal de aquisições B2B, isolando o cache de queries entre sessões.",
  variants: ["default"],
  props: {
    children: "ReactNode — árvore de componentes do portal",
  },
  relationships: [
    "supplier-list",
    "supplier-detail",
    "rfq-list",
    "purchase-order-list",
  ],
  tokens: {
    background: "components.card.bg",
  },
  antiPatterns: [
    "usar PortalProviders fora do layout do portal",
    "instanciar QueryClient fora de useMemo",
  ],
  accessibility: {
    keyboard: "n/a (provider)",
    focus: "n/a",
    semantics: "n/a",
  },
} as const;
