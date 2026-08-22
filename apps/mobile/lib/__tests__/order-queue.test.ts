import {
  clearQueuedOrders,
  enqueueOrder,
  getQueuedOrders,
  isNetworkError,
  removeQueuedOrder,
  syncQueuedOrders,
  type QueueStorage,
  type QueuedOrderPayload,
} from "@/lib/order-queue";

function createMemoryStorage(): QueueStorage {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string): Promise<T | null> {
      return (map.has(key) ? (map.get(key) as T) : null) ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      map.set(key, value);
    },
  };
}

const payload: QueuedOrderPayload = {
  organizationId: "org_1",
  marketCode: "AO",
  items: [{ productId: "prod_1", pharmacyId: "pharm_1", quantity: 2 }],
  deliveryAddress: {
    zone: "urban",
    addressLine: "Rua da Missão, 123",
    city: "Luanda",
  },
};

describe("isNetworkError", () => {
  it("treats TypeError as a network error", () => {
    expect(isNetworkError(new TypeError("Network request failed"))).toBe(
      true,
    );
  });

  it("matches network-ish error messages", () => {
    expect(isNetworkError(new Error("fetch failed"))).toBe(true);
    expect(isNetworkError(new Error("Request timed out"))).toBe(true);
  });

  it("does not treat business/validation errors as network errors", () => {
    expect(isNetworkError(new Error("Invalid delivery address"))).toBe(false);
    expect(isNetworkError(new Error("HTTP 422"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isNetworkError("boom")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe("order queue persistence", () => {
  it("starts empty", async () => {
    const storage = createMemoryStorage();
    expect(await getQueuedOrders(storage)).toEqual([]);
  });

  it("enqueues an order with a generated id and retryCount 0", async () => {
    const storage = createMemoryStorage();
    const entry = await enqueueOrder(payload, storage);

    expect(entry.id).toEqual(expect.any(String));
    expect(entry.retryCount).toBe(0);
    expect(entry.organizationId).toBe("org_1");

    const queue = await getQueuedOrders(storage);
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(entry.id);
  });

  it("preserves existing entries when enqueueing more", async () => {
    const storage = createMemoryStorage();
    await enqueueOrder(payload, storage);
    await enqueueOrder(payload, storage);

    expect(await getQueuedOrders(storage)).toHaveLength(2);
  });

  it("removes a queued order by id", async () => {
    const storage = createMemoryStorage();
    const first = await enqueueOrder(payload, storage);
    const second = await enqueueOrder(payload, storage);

    await removeQueuedOrder(first.id, storage);

    const queue = await getQueuedOrders(storage);
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(second.id);
  });

  it("clears the whole queue", async () => {
    const storage = createMemoryStorage();
    await enqueueOrder(payload, storage);
    await clearQueuedOrders(storage);

    expect(await getQueuedOrders(storage)).toEqual([]);
  });
});

describe("syncQueuedOrders", () => {
  it("removes orders that sync successfully", async () => {
    const storage = createMemoryStorage();
    await enqueueOrder(payload, storage);
    const createOrder = jest.fn().mockResolvedValue({ id: "order_1" });

    const result = await syncQueuedOrders(createOrder, storage);

    expect(result.synced).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(await getQueuedOrders(storage)).toEqual([]);
    expect(createOrder).toHaveBeenCalledWith("org_1", "AO", {
      items: payload.items,
      deliveryAddress: payload.deliveryAddress,
    });
  });

  it("keeps an order in the queue and increments retryCount on network failure", async () => {
    const storage = createMemoryStorage();
    await enqueueOrder(payload, storage);
    const createOrder = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed"));

    const result = await syncQueuedOrders(createOrder, storage);

    expect(result.failed).toHaveLength(1);
    expect(result.dropped).toHaveLength(0);
    const queue = await getQueuedOrders(storage);
    expect(queue).toHaveLength(1);
    expect(queue[0]?.retryCount).toBe(1);
  });

  it("drops an order after a non-network (business) failure instead of retrying forever", async () => {
    const storage = createMemoryStorage();
    await enqueueOrder(payload, storage);
    const createOrder = jest
      .fn()
      .mockRejectedValue(new Error("HTTP 422: invalid address"));

    const result = await syncQueuedOrders(createOrder, storage);

    expect(result.dropped).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(await getQueuedOrders(storage)).toEqual([]);
  });

  it("drops an order once it exceeds the retry limit even for network errors", async () => {
    const storage = createMemoryStorage();
    const entry = await enqueueOrder(payload, storage);
    await storage.set("pending-orders", [{ ...entry, retryCount: 4 }]);
    const createOrder = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed"));

    const result = await syncQueuedOrders(createOrder, storage);

    expect(result.dropped).toHaveLength(1);
    expect(await getQueuedOrders(storage)).toEqual([]);
  });

  it("processes multiple queued orders independently", async () => {
    const storage = createMemoryStorage();
    await enqueueOrder(payload, storage);
    await enqueueOrder(payload, storage);
    const createOrder = jest
      .fn()
      .mockResolvedValueOnce({ id: "order_1" })
      .mockRejectedValueOnce(new TypeError("Network request failed"));

    const result = await syncQueuedOrders(createOrder, storage);

    expect(result.synced).toHaveLength(1);
    expect(result.failed).toHaveLength(1);
    expect(await getQueuedOrders(storage)).toHaveLength(1);
  });

  it("is a no-op when the queue is empty", async () => {
    const storage = createMemoryStorage();
    const createOrder = jest.fn();

    const result = await syncQueuedOrders(createOrder, storage);

    expect(result).toEqual({ synced: [], failed: [], dropped: [] });
    expect(createOrder).not.toHaveBeenCalled();
  });
});
