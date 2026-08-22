export type CurrencyConfig = {
  code: string;
  symbol: string;
  decimals: number;
  groupSeparator: string;
};

export type PhoneConfig = {
  countryCode: string;
  nationalFormat: string;
};

export type AddressConfig = {
  levels: string[];
  fields: string[];
  referencePoint: boolean;
};

export type PaymentMethodConfig = {
  id: string;
  type: "reference" | "pos" | "bank" | "cod" | "wallet";
  label: string;
};

export type PaymentConfig = {
  methods: PaymentMethodConfig[];
};

export type TaxConfig = {
  vatRate: number;
  safT: boolean;
};

export type PharmacyConfig = {
  verificationLevels: string[];
  documentTypes: string[];
};

export type PrescriptionConfig = {
  types: string[];
  validityDays: number;
  pharmacistApproval: boolean;
  controlledRules: boolean;
};

export type LogisticsConfig = {
  deliveryUnit: string;
  zones: string[];
  partners: string[];
};

export type Market = {
  countryCode: string;
  region: string;
  locale: string;
  currency: CurrencyConfig;
  phone: PhoneConfig;
  address: AddressConfig;
  payments: PaymentConfig;
  taxation: TaxConfig;
  pharmacy: PharmacyConfig;
  prescription: PrescriptionConfig;
  logistics: LogisticsConfig;
};
