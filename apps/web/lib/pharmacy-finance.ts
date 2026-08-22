import type { PharmacySettlement, SettlementStatus } from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";
import {
  daysFromNow,
  mockCuid,
  PHARMACY_ID,
  PHARMACY_MARKET,
  PHARMACY_ORG_ID,
} from "./pharmacy-data";

export const SETTLEMENT_STATUS_KEY: Record<SettlementStatus, MessageKey> = {
  PENDING: "pharmacy.finance.status.pending",
  PAID: "pharmacy.finance.status.paid",
  FAILED: "pharmacy.finance.status.failed",
};

export function settlementStatusBadgeVariant(
  status: SettlementStatus,
): BadgeVariant {
  switch (status) {
    case "PAID":
      return "default";
    case "FAILED":
      return "destructive";
    case "PENDING":
      return "secondary";
  }
}

export type SettlementBalance = {
  grossMinor: number;
  accountedMinor: number;
  deltaMinor: number;
  reconciled: boolean;
};

export function settlementBalance(
  settlement: PharmacySettlement,
): SettlementBalance {
  const accounted =
    settlement.commissionMinor + settlement.netMinor + settlement.reserveMinor;
  const delta = settlement.grossMinor - accounted;
  return {
    grossMinor: settlement.grossMinor,
    accountedMinor: accounted,
    deltaMinor: delta,
    reconciled: delta === 0,
  };
}

export function pendingSettlementTotals(
  settlements: readonly PharmacySettlement[],
): { count: number; netMinor: number } {
  let count = 0;
  let netMinor = 0;
  for (const settlement of settlements) {
    if (settlement.status === "PENDING") {
      count += 1;
      netMinor += settlement.netMinor;
    }
  }
  return { count, netMinor };
}

const scheduledCommission = (gross: number, bps: number): number =>
  Math.round((gross * bps) / 10_000);

function settlement(
  index: number,
  periodStartDaysAgo: number,
  grossMinor: number,
  commissionRateBps: number,
  reserveMinor: number,
  status: SettlementStatus,
  finpayRef: string | null,
): PharmacySettlement {
  const commissionMinor = scheduledCommission(grossMinor, commissionRateBps);
  const periodStart = daysFromNow(-periodStartDaysAgo);
  return {
    id: mockCuid(`stl-${index}`),
    pharmacyId: PHARMACY_ID,
    organizationId: PHARMACY_ORG_ID,
    marketCode: PHARMACY_MARKET,
    periodStart,
    periodEnd: new Date(periodStart.getTime() + 6 * 86_400_000),
    grossMinor,
    commissionRateBps,
    commissionMinor,
    netMinor: grossMinor - commissionMinor - reserveMinor,
    reserveMinor,
    status,
    ...(finpayRef !== null ? { finpayRef } : {}),
    createdAt: periodStart,
  };
}

export const DEMO_PHARMACY_SETTLEMENTS: readonly PharmacySettlement[] = [
  settlement(1, 0, 245800, 250, 12000, "PENDING", null),
  settlement(2, 7, 318500, 250, 15800, "PENDING", null),
  settlement(3, 14, 287400, 250, 14300, "PAID", "FP-88213"),
  settlement(4, 21, 198900, 250, 9900, "FAILED", "FP-88145"),
  settlement(5, 28, 265300, 250, 13200, "PAID", "FP-88011"),
];

export type PayoutMethod = {
  id: string;
  key: MessageKey;
};

export const PAYOUT_METHODS: readonly PayoutMethod[] = [
  { id: "bank", key: "pharmacy.finance.method.bank" },
  { id: "multicaixa", key: "pharmacy.finance.method.multicaixa" },
  { id: "tpa", key: "pharmacy.finance.method.tpa" },
];
