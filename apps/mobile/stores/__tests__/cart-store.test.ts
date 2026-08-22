import { act } from "@testing-library/react-native";
import { useCartStore } from "@/stores/cart-store";

const item1 = {
  productId: "prod_1",
  pharmacyId: "pharm_1",
  quantity: 1,
  name: "Paracetamol 500mg",
  price: 1500,
  currency: "AOA",
};

const item2 = {
  productId: "prod_2",
  pharmacyId: "pharm_1",
  quantity: 2,
  name: "Ibuprofeno 400mg",
  price: 2000,
  currency: "AOA",
};

beforeEach(() => {
  act(() => {
    useCartStore.setState({
      organizationId: "",
      marketCode: "AO",
      items: [],
    });
  });
});

describe("useCartStore", () => {
  it("starts with an empty cart", () => {
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().total()).toBe(0);
    expect(useCartStore.getState().itemCount()).toBe(0);
  });

  it("adds a new item to the cart", () => {
    act(() => useCartStore.getState().addItem(item1));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]).toMatchObject(item1);
  });

  it("merges quantities when adding the same product+pharmacy twice", () => {
    act(() => useCartStore.getState().addItem(item1));
    act(() => useCartStore.getState().addItem({ ...item1, quantity: 3 }));

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(4);
  });

  it("keeps the same product from two different pharmacies as separate lines", () => {
    act(() => useCartStore.getState().addItem(item1));
    act(() =>
      useCartStore
        .getState()
        .addItem({ ...item1, pharmacyId: "pharm_2", quantity: 1 }),
    );

    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("updates the quantity of an existing item", () => {
    act(() => useCartStore.getState().addItem(item1));
    act(() =>
      useCartStore
        .getState()
        .updateQuantity(item1.productId, item1.pharmacyId, 5),
    );

    expect(useCartStore.getState().items[0]?.quantity).toBe(5);
  });

  it("removes the item when quantity is updated to zero or below", () => {
    act(() => useCartStore.getState().addItem(item1));
    act(() =>
      useCartStore
        .getState()
        .updateQuantity(item1.productId, item1.pharmacyId, 0),
    );

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("removes an item explicitly", () => {
    act(() => useCartStore.getState().addItem(item1));
    act(() => useCartStore.getState().addItem(item2));
    act(() =>
      useCartStore.getState().removeItem(item1.productId, item1.pharmacyId),
    );

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]?.productId).toBe(item2.productId);
  });

  it("clears the whole cart", () => {
    act(() => useCartStore.getState().addItem(item1));
    act(() => useCartStore.getState().clearCart());

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("computes the total across all items", () => {
    act(() => useCartStore.getState().addItem(item1)); // 1 * 1500
    act(() => useCartStore.getState().addItem(item2)); // 2 * 2000

    expect(useCartStore.getState().total()).toBe(1500 + 2 * 2000);
  });

  it("computes the item count as the sum of quantities, not line count", () => {
    act(() => useCartStore.getState().addItem(item1)); // qty 1
    act(() => useCartStore.getState().addItem(item2)); // qty 2

    expect(useCartStore.getState().itemCount()).toBe(3);
  });

  it("updates the tenant context", () => {
    act(() => useCartStore.getState().setContext("org_9", "MZ"));

    expect(useCartStore.getState().organizationId).toBe("org_9");
    expect(useCartStore.getState().marketCode).toBe("MZ");
  });
});
