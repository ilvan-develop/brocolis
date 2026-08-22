import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CartItem = {
  productId: string;
  pharmacyId: string;
  quantity: number;
  name: string;
  price: number;
  currency: string;
};

type CartState = {
  organizationId: string;
  marketCode: string;
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (
    productId: string,
    pharmacyId: string,
    quantity: number,
  ) => void;
  removeItem: (productId: string, pharmacyId: string) => void;
  clearCart: () => void;
  setContext: (organizationId: string, marketCode: string) => void;
  total: () => number;
  itemCount: () => number;
};

const secureStoreStorage = {
  getItem: async (name: string) => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      organizationId: "",
      marketCode: "AO",
      items: [],

      setContext: (organizationId, marketCode) =>
        set({ organizationId, marketCode }),

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.pharmacyId === item.pharmacyId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId &&
                i.pharmacyId === item.pharmacyId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      updateQuantity: (productId, pharmacyId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) =>
                    !(i.productId === productId && i.pharmacyId === pharmacyId),
                )
              : state.items.map((i) =>
                  i.productId === productId && i.pharmacyId === pharmacyId
                    ? { ...i, quantity }
                    : i,
                ),
        })),

      removeItem: (productId, pharmacyId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.pharmacyId === pharmacyId),
          ),
        })),

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "brocolis_cart",
      storage: createJSONStorage(() => secureStoreStorage),
    },
  ),
);
