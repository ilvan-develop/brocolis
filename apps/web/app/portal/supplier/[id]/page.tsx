"use client";

import { tF4, type F4MessageKey } from "@brocolis/i18n";
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
import { notFound } from "next/navigation";
import { getSupplier } from "@/lib/procurement";
import { useSession } from "@/hooks/use-session";

const STATUS_VARIANT: Record<
  "ACTIVE" | "INACTIVE" | "SUSPENDED",
  "default" | "secondary" | "destructive"
> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

export default function SupplierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ["supplier", params.id, scope.organizationId, scope.marketCode],
    queryFn: () => getSupplier(scope, params.id),
    enabled: scope.organizationId.length > 0,
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col gap-6 p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {tF4("procurement.supplier.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tF4("procurement.subtitle")}
          </p>
        </header>
        <Card>
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

  if (isError || !supplier) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {supplier.name}
          </h1>
          <Badge variant={STATUS_VARIANT[supplier.status]}>
            {tF4(`procurement.supplier.${supplier.status.toLowerCase()}` as F4MessageKey)}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {tF4("procurement.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.supplier.contact")}</CardTitle>
            <CardDescription>
              {tF4("procurement.supplier.title")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {tF4("procurement.supplier.name")}
                </dt>
                <dd className="font-medium">{supplier.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{supplier.contactEmail ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {tF4("procurement.supplier.contact")}
                </dt>
                <dd>{supplier.contactPhone ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.supplier.status")}</CardTitle>
            <CardDescription>
              {tF4("procurement.supplier.title")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {tF4("procurement.supplier.status")}
                </dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[supplier.status]}>
            {tF4(`procurement.supplier.${supplier.status.toLowerCase()}` as F4MessageKey)}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">ID</dt>
                <dd className="text-muted-foreground font-mono text-xs">
                  {supplier.id}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
