import type { CartItem, MarketOffer } from "@brocolis/contracts";

export function bestOffer(offers: readonly MarketOffer[]): MarketOffer | null {
  let best: MarketOffer | null = null;
  for (const offer of offers) {
    if (offer.status === "OUT_OF_STOCK" || offer.stock <= 0) {
      continue;
    }
    if (best === null || offer.priceMoney.amount < best.priceMoney.amount) {
      best = offer;
    }
  }
  return best;
}

export function distinctPharmacyIds(items: readonly CartItem[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!seen.has(item.pharmacyId)) {
      seen.add(item.pharmacyId);
      result.push(item.pharmacyId);
    }
  }
  return result;
}
