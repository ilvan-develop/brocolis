import { createHash } from "node:crypto";
import {
  controlledSubstancesIn,
  type EPrescription,
  type EPrescriptionValidationResult,
  ePrescriptionExpiry,
  type HealthcareProfessional,
  isEPrescriptionExpired,
  issueEPrescriptionInputSchema,
  policyForMarket,
  type RegulatoryPolicy,
  registerHealthcareProfessionalInputSchema,
  renewEPrescriptionInputSchema,
  revokeEPrescriptionInputSchema,
  setProfessionalVerificationInputSchema,
  validateEPrescriptionInputSchema,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import type { ComplianceService } from "../compliance/compliance.service.js";
import { nextCuid } from "../cuid.js";

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

export type PrescriptionScope = {
  organizationId: string;
  marketCode: string;
};

/**
 * F6 — receita digital: profissionais de saúde verificados emitem
 * e-prescriptions assinadas; a farmácia valida (estado, expiração por dias,
 * substâncias controladas da policy do mercado) antes de dispensar.
 */
@Injectable()
export class PrescriptionDigitalService {
  private readonly professionals = new Map<string, HealthcareProfessional>();
  private readonly prescriptions = new Map<string, EPrescription>();
  private readonly auditEvents: AuditLogEntry[] = [];
  private readonly compliance: ComplianceService | null;

  constructor(@Optional() compliance?: ComplianceService) {
    this.compliance = compliance ?? null;
  }

  async policyFor(marketCode: string): Promise<RegulatoryPolicy> {
    if (this.compliance) {
      return await this.compliance.policyForMarketOrDefault(marketCode);
    }
    return policyForMarket(marketCode, []);
  }

  registerProfessional(input: unknown): HealthcareProfessional {
    const parsed = registerHealthcareProfessionalInputSchema.parse(input);
    const now = new Date();
    const record: HealthcareProfessional = {
      id: nextCuid(),
      name: parsed.name,
      credential: parsed.credential,
      specialty: parsed.specialty,
      marketCode: parsed.marketCode,
      verificationStatus: "PENDING",
      organizationId: parsed.organizationId,
      createdAt: now,
      updatedAt: now,
    };
    this.professionals.set(record.id, record);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "rxdigital.professional.registered",
      resourceType: "healthcare_professional",
      resourceId: record.id,
      payload: { credentialType: parsed.credential.type },
    });
    return record;
  }

  setVerification(input: unknown): HealthcareProfessional {
    const parsed = setProfessionalVerificationInputSchema.parse(input);
    const record = this.getScopedProfessional(
      parsed.organizationId,
      parsed.marketCode,
      parsed.professionalId,
    );
    record.verificationStatus = parsed.status;
    record.updatedAt = new Date();
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action:
        parsed.status === "VERIFIED"
          ? "rxdigital.professional.verified"
          : "rxdigital.professional.suspended",
      resourceType: "healthcare_professional",
      resourceId: record.id,
      payload: { decidedBy: parsed.decidedBy },
    });
    return record;
  }

  getProfessional(
    organizationId: string,
    marketCode: string,
    professionalId: string,
  ): HealthcareProfessional {
    return this.getScopedProfessional(
      organizationId,
      marketCode,
      professionalId,
    );
  }

  async issue(input: unknown): Promise<EPrescription> {
    const parsed = issueEPrescriptionInputSchema.parse(input);
    const professional = this.getScopedProfessional(
      parsed.organizationId,
      parsed.marketCode,
      parsed.professionalId,
    );
    if (professional.verificationStatus !== "VERIFIED") {
      throw new BadRequestException(
        `Profissional em ${professional.verificationStatus} — só profissionais verificados emitem receitas digitais`,
      );
    }
    const policy = await this.policyFor(parsed.marketCode);
    if (parsed.daysValid > policy.maxPrescriptionDaysValid) {
      throw new BadRequestException(
        `daysValid ${parsed.daysValid} excede o máximo regulatório de ${policy.maxPrescriptionDaysValid} dias para o mercado ${parsed.marketCode}`,
      );
    }
    const now = new Date();
    const issuedAt = now;
    const expiresAt = ePrescriptionExpiry(issuedAt, parsed.daysValid);
    const record: EPrescription = {
      id: nextCuid(),
      professionalId: professional.id,
      patientRef: parsed.patientRef,
      items: parsed.items,
      issuedAt,
      expiresAt,
      daysValid: parsed.daysValid,
      signatureHash: this.sign(parsed, issuedAt),
      status: "ACTIVE",
      sourceMarketCode: parsed.marketCode,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      createdAt: now,
      updatedAt: now,
    };
    this.prescriptions.set(record.id, record);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "rxdigital.prescription.issued",
      resourceType: "e_prescription",
      resourceId: record.id,
      payload: {
        professionalId: professional.id,
        daysValid: record.daysValid,
        items: record.items.length,
      },
    });
    return record;
  }

  async validate(input: unknown): Promise<EPrescriptionValidationResult> {
    const parsed = validateEPrescriptionInputSchema.parse(input);
    const record = this.getScopedPrescription(
      parsed.organizationId,
      parsed.marketCode,
      parsed.prescriptionId,
    );
    const policy = await this.policyFor(parsed.marketCode);
    const reasons: string[] = [];
    if (record.status !== "ACTIVE") {
      reasons.push(`Receita em ${record.status}`);
    }
    if (isEPrescriptionExpired(record, new Date())) {
      reasons.push("Receita expirada");
    }
    const controlledSubstances = controlledSubstancesIn(
      record.items,
      policy.controlledSubstances,
    );
    for (const substance of controlledSubstances) {
      reasons.push(`Substância controlada: ${substance}`);
    }
    return {
      prescriptionId: record.id,
      pharmacyId: parsed.pharmacyId,
      valid: reasons.length === 0,
      reasons,
      controlledSubstances,
    };
  }

  dispense(input: unknown, pharmacistId: string): EPrescription {
    const parsed = validateEPrescriptionInputSchema.parse(input);
    const record = this.getScopedPrescription(
      parsed.organizationId,
      parsed.marketCode,
      parsed.prescriptionId,
    );
    if (record.status !== "ACTIVE") {
      throw new BadRequestException(
        `Receita em ${record.status} não pode ser dispensada`,
      );
    }
    if (isEPrescriptionExpired(record, new Date())) {
      throw new BadRequestException("Receita expirada — dispensa bloqueada");
    }
    record.status = "DISPENSED";
    record.updatedAt = new Date();
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "rxdigital.prescription.dispensed",
      resourceType: "e_prescription",
      resourceId: record.id,
      payload: { pharmacistId, pharmacyId: parsed.pharmacyId },
    });
    return record;
  }

  revoke(input: unknown): EPrescription {
    const parsed = revokeEPrescriptionInputSchema.parse(input);
    const record = this.getScopedPrescription(
      parsed.organizationId,
      parsed.marketCode,
      parsed.prescriptionId,
    );
    if (record.status !== "ACTIVE") {
      throw new BadRequestException(
        `Receita em ${record.status} não pode ser revogada`,
      );
    }
    record.status = "REVOKED";
    record.updatedAt = new Date();
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "rxdigital.prescription.revoked",
      resourceType: "e_prescription",
      resourceId: record.id,
      payload: { reason: parsed.reason },
    });
    return record;
  }

  async renew(input: unknown): Promise<EPrescription> {
    const parsed = renewEPrescriptionInputSchema.parse(input);
    const record = this.getScopedPrescription(
      parsed.organizationId,
      parsed.marketCode,
      parsed.prescriptionId,
    );
    if (record.status !== "ACTIVE") {
      throw new BadRequestException(
        `Receita em ${record.status} não pode ser renovada`,
      );
    }
    const policy = await this.policyFor(parsed.marketCode);
    if (parsed.daysValid > policy.maxPrescriptionDaysValid) {
      throw new BadRequestException(
        `daysValid ${parsed.daysValid} excede o máximo regulatório de ${policy.maxPrescriptionDaysValid} dias para o mercado ${parsed.marketCode}`,
      );
    }
    const renewedAt = new Date();
    record.daysValid = parsed.daysValid;
    record.expiresAt = ePrescriptionExpiry(renewedAt, parsed.daysValid);
    record.updatedAt = renewedAt;
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "rxdigital.prescription.renewed",
      resourceType: "e_prescription",
      resourceId: record.id,
      payload: { daysValid: record.daysValid },
    });
    return record;
  }

  getPrescription(
    organizationId: string,
    marketCode: string,
    prescriptionId: string,
  ): EPrescription {
    return this.getScopedPrescription(
      organizationId,
      marketCode,
      prescriptionId,
    );
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private getScopedProfessional(
    organizationId: string,
    marketCode: string,
    professionalId: string,
  ): HealthcareProfessional {
    const record = this.professionals.get(professionalId);
    if (
      !record ||
      record.organizationId !== organizationId ||
      record.marketCode !== marketCode
    ) {
      throw new NotFoundException(
        `Profissional ${professionalId} não encontrado`,
      );
    }
    return record;
  }

  private getScopedPrescription(
    organizationId: string,
    marketCode: string,
    prescriptionId: string,
  ): EPrescription {
    const record = this.prescriptions.get(prescriptionId);
    if (
      !record ||
      record.organizationId !== organizationId ||
      record.marketCode !== marketCode
    ) {
      throw new NotFoundException(
        `Receita digital ${prescriptionId} não encontrada`,
      );
    }
    return record;
  }

  private sign(
    input: { professionalId: string; patientRef: string; items: unknown },
    issuedAt: Date,
  ): string {
    return createHash("sha256")
      .update(
        JSON.stringify({
          professionalId: input.professionalId,
          patientRef: input.patientRef,
          items: input.items,
          issuedAt: issuedAt.toISOString(),
        }),
      )
      .digest("hex");
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "prescription-digital-service",
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
