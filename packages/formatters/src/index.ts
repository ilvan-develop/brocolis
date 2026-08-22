export type CurrencyConfig = {
  code: string;
  symbol: string;
  decimals: number;
  groupSeparator: string;
};

const CURRENCIES: Record<string, CurrencyConfig> = {
  AOA: { code: "AOA", symbol: "Kz", decimals: 0, groupSeparator: " " },
  MZN: { code: "MZN", symbol: "MT", decimals: 0, groupSeparator: "," },
  KES: { code: "KES", symbol: "KSh", decimals: 2, groupSeparator: "," },
  NGN: { code: "NGN", symbol: "₦", decimals: 2, groupSeparator: "," },
  BRL: { code: "BRL", symbol: "R$", decimals: 2, groupSeparator: "." },
};

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode.toUpperCase()];

  if (!currency) {
    return `${amount.toLocaleString("pt-PT")} ${currencyCode}`;
  }

  // Formata manualmente em vez de depender dos separadores nativos de uma
  // locale fixa (ex.: pt-PT usa NBSP para milhares), para que cada moeda
  // use sempre o separador configurado em CurrencyConfig.
  const decimalSeparator = currency.groupSeparator === "," ? "." : ",";
  const [integerPart = "0", decimalPart] = amount
    .toFixed(currency.decimals)
    .split(".");
  const grouped = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.groupSeparator,
  );
  const formatted = decimalPart
    ? `${grouped}${decimalSeparator}${decimalPart}`
    : grouped;

  return `${formatted} ${currency.symbol}`;
}

export function formatPhone(
  nationalNumber: string,
  countryCode: string,
): string {
  return `${countryCode} ${nationalNumber}`;
}

const FALLBACK_LOCALE = "pt-PT";

function resolveLocale(locale: string): string {
  try {
    const matched = Intl.DateTimeFormat.supportedLocalesOf(locale);
    return matched.length > 0 && matched[0] != null
      ? matched[0]
      : FALLBACK_LOCALE;
  } catch {
    return FALLBACK_LOCALE;
  }
}

export function formatDate(
  date: Date | string | number,
  locale: string = "pt-AO",
): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatPercentage(
  value: number,
  options: { decimals?: number } = {},
): string {
  const { decimals = 0 } = options;
  const number = value.toLocaleString(FALLBACK_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${number}%`;
}

export function formatAddress(
  ...parts: Array<string | null | undefined>
): string {
  return parts
    .filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0,
    )
    .map((part) => part.trim())
    .join(", ");
}
