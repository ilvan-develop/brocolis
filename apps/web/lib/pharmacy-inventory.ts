import type {
  InventoryAlertThresholds,
  InventoryAlertType,
} from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";
import {
  daysFromNow,
  mockCuid,
  PHARMACY_ID,
  PHARMACY_MARKET,
  PHARMACY_ORG_ID,
} from "./pharmacy-data";

export type PharmacyInventoryRow = {
  itemId: string;
  batchId: string;
  productName: string;
  presentation: string;
  batchNumber: string;
  expiryDate: Date;
  quantityOnHand: number;
  reorderPoint: number;
  reserved: number;
  organizationId: string;
  marketCode: string;
  pharmacyId: string;
};

export const DEFAULT_INVENTORY_THRESHOLDS: InventoryAlertThresholds = {
  low: 10,
  critical: 3,
  expiringDays: 60,
};

export function availableOf(row: PharmacyInventoryRow): number {
  return Math.max(row.quantityOnHand - row.reserved, 0);
}

export function daysToExpiry(row: PharmacyInventoryRow, now: Date): number {
  const diffMs = row.expiryDate.getTime() - now.getTime();
  return Math.ceil(diffMs / 86_400_000);
}

export function isExpired(row: PharmacyInventoryRow, now: Date): boolean {
  return row.expiryDate.getTime() < now.getTime();
}

export function inventoryAlertFor(
  row: PharmacyInventoryRow,
  now: Date,
  thresholds: InventoryAlertThresholds = DEFAULT_INVENTORY_THRESHOLDS,
): InventoryAlertType | null {
  if (isExpired(row, now)) {
    return "EXPIRED";
  }
  if (daysToExpiry(row, now) <= thresholds.expiringDays) {
    return "EXPIRING";
  }
  if (row.quantityOnHand <= thresholds.critical) {
    return "CRITICAL";
  }
  if (row.quantityOnHand <= thresholds.low) {
    return "LOW";
  }
  return null;
}

export type InventoryTotals = {
  items: number;
  lowStock: number;
  outOfStock: number;
  expiring: number;
  expired: number;
  totalUnits: number;
  availableUnits: number;
};

export function inventoryTotals(
  rows: readonly PharmacyInventoryRow[],
  now: Date,
  thresholds: InventoryAlertThresholds = DEFAULT_INVENTORY_THRESHOLDS,
): InventoryTotals {
  const totals: InventoryTotals = {
    items: rows.length,
    lowStock: 0,
    outOfStock: 0,
    expiring: 0,
    expired: 0,
    totalUnits: 0,
    availableUnits: 0,
  };
  for (const row of rows) {
    totals.totalUnits += row.quantityOnHand;
    totals.availableUnits += availableOf(row);
    if (row.quantityOnHand === 0) {
      totals.outOfStock += 1;
      continue;
    }
    const alert = inventoryAlertFor(row, now, thresholds);
    switch (alert) {
      case "EXPIRED":
        totals.expired += 1;
        break;
      case "EXPIRING":
        totals.expiring += 1;
        break;
      case "CRITICAL":
      case "LOW":
        totals.lowStock += 1;
        break;
      default:
        break;
    }
  }
  return totals;
}

export function stockPct(rows: readonly PharmacyInventoryRow[]): number {
  const totals = inventoryTotals(
    rows,
    new Date(),
    DEFAULT_INVENTORY_THRESHOLDS,
  );
  if (totals.totalUnits === 0) {
    return 0;
  }
  return Math.round((totals.availableUnits / totals.totalUnits) * 100);
}

export const INVENTORY_ALERT_KEY: Record<InventoryAlertType, MessageKey> = {
  LOW: "pharmacy.inventory.alert.LOW",
  CRITICAL: "pharmacy.inventory.alert.CRITICAL",
  EXPIRING: "pharmacy.inventory.alert.EXPIRING",
  EXPIRED: "pharmacy.inventory.alert.EXPIRED",
};

export function inventoryAlertBadgeVariant(
  type: InventoryAlertType,
): BadgeVariant {
  switch (type) {
    case "LOW":
      return "secondary";
    case "CRITICAL":
    case "EXPIRED":
      return "destructive";
    case "EXPIRING":
      return "outline";
  }
}

function stockRow(
  index: number,
  productName: string,
  presentation: string,
  batchNumber: string,
  expiryDays: number,
  quantityOnHand: number,
  reorderPoint: number,
  reserved: number,
): PharmacyInventoryRow {
  return {
    itemId: mockCuid(`inv-${index}`),
    batchId: mockCuid(`bat-${index}`),
    productName,
    presentation,
    batchNumber,
    expiryDate: daysFromNow(expiryDays),
    quantityOnHand,
    reorderPoint,
    reserved,
    organizationId: PHARMACY_ORG_ID,
    marketCode: PHARMACY_MARKET,
    pharmacyId: PHARMACY_ID,
  };
}

export const DEMO_PHARMACY_INVENTORY: readonly PharmacyInventoryRow[] = [
  stockRow(
    1,
    "Amoxicilina 500mg",
    "Cápsulas · 20 un",
    "AMX-2407A",
    240,
    120,
    10,
    8,
  ),
  stockRow(
    2,
    "Paracetamol 1000mg",
    "Comprimidos · 20 un",
    "PAR-2403B",
    320,
    240,
    20,
    0,
  ),
  stockRow(
    3,
    "Ibuprofeno 400mg",
    "Comprimidos · 30 un",
    "IBU-2401C",
    45,
    16,
    10,
    0,
  ),
  stockRow(
    4,
    "Vitamina C 500mg",
    "Efervescente · 20 un",
    "VIT-2412D",
    -12,
    30,
    10,
    0,
  ),
  stockRow(5, "Soro oral 500ml", "Frasco 500 ml", "SOR-2406E", 28, 9, 8, 2),
  stockRow(6, "Fenistil 1mg/ml", "Gotas · 20 ml", "FEN-2408F", 180, 55, 6, 0),
  stockRow(
    7,
    "Azitromicina 500mg",
    "Comprimidos · 3 un",
    "AZI-2405G",
    90,
    2,
    5,
    0,
  ),
  stockRow(
    8,
    "Metformina 850mg",
    "Comprimidos · 60 un",
    "MET-2409H",
    400,
    75,
    15,
    3,
  ),
  stockRow(
    9,
    "Famotil 20mg",
    "Comprimidos · 20 un",
    "FAM-2402I",
    150,
    8,
    10,
    0,
  ),
  stockRow(10, "Ferbisol 40mg", "Ampolas · 5 un", "FER-2411J", 210, 22, 4, 0),
];
