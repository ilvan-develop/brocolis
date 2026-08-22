"use client";

import { tF4 } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Supplier } from "@brocolis/contracts";
import { listSuppliers } from "@/lib/procurement";
import { useSession } from "@/hooks/use-session";

const STATUS_VARIANT: Record<
  "ACTIVE" | "INACTIVE" | "SUSPENDED",
  "default" | "secondary" | "destructive"
> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  SUSPENDED: "destructive",
};

const SUPPLIER_STATUS_KEY: Record<
  Supplier["status"],
  "procurement.supplier.active" | "procurement.supplier.inactive" | "procurement.supplier.suspended"
> = {
  ACTIVE: "procurement.supplier.active",
  INACTIVE: "procurement.supplier.inactive",
  SUSPENDED: "procurement.supplier.suspended",
};

export default function SupplierListPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["suppliers", scope.organizationId, scope.marketCode],
    queryFn: () => listSuppliers(scope),
    enabled: scope.organizationId.length > 0,
  });

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
        <CardHeader>
          <CardTitle>{tF4("procurement.supplier.title")}</CardTitle>
          <CardDescription>
            {tF4("procurement.supplier.empty")}
          </CardDescription>
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
              {tF4("procurement.supplier.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.supplier.name")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.supplier.contact")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {tF4("procurement.supplier.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((supplier) => (
                  <tr key={supplier.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        href={`/supplier/${supplier.id}`}
                        className="hover:text-primary underline-offset-4 hover:underline"
                      >
                        {supplier.name}
                      </Link>
                    </td>
                    <td className="text-muted-foreground py-2 pr-4">
                      {supplier.contactEmail ?? supplier.contactPhone ?? "—"}
                    </td>
                    <td className="py-2">
                      <Badge variant={STATUS_VARIANT[supplier.status]}>
                        {tF4(`procurement.supplier.${supplier.status.toLowerCase()}`)}
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
