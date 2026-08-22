import type { Market } from "../types.js";

export const aoMarket: Market = {
  countryCode: "AO",
  region: "Southern Africa",
  locale: "pt-AO",
  currency: { code: "AOA", symbol: "Kz", decimals: 0, groupSeparator: " " },
  phone: { countryCode: "+244", nationalFormat: "9XX XXX XXX" },
  address: {
    levels: ["province", "municipality", "district", "neighborhood"],
    fields: [
      "street",
      "houseNumber",
      "referencePoint",
      "latitude",
      "longitude",
    ],
    referencePoint: true,
  },
  payments: {
    methods: [
      { id: "multicaixa", type: "reference", label: "Multicaixa" },
      { id: "tpa", type: "pos", label: "TPA" },
      { id: "bank-transfer", type: "bank", label: "Transferência bancária" },
      { id: "cash-on-delivery", type: "cod", label: "Dinheiro na entrega" },
    ],
  },
  taxation: { vatRate: 14, safT: true },
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
