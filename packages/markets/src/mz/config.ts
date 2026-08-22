import type { Market } from "../types.js";

export const mzMarket: Market = {
  countryCode: "MZ",
  region: "Southern Africa",
  locale: "pt-MZ",
  currency: { code: "MZN", symbol: "MT", decimals: 0, groupSeparator: "," },
  phone: { countryCode: "+258", nationalFormat: "8X XXX XXXX" },
  address: {
    levels: ["province", "municipality", "neighborhood"],
    fields: ["street", "houseNumber", "referencePoint"],
    referencePoint: true,
  },
  payments: {
    methods: [
      { id: "reference", type: "reference", label: "Referência" },
      { id: "wallet", type: "wallet", label: "Carteira móvel" },
    ],
  },
  taxation: { vatRate: 17, safT: true },
  pharmacy: {
    verificationLevels: [
      "VERIFIED",
      "PREMIUM_VERIFIED",
      "PENDING_VERIFICATION",
      "SUSPENDED",
    ],
    documentTypes: ["license", "identity", "tax-id"],
  },
  prescription: {
    types: ["digital", "physical"],
    validityDays: 30,
    pharmacistApproval: true,
    controlledRules: true,
  },
  logistics: {
    deliveryUnit: "km",
    zones: ["urban", "suburban"],
    partners: ["brocolis-fleet"],
  },
};
