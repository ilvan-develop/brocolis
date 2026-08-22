import type { PrescriptionAttachment } from "@brocolis/contracts";
import {
  respondPrescriptionInputSchema,
  uploadPrescriptionInputSchema,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type PrescriptionStatus =
  | "PENDING"
  | "RESPONSE_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type PrescriptionRecord = {
  id: string;
  orderId: string;
  status: PrescriptionStatus;
  attachments: string[];
  pharmacistId?: string;
  pharmacistNotes?: string;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PrescriptionScope = {
  organizationId: string;
  marketCode: string;
};

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

const ALLOWED_RESPONDS = new Set<PrescriptionStatus>([
  "PENDING",
  "RESPONSE_REQUIRED",
]);

/**
 * Receitas F3 — upload com anexos (max 4), resposta do farmacêutico
 * (RF-90..91) e reabertura quando exige mais informação (RF-90).
 */
@Injectable()
export class PrescriptionService {
  private readonly prescriptions = new Map<string, PrescriptionRecord>();
  private readonly byOrder = new Map<string, string>();
  private readonly auditEvents: AuditLogEntry[] = [];

  upload(input: unknown): PrescriptionRecord {
    const parsed = uploadPrescriptionInputSchema.parse(input);
    const existingId = this.byOrder.get(parsed.orderId);
    const urls = parsed.files.map((f: PrescriptionAttachment) => f.uri);
    if (existingId) {
      const existing = this.prescriptions.get(existingId);
      if (!existing) {
        throw new NotFoundException("Receita associada não encontrada");
      }
      const wasDecided =
        existing.status === "REJECTED" ||
        existing.status === "RESPONSE_REQUIRED";
      existing.attachments = urls;
      existing.status = wasDecided ? "PENDING" : existing.status;
      existing.updatedAt = new Date();
      void this.emitAudit({
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
        action: "prescription.reopened",
        resourceType: "prescription",
        resourceId: existing.id,
        payload: { orderId: parsed.orderId, attachments: urls.length },
      });
      return existing;
    }

    const now = new Date();
    const record: PrescriptionRecord = {
      id: nextCuid(),
      orderId: parsed.orderId,
      status: "PENDING",
      attachments: urls,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      createdAt: now,
      updatedAt: now,
    };
    this.prescriptions.set(record.id, record);
    this.byOrder.set(record.orderId, record.id);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "prescription.uploaded",
      resourceType: "prescription",
      resourceId: record.id,
      payload: { orderId: parsed.orderId, attachments: urls.length },
    });
    return record;
  }

  respond(input: unknown, pharmacistId: string): PrescriptionRecord {
    const parsed = respondPrescriptionInputSchema.parse(input);
    const record = this.getScoped(
      parsed.organizationId,
      parsed.marketCode,
      parsed.prescriptionId,
    );
    if (!ALLOWED_RESPONDS.has(record.status)) {
      throw new BadRequestException(
        `Receita em ${record.status} não pode ser respondida`,
      );
    }
    record.status = parsed.action === "APPROVE" ? "APPROVED" : "REJECTED";
    record.pharmacistId = pharmacistId;
    if (parsed.notes) {
      record.pharmacistNotes = parsed.notes;
    }
    record.updatedAt = new Date();
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action:
        record.status === "APPROVED"
          ? "prescription.approved"
          : "prescription.rejected",
      resourceType: "prescription",
      resourceId: record.id,
      payload: { pharmacistId },
    });
    return record;
  }

  get(input: unknown): PrescriptionRecord {
    const { organizationId, marketCode, prescriptionId } =
      respondPrescriptionInputSchema
        .pick({
          organizationId: true,
          marketCode: true,
          prescriptionId: true,
        })
        .parse(input);
    return this.getScoped(organizationId, marketCode, prescriptionId);
  }

  getForOrder(
    orderId: string,
    scope: PrescriptionScope,
  ): PrescriptionRecord | null {
    const id = this.byOrder.get(orderId);
    if (!id) {
      return null;
    }
    const record = this.prescriptions.get(id);
    if (
      !record ||
      record.organizationId !== scope.organizationId ||
      record.marketCode !== scope.marketCode
    ) {
      return null;
    }
    return record;
  }

  /** RF-90 — farmacêutico pede mais informação antes de decidir. */
  markResponseRequired(
    orderId: string,
    scope: PrescriptionScope,
  ): PrescriptionRecord {
    const record = this.getForOrder(orderId, scope);
    if (!record) {
      throw new NotFoundException(
        `Receita do pedido ${orderId} não encontrada`,
      );
    }
    if (record.status !== "PENDING") {
      throw new BadRequestException(
        `Receita em ${record.status} não aceita pedido de resposta`,
      );
    }
    record.status = "RESPONSE_REQUIRED";
    record.updatedAt = new Date();
    return record;
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private getScoped(
    organizationId: string,
    marketCode: string,
    prescriptionId: string,
  ): PrescriptionRecord {
    const record = this.prescriptions.get(prescriptionId);
    if (
      !record ||
      record.organizationId !== organizationId ||
      record.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Receita ${prescriptionId} não encontrada`);
    }
    return record;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "prescription-service",
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload,
      } as never);
    } catch {
      // DB ainda não wired — auditoria fica registada em memória.
    }
  }
}
