import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { database } from "@brocolis/db";

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

type QuotationWithItems = {
  id: string;
  organizationId: string;
  marketCode: string;
  rfqId: string;
  supplierId: string;
  reference: string;
  status: string;
  totalAmountMinor: number;
  currency: string;
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    productId: string;
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    currency: string;
  }[];
};

@Injectable()
export class QuotationService {
  async create(input: CreateQuotationInput): Promise<QuotationRecord> {
    const id = `c${Date.now().toString(36).padStart(12, "0")}`;
    const ref = `QT-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const record = await database().quotation.create({
      data: {
        id,
        organizationId: input.organizationId,
        marketCode: input.marketCode,
        rfqId: input.rfqId,
        supplierId: input.supplierId,
        reference: ref,
        status: "DRAFT",
        totalAmountMinor: input.totalAmountMinor,
        currency: input.currency ?? "AOA",
        validUntil: input.validUntil,
        notes: input.notes,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceMinor: i.unitPriceMinor,
            lineTotalMinor: i.quantity * i.unitPriceMinor,
            currency: input.currency ?? "AOA",
          })),
        },
        createdAt: now,
        updatedAt: now,
      },
      include: { items: true },
    });
    const qt = record as QuotationWithItems;
    return {
      ...qt,
      items: qt.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
      })),
    } as QuotationRecord;
  }

  async getById(
    organizationId: string,
    marketCode: string,
    quotationId: string,
  ): Promise<QuotationRecord> {
    const qt = await database().quotation.findUnique({
      where: { id: quotationId, organizationId, marketCode },
      include: { items: true },
    });
    if (!qt) {
      throw new NotFoundException(`Cotação ${quotationId} não encontrada`);
    }
    const q = qt as QuotationWithItems;
    return {
      ...q,
      items: q.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
      })),
    } as QuotationRecord;
  }

  async listByRfq(
    organizationId: string,
    marketCode: string,
    rfqId: string,
  ): Promise<QuotationRecord[]> {
    const items = await database().quotation.findMany({
      where: { organizationId, marketCode, rfqId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    const typed = items as QuotationWithItems[];
    return typed.map((qt) => {
      const q = qt as QuotationWithItems;
      return {
        ...q,
        items: q.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPriceMinor: i.unitPriceMinor,
        })),
      };
    }) as QuotationRecord[];
  }

  async advanceStatus(quotationId: string, to: QuotationStatus): Promise<QuotationRecord> {
    const qt = await database().quotation.findUnique({ where: { id: quotationId } });
    if (!qt) {
      throw new NotFoundException(`Cotação ${quotationId} não encontrada`);
    }
    const from = qt.status as QuotationStatus;
    const allowed = QT_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    const updated = await database().quotation.update({
      where: { id: quotationId },
      data: { status: to, updatedAt: new Date() },
      include: { items: true },
    });
    const q = updated as QuotationWithItems;
    return {
      ...q,
      items: q.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
      })),
    } as QuotationRecord;
  }
}
