"use client";

import { tF6 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useAuditEvents } from "@/lib/audit-query";

export default function AuditExplorerPage() {
  const { events, isLoading, isError, refetch } = useAuditEvents();

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
          {isError ? (
            <div className="flex flex-col gap-2">
              <p role="alert" className="text-destructive text-sm">
                {tF6("audit.events.title")}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {tF6("audit.events.export")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Input
                  placeholder={tF6("audit.events.search_placeholder")}
                  className="sm:max-w-xs"
                />
                <Button variant="outline" size="sm">
                  {tF6("audit.events.export")}
                </Button>
              </div>
              {isLoading ? (
                <div className="flex flex-col gap-2" aria-busy="true">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {tF6("audit.events.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{event.action}</span>
                        <span className="text-muted-foreground text-xs">
                          {event.resource}
                        </span>
                      </div>
                      <div className="flex flex-col text-right sm:text-left">
                        <span className="text-xs">
                          {tF6("audit.events.actor")}: {event.actor}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {tF6("audit.events.timestamp")}:{" "}
                          {event.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
