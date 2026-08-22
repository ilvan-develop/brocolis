"use client";

import { formatCurrency } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@brocolis/ui/components/dialog";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  DEMO_PHARMACY_CATALOG,
  filterPharmacyCatalog,
  type PharmacyCatalogProduct,
  updateCatalogPrice,
} from "@/lib/pharmacy-catalog";
import { STOCK_TIER_KEY, stockBadgeVariant, stockTier } from "@/lib/product";

export default function PharmacyCatalogPage() {
  const loading = useSimulatedLoad();
  const [products, setProducts] = useState<PharmacyCatalogProduct[]>(() => [
    ...DEMO_PHARMACY_CATALOG,
  ]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PharmacyCatalogProduct | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = filterPharmacyCatalog(products, query);

  function openEdit(product: PharmacyCatalogProduct) {
    setEditing(product);
    setPriceValue(String(product.price.amount));
  }

  function handleSavePrice() {
    if (editing === null) {
      return;
    }
    const amount = Number(priceValue);
    if (!Number.isFinite(amount) || amount < 0) {
      setError(t("auth.error.required"));
      return;
    }
    setProducts((previous) =>
      updateCatalogPrice(previous, editing.productId, amount),
    );
    setError(null);
    setEditing(null);
    toast.success(t("pharmacy.catalog.priceUpdated"));
  }

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

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("pharmacy.catalog.title")}</CardTitle>
            <CardDescription>{t("pharmacy.catalog.subtitle")}</CardDescription>
          </div>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pharmacy.catalog.search.placeholder")}
            aria-label={t("pharmacy.catalog.search.aria")}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error !== null ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
              >
                {t("catalog.retry")}
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
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.catalog.presentation")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("product.price")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.catalog.stock")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.status")}
                  </th>
                  <th className="py-2 font-medium">
                    {t("pharmacy.orders.action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const tier = stockTier(product.stock);
                  return (
                    <tr
                      key={product.productId}
                      className="border-b last:border-0"
                    >
                      <td className="py-2 pr-4">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {product.brand}
                        </p>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {product.presentation}
                      </td>
                      <td className="py-2 pr-4 font-medium">
                        {formatCurrency(
                          product.price.amount,
                          product.price.currency,
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={stockBadgeVariant(tier)}>
                          {t(STOCK_TIER_KEY[tier])}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant={product.active ? "default" : "outline"}>
                          {t(
                            product.active
                              ? "pharmacy.catalog.active"
                              : "pharmacy.catalog.inactive",
                          )}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(product)}
                        >
                          {t("pharmacy.catalog.editPrice")}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        {editing !== null && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("pharmacy.catalog.priceDialogTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("pharmacy.catalog.priceDialogDescription")}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSavePrice();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="catalog-price">{t("product.price")}</Label>
                <Input
                  id="catalog-price"
                  type="number"
                  step="1"
                  min="0"
                  value={priceValue}
                  onChange={(event) => setPriceValue(event.target.value)}
                  aria-invalid={error !== null}
                />
                {error !== null && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  {t("pharmacy.catalog.cancel")}
                </Button>
                <Button type="submit">{t("pharmacy.catalog.save")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
