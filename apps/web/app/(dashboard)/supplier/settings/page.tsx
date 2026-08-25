"use client";

import { tF4 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Label } from "@brocolis/ui/components/label";
import { Switch } from "@brocolis/ui/components/switch";
import { useSession } from "@/hooks/use-session";

export default function SupplierSettingsPage() {
  const { state } = useSession();
  const _scope = {
    organizationId: state.organization?.id ?? "",
    marketCode: state.marketCode ?? "AO",
  };

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
          <CardDescription>{tF4("procurement.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">
              {tF4("procurement.supplier.title")}
            </Label>
            <Switch id="notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="catalog-updates">
              {tF4("procurement.supplier.title")}
            </Label>
            <Switch id="catalog-updates" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
