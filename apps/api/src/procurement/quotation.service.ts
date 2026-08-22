import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type QuotationItemRecord = {
  productId: string;
  quantity: number;
  unitPriceMinor: number;
};

export type QuotationRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  rfqId: string;
  supplierId: string;
  reference: string;
  status: "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  totalAmountMinor: number;
  currency: string;
  validUntil?: Date;
  notes?: string;
  items: QuotationItemRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type QuotationStatus = QuotationRecord["status"];

export type CreateQuotationInput = {
  organizationId: string;
  marketCode: string;
  rfqId: string;
  supplierId: string;
  totalAmountMinor: number;
  currency?: string;
  validUntil?: Date;
  notes?: string;
  items: QuotationItemRecord[];
};

const QT_TRANSITIONS: Partial<Record<QuotationStatus, QuotationStatus[]>> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["ACCEPTED", "REJECTED", "EXPIRED"],
};

@Injectable()
export class QuotationService {
  private readonly quotations = new Map<string, QuotationRecord>();

  create(input: CreateQuotationInput): QuotationRecord {
    const id = nextCuid();
    const ref = `QT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const record: QuotationRecord = {
      id,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      rfqId: input.rfqId,
      supplierId: input.supplierId,
      reference: ref,
      status: "DRAFT",
      totalAmountMinor: input.totalAmountMinor,
      currency: input.currency ?? "AOA",
      items: input.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
      })),
      createdAt: now,
      updatedAt: now,
      ...(input.validUntil ? { validUntil: input.validUntil } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    };
    this.quotations.set(id, record);
    return record;
  }

  getById(
    organizationId: string,
    marketCode: string,
    quotationId: string,
  ): QuotationRecord {
    const qt = this.quotations.get(quotationId);
    if (
      !qt ||
      qt.organizationId !== organizationId ||
      qt.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Cotação ${quotationId} não encontrada`);
    }
    return qt;
  }

  listByRfq(
    organizationId: string,
    marketCode: string,
    rfqId: string,
  ): QuotationRecord[] {
    return [...this.quotations.values()]
      .filter(
        (q) =>
          q.organizationId === organizationId &&
          q.marketCode === marketCode &&
          q.rfqId === rfqId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Scoped por organizationId+marketCode (regra 3) — ver RfqService.advanceStatus. */
  advanceStatus(
    organizationId: string,
    marketCode: string,
    quotationId: string,
    to: QuotationStatus,
  ): QuotationRecord {
    const qt = this.getById(organizationId, marketCode, quotationId);
    const from = qt.status;
    const allowed = QT_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    qt.status = to;
    qt.updatedAt = new Date();
    return qt;
  }
}
