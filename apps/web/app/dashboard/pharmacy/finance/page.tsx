"use client";

import type { PharmacySettlement } from "@brocolis/contracts";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
} from "@brocolis/formatters";
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
import { SettlementStatusBadge } from "@/components/pharmacy/settlement-status-badge";
import { useSession } from "@/hooks/use-session";
import { usePharmacySettlements } from "@/lib/pharmacy-query";

function SettlementTable({
  settlements,
}: {
  settlements: PharmacySettlement[];
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground border-b text-left">
          <th className="py-2 pr-4 font-medium">
            {t("pharmacy.finance.period")}
          </th>
          <th className="py-2 pr-4 font-medium">
            {t("pharmacy.finance.gross")}
          </th>
          <th className="py-2 pr-4 font-medium">
            {t("pharmacy.finance.commission")}
          </th>
          <th className="py-2 pr-4 font-medium">{t("pharmacy.finance.net")}</th>
          <th className="py-2 font-medium">{t("pharmacy.finance.status")}</th>
        </tr>
      </thead>
      <tbody>
        {settlements.map((settlement) => (
          <tr key={settlement.id} className="border-b last:border-0">
            <td className="py-2 pr-4">
              {formatDate(settlement.periodStart)} —{" "}
              {formatDate(settlement.periodEnd)}
            </td>
            <td className="py-2 pr-4">
              {formatCurrency(settlement.grossMinor, "AOA")}
            </td>
            <td className="py-2 pr-4">
              {formatPercentage(settlement.commissionRateBps / 100)}
            </td>
            <td className="py-2 pr-4">
              {formatCurrency(settlement.netMinor, "AOA")}
            </td>
            <td className="py-2">
              <SettlementStatusBadge status={settlement.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PharmacyFinancePage() {
  const { state } = useSession();
  const scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

  const settlementsQuery = usePharmacySettlements(scope);
  const settlement = settlementsQuery.data;
  const isLoading = settlementsQuery.isLoading;
  const isError = settlementsQuery.isError;

  const balance = settlement
    ? {
        gross: settlement.grossMinor,
        commission: settlement.commissionMinor,
        net: settlement.netMinor,
      }
    : { gross: 0, commission: 0, net: 0 };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.finance.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.finance.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("pharmacy.finance.gross")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-semibold">
                {formatCurrency(balance.gross, "AOA")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("pharmacy.finance.commission")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-semibold">
                {formatCurrency(balance.commission, "AOA")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("pharmacy.finance.net")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-semibold">
                {formatCurrency(balance.net, "AOA")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pharmacy.finance.settlements")}</CardTitle>
          <CardDescription>{t("pharmacy.finance.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-start gap-2">
              <p role="alert" className="text-destructive text-sm">
                {t("error.generic")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => settlementsQuery.refetch()}
              >
                {t("catalog.retry")}
              </Button>
            </div>
          ) : settlement === undefined ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.finance.empty")}
            </p>
          ) : (
            <SettlementTable settlements={[settlement]} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
