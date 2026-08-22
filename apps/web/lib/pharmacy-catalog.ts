import type { Money } from "@brocolis/contracts";
import { normalizeText } from "./catalog";
import { mockCuid, PHARMACY_CURRENCY } from "./pharmacy-data";

export type PharmacyCatalogProduct = {
  productId: string;
  name: string;
  brand: string;
  presentation: string;
  price: Money;
  stock: number;
  active: boolean;
};

export const DEMO_PHARMACY_CATALOG: readonly PharmacyCatalogProduct[] = [
  {
    productId: mockCuid("pro-1"),
    name: "Amoxicilina 500mg",
    brand: "Generis",
    presentation: "Cápsulas · 20 un",
    price: { amount: 6250, currency: PHARMACY_CURRENCY },
    stock: 120,
    active: true,
  },
  {
    productId: mockCuid("pro-2"),
    name: "Paracetamol 1000mg",
    brand: "Ben-u-ron",
    presentation: "Comprimidos · 20 un",
    price: { amount: 3450, currency: PHARMACY_CURRENCY },
    stock: 240,
    active: true,
  },
  {
    productId: mockCuid("pro-3"),
    name: "Ibuprofeno 400mg",
    brand: "Generis",
    presentation: "Comprimidos · 30 un",
    price: { amount: 4100, currency: PHARMACY_CURRENCY },
    stock: 16,
    active: true,
  },
  {
    productId: mockCuid("pro-4"),
    name: "Vitamina C 500mg",
    brand: "Cebion",
    presentation: "Efervescente · 20 un",
    price: { amount: 5200, currency: PHARMACY_CURRENCY },
    stock: 4,
    active: true,
  },
  {
    productId: mockCuid("pro-5"),
    name: "Soro oral 500ml",
    brand: "Sucral",
    presentation: "Frasco 500 ml",
    price: { amount: 1800, currency: PHARMACY_CURRENCY },
    stock: 0,
    active: true,
  },
  {
    productId: mockCuid("pro-6"),
    name: "Fenistil 1mg/ml",
    brand: "Fenistil",
    presentation: "Gotas · 20 ml",
    price: { amount: 7800, currency: PHARMACY_CURRENCY },
    stock: 55,
    active: true,
  },
  {
    productId: mockCuid("pro-7"),
    name: "Azitromicina 500mg",
    brand: "Zitromax",
    presentation: "Comprimidos · 3 un",
    price: { amount: 9300, currency: PHARMACY_CURRENCY },
    stock: 30,
    active: true,
  },
  {
    productId: mockCuid("pro-8"),
    name: "Metformina 850mg",
    brand: "Generis",
    presentation: "Comprimidos · 60 un",
    price: { amount: 8900, currency: PHARMACY_CURRENCY },
    stock: 75,
    active: true,
  },
  {
    productId: mockCuid("pro-9"),
    name: "Famotil 20mg",
    brand: "Generis",
    presentation: "Comprimidos · 20 un",
    price: { amount: 5400, currency: PHARMACY_CURRENCY },
    stock: 8,
    active: true,
  },
  {
    productId: mockCuid("pro-10"),
    name: "Sinutab",
    brand: "Sinutab",
    presentation: "Comprimidos · 24 un",
    price: { amount: 6400, currency: PHARMACY_CURRENCY },
    stock: 0,
    active: false,
  },
  {
    productId: mockCuid("pro-11"),
    name: "Ferbisol 40mg",
    brand: "Ferbisol",
    presentation: "Ampolas · 5 un",
    price: { amount: 12900, currency: PHARMACY_CURRENCY },
    stock: 22,
    active: true,
  },
];

export function filterPharmacyCatalog(
  rows: readonly PharmacyCatalogProduct[],
  query: string,
): PharmacyCatalogProduct[] {
  const normalized = normalizeText(query);
  if (normalized.length === 0) {
    return [...rows];
  }
  return rows.filter((row) =>
    [row.name, row.brand, row.presentation].some((part) =>
      normalizeText(part).includes(normalized),
    ),
  );
}

export function updateCatalogPrice(
  rows: readonly PharmacyCatalogProduct[],
  productId: string,
  amount: number,
): PharmacyCatalogProduct[] {
  return rows.map((row) =>
    row.productId === productId
      ? { ...row, price: { ...row.price, amount } }
      : row,
  );
}

export function totalCatalogValue(
  rows: readonly PharmacyCatalogProduct[],
): number {
  return rows.reduce(
    (sum, row) => sum + row.price.amount * Math.max(row.stock, 0),
    0,
  );
}
