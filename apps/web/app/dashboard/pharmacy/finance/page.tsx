"use client";

import type { PharmacySettlement } from "@brocolis/contracts";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
} from "@brocolis/formatters";
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
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { SettlementStatusBadge } from "@/components/pharmacy/settlement-status-badge";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  DEMO_PHARMACY_SETTLEMENTS,
  PAYOUT_METHODS,
  settlementBalance,
} from "@/lib/pharmacy-finance";

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
          <th className="py-2 pr-4 font-medium">
            {t("pharmacy.finance.reserve")}
          </th>
          <th className="py-2 pr-4 font-medium">
            {t("pharmacy.finance.status")}
          </th>
          <th className="py-2 font-medium">
            {t("pharmacy.finance.finpayRef")}
          </th>
        </tr>
      </thead>
      <tbody>
        {settlements.map((s) => {
          const _balance = settlementBalance(s);
          return (
            <tr key={s.id} className="border-b last:border-0">
              <td className="py-2 pr-4 text-muted-foreground">
                {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
              </td>
              <td className="py-2 pr-4 font-medium">
                {formatCurrency(s.grossMinor, "AOA")}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                {formatCurrency(s.commissionMinor, "AOA")}
                <span className="block text-xs">
                  {formatPercentage(s.commissionRateBps / 100, { decimals: 1 })}
                </span>
              </td>
              <td className="py-2 pr-4">{formatCurrency(s.netMinor, "AOA")}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {formatCurrency(s.reserveMinor, "AOA")}
              </td>
              <td className="py-2 pr-4">
                <SettlementStatusBadge status={s.status} />
              </td>
              <td className="text-muted-foreground py-2">
                {s.finpayRef ? (
                  <Badge variant="outline">{s.finpayRef}</Badge>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function PharmacyFinancePage() {
  const loading = useSimulatedLoad();
  const [settlements] = useState<PharmacySettlement[]>(() => [
    ...DEMO_PHARMACY_SETTLEMENTS,
  ]);
  const [error, setError] = useState<string | null>(null);

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

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>{t("pharmacy.finance.settlements")}</CardTitle>
          <CardDescription>{t("pharmacy.finance.subtitle")}</CardDescription>
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
          ) : settlements.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("pharmacy.finance.empty")}
            </p>
          ) : (
            <SettlementTable settlements={settlements} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle>{t("pharmacy.finance.methods")}</CardTitle>
          <CardDescription>
            {t("pharmacy.finance.methodsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {PAYOUT_METHODS.map((method) => (
                <Card key={method.id} className="gap-2 py-4">
                  <CardContent>
                    <Badge variant="secondary">{t(method.key)}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
