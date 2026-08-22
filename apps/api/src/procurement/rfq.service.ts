import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

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
  private readonly rfqs = new Map<string, RfqRecord>();

  create(input: CreateRfqInput): RfqRecord {
    const id = nextCuid();
    const ref = `RFQ-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const record: RfqRecord = {
      id,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      supplierId: input.supplierId,
      reference: ref,
      subject: input.subject,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
      ...(input.validUntil ? { validUntil: input.validUntil } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    };
    this.rfqs.set(id, record);
    return record;
  }

  getById(
    organizationId: string,
    marketCode: string,
    rfqId: string,
  ): RfqRecord {
    const rfq = this.rfqs.get(rfqId);
    if (
      !rfq ||
      rfq.organizationId !== organizationId ||
      rfq.marketCode !== marketCode
    ) {
      throw new NotFoundException(`RFQ ${rfqId} não encontrado`);
    }
    return rfq;
  }

  listByOrg(input: ListRfqsInput): {
    items: RfqRecord[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    let filtered = [...this.rfqs.values()].filter(
      (r) =>
        r.organizationId === input.organizationId &&
        r.marketCode === input.marketCode,
    );
    if (input.status) {
      filtered = filtered.filter((r) => r.status === input.status);
    }
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Scoped por organizationId+marketCode (regra 3) — usa getById para que
   * uma tentativa cross-tenant resulte em 404, nunca num 400 que confirme
   * a existência do recurso noutra organização.
   */
  advanceStatus(
    organizationId: string,
    marketCode: string,
    rfqId: string,
    to: RfqStatus,
  ): RfqRecord {
    const rfq = this.getById(organizationId, marketCode, rfqId);
    const from = rfq.status;
    const allowed = RFQ_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    rfq.status = to;
    rfq.updatedAt = new Date();
    return rfq;
  }
}
