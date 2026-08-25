"use client";

import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Input } from "@brocolis/ui/components/input";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import type { CatalogRow } from "@/lib/catalog-mapper";
import { usePharmacyCatalog } from "@/lib/pharmacy-query";

export default function PharmacyCatalogPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const catalogQuery = usePharmacyCatalog(scope);
  const [query, setQuery] = useState("");

  const rows = catalogQuery.data?.rows ?? [];
  const filtered = rows.filter((row: { name: string }) =>
    row.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.catalog.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.catalog.subtitle")}
        </p>
      </header>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t("pharmacy.catalog.search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pharmacy.catalog.title")}</CardTitle>
          <CardDescription>{t("pharmacy.catalog.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {catalogQuery.isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : catalogQuery.isError ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                Something went wrong
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => catalogQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.catalog.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.catalog.product")}
                  </th>
                  <th className="py-2 pr-4 font-medium">Brand</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.catalog.stock")}
                  </th>
                  <th className="py-2 font-medium">Prescription</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row: CatalogRow) => (
                  <tr key={row.productId} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {row.brand}
                    </td>
                    <td className="py-2 pr-4">
                      {formatCurrency(row.price.amount, row.price.currency)}
                    </td>
                    <td className="py-2 pr-4">{row.totalStock}</td>
                    <td className="py-2">
                      {row.prescriptionRequired ? "Required" : "Not required"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
