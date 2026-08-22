"use client";

import { tF4 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";

export default function SupplierPage() {
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.rfq.title")}</CardTitle>
            <CardDescription>{tF4("procurement.rfq.empty")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.quotation.title")}</CardTitle>
            <CardDescription>
              {tF4("procurement.quotation.empty")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tF4("procurement.po.title")}</CardTitle>
            <CardDescription>{tF4("procurement.po.empty")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">0</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
