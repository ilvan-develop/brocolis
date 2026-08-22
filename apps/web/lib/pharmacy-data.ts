export const PHARMACY_ORG_ID = "00000000-0000-4000-8000-000000000001";

export const PHARMACY_ID = "clpharmacy00000000000000001";

export const PHARMACY_MARKET = "AO";

export const PHARMACY_CURRENCY = "AOA";

const DAY_MS = 86_400_000;

export function daysFromNow(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

export function mockCuid(seed: string): string {
  const normalized = seed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const body = normalized.padEnd(23, "0").slice(0, 23);
  return `c${body}`;
}
