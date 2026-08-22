import { api } from "@/lib/api";

function mockFetchOnce(status: number, body: unknown) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("api.catalog.search", () => {
  it("always sends organizationId and marketCode as query params (tenant isolation)", async () => {
    const fetchMock = mockFetchOnce(200, { offers: [], total: 0 });

    await api.catalog.search("org_1", "AO", { query: "paracetamol" });

    const url = new URL(
      (fetchMock.mock.calls[0]?.[0] as string) ?? "",
      "http://localhost",
    );
    expect(url.searchParams.get("organizationId")).toBe("org_1");
    expect(url.searchParams.get("marketCode")).toBe("AO");
    expect(url.searchParams.get("query")).toBe("paracetamol");
  });

  it("omits optional params when not provided", async () => {
    const fetchMock = mockFetchOnce(200, { offers: [], total: 0 });

    await api.catalog.search("org_1", "AO", {});

    const url = new URL(
      (fetchMock.mock.calls[0]?.[0] as string) ?? "",
      "http://localhost",
    );
    expect(url.searchParams.has("query")).toBe(false);
    expect(url.searchParams.has("categoryId")).toBe(false);
  });
});

describe("api.order.create", () => {
  it("posts organizationId, marketCode and the order payload", async () => {
    const fetchMock = mockFetchOnce(200, { id: "order_1", status: "PENDING" });

    await api.order.create("org_1", "AO", {
      items: [{ productId: "p1", pharmacyId: "ph1", quantity: 1 }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/orders");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body.organizationId).toBe("org_1");
    expect(body.marketCode).toBe("AO");
    expect(body.items).toHaveLength(1);
  });
});

describe("request() error handling (via api.order.get)", () => {
  it("throws the server-provided message on a non-ok response", async () => {
    mockFetchOnce(404, { message: "Pedido não encontrado" });

    await expect(api.order.get("org_1", "AO", "order_x")).rejects.toThrow(
      "Pedido não encontrado",
    );
  });

  it("falls back to an HTTP status message when the error body is not JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    }) as unknown as typeof fetch;

    await expect(api.order.get("org_1", "AO", "order_x")).rejects.toThrow(
      "HTTP 500",
    );
  });

  it("propagates network failures untouched (so order-queue can classify them)", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed"));

    await expect(api.order.get("org_1", "AO", "order_x")).rejects.toThrow(
      "Network request failed",
    );
  });
});
