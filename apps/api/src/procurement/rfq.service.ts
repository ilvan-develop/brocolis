import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { database } from "@brocolis/db";

export type RfqRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  supplierId: string;
  reference: string;
  subject: string;
  status: "DRAFT" | "OPEN" | "QUOTED" | "AWARDED" | "CANCELED" | "EXPIRED";
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RfqStatus = RfqRecord["status"];

export type CreateRfqInput = {
  organizationId: string;
  marketCode: string;
  supplierId: string;
  subject: string;
  validUntil?: Date;
  notes?: string;
};

export type ListRfqsInput = {
  organizationId: string;
  marketCode: string;
  status?: RfqStatus;
  page?: number;
  pageSize?: number;
};

const RFQ_TRANSITIONS: Partial<Record<RfqStatus, RfqStatus[]>> = {
  DRAFT: ["OPEN", "CANCELED"],
  OPEN: ["QUOTED", "CANCELED", "EXPIRED"],
  QUOTED: ["AWARDED", "CANCELED"],
};

@Injectable()
export class RfqService {
  async create(input: CreateRfqInput): Promise<RfqRecord> {
    const id = `c${Date.now().toString(36).padStart(12, "0")}`;
    const ref = `RFQ-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const record = await database().rfq.create({
      data: {
        id,
        organizationId: input.organizationId,
        marketCode: input.marketCode,
        supplierId: input.supplierId,
        reference: ref,
        subject: input.subject,
        status: "DRAFT",
        validUntil: input.validUntil,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      },
    });
    return {
      ...record,
      validUntil: record.validUntil ?? undefined,
      notes: record.notes ?? undefined,
    } as RfqRecord;
  }

  async getById(
    organizationId: string,
    marketCode: string,
    rfqId: string,
  ): Promise<RfqRecord> {
    const rfq = await database().rfq.findUnique({
      where: { id: rfqId, organizationId, marketCode },
    });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${rfqId} não encontrado`);
    }
    return rfq as RfqRecord;
  }

  async listByOrg(input: ListRfqsInput): Promise<{
    items: RfqRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const where: Record<string, unknown> = {
      organizationId: input.organizationId,
      marketCode: input.marketCode,
    };
    if (input.status) {
      where.status = input.status;
    }
    const [items, total] = await Promise.all([
      database().rfq.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      database().rfq.count({ where }),
    ]);
    return {
      items: items as RfqRecord[],
      total,
      page,
      pageSize,
    };
  }

  async advanceStatus(rfqId: string, to: RfqStatus): Promise<RfqRecord> {
    const rfq = await database().rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${rfqId} não encontrado`);
    }
    const from = rfq.status as RfqStatus;
    const allowed = RFQ_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    const updated = await database().rfq.update({
      where: { id: rfqId },
      data: { status: to, updatedAt: new Date() },
    });
    return updated as RfqRecord;
  }
}
