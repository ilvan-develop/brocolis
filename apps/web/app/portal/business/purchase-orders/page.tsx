"use client";

import { formatCurrency } from "@brocolis/formatters";
import { type F4MessageKey, tF4 } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { listPurchaseOrders } from "@/lib/procurement";

const PO_STATUS_VARIANT: Record<
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CONFIRMED"
  | "IN_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED",
  "secondary" | "default" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  CONFIRMED: "default",
  IN_DELIVERY: "outline",
  DELIVERED: "default",
  COMPLETED: "default",
  CANCELED: "destructive",
};

export default function BusinessPurchaseOrdersPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchase-orders", scope.organizationId, scope.marketCode],
    queryFn: () => listPurchaseOrders(scope),
    enabled: scope.organizationId.length > 0,
  });

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF4("procurement.po.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tF4("procurement.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{tF4("procurement.po.title")}</CardTitle>
          <CardDescription>{tF4("procurement.po.empty")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <p role="alert" className="text-destructive text-sm">
              {tF4("error.generic")}
            </p>
          ) : data?.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tF4("procurement.po.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.po.reference")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.po.supplier")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.po.total")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.po.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((po) => (
                  <tr key={po.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{po.reference}</td>
                    <td className="text-muted-foreground py-2 pr-4">
                      {po.supplierId}
                    </td>
                    <td className="py-2 pr-4">
                      {formatCurrency(po.totalAmountMinor, po.currency)}
                    </td>
                    <td className="py-2">
                      <Badge variant={PO_STATUS_VARIANT[po.status]}>
                        {tF4(`procurement.status.${po.status}` as F4MessageKey)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
