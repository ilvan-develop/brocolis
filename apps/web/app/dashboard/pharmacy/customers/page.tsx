"use client";

import { formatCurrency, formatDate } from "@brocolis/formatters";
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
import { Input } from "@brocolis/ui/components/input";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  CUSTOMER_SEGMENT_KEY,
  customerSegment,
  DEMO_PHARMACY_CUSTOMERS,
  filterPharmacyCustomers,
  formatCustomerPhone,
  type PharmacyCustomer,
  sortCustomersByRecent,
} from "@/lib/pharmacy-customers";

export default function PharmacyCustomersPage() {
  const loading = useSimulatedLoad();
  const [customers] = useState<PharmacyCustomer[]>(() => [
    ...DEMO_PHARMACY_CUSTOMERS,
  ]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = sortCustomersByRecent(
    filterPharmacyCustomers(customers, query),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.customers.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.customers.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("pharmacy.customers.title")}</CardTitle>
            <CardDescription>
              {t("pharmacy.customers.subtitle")}
            </CardDescription>
          </div>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("pharmacy.customers.search.placeholder")}
            aria-label={t("pharmacy.customers.search.aria")}
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
              {t("pharmacy.customers.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.customers.name")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.customers.phone")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.customers.orders")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.customers.totalSpent")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.customers.lastOrder")}
                  </th>
                  <th className="py-2 font-medium">
                    {t("pharmacy.customers.segment")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const segment = customerSegment(customer);
                  return (
                    <tr key={customer.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{customer.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatCustomerPhone(customer.phoneNational)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {customer.orderCount}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatCurrency(customer.totalSpentMinor, "AOA")}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {customer.lastOrderAt === null
                          ? t("pharmacy.customers.never")
                          : formatDate(customer.lastOrderAt)}
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            segment === "recurring" ? "default" : "secondary"
                          }
                        >
                          {t(CUSTOMER_SEGMENT_KEY[segment])}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
