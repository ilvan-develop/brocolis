import type { PrescriptionStatus } from "@brocolis/contracts";
import type { MessageKey } from "@brocolis/i18n";
import type { BadgeVariant } from "./badge-variant";
import {
  daysFromNow,
  mockCuid,
  PHARMACY_MARKET,
  PHARMACY_ORG_ID,
} from "./pharmacy-data";

export type PharmacyPrescription = {
  id: string;
  orderId: string;
  reference: string;
  patientName: string;
  medication: string;
  documentUri: string;
  attachments: string[];
  status: PrescriptionStatus;
  pharmacistNotes: string | null;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export const PRESCRIPTION_STATUS_KEY: Record<PrescriptionStatus, MessageKey> = {
  PENDING: "pharmacy.prescriptions.status.pending",
  RESPONSE_REQUIRED: "pharmacy.prescriptions.status.responseRequired",
  APPROVED: "pharmacy.prescriptions.status.approved",
  REJECTED: "pharmacy.prescriptions.status.rejected",
  EXPIRED: "pharmacy.prescriptions.status.expired",
};

export function prescriptionStatusBadgeVariant(
  status: PrescriptionStatus,
): BadgeVariant {
  switch (status) {
    case "APPROVED":
      return "default";
    case "PENDING":
    case "RESPONSE_REQUIRED":
      return "secondary";
    case "REJECTED":
    case "EXPIRED":
      return "destructive";
  }
}

export function canActOnPrescription(status: PrescriptionStatus): boolean {
  return status === "PENDING" || status === "RESPONSE_REQUIRED";
}

export type PrescriptionCounts = {
  pending: number;
  responseRequired: number;
  approved: number;
  rejected: number;
  expired: number;
};

export function prescriptionCounts(
  prescriptions: readonly PharmacyPrescription[],
): PrescriptionCounts {
  const counts: PrescriptionCounts = {
    pending: 0,
    responseRequired: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  };
  for (const prescription of prescriptions) {
    switch (prescription.status) {
      case "PENDING":
        counts.pending += 1;
        break;
      case "RESPONSE_REQUIRED":
        counts.responseRequired += 1;
        break;
      case "APPROVED":
        counts.approved += 1;
        break;
      case "REJECTED":
        counts.rejected += 1;
        break;
      case "EXPIRED":
        counts.expired += 1;
        break;
    }
  }
  return counts;
}

export function totalPending(counts: PrescriptionCounts): number {
  return counts.pending + counts.responseRequired;
}

export function respondToPrescription(
  prescription: PharmacyPrescription,
  action: "APPROVED" | "REJECTED",
  notes: string | null,
): PharmacyPrescription {
  return { ...prescription, status: action, pharmacistNotes: notes };
}

function prescription(
  index: number,
  reference: string,
  patientName: string,
  medication: string,
  status: PrescriptionStatus,
  daysAgo: number,
  notes: string | null,
): PharmacyPrescription {
  const created = daysFromNow(-daysAgo);
  return {
    id: mockCuid(`rx-${index}`),
    orderId: mockCuid(`ord-${index + 10}`),
    reference,
    patientName,
    medication,
    documentUri: `https://cdn.brocolis.ao/rx/${reference.toLowerCase()}.pdf`,
    attachments: [`https://cdn.brocolis.ao/rx/${reference.toLowerCase()}.pdf`],
    status,
    pharmacistNotes: notes,
    organizationId: PHARMACY_ORG_ID,
    marketCode: PHARMACY_MARKET,
    createdAt: created,
    updatedAt:
      status === "PENDING" || status === "RESPONSE_REQUIRED"
        ? created
        : daysFromNow(-Math.max(daysAgo - 1, 0)),
  };
}

export const DEMO_PHARMACY_PRESCRIPTIONS: readonly PharmacyPrescription[] = [
  prescription(
    1,
    "RX-29382",
    "João Manuel",
    "Amoxicilina 500mg",
    "PENDING",
    0,
    null,
  ),
  prescription(
    2,
    "RX-29381",
    "Marta Sousa",
    "Azitromicina 500mg",
    "PENDING",
    0,
    "Confirmar dose para adulto.",
  ),
  prescription(
    3,
    "RX-29380",
    "Carlos Chicapa",
    "Metformina 850mg",
    "RESPONSE_REQUIRED",
    1,
    null,
  ),
  prescription(
    4,
    "RX-29379",
    "Teresa Cardoso",
    "Amoxicilina 500mg",
    "APPROVED",
    2,
    "Aprovada sem restrições.",
  ),
  prescription(
    5,
    "RX-29378",
    "Pedro Paulo",
    "Ibuprofeno 400mg",
    "APPROVED",
    3,
    null,
  ),
  prescription(
    6,
    "RX-29377",
    "Rui Mateus",
    "Diazepam 5mg",
    "REJECTED",
    4,
    "Receita fora do prazo de validade.",
  ),
  prescription(
    7,
    "RX-29376",
    "Luísa Mendes",
    "Paracetamol 1000mg",
    "EXPIRED",
    12,
    null,
  ),
];
