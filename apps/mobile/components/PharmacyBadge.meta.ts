export const meta = {
  name: "PharmacyBadge",
  description: "Displays pharmacy name with optional verified badge indicator",
  models: ["b2c"],
  pillars: {
    accessibility: "Plain text with visual checkmark for verification",
    composition:
      "PharmacyBadge is standalone, used inside ProductCard and ProductDetail",
    responsiveness: "numberOfLines=1 truncation for long names",
    testability: "Controlled via name and verified boolean props",
  },
} as const;
