"use client";

import { tF4 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";

export default function SupplierCatalogPage() {
  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF4("procurement.pricing.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tF4("procurement.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{tF4("procurement.pricing.tier")}</CardTitle>
          <CardDescription>{tF4("procurement.pricing.minQty")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
