import type {
  Brand,
  Cart,
  Category,
  GlobalProduct,
  InventoryItem,
  Invitation,
  MarketOffer,
  Member,
  Order,
  Organization,
  PharmacySettlement,
  Prescription,
  SessionInfo,
  SignInInput,
  SignUpInput,
  User,
  VerifyEmailInput,
} from "@brocolis/contracts";

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "emailVerified" | "marketCode"
>;

export type SignInResult = {
  user: SessionUser;
  session: { token: string; expiresAt: string };
  organizations: Organization[];
};

export type SignUpResult = {
  user: SessionUser;
};

export type ApiFetch = typeof fetch;

export type ApiClientDeps = {
  fetchImpl?: ApiFetch;
  baseUrl?: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function jsonInit(method: string, body?: unknown): RequestInit {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return init;
}

export { jsonInit };

export function toQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    search.set(key, String(value));
  }
  return search.toString();
}

export type CommerceScope = {
  organizationId: string;
  marketCode: string;
};

export type CatalogSearchInput = {
  organizationId: string;
  marketCode: string;
  query?: string;
  categoryId?: string;
  limit?: number;
};

export type CatalogSearchItem = {
  offer: MarketOffer;
  product: GlobalProduct;
  brand: Brand | null;
  category: Category | null;
};

export type CatalogSearchResponse = {
  items: CatalogSearchItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type GetOrderInput = {
  organizationId: string;
  marketCode: string;
  orderId: string;
};

export async function request<T>(
  fetchImpl: ApiFetch,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetchImpl(path, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { message?: unknown } | null)?.message ?? response.statusText;
    throw new ApiError(String(message ?? "Request failed"), response.status);
  }

  return payload as T;
}

export type ApiClient = {
  auth: {
    signIn: (input: SignInInput) => Promise<SignInResult>;
    signUp: (input: SignUpInput) => Promise<SignUpResult>;
    signOut: () => Promise<void>;
    getSession: () => Promise<SessionInfo | null>;
    verifyEmail: (input: VerifyEmailInput) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
  };
  organizations: {
    list: () => Promise<Organization[]>;
    switch: (input: { organizationId: string }) => Promise<SessionInfo>;
    listMembers: (organizationId: string) => Promise<Member[]>;
    inviteMember: (input: {
      organizationId: string;
      email: string;
      role: string;
      expiresInDays?: number;
    }) => Promise<Invitation>;
  };
  commerce: {
    searchCatalog: (
      input: CatalogSearchInput,
    ) => Promise<CatalogSearchResponse>;
    getCart: (input: CommerceScope) => Promise<Cart | null>;
    getOrder: (input: GetOrderInput) => Promise<Order | null>;
  };
  pharmacy: {
    listInventory: (input: {
      organizationId: string;
      marketCode: string;
      limit?: number;
    }) => Promise<InventoryItem[]>;
    listOrders: (input: {
      organizationId: string;
      marketCode: string;
      page?: number;
      pageSize?: number;
    }) => Promise<Order[]>;
    listPrescriptions: (input: {
      organizationId: string;
      marketCode: string;
      limit?: number;
    }) => Promise<Prescription[]>;
    computeSettlements: (input: {
      organizationId: string;
      marketCode: string;
      periodStart?: string;
      periodEnd?: string;
    }) => Promise<PharmacySettlement>;
  };
};

