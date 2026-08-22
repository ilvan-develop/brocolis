import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

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

@Injectable()
export class PurchaseOrderService {
  private readonly orders = new Map<string, PurchaseOrderRecord>();

  create(input: CreatePurchaseOrderInput): PurchaseOrderRecord {
    const id = nextCuid();
    const ref = `PO-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const record: PurchaseOrderRecord = {
      id,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      supplierId: input.supplierId,
      reference: ref,
      status: "DRAFT",
      totalAmountMinor: input.totalAmountMinor,
      currency: input.currency ?? "AOA",
      items: input.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
        lineTotalMinor: i.lineTotalMinor,
        currency: i.currency,
      })),
      createdAt: now,
      updatedAt: now,
      ...(input.quotationId ? { quotationId: input.quotationId } : {}),
      ...(input.requestedDeliveryDate
        ? { requestedDeliveryDate: input.requestedDeliveryDate }
        : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    };
    this.orders.set(id, record);
    return record;
  }

  getById(
    organizationId: string,
    marketCode: string,
    poId: string,
  ): PurchaseOrderRecord {
    const po = this.orders.get(poId);
    if (
      !po ||
      po.organizationId !== organizationId ||
      po.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Purchase Order ${poId} não encontrado`);
    }
    return po;
  }

  listByOrg(
    organizationId: string,
    marketCode: string,
    filters?: { status?: PoStatus; supplierId?: string },
    page = 1,
    pageSize = 20,
  ): {
    items: PurchaseOrderRecord[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let filtered = [...this.orders.values()].filter(
      (o) => o.organizationId === organizationId && o.marketCode === marketCode,
    );
    if (filters?.status) {
      filtered = filtered.filter((o) => o.status === filters.status);
    }
    if (filters?.supplierId) {
      filtered = filtered.filter((o) => o.supplierId === filters.supplierId);
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

  /** Scoped por organizationId+marketCode (regra 3) — ver RfqService.advanceStatus. */
  advanceStatus(
    organizationId: string,
    marketCode: string,
    poId: string,
    to: PoStatus,
  ): PurchaseOrderRecord {
    const po = this.getById(organizationId, marketCode, poId);
    const from = po.status;
    const allowed = PO_TRANSITIONS[from];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    po.status = to;
    po.updatedAt = new Date();
    return po;
  }
}
