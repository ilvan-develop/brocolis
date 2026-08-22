"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { filterCatalogRows } from "@/lib/catalog";
import type { CatalogRow } from "@/lib/catalog-mapper";
import { offersForProduct } from "@/lib/product";
import { useCatalog } from "@/lib/query";
import { CatalogCard } from "./catalog-card";
import { CatalogSearch } from "./catalog-search";
import { CategoryChips } from "./category-chips";

export function CatalogGrid() {
  const catalog = useCatalog();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const visible = filterCatalogRows(catalog.rows, {
    query,
    categoryId,
  }) as CatalogRow[];

  if (catalog.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 w-full" />
        ))}
      </div>
    );
  }

  if (catalog.isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground text-sm">{t("catalog.error")}</p>
        <Button variant="outline" onClick={() => catalog.refetch()}>
          {t("catalog.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CatalogSearch onQueryChange={setQuery} />
      <CategoryChips
        categories={catalog.categories}
        selected={categoryId}
        onSelect={setCategoryId}
      />
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t("catalog.empty")}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {visible.length} {t("catalog.results")}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((row) => (
              <CatalogCard
                key={row.productId}
                row={row}
                offers={offersForProduct(catalog.data.offers, row.productId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
