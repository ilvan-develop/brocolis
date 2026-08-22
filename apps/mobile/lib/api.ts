import { getMarket } from "@brocolis/markets";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type MarketOffer = {
  id: string;
  productId: string;
  pharmacyId: string;
  priceMoney: { amount: number; currency: string };
  stock: number;
  prescriptionRequired: boolean;
  status: string;
  product?: {
    id: string;
    name: string;
    dosage?: string;
    form?: string;
    brandId?: string;
    categoryId?: string;
  };
  pharmacy?: {
    id: string;
    name: string;
    verified: boolean;
  };
};

export type Cart = {
  id: string;
  items: CartItem[];
  subtotal: { amount: number; currency: string };
  itemCount: number;
};

export type CartItem = {
  productId: string;
  pharmacyId: string;
  quantity: number;
  unitPrice: { amount: number; currency: string };
  product?: { name: string; form?: string };
};

export type Order = {
  id: string;
  status: string;
  items: Array<{
    productId: string;
    pharmacyId: string;
    quantity: number;
    unitPrice: { amount: number; currency: string };
    lineTotal: { amount: number; currency: string };
  }>;
  totals: {
    subtotal: { amount: number; currency: string };
    deliveryFee: { amount: number; currency: string };
    vat: { amount: number; currency: string };
    total: { amount: number; currency: string };
  };
  deliveryAddress?: {
    zone: string;
    addressLine: string;
    city?: string;
    referencePoint?: string;
  };
  createdAt: string;
};

export type Payment = {
  id: string;
  status: string;
  method: string;
  amountMinor: number;
  currency: string;
};

export const api = {
  catalog: {
    async search(
      organizationId: string,
      marketCode: string,
      params: {
        query?: string;
        categoryId?: string;
        page?: number;
        pageSize?: number;
      },
    ) {
      getMarket(marketCode);
      const qs = new URLSearchParams();
      qs.set("organizationId", organizationId);
      qs.set("marketCode", marketCode);
      if (params.query) qs.set("query", params.query);
      if (params.categoryId) qs.set("categoryId", params.categoryId);
      if (params.page) qs.set("page", String(params.page));
      if (params.pageSize) qs.set("pageSize", String(params.pageSize));
      return request<{ offers: MarketOffer[]; total: number }>(
        `/api/catalog/offers?${qs.toString()}`,
      );
    },
  },

  cart: {
    async get(organizationId: string, marketCode: string) {
      return request<Cart>(
        `/api/cart?organizationId=${organizationId}&marketCode=${marketCode}`,
      );
    },
    async addItem(
      organizationId: string,
      marketCode: string,
      item: { productId: string; pharmacyId: string; quantity: number },
    ) {
      return request<Cart>("/api/cart/items", {
        method: "POST",
        body: { organizationId, marketCode, ...item },
      });
    },
    async updateItem(
      organizationId: string,
      marketCode: string,
      item: { productId: string; pharmacyId: string; quantity: number },
    ) {
      return request<Cart>("/api/cart/items", {
        method: "PATCH",
        body: { organizationId, marketCode, ...item },
      });
    },
    async removeItem(
      organizationId: string,
      marketCode: string,
      item: { productId: string; pharmacyId: string },
    ) {
      return request<Cart>("/api/cart/items", {
        method: "DELETE",
        body: { organizationId, marketCode, ...item },
      });
    },
  },

  order: {
    async create(
      organizationId: string,
      marketCode: string,
      data: {
        items: Array<{
          productId: string;
          pharmacyId: string;
          quantity: number;
        }>;
        deliveryAddress?: {
          zone: string;
          addressLine: string;
          city?: string;
          referencePoint?: string;
        };
      },
    ) {
      return request<Order>("/api/orders", {
        method: "POST",
        body: { organizationId, marketCode, ...data },
      });
    },
    async get(organizationId: string, marketCode: string, orderId: string) {
      return request<Order>(
        `/api/orders/${orderId}?organizationId=${organizationId}&marketCode=${marketCode}`,
      );
    },
    async list(organizationId: string, marketCode: string, page = 1) {
      return request<{ orders: Order[]; total: number }>(
        `/api/orders?organizationId=${organizationId}&marketCode=${marketCode}&page=${page}`,
      );
    },
  },

  payment: {
    async create(
      organizationId: string,
      marketCode: string,
      data: {
        orderId: string;
        amountMinor: number;
        currency: string;
        method: string;
      },
    ) {
      return request<Payment>("/api/payments", {
        method: "POST",
        body: { organizationId, marketCode, ...data },
      });
    },
    async getStatus(paymentId: string) {
      return request<Payment>(`/api/payments/${paymentId}`);
    },
  },

  prescription: {
    async upload(
      organizationId: string,
      marketCode: string,
      data: { orderId: string; files: Array<{ uri: string; type: string }> },
    ) {
      return request<{ id: string; status: string }>("/api/prescriptions", {
        method: "POST",
        body: { organizationId, marketCode, ...data },
      });
    },
  },
};
