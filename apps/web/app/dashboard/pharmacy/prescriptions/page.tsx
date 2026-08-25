"use client";

import type { Prescription } from "@brocolis/contracts";
import { formatDate } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useSession } from "@/hooks/use-session";
import { usePharmacyPrescriptions } from "@/lib/pharmacy-query";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  RESPONSE_REQUIRED: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  EXPIRED: "Expirada",
};

export default function PharmacyPrescriptionsPage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const prescriptionsQuery = usePharmacyPrescriptions(scope);
  const prescriptions = prescriptionsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.prescriptions.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.prescriptions.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("pharmacy.prescriptions.title")}</CardTitle>
          <CardDescription>
            {t("pharmacy.prescriptions.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptionsQuery.isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : prescriptionsQuery.isError ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                {t("error.generic")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => prescriptionsQuery.refetch()}
              >
                {t("catalog.retry")}
              </Button>
            </div>
          ) : prescriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.orders.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.prescriptions.reference")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.orders.number")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.prescriptions.status")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("pharmacy.prescriptions.createdAt")}
                  </th>
                  <th className="py-2 font-medium">Anexos</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx: Prescription) => (
                  <tr key={rx.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{rx.id}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {rx.orderId}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-xs font-medium">
                        {STATUS_LABEL[rx.status] ?? rx.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDate(rx.createdAt)}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {rx.attachments.length}
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
