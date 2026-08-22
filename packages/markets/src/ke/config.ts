import type { Market } from "../types.js";

export const keMarket: Market = {
  countryCode: "KE",
  region: "East Africa",
  locale: "en-KE",
  currency: { code: "KES", symbol: "KSh", decimals: 2, groupSeparator: "," },
  phone: { countryCode: "+254", nationalFormat: "7XX XXX XXX" },
  address: {
    levels: ["county", "ward", "location"],
    fields: ["street", "building", "landmark"],
    referencePoint: true,
  },
  payments: {
    methods: [
      { id: "m-pesa", type: "wallet", label: "M-Pesa" },
      { id: "airtel-money", type: "wallet", label: "Airtel Money" },
      { id: "cash-on-delivery", type: "cod", label: "Cash on delivery" },
    ],
  },
  taxation: { vatRate: 16, safT: true },
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
    validityDays: 90,
    pharmacistApproval: true,
    controlledRules: true,
  },
  logistics: {
    deliveryUnit: "km",
    zones: ["nairobi", "mombasa", "national"],
    partners: ["brocolis-fleet"],
  },
};
