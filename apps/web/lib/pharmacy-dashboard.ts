import type { PharmacySettlement } from "@brocolis/contracts";
import { pendingSettlementTotals } from "./pharmacy-finance";
import type { PharmacyInventoryRow } from "./pharmacy-inventory";
import { stockPct } from "./pharmacy-inventory";
import type { PharmacyOrder } from "./pharmacy-orders";
import { salesTotal } from "./pharmacy-orders";

export type PharmacyDashboardKpis = {
  orderCount: number;
  salesMinor: number;
  salesCurrency: string;
  stockPct: number;
  pendingSettlements: number;
  pendingSettlementsMinor: number;
};

export function derivePharmacyKpis(
  orders: readonly PharmacyOrder[],
  inventory: readonly PharmacyInventoryRow[],
  settlements: readonly PharmacySettlement[],
): PharmacyDashboardKpis {
  const sales = salesTotal(orders);
  const settlementsPending = pendingSettlementTotals(settlements);
  return {
    orderCount: orders.length,
    salesMinor: sales?.amount ?? 0,
    salesCurrency: sales?.currency ?? "AOA",
    stockPct: stockPct(inventory),
    pendingSettlements: settlementsPending.count,
    pendingSettlementsMinor: settlementsPending.netMinor,
  };
}
