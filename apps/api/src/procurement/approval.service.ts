import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { database } from "@brocolis/db";

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
  create(
    purchaseOrderId: string,
    approverId: string,
    level = 1,
  ): ApprovalRecord {
    const id = `ap-${Date.now().toString(36).padStart(12, "0")}`;
    const now = new Date();
    const record = database().approvalWorkflow.create({
      data: {
        id,
        purchaseOrderId,
        approverId,
        status: "PENDING",
        level,
        createdAt: now,
        updatedAt: now,
      },
    });
    return record as ApprovalRecord;
  }

  getById(approvalId: string): ApprovalRecord {
    const approval = database().approvalWorkflow.findUnique({
      where: { id: approvalId },
    });
    if (!approval) {
      throw new NotFoundException(`Aprovação ${approvalId} não encontrada`);
    }
    return approval as ApprovalRecord;
  }

  listByPurchaseOrder(purchaseOrderId: string): ApprovalRecord[] {
    return database().approvalWorkflow.findMany({
      where: { purchaseOrderId },
      orderBy: { level: "asc" },
    }) as ApprovalRecord[];
  }

  decide(input: DecideApprovalInput): ApprovalRecord {
    const approval = database().approvalWorkflow.findUnique({
      where: { id: input.approvalId },
    });
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
    const updated = database().approvalWorkflow.update({
      where: { id: input.approvalId },
      data: {
        status: input.decision,
        decidedAt: new Date(),
        updatedAt: new Date(),
        ...(input.notes ? { notes: input.notes } : {}),
      },
    });
    return updated as ApprovalRecord;
  }

  hasApproval(purchaseOrderId: string): boolean {
    const approvals = this.listByPurchaseOrder(purchaseOrderId);
    return (
      approvals.length > 0 && approvals.every((a) => a.status === "APPROVED")
    );
  }
}
