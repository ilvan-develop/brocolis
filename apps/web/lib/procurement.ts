import type { PurchaseOrder, Rfq, Supplier } from "@brocolis/contracts";
import type { ApiClientDeps, ApiError } from "./api";
import { jsonInit, request, toQueryString } from "./api";

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

export type ProcurementClient = {
  listSuppliers: (scope: ProcurementScope) => Promise<Paginated<Supplier>>;
  getSupplier: (
    scope: ProcurementScope,
    supplierId: string,
  ) => Promise<Supplier>;
  listRfqs: (scope: ProcurementScope) => Promise<Paginated<Rfq>>;
  getRfq: (scope: ProcurementScope, rfqId: string) => Promise<Rfq>;
  listPurchaseOrders: (
    scope: ProcurementScope,
  ) => Promise<Paginated<PurchaseOrder>>;
  getPurchaseOrder: (
    scope: ProcurementScope,
    poId: string,
  ) => Promise<PurchaseOrder>;
};

export function createProcurementClient(
  deps: ApiClientDeps = {},
): ProcurementClient {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  const baseUrl = deps.baseUrl ?? "";

  return {
    listSuppliers: (scope) =>
      request<Paginated<Supplier>>(
        fetchImpl,
        `${baseUrl}/procurement/supplier?${toQueryString({
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
        })}`,
        jsonInit("GET"),
      ),

    getSupplier: (scope, supplierId) =>
      request<Supplier>(
        fetchImpl,
        `${baseUrl}/procurement/supplier/${supplierId}?${toQueryString({
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
        })}`,
        jsonInit("GET"),
      ),

    listRfqs: (scope) =>
      request<Paginated<Rfq>>(
        fetchImpl,
        `${baseUrl}/procurement/rfq?${toQueryString({
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
        })}`,
        jsonInit("GET"),
      ),

    getRfq: (scope, rfqId) =>
      request<Rfq>(
        fetchImpl,
        `${baseUrl}/procurement/rfq/${rfqId}?${toQueryString({
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
        })}`,
        jsonInit("GET"),
      ),

    listPurchaseOrders: (scope) =>
      request<Paginated<PurchaseOrder>>(
        fetchImpl,
        `${baseUrl}/procurement/purchase-order?${toQueryString({
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
        })}`,
        jsonInit("GET"),
      ),

    getPurchaseOrder: (scope, poId) =>
      request<PurchaseOrder>(
        fetchImpl,
        `${baseUrl}/procurement/purchase-order/${poId}?${toQueryString({
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
        })}`,
        jsonInit("GET"),
      ),
  };
}

export const listSuppliers = (scope: ProcurementScope) =>
  procurement.listSuppliers(scope);

export const getSupplier = (scope: ProcurementScope, supplierId: string) =>
  procurement.getSupplier(scope, supplierId);

export const listRfqs = (scope: ProcurementScope) =>
  procurement.listRfqs(scope);

export const getRfq = (scope: ProcurementScope, rfqId: string) =>
  procurement.getRfq(scope, rfqId);

export const listPurchaseOrders = (scope: ProcurementScope) =>
  procurement.listPurchaseOrders(scope);

export const getPurchaseOrder = (scope: ProcurementScope, poId: string) =>
  procurement.getPurchaseOrder(scope, poId);

export const procurement = createProcurementClient();
