import type {
  Brand,
  Category,
  GlobalProduct,
  MarketOffer,
  Money,
} from "@brocolis/contracts";
import { lowestPriceOf } from "./product";

export type CatalogRow = {
  productId: string;
  name: string;
  brand: string;
  categoryId: string | null;
  price: Money;
  offerCount: number;
  totalStock: number;
  prescriptionRequired: boolean;
};

export type CatalogSource = {
  offers: readonly MarketOffer[];
  products: readonly GlobalProduct[];
  brands: readonly Brand[];
  categories: readonly Category[];
};

export type CategoryChip = {
  id: string;
  name: string;
};

export type CatalogData = {
  rows: CatalogRow[];
  offers: MarketOffer[];
  products: GlobalProduct[];
  categories: CategoryChip[];
};

export function countActiveOffers(offers: readonly MarketOffer[]): number {
  return offers.filter((offer) => offer.status === "ACTIVE").length;
}

export function sumStock(offers: readonly MarketOffer[]): number {
  return offers.reduce((sum, offer) => sum + offer.stock, 0);
}

export function mapCatalogToRows(source: CatalogSource): CatalogRow[] {
  const grouped = new Map<string, MarketOffer[]>();

  for (const offer of source.offers) {
    const bucket = grouped.get(offer.productId);
    if (bucket !== undefined) {
      bucket.push(offer);
    } else {
      grouped.set(offer.productId, [offer]);
    }
  }

  const rows: CatalogRow[] = [];

  for (const [productId, offers] of grouped) {
    const product = source.products.find((item) => item.id === productId);
    if (product === undefined) {
      continue;
    }
    const brand = product.brandId
      ? source.brands.find((item) => item.id === product.brandId)
      : undefined;
    const lowest = lowestPriceOf(offers);
    rows.push({
      productId,
      name: product.name,
      brand: brand?.name ?? "",
      categoryId: product.categoryId ?? null,
      price: lowest ?? {
        amount: 0,
        currency: offers[0]?.priceMoney.currency ?? "AOA",
      },
      offerCount: countActiveOffers(offers),
      totalStock: sumStock(offers),
      prescriptionRequired: offers.some((offer) => offer.prescriptionRequired),
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  return rows;
}

export function extractCategoryChips(source: {
  categories: readonly Category[];
  products: readonly GlobalProduct[];
}): CategoryChip[] {
  const fromCatalog = source.categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  if (fromCatalog.length > 0) {
    return fromCatalog;
  }

  const seen = new Set<string>();
  const chips: CategoryChip[] = [];
  for (const product of source.products) {
    if (product.categoryId !== undefined && !seen.has(product.categoryId)) {
      seen.add(product.categoryId);
      chips.push({
        id: product.categoryId,
        name: product.categoryId.replace(/-/g, " "),
      });
    }
  }
  return chips;
}

export function mapCatalogToData(source: CatalogSource): CatalogData {
  return {
    rows: mapCatalogToRows(source),
    offers: [...source.offers],
    products: [...source.products],
    categories: extractCategoryChips(source),
  };
}
