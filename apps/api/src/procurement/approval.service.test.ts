import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { ApprovalService } from "./approval.service.js";

describe("ApprovalService", () => {
  let svc: ApprovalService;

  beforeEach(() => {
    svc = new ApprovalService();
  });

  it("creates approval in PENDING status", () => {
    const approval = svc.create("po-1", "user-1");
    expect(approval.status).toBe("PENDING");
    expect(approval.level).toBe(1);
    expect(approval.purchaseOrderId).toBe("po-1");
    expect(approval.approverId).toBe("user-1");
    expect(approval.id).toBeDefined();
    expect(approval.createdAt).toBeInstanceOf(Date);
    expect(approval.updatedAt).toBeInstanceOf(Date);
  });

  it("creates approval with custom level", () => {
    const approval = svc.create("po-1", "user-1", 2);
    expect(approval.level).toBe(2);
  });

  it("decides approval with APPROVED", () => {
    const approval = svc.create("po-1", "user-1");
    const decided = svc.decide({
      approvalId: approval.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    expect(decided.status).toBe("APPROVED");
    expect(decided.decidedAt).toBeInstanceOf(Date);
  });

  it("decides approval with REJECTED and notes", () => {
    const approval = svc.create("po-1", "user-1");
    const decided = svc.decide({
      approvalId: approval.id,
      decision: "REJECTED",
      approverId: "user-1",
      notes: "Fora do orçamento",
    });
    expect(decided.status).toBe("REJECTED");
    expect(decided.notes).toBe("Fora do orçamento");
  });

  it("rejects decision by wrong approver", () => {
    const approval = svc.create("po-1", "user-1");
    expect(() =>
      svc.decide({
        approvalId: approval.id,
        decision: "APPROVED",
        approverId: "user-2",
      }),
    ).toThrow(BadRequestException);
  });

  it("rejects double decision", () => {
    const approval = svc.create("po-1", "user-1");
    svc.decide({
      approvalId: approval.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    expect(() =>
      svc.decide({
        approvalId: approval.id,
        decision: "REJECTED",
        approverId: "user-1",
      }),
    ).toThrow(BadRequestException);
  });

  it("getById returns approval when found", () => {
    const approval = svc.create("po-1", "user-1");
    const found = svc.getById(approval.id);
    expect(found.id).toBe(approval.id);
  });

  it("getById throws NotFoundException for missing id", () => {
    expect(() => svc.getById("non-existent")).toThrow(NotFoundException);
  });

  it("listByPurchaseOrder returns approvals for a PO", () => {
    svc.create("po-1", "user-1", 1);
    svc.create("po-1", "user-2", 2);
    svc.create("po-2", "user-1", 1);

    const list = svc.listByPurchaseOrder("po-1");
    expect(list).toHaveLength(2);
    expect(list[0]!.level).toBe(1);
    expect(list[1]!.level).toBe(2);
  });

  it("listByPurchaseOrder returns empty array for PO with no approvals", () => {
    const list = svc.listByPurchaseOrder("po-nonexistent");
    expect(list).toHaveLength(0);
  });

  it("hasApproval returns true when all approved", () => {
    const a1 = svc.create("po-1", "user-1", 1);
    const a2 = svc.create("po-1", "user-2", 2);
    svc.decide({
      approvalId: a1.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    svc.decide({
      approvalId: a2.id,
      decision: "APPROVED",
      approverId: "user-2",
    });
    expect(svc.hasApproval("po-1")).toBe(true);
  });

  it("hasApproval returns false when pending", () => {
    svc.create("po-1", "user-1", 1);
    svc.create("po-1", "user-2", 2);
    expect(svc.hasApproval("po-1")).toBe(false);
  });

  it("hasApproval returns false when one is rejected", () => {
    const a1 = svc.create("po-1", "user-1", 1);
    const a2 = svc.create("po-1", "user-2", 2);
    svc.decide({
      approvalId: a1.id,
      decision: "APPROVED",
      approverId: "user-1",
    });
    svc.decide({
      approvalId: a2.id,
      decision: "REJECTED",
      approverId: "user-2",
    });
    expect(svc.hasApproval("po-1")).toBe(false);
  });

  it("hasApproval returns false when PO has no approvals", () => {
    expect(svc.hasApproval("po-nonexistent")).toBe(false);
  });
});
