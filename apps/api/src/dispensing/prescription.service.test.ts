import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { PrescriptionService } from "./prescription.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const ORDER = "c000000000000000000000201";
const ORDER2 = "c000000000000000000000202";
const PHARMACIST = "c1234567890abcdef00000031";

const scope = { organizationId: ORG, marketCode: "AO" } as const;

const file = { uri: "https://cdn.brocolis.ao/rx/1.jpg", type: "image/jpeg" };

function upload(service: PrescriptionService, orderId = ORDER) {
  return service.upload({
    ...scope,
    orderId,
    files: [
      file,
      { uri: "https://cdn.brocolis.ao/rx/2.jpg", type: "image/png" },
    ],
  });
}

describe("PrescriptionService — transições de estado (RF-90/91)", () => {
  it("upload cria receita PENDING com anexos", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    expect(rx.status).toBe("PENDING");
    expect(rx.attachments).toHaveLength(2);
    expect(service.getForOrder(ORDER, scope)?.id).toBe(rx.id);
  });

  it("reabre via RESPONSE_REQUIRED para PENDING após novo upload", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    service.markResponseRequired(ORDER, scope);
    const reopened = upload(service);
    expect(reopened.id).toBe(rx.id);
    expect(reopened.status).toBe("PENDING");
  });

  it("APPROVE transita PENDING → APPROVED e guarda farmacêutico + notas", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    const decided = service.respond(
      {
        ...scope,
        prescriptionId: rx.id,
        action: "APPROVE",
        notes: "receita válida",
      },
      PHARMACIST,
    );
    expect(decided.status).toBe("APPROVED");
    expect(decided.pharmacistId).toBe(PHARMACIST);
    expect(decided.pharmacistNotes).toBe("receita válida");
  });

  it("REJECT transita PENDING → REJECTED", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    const decided = service.respond(
      { ...scope, prescriptionId: rx.id, action: "REJECT" },
      PHARMACIST,
    );
    expect(decided.status).toBe("REJECTED");
  });

  it("RESPONSE_REQUIRED pode ser decidida pelo farmacêutico", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    service.markResponseRequired(ORDER, scope);
    const decided = service.respond(
      { ...scope, prescriptionId: rx.id, action: "APPROVE" },
      PHARMACIST,
    );
    expect(decided.status).toBe("APPROVED");
  });

  it("rejeita decisão de receita já aprovada ou rejeitada", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    service.respond(
      { ...scope, prescriptionId: rx.id, action: "APPROVE" },
      PHARMACIST,
    );
    expect(() =>
      service.respond(
        { ...scope, prescriptionId: rx.id, action: "REJECT" },
        PHARMACIST,
      ),
    ).toThrowError(BadRequestException);
  });

  it("rejeita receita inexistente com NotFoundException", () => {
    const service = new PrescriptionService();
    expect(() =>
      service.respond(
        {
          ...scope,
          prescriptionId: "c000000000000000000000099",
          action: "APPROVE",
        },
        PHARMACIST,
      ),
    ).toThrowError(NotFoundException);
  });

  it("markResponseRequired só aceita PENDING", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    service.respond(
      { ...scope, prescriptionId: rx.id, action: "APPROVE" },
      PHARMACIST,
    );
    expect(() => service.markResponseRequired(ORDER, scope)).toThrowError(
      BadRequestException,
    );
  });

  it("getForOrder respeita o scoping de tenant+mercado", () => {
    const service = new PrescriptionService();
    upload(service);
    expect(
      service.getForOrder(ORDER, { organizationId: ORG, marketCode: "MZ" }),
    ).toBeNull();
    expect(service.getForOrder(ORDER2, scope)).toBeNull();
  });

  it("audita upload e decisão", () => {
    const service = new PrescriptionService();
    const rx = upload(service);
    service.respond(
      { ...scope, prescriptionId: rx.id, action: "APPROVE" },
      PHARMACIST,
    );
    const actions = service.getAuditEvents().map((e) => e.action);
    expect(actions).toContain("prescription.uploaded");
    expect(actions).toContain("prescription.approved");
  });
});
