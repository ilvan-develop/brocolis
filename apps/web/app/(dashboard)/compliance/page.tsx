"use client";

import { tF6 } from "@brocolis/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useComplianceDashboard } from "@/lib/compliance-query";

const SUBJECT_LABEL: Record<string, string> = {
  HEALTHCARE_PROFESSIONAL: "compliance.subject.healthcare_professional",
  PHARMACY: "compliance.subject.pharmacy",
  SUPPLIER: "compliance.subject.supplier",
  PRODUCT: "compliance.subject.product",
  E_PRESCRIPTION: "compliance.subject.e_prescription",
};

const DECISION_VARIANT: Record<string, "default" | "destructive" | "secondary"> = {
  APPROVED: "default",
  REJECTED: "destructive",
  ESCALATED: "secondary",
};

export default function CompliancePage() {
  const { data, isLoading, isError, refetch } = useComplianceDashboard();

  if (isError) {
    return (
      <main className="flex min-h-screen flex-col gap-6 p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {tF6("compliance.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tF6("compliance.policy.title")}
          </p>
        </header>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p role="alert" className="text-destructive text-sm">
              {tF6("compliance.title")}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {tF6("compliance.title")}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const policy = data?.policy;
  const decisions = data?.decisions ?? [];
  const saftExports = data?.saftExports ?? [];

  const approved = decisions.filter((d) => d.decision === "APPROVED").length;
  const rejected = decisions.filter((d) => d.decision === "REJECTED").length;
  const escalated = decisions.filter((d) => d.decision === "ESCALATED").length;

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {tF6("compliance.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {tF6("compliance.policy.title")}
        </p>
      </header>

      {isLoading || !policy ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>
                {tF6("compliance.policy.max_days")}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {policy.maxPrescriptionDays}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>
                {tF6("compliance.policy.saft_enabled")}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {policy.saftExportEnabled ? "ON" : "OFF"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>{tF6("compliance.audit.title")}</CardDescription>
              <CardTitle className="text-3xl font-semibold">
                {decisions.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{tF6("compliance.decision.approved")}</CardTitle>
          <CardDescription>
            {tF6("compliance.decision.rejected")} /{" "}
            {tF6("compliance.decision.escalated")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {tF6(SUBJECT_LABEL[decision.subject] ?? decision.subject)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {decision.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={DECISION_VARIANT[decision.decision]}>
                      {tF6(
                        `compliance.decision.${decision.decision.toLowerCase()}` as Parameters<
                          typeof tF6
                        >[0],
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tF6("compliance.saft.request")}</CardTitle>
          <CardDescription>{tF6("compliance.saft.queued")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {saftExports.map((saft) => (
                <div
                  key={saft.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{saft.id}</span>
                    <span className="text-muted-foreground text-xs">
                      {saft.periodStart.toLocaleDateString()} →{" "}
                      {saft.periodEnd.toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant={saft.status === "COMPLETED" ? "outline" : "secondary"}>
                    {saft.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
