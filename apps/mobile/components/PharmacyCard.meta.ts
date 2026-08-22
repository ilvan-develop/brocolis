export const meta = {
  name: "PharmacyCard",
  description:
    "Horizontal card showing pharmacy name, verification status, and delivery fee",
  models: ["b2c"],
  pillars: {
    accessibility:
      "Semantic role=button, accessibilityLabel with name and verified status",
    composition: "PharmacyCard composes cn utility, t() for i18n",
    responsiveness:
      "Fixed width 36 (w-36) horizontal scroll item, numberOfLines truncation",
    testability: "Data-driven via pharmacy prop, deterministic rendering",
  },
} as const;