export function createApiClient(deps: ApiClientDeps = {}): ApiClient {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const baseUrl = deps.baseUrl ?? "";

  return {
    auth: {
      signIn: (input) =>
        request<SignInResult>(
          fetchImpl,
          `${baseUrl}/api/auth/sign-in`,
          jsonInit("POST", input),
        ),
      signUp: (input) =>
        request<SignUpResult>(
          fetchImpl,
          `${baseUrl}/api/auth/sign-up`,
          jsonInit("POST", input),
        ),
      signOut: async () => {
        await request<{ ok: true }>(
          fetchImpl,
          `${baseUrl}/api/auth/sign-out`,
          jsonInit("POST"),
        );
      },
      getSession: async () => {
        const response = await fetchImpl(`${baseUrl}/api/auth/session`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (response.status === 404) {
          return null;
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new ApiError(
            String(
              (payload as { message?: unknown } | null)?.message ??
                response.statusText ??
                "Request failed",
            ),
            response.status,
          );
        }
        return payload as SessionInfo;
      },
      verifyEmail: (input) =>
        request<void>(
          fetchImpl,
          `${baseUrl}/api/auth/verify-email`,
          jsonInit("POST", input),
        ),
      requestPasswordReset: (email) =>
        request<void>(
          fetchImpl,
          `${baseUrl}/api/auth/forgot-password`,
          jsonInit("POST", { email }),
        ),
    },
    organizations: {
      list: () =>
        request<Organization[]>(
          fetchImpl,
          `${baseUrl}/api/tenants/organizations`,
          jsonInit("GET"),
        ),
      switch: (input) =>
        request<SessionInfo>(
          fetchImpl,
          `${baseUrl}/api/tenants/switch`,
          jsonInit("POST", input),
        ),
      listMembers: (organizationId) =>
        request<Member[]>(
          fetchImpl,
          `${baseUrl}/api/tenants/organizations/${organizationId}/members`,
          jsonInit("GET"),
        ),
      inviteMember: (input) =>
        request<Invitation>(
          fetchImpl,
          `${baseUrl}/api/tenants/organizations/${input.organizationId}/invites`,
          jsonInit("POST", input),
        ),
    },
    commerce: {
      searchCatalog: (input) =>
        request<CatalogSearchResponse>(
          fetchImpl,
          `${baseUrl}/api/catalog/search?${toQueryString({
            organizationId: input.organizationId,
            marketCode: input.marketCode,
            query: input.query,
            categoryId: input.categoryId,
            limit: input.limit,
          })}`,
          jsonInit("GET"),
        ),
      getCart: async (input) => {
        const response = await fetchImpl(
          `${baseUrl}/api/cart?${toQueryString(input)}`,
          { method: "GET", headers: { Accept: "application/json" } },
        );

        if (response.status === 404) {
          return null;
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new ApiError(
            String(
              (payload as { message?: unknown } | null)?.message ??
                response.statusText ??
                "Request failed",
            ),
            response.status,
          );
        }
        return payload as Cart;
      },
      getOrder: async (input) => {
        const response = await fetchImpl(
          `${baseUrl}/api/orders/${input.orderId}?${toQueryString({
            organizationId: input.organizationId,
            marketCode: input.marketCode,
          })}`,
          { method: "GET", headers: { Accept: "application/json" } },
        );

        if (response.status === 404) {
          return null;
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new ApiError(
            String(
              (payload as { message?: unknown } | null)?.message ??
                response.statusText ??
                "Request failed",
            ),
            response.status,
          );
        }
        return payload as Order;
      },
    },
    pharmacy: {
      listInventory: (input) =>
        request<InventoryItem[]>(
          fetchImpl,
          `${baseUrl}/api/inventory?${toQueryString({
            organizationId: input.organizationId,
            marketCode: input.marketCode,
            limit: input.limit,
          })}`,
          jsonInit("GET"),
        ),
      listOrders: (input) =>
        request<Order[]>(
          fetchImpl,
          `${baseUrl}/api/orders?${toQueryString({
            organizationId: input.organizationId,
            marketCode: input.marketCode,
            page: input.page,
            pageSize: input.pageSize,
          })}`,
          jsonInit("GET"),
        ),
      listPrescriptions: (input) =>
        request<Prescription[]>(
          fetchImpl,
          `${baseUrl}/api/prescription-digital?${toQueryString({
            organizationId: input.organizationId,
            marketCode: input.marketCode,
            limit: input.limit,
          })}`,
          jsonInit("GET"),
        ),
      computeSettlements: (input) =>
        request<PharmacySettlement>(
          fetchImpl,
          `${baseUrl}/api/settlements/compute?${toQueryString({
            organizationId: input.organizationId,
            marketCode: input.marketCode,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
          })}`,
          jsonInit("GET"),
        ),
    },
  };
}

export const api = createApiClient();
