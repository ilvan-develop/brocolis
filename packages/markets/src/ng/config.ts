import type { Market } from "../types.js";

export const ngMarket: Market = {
  countryCode: "NG",
  region: "West Africa",
  locale: "en-NG",
  currency: { code: "NGN", symbol: "₦", decimals: 2, groupSeparator: "," },
  phone: { countryCode: "+234", nationalFormat: "7XX XXX XXXX" },
  address: {
    levels: ["state", "lga", "city"],
    fields: ["street", "building", "landmark"],
    referencePoint: true,
  },
  payments: {
    methods: [
      { id: "bank-transfer", type: "bank", label: "Bank transfer" },
      { id: "wallet", type: "wallet", label: "Wallet" },
      { id: "cash-on-delivery", type: "cod", label: "Cash on delivery" },
    ],
  },
  taxation: { vatRate: 7.5, safT: true },
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
    zones: ["lagos", "abuja", "national"],
    partners: ["brocolis-fleet"],
  },
};
