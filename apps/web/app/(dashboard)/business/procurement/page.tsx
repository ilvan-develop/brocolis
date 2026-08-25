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
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { listPurchaseOrders, listRfqs } from "@/lib/procurement";

export default function BusinessProcurementPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const rfqsQuery = useQuery({
    queryKey: ["rfqs", scope.organizationId, scope.marketCode],
    queryFn: () => listRfqs(scope),
    enabled: scope.organizationId.length > 0,
  });

  const poQuery = useQuery({
    queryKey: ["purchase-orders", scope.organizationId, scope.marketCode],
    queryFn: () => listPurchaseOrders(scope),
    enabled: scope.organizationId.length > 0,
  });

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF4("procurement.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tF4("procurement.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.rfq.title")}</CardTitle>
            <CardDescription>{tF4("procurement.rfq.empty")}</CardDescription>
          </CardHeader>
          <CardContent>
            {rfqsQuery.isLoading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <p className="text-muted-foreground text-sm">
                {rfqsQuery.data?.items.length ?? 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.po.title")}</CardTitle>
            <CardDescription>{tF4("procurement.po.empty")}</CardDescription>
          </CardHeader>
          <CardContent>
            {poQuery.isLoading ? (
              <Skeleton className="h-4 w-12" />
            ) : (
              <p className="text-muted-foreground text-sm">
                {poQuery.data?.items.length ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
