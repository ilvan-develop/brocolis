import type {
  PurchaseOrder,
  Rfq,
  Supplier,
} from "@brocolis/contracts";

export type ProcurementScope = {
  organizationId: string;
  marketCode: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiError = {
  message: string;
  status: number;
};

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

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { message?: unknown } | null)?.message ??
      response.statusText;
    throw new Error(String(message ?? "Request failed"));
  }

  return payload as T;
}

export async function listSuppliers(
  scope: ProcurementScope,
): Promise<Paginated<Supplier>> {
  const query = new URLSearchParams({
    organizationId: scope.organizationId,
    marketCode: scope.marketCode,
  });
  return request<Paginated<Supplier>>(
    `/procurement/supplier?${query.toString()}`,
    jsonInit("GET"),
  );
}

export async function getSupplier(
  scope: ProcurementScope,
  supplierId: string,
): Promise<Supplier> {
  const query = new URLSearchParams({
    organizationId: scope.organizationId,
    marketCode: scope.marketCode,
  });
  return request<Supplier>(
    `/procurement/supplier/${supplierId}?${query.toString()}`,
    jsonInit("GET"),
  );
}

export async function listRfqs(
  scope: ProcurementScope,
): Promise<Paginated<Rfq>> {
  const query = new URLSearchParams({
    organizationId: scope.organizationId,
    marketCode: scope.marketCode,
  });
  return request<Paginated<Rfq>>(
    `/procurement/rfq?${query.toString()}`,
    jsonInit("GET"),
  );
}

export async function getRfq(
  scope: ProcurementScope,
  rfqId: string,
): Promise<Rfq> {
  const query = new URLSearchParams({
    organizationId: scope.organizationId,
    marketCode: scope.marketCode,
  });
  return request<Rfq>(
    `/procurement/rfq/${rfqId}?${query.toString()}`,
    jsonInit("GET"),
  );
}

export async function listPurchaseOrders(
  scope: ProcurementScope,
): Promise<Paginated<PurchaseOrder>> {
  const query = new URLSearchParams({
    organizationId: scope.organizationId,
    marketCode: scope.marketCode,
  });
  return request<Paginated<PurchaseOrder>>(
    `/procurement/purchase-order?${query.toString()}`,
    jsonInit("GET"),
  );
}

export async function getPurchaseOrder(
  scope: ProcurementScope,
  poId: string,
): Promise<PurchaseOrder> {
  const query = new URLSearchParams({
    organizationId: scope.organizationId,
    marketCode: scope.marketCode,
  });
  return request<PurchaseOrder>(
    `/procurement/purchase-order/${poId}?${query.toString()}`,
    jsonInit("GET"),
  );
}
