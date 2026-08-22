export const meta = {
  name: "ProductCard",
  description:
    "Card displaying a market offer with product info, price, pharmacy, and add-to-cart action",
  models: ["b2c"],
  pillars: {
    accessibility: "Semantic role=button, accessibilityLabel with name+price",
    composition:
      "ProductCard composes Card, Badge (Rx), PharmacyBadge, formatCurrency",
    responsiveness: "Flex layout, numberOfLines truncation, flexible width",
    testability:
      "Data-driven via MarketOffer prop, deterministic price formatting",
  },
} as const;
