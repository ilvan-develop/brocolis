"use client";

import type { CartItem } from "@brocolis/contracts";
import { useSyncExternalStore } from "react";
import { addToCart as mergeItem, removeFromCart, updateQuantity } from "./cart";

export const CART_STORAGE_KEY = "brocolis.cart.v1";

const EMPTY_ITEMS: CartItem[] = [];

export function serializeCart(items: readonly CartItem[]): string {
  return JSON.stringify(items);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as {
    productId?: unknown;
    pharmacyId?: unknown;
    quantity?: unknown;
    unitPrice?: unknown;
  };
  return (
    typeof candidate.productId === "string" &&
    typeof candidate.pharmacyId === "string" &&
    typeof candidate.quantity === "number" &&
    typeof candidate.unitPrice === "object" &&
    candidate.unitPrice !== null
  );
}

export function deserializeCart(raw: string | null): CartItem[] {
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

let cachedItems: CartItem[] | null = null;
const listeners = new Set<() => void>();

function readItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  if (cachedItems === null) {
    cachedItems = deserializeCart(
      window.localStorage.getItem(CART_STORAGE_KEY),
    );
  }
  return cachedItems;
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function persist(items: CartItem[]): void {
  cachedItems = items;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(items));
  }
  notify();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== CART_STORAGE_KEY) {
    return;
  }
  cachedItems = null;
  notify();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function useCartItems(): CartItem[] {
  return useSyncExternalStore(subscribe, readItems, () => EMPTY_ITEMS);
}

export function addItemToCart(next: CartItem): void {
  persist(mergeItem(readItems(), next));
}

export function removeCartItem(productId: string, pharmacyId: string): void {
  persist(removeFromCart(readItems(), productId, pharmacyId));
}

export function setCartItemQuantity(
  productId: string,
  pharmacyId: string,
  quantity: number,
): void {
  persist(updateQuantity(readItems(), productId, pharmacyId, quantity));
}

export function clearCart(): void {
  persist([]);
}
