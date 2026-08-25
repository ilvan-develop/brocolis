"use client";

import type {
  InventoryItem,
  Order,
  PharmacySettlement,
  Prescription,
} from "@brocolis/contracts";
import { useQuery } from "@tanstack/react-query";
import type { CatalogSearchItem } from "./api";
import { api } from "./api";
import type { CatalogData } from "./catalog-mapper";
import { mapCatalogToData } from "./catalog-mapper";
import { EMPTY_CATALOG } from "./query";

function safeCatalogItems(items: unknown): CatalogSearchItem[] {
  return Array.isArray(items) ? (items as CatalogSearchItem[]) : [];
}

export type PharmacyScope = {
  organizationId: string;
  marketCode: string;
};

function scopeOrDefault(scope: Partial<PharmacyScope> = {}): PharmacyScope {
  return {
    organizationId: scope.organizationId ?? "",
    marketCode: scope.marketCode?.toUpperCase() ?? "AO",
  };
}

export function usePharmacyOrders(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery<Order[]>({
    queryKey: ["pharmacy", "orders", marketCode, organizationId],
    queryFn: async () =>
      api.pharmacy.listOrders({ organizationId, marketCode, pageSize: 100 }),
    enabled: organizationId.length > 0,
    initialData: [],
  });
}

export function usePharmacyInventory(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery<InventoryItem[]>({
    queryKey: ["pharmacy", "inventory", marketCode, organizationId],
    queryFn: async () =>
      api.pharmacy.listInventory({ organizationId, marketCode, limit: 100 }),
    enabled: organizationId.length > 0,
    initialData: [],
  });
}

export function usePharmacySettlements(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery<PharmacySettlement>({
    queryKey: ["pharmacy", "settlements", marketCode, organizationId],
    queryFn: async () =>
      api.pharmacy.computeSettlements({ organizationId, marketCode }),
    enabled: organizationId.length > 0,
    initialData: {
      id: "",
      pharmacyId: "",
      organizationId,
      marketCode,
      periodStart: new Date(),
      periodEnd: new Date(),
      grossMinor: 0,
      commissionRateBps: 0,
      commissionMinor: 0,
      netMinor: 0,
      reserveMinor: 0,
      status: "PENDING",
      createdAt: new Date(),
    },
  });
}

export function usePharmacyPrescriptions(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery<Prescription[]>({
    queryKey: ["pharmacy", "prescriptions", marketCode, organizationId],
    queryFn: async () =>
      api.pharmacy.listPrescriptions({
        organizationId,
        marketCode,
        limit: 100,
      }),
    enabled: organizationId.length > 0,
    initialData: [],
  });
}

export function usePharmacyCustomers(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery({
    queryKey: ["pharmacy", "customers", marketCode, organizationId],
    queryFn: async () =>
      api.commerce.searchCatalog({
        organizationId,
        marketCode,
        limit: 100,
      }),
    enabled: organizationId.length > 0,
    initialData: { items: [], page: 1, pageSize: 100, total: 0 },
  });
}

export function usePharmacyDeliveries(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery({
    queryKey: ["pharmacy", "deliveries", marketCode, organizationId],
    queryFn: async () =>
      api.commerce.searchCatalog({
        organizationId,
        marketCode,
        limit: 100,
      }),
    enabled: organizationId.length > 0,
    initialData: { items: [], page: 1, pageSize: 100, total: 0 },
  });
}

export function usePharmacyCatalog(scope: Partial<PharmacyScope> = {}) {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  return useQuery<CatalogData>({
    queryKey: ["pharmacy", "catalog", marketCode, organizationId],
    queryFn: async () => {
      const response = await api.commerce.searchCatalog({
        organizationId,
        marketCode,
        limit: 100,
      });
      const source = {
        offers: safeCatalogItems(response.items).map((item) => item.offer),
        products: safeCatalogItems(response.items).map((item) => item.product),
        brands: safeCatalogItems(response.items)
          .map((item) => item.brand)
          .filter(
            (brand): brand is NonNullable<typeof brand> => brand !== null,
          ),
        categories: safeCatalogItems(response.items)
          .map((item) => item.category)
          .filter(
            (category): category is NonNullable<typeof category> =>
              category !== null,
          ),
      };
      return mapCatalogToData(source);
    },
    enabled: organizationId.length > 0,
    initialData: EMPTY_CATALOG,
  });
}
