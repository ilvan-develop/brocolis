"use client";

import type {
  Cart,
  GlobalProduct,
  MarketOffer,
  Order,
} from "@brocolis/contracts";
import { useQuery } from "@tanstack/react-query";
import { ApiError, api, type CatalogSearchItem } from "./api";
import {
  type CatalogData,
  type CatalogRow,
  type CategoryChip,
  mapCatalogToData,
} from "./catalog-mapper";
import { offersForProduct } from "./product";

export type CatalogScope = {
  organizationId?: string | null;
  marketCode?: string;
};

export const GUEST_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000000";
export const CATALOG_PAGE_SIZE = 50;
export const CATALOG_STALE_MS = 60_000;

export const EMPTY_CATALOG: CatalogData = {
  rows: [],
  offers: [],
  products: [],
  categories: [],
};

function scopeOrDefault(scope: CatalogScope): {
  organizationId: string;
  marketCode: string;
} {
  return {
    organizationId: scope.organizationId ?? GUEST_ORGANIZATION_ID,
    marketCode: scope.marketCode?.toUpperCase() ?? "AO",
  };
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function safeCatalogItems(items: unknown): CatalogSearchItem[] {
  return Array.isArray(items) ? (items as CatalogSearchItem[]) : [];
}

export type CatalogQuery = {
  data: CatalogData;
  rows: CatalogRow[];
  categories: CategoryChip[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

export function useCatalog(scope: CatalogScope = {}): CatalogQuery {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  const query = useQuery<CatalogData>({
    queryKey: ["catalog", marketCode, organizationId],
    queryFn: async () => {
      try {
        const response = await api.commerce.searchCatalog({
          organizationId,
          marketCode,
          limit: CATALOG_PAGE_SIZE,
        });
        const source = {
          offers: safeCatalogItems(response.items).map((item) => item.offer),
          products: safeCatalogItems(response.items).map(
            (item) => item.product,
          ),
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
      } catch (error) {
        if (isNotFound(error)) {
          return EMPTY_CATALOG;
        }
        throw error;
      }
    },
    initialData: EMPTY_CATALOG,
    staleTime: CATALOG_STALE_MS,
  });

  return {
    data: query.data,
    rows: query.data.rows,
    categories: query.data.categories,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}

export function useProductDetail(
  productId: string | undefined,
  scope: CatalogScope = {},
): {
  product: GlobalProduct | null;
  offers: MarketOffer[];
  isLoading: boolean;
  isError: boolean;
} {
  const catalog = useCatalog(scope);
  const product =
    catalog.data.products.find((item) => item.id === productId) ?? null;
  const offers =
    productId === undefined
      ? []
      : offersForProduct(catalog.data.offers, productId);
  return {
    product,
    offers,
    isLoading: catalog.isLoading,
    isError: catalog.isError,
  };
}

export function useCart(scope: CatalogScope = {}): {
  cart: Cart | null;
  isLoading: boolean;
  isError: boolean;
} {
  const { organizationId, marketCode } = scopeOrDefault(scope);
  const query = useQuery<Cart | null>({
    queryKey: ["cart", marketCode, organizationId],
    queryFn: async () => {
      try {
        return await api.commerce.getCart({ organizationId, marketCode });
      } catch (error) {
        if (isNotFound(error)) {
          return null;
        }
        throw error;
      }
    },
    initialData: null,
    staleTime: CATALOG_STALE_MS,
  });

  return {
    cart: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useOrder(
  input: {
    orderId?: string;
  } & CatalogScope,
): {
  order: Order | null;
  isLoading: boolean;
  isError: boolean;
} {
  const { organizationId, marketCode } = scopeOrDefault(input);
  const orderId = input.orderId ?? "";
  const query = useQuery<Order | null>({
    queryKey: ["order", orderId, marketCode, organizationId],
    enabled: orderId.length > 0,
    queryFn: async () => {
      try {
        return await api.commerce.getOrder({
          organizationId,
          marketCode,
          orderId,
        });
      } catch (error) {
        if (isNotFound(error)) {
          return null;
        }
        throw error;
      }
    },
    initialData: null,
    staleTime: CATALOG_STALE_MS,
  });

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
