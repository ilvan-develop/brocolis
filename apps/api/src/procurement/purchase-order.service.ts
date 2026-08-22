import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { database } from "@brocolis/db";

export type PurchaseOrderItemRecord = {
  productId: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currency: string;
};

export type PurchaseOrderRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  quotationId?: string;
  supplierId: string;
  reference: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "CONFIRMED"
    | "IN_DELIVERY"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELED";
  totalAmountMinor: number;
  currency: string;
  requestedDeliveryDate?: Date;
  notes?: string;
  items: PurchaseOrderItemRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type PoStatus = PurchaseOrderRecord["status"];

export type CreatePurchaseOrderInput = {
  organizationId: string;
  marketCode: string;
  quotationId?: string;
  supplierId: string;
  totalAmountMinor: number;
  currency?: string;
  requestedDeliveryDate?: Date;
  notes?: string;
  items: PurchaseOrderItemRecord[];
};

const PO_TRANSITIONS: Partial<Record<PoStatus, PoStatus[]>> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["CONFIRMED"],
  CONFIRMED: ["IN_DELIVERY"],
  IN_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
};

type PoWithItems = {
  id: string;
  organizationId: string;
  marketCode: string;
  quotationId?: string;
  supplierId: string;
  reference: string;
  status: string;
  totalAmountMinor: number;
  currency: string;
  requestedDeliveryDate?: Date;
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
export class PurchaseOrderService {
  async create(input: CreatePurchaseOrderInput): Promise<PurchaseOrderRecord> {
    const id = `po-${Date.now().toString(36).padStart(12, "0")}`;
    const ref = `PO-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const record = await database().purchaseOrder.create({
      data: {
        id,
        organizationId: input.organizationId,
        marketCode: input.marketCode,
        supplierId: input.supplierId,
        reference: ref,
        status: "DRAFT",
        totalAmountMinor: input.totalAmountMinor,
        currency: input.currency ?? "AOA",
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPriceMinor: i.unitPriceMinor,
            lineTotalMinor: i.lineTotalMinor,
            currency: i.currency,
          })),
        },
        ...(input.quotationId ? { quotationId: input.quotationId } : {}),
        ...(input.requestedDeliveryDate
          ? { requestedDeliveryDate: input.requestedDeliveryDate }
          : {}),
        ...(input.notes ? { notes: input.notes } : {}),
        createdAt: now,
        updatedAt: now,
      },
      include: { items: true },
    });
    const po = record as PoWithItems;
    return {
      ...po,
      items: po.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
        lineTotalMinor: i.lineTotalMinor,
        currency: i.currency,
      })),
    } as PurchaseOrderRecord;
  }

  async getById(
    organizationId: string,
    marketCode: string,
    poId: string,
  ): Promise<PurchaseOrderRecord> {
    const po = await database().purchaseOrder.findUnique({
      where: { id: poId, organizationId, marketCode },
      include: { items: true },
    });
    if (!po) {
      throw new NotFoundException(`Purchase Order ${poId} não encontrado`);
    }
    const p = po as PoWithItems;
    return {
      ...p,
      items: p.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
        lineTotalMinor: i.lineTotalMinor,
        currency: i.currency,
      })),
    } as PurchaseOrderRecord;
  }

  async listByOrg(
    organizationId: string,
    marketCode: string,
    filters?: { status?: PoStatus; supplierId?: string },
    page = 1,
    pageSize = 20,
  ): Promise<{
    items: PurchaseOrderRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where: Record<string, unknown> = {
      organizationId,
      marketCode,
    };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }
    const [rawItems, total] = await Promise.all([
      database().purchaseOrder.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      database().purchaseOrder.count({ where }),
    ]);
    const items = rawItems as PoWithItems[];
    return {
      items: items.map((po) => ({
        ...po,
        items: po.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPriceMinor: i.unitPriceMinor,
          lineTotalMinor: i.lineTotalMinor,
          currency: i.currency,
        })),
      })) as PurchaseOrderRecord[],
      total,
      page,
      pageSize,
    };
  }

  async advanceStatus(poId: string, to: PoStatus): Promise<PurchaseOrderRecord> {
    const po = await database().purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) {
      throw new NotFoundException(`Purchase Order ${poId} não encontrado`);
    }
    const from = po.status as PoStatus;
    const allowed = PO_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    const updated = await database().purchaseOrder.update({
      where: { id: poId },
      data: { status: to, updatedAt: new Date() },
      include: { items: true },
    });
    const p = updated as PoWithItems;
    return {
      ...p,
      items: p.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
        lineTotalMinor: i.lineTotalMinor,
        currency: i.currency,
      })),
    } as PurchaseOrderRecord;
  }
}
