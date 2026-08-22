import type { Cart, CartItem, Money } from "@brocolis/contracts";

export const MIN_ITEM_QUANTITY = 1;
export const MAX_ITEM_QUANTITY = 999;

export function clampQuantity(
  quantity: number,
  max: number = MAX_ITEM_QUANTITY,
): number {
  if (!Number.isFinite(quantity)) {
    return MIN_ITEM_QUANTITY;
  }
  return Math.min(
    Math.max(Math.round(quantity), MIN_ITEM_QUANTITY),
    Math.max(max, MIN_ITEM_QUANTITY),
  );
}

export type CartItemKey = `${string}:${string}`;

export function itemKey(
  item: Pick<CartItem, "productId" | "pharmacyId">,
): string {
  return `${item.productId}:${item.pharmacyId}`;
}

export function computeSubtotal(items: readonly CartItem[]): Money {
  const amount = items.reduce(
    (sum, item) => sum + item.unitPrice.amount * item.quantity,
    0,
  );
  const currency = items[0]?.unitPrice.currency ?? "AOA";
  return { amount, currency };
}

export function computeItemCount(items: readonly CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function addToCart(
  items: readonly CartItem[],
  next: CartItem,
): CartItem[] {
  const clamped = { ...next, quantity: clampQuantity(next.quantity) };
  const existing = items.find((item) => itemKey(item) === itemKey(clamped));
  if (existing === undefined) {
    return [...items, clamped];
  }
  return items.map((item) =>
    itemKey(item) === itemKey(clamped)
      ? {
          ...item,
          quantity: clampQuantity(existing.quantity + clamped.quantity),
        }
      : item,
  );
}

export function removeFromCart(
  items: readonly CartItem[],
  productId: string,
  pharmacyId: string,
): CartItem[] {
  return items.filter(
    (item) => !(item.productId === productId && item.pharmacyId === pharmacyId),
  );
}

export function updateQuantity(
  items: readonly CartItem[],
  productId: string,
  pharmacyId: string,
  quantity: number,
): CartItem[] {
  return items.map((item) =>
    item.productId === productId && item.pharmacyId === pharmacyId
      ? { ...item, quantity: clampQuantity(quantity) }
      : item,
  );
}

export function canCheckout(cart: Cart): boolean {
  return cart.items.length > 0 && cart.subtotal.amount > 0;
}
