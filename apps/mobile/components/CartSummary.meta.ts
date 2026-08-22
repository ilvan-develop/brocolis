export const meta = {
  name: "CartSummary",
  description:
    "Order summary showing subtotal, delivery fee, VAT, and total in a bordered card",
  models: ["b2c"],
  pillars: {
    accessibility: "Clear label/value pairs in View rows",
    composition:
      "CartSummary composes formatCurrency from @brocolis/formatters",
    responsiveness: "Full-width card with flex-row justify-between",
    testability: "Deterministic output from subtotal/currency/itemCount props",
  },
} as const;
