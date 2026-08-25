"use client";

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
import { listRfqs } from "@/lib/procurement";

const RFQ_STATUS_VARIANT: Record<
  "DRAFT" | "OPEN" | "QUOTED" | "AWARDED" | "CANCELED" | "EXPIRED",
  "secondary" | "default" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  OPEN: "default",
  QUOTED: "outline",
  AWARDED: "default",
  CANCELED: "destructive",
  EXPIRED: "destructive",
};

export default function BusinessRfqPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rfqs", scope.organizationId, scope.marketCode],
    queryFn: () => listRfqs(scope),
    enabled: scope.organizationId.length > 0,
  });

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF4("procurement.rfq.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tF4("procurement.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{tF4("procurement.rfq.title")}</CardTitle>
          <CardDescription>{tF4("procurement.rfq.empty")}</CardDescription>
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
              {tF4("procurement.rfq.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.rfq.reference")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.rfq.subject")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.rfq.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((rfq) => (
                  <tr key={rfq.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{rfq.reference}</td>
                    <td className="py-2 pr-4">{rfq.subject}</td>
                    <td className="py-2">
                      <Badge variant={RFQ_STATUS_VARIANT[rfq.status]}>
                        {tF4(
                          `procurement.status.${rfq.status}` as F4MessageKey,
                        )}
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
