"use client";

import { tF6 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Skeleton } from "@brocolis/ui/components/skeleton";

export default function AuditExplorerPage() {
  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF6("audit.events.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tF6("compliance.audit.title")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{tF6("audit.events.title")}</CardTitle>
          <CardDescription>{tF6("audit.events.filter_action")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2" aria-busy="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
