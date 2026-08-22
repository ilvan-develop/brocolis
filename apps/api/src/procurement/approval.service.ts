import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type ApprovalRecord = {
  id: string;
  purchaseOrderId: string;
  approverId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED";
  level: number;
  notes?: string;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DecideApprovalInput = {
  approvalId: string;
  decision: "APPROVED" | "REJECTED";
  approverId: string;
  notes?: string;
};

@Injectable()
export class ApprovalService {
  private readonly approvals = new Map<string, ApprovalRecord>();

  create(
    purchaseOrderId: string,
    approverId: string,
    level = 1,
  ): ApprovalRecord {
    const id = nextCuid();
    const now = new Date();
    const record: ApprovalRecord = {
      id,
      purchaseOrderId,
      approverId,
      status: "PENDING",
      level,
      createdAt: now,
      updatedAt: now,
    };
    this.approvals.set(id, record);
    return record;
  }

  getById(approvalId: string): ApprovalRecord {
    const approval = this.approvals.get(approvalId);
    if (!approval) {
      throw new NotFoundException(`Aprovação ${approvalId} não encontrada`);
    }
    return approval;
  }

  listByPurchaseOrder(purchaseOrderId: string): ApprovalRecord[] {
    return [...this.approvals.values()]
      .filter((a) => a.purchaseOrderId === purchaseOrderId)
      .sort((a, b) => a.level - b.level);
  }

  decide(input: DecideApprovalInput): ApprovalRecord {
    const approval = this.approvals.get(input.approvalId);
    if (!approval) {
      throw new NotFoundException(
        `Aprovação ${input.approvalId} não encontrada`,
      );
    }
    if (approval.status !== "PENDING") {
      throw new BadRequestException(
        `Aprovação ${input.approvalId} já foi decidida`,
      );
    }
    if (approval.approverId !== input.approverId) {
      throw new BadRequestException("Aprovador não autorizado");
    }
    approval.status = input.decision;
    approval.decidedAt = new Date();
    approval.updatedAt = new Date();
    if (input.notes) {
      approval.notes = input.notes;
    }
    return approval;
  }

  hasApproval(purchaseOrderId: string): boolean {
    const approvals = this.listByPurchaseOrder(purchaseOrderId);
    return (
      approvals.length > 0 && approvals.every((a) => a.status === "APPROVED")
    );
  }
}
