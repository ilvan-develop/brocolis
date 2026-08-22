"use client";

import { formatDate } from "@brocolis/formatters";
import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@brocolis/ui/components/dialog";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { PrescriptionStatusBadge } from "@/components/pharmacy/prescription-status-badge";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import {
  canActOnPrescription,
  DEMO_PHARMACY_PRESCRIPTIONS,
  type PharmacyPrescription,
  prescriptionCounts,
  respondToPrescription,
  totalPending,
} from "@/lib/pharmacy-prescriptions";

const DETAIL_LABELS: readonly {
  key:
    | "pharmacy.prescriptions.patient"
    | "pharmacy.prescriptions.medication"
    | "pharmacy.prescriptions.reference"
    | "pharmacy.prescriptions.createdAt";
  render: (prescription: PharmacyPrescription) => string;
}[] = [
  {
    key: "pharmacy.prescriptions.patient",
    render: (prescription) => prescription.patientName,
  },
  {
    key: "pharmacy.prescriptions.medication",
    render: (prescription) => prescription.medication,
  },
  {
    key: "pharmacy.prescriptions.reference",
    render: (prescription) => prescription.reference,
  },
  {
    key: "pharmacy.prescriptions.createdAt",
    render: (prescription) => formatDate(prescription.createdAt),
  },
];

export default function PharmacyPrescriptionsPage() {
  const loading = useSimulatedLoad();
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescription[]>(
    () => [...DEMO_PHARMACY_PRESCRIPTIONS],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = prescriptionCounts(prescriptions);
  const sorted = [...prescriptions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const selected =
    prescriptions.find((prescription) => prescription.id === selectedId) ??
    null;

  function handleAction(id: string, action: "APPROVED" | "REJECTED") {
    setPrescriptions((previous) =>
      previous.map((prescription) =>
        prescription.id === id
          ? respondToPrescription(prescription, action, "Ação do farmacêutico")
          : prescription,
      ),
    );
    toast.success(
      t(
        action === "APPROVED"
          ? "pharmacy.prescriptions.approvedToast"
          : "pharmacy.prescriptions.rejectedToast",
      ),
    );
  }

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

      <div className="flex flex-wrap gap-4">
        {loading ? (
          ["pending", "approved", "rejected", "expired"].map((key) => (
            <Card key={key} className="min-w-40">
              <CardHeader className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))
        ) : (
          <>
            <Card className="min-w-40">
              <CardHeader className="flex flex-col gap-2">
                <CardDescription>
                  {t("pharmacy.prescriptions.pending")}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {totalPending(counts)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-40">
              <CardHeader className="flex flex-col gap-2">
                <CardDescription>
                  {t("pharmacy.prescriptions.approved")}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {counts.approved}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-40">
              <CardHeader className="flex flex-col gap-2">
                <CardDescription>
                  {t("pharmacy.prescriptions.rejected")}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {counts.rejected}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-40">
              <CardHeader className="flex flex-col gap-2">
                <CardDescription>
                  {t("pharmacy.prescriptions.expired")}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {counts.expired}
                </CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>
            <CardContent className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : error !== null ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
            <Button variant="outline" size="sm" onClick={() => setError(null)}>
              {t("catalog.retry")}
            </Button>
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("pharmacy.prescriptions.empty")}
          </p>
        ) : (
          sorted.map((prescription) => {
            const actionable = canActOnPrescription(prescription.status);
            return (
              <Card key={prescription.id}>
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{prescription.reference}</CardTitle>
                    <CardDescription>
                      {prescription.patientName} · {prescription.medication}
                    </CardDescription>
                  </div>
                  <PrescriptionStatusBadge status={prescription.status} />
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-sm">
                    {t("pharmacy.prescriptions.createdAt")}:{" "}
                    {formatDate(prescription.createdAt)}
                  </p>
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="justify-start px-0"
                  >
                    <a
                      href={prescription.documentUri}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("pharmacy.prescriptions.viewDocument")}
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedId(prescription.id)}
                  >
                    {t("pharmacy.prescriptions.details")}
                  </Button>
                </CardContent>
                {actionable && (
                  <CardFooter className="justify-start gap-2">
                    <Button
                      onClick={() => handleAction(prescription.id, "APPROVED")}
                    >
                      {t("pharmacy.prescriptions.approve")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(prescription.id, "REJECTED")}
                    >
                      {t("pharmacy.prescriptions.reject")}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
      >
        {selected !== null && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("pharmacy.prescriptions.details.title")}
              </DialogTitle>
              <DialogDescription>
                {selected.reference} ·{" "}
                <PrescriptionStatusBadge status={selected.status} />
              </DialogDescription>
            </DialogHeader>
            <dl className="text-muted-foreground flex flex-col gap-2 text-sm">
              {DETAIL_LABELS.map((label) => (
                <div key={label.key} className="flex justify-between gap-4">
                  <dt>{t(label.key)}</dt>
                  <dd className="text-foreground">{label.render(selected)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <dt>{t("pharmacy.prescriptions.notes")}</dt>
                <dd className="text-foreground">
                  {selected.pharmacistNotes ?? "—"}
                </dd>
              </div>
            </dl>
            <DialogFooter>
              <Button asChild variant="outline" size="sm">
                <a href={selected.documentUri} target="_blank" rel="noreferrer">
                  {t("pharmacy.prescriptions.viewDocument")}
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
