import type { MarketOffer, Money } from "@brocolis/contracts";
import { formatCurrency } from "@brocolis/formatters";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";

export const LOW_STOCK_THRESHOLD = 5;

export type StockTier = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_TIER_KEY: Record<StockTier, MessageKey> = {
  in_stock: "commerce.stock.available",
  low_stock: "commerce.stock.low",
  out_of_stock: "commerce.stock.out",
};

export function stockTier(stock: number): StockTier {
  if (stock <= 0) {
    return "out_of_stock";
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return "low_stock";
  }
  return "in_stock";
}

export function stockBadgeVariant(tier: StockTier): BadgeVariant {
  switch (tier) {
    case "out_of_stock":
      return "destructive";
    case "low_stock":
      return "secondary";
    default:
      return "default";
  }
}

export type OfferDisplay = {
  offerId: string;
  pharmacyId: string;
  price: Money;
  priceLabel: string;
  stock: number;
  tier: StockTier;
  available: boolean;
  prescriptionRequired: boolean;
};

export function mapOfferToDisplay(offer: MarketOffer): OfferDisplay {
  return {
    offerId: offer.id,
    pharmacyId: offer.pharmacyId,
    price: offer.priceMoney,
    priceLabel: formatCurrency(
      offer.priceMoney.amount,
      offer.priceMoney.currency,
    ),
    stock: offer.stock,
    tier: stockTier(offer.status === "OUT_OF_STOCK" ? 0 : offer.stock),
    available: offer.status !== "OUT_OF_STOCK" && offer.stock > 0,
    prescriptionRequired: offer.prescriptionRequired,
  };
}

export function lowestPriceOf(offers: readonly MarketOffer[]): Money | null {
  const candidates = offers.filter((offer) => offer.status !== "OUT_OF_STOCK");
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((cheapest, offer) =>
    offer.priceMoney.amount < cheapest.priceMoney.amount ? offer : cheapest,
  ).priceMoney;
}

export function offersForProduct(
  offers: readonly MarketOffer[],
  productId: string,
): MarketOffer[] {
  return offers.filter((offer) => offer.productId === productId);
}
