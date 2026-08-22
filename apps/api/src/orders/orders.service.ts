import {
  getOrderInputSchema,
  listOrdersInputSchema,
} from "@brocolis/contracts";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELED";

export type OrderItemRecord = {
  productId: string;
  pharmacyId: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currency: string;
};

export type OrderSplitRecord = {
  pharmacyId: string;
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
};

export type OrderSummaryRecord = {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  vatMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
};

export type OrderRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  customerId?: string;
  status: OrderStatus;
  items: OrderItemRecord[];
  summary: OrderSummaryRecord;
  splits: OrderSplitRecord[];
  deliveryAddress?: {
    zone?: string | undefined;
    addressLine: string;
    city?: string | undefined;
    referencePoint?: string | undefined;
  };
  idempotencyKey?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
};

export type PlaceOrderInput = {
  id: string;
  organizationId: string;
  marketCode: string;
  customerId?: string | undefined;
  items: OrderItemRecord[];
  summary: OrderSummaryRecord;
  splits: OrderSplitRecord[];
  deliveryAddress?: {
    zone?: string | undefined;
    addressLine: string;
    city?: string | undefined;
    referencePoint?: string | undefined;
  };
  idempotencyKey?: string | undefined;
};

export type OrderStatusHistoryRecord = {
  id: string;
  orderId: string;
  from?: OrderStatus;
  to: OrderStatus;
  note?: string;
  createdAt: Date;
};

export type ListOrdersResult = {
  items: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
};

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["PROCESSING"],
  PROCESSING: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
};

export function validateStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Orders F2 — pedidos em memória com scoping tenant+mercado,
 * histórico de estados e validação de transições.
 */
@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, OrderRecord>();
  private readonly byIdempotency = new Map<string, string>();
  private readonly history = new Map<string, OrderStatusHistoryRecord[]>();

  place(input: PlaceOrderInput): OrderRecord {
    if (input.idempotencyKey) {
      const existingId = this.byIdempotency.get(input.idempotencyKey);
      if (existingId) {
        const existing = this.orders.get(existingId);
        if (existing) {
          return existing;
        }
      }
    }
    const now = new Date();
    const order: OrderRecord = {
      id: input.id,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      status: "PENDING",
      items: input.items,
      summary: input.summary,
      splits: input.splits,
      createdAt: now,
      updatedAt: now,
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      ...(input.deliveryAddress
        ? { deliveryAddress: input.deliveryAddress }
        : {}),
    };
    this.orders.set(order.id, order);
    if (input.idempotencyKey) {
      this.byIdempotency.set(input.idempotencyKey, order.id);
    }
    this.appendHistory(order.id, { to: "PENDING", note: "pedido criado" });
    return order;
  }

  getOrder(input: unknown): OrderRecord {
    const parsed = getOrderInputSchema.parse(input);
    const order = this.orders.get(parsed.orderId);
    if (
      !order ||
      order.organizationId !== parsed.organizationId ||
      order.marketCode !== parsed.marketCode
    ) {
      throw new NotFoundException(`Pedido ${parsed.orderId} não encontrado`);
    }
    return order;
  }

  findByIdempotencyKey(
    organizationId: string,
    marketCode: string,
    idempotencyKey: string,
  ): OrderRecord | null {
    const orderId = this.byIdempotency.get(idempotencyKey);
    if (!orderId) {
      return null;
    }
    const order = this.orders.get(orderId);
    if (
      !order ||
      order.organizationId !== organizationId ||
      order.marketCode !== marketCode
    ) {
      return null;
    }
    return order;
  }

  listByOrg(input: unknown): ListOrdersResult {
    const parsed = listOrdersInputSchema.parse(input);
    const filtered = [...this.orders.values()]
      .filter(
        (o) =>
          o.organizationId === parsed.organizationId &&
          o.marketCode === parsed.marketCode,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const start = (parsed.page - 1) * parsed.pageSize;
    return {
      items: filtered.slice(start, start + parsed.pageSize),
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
    };
  }

  /** Iteração completa e scoped — usada por settlements (F3) e leituras batch. */
  listAll(organizationId: string, marketCode: string): OrderRecord[] {
    return [...this.orders.values()].filter(
      (o) => o.organizationId === organizationId && o.marketCode === marketCode,
    );
  }

  advanceStatus(orderId: string, to: OrderStatus, note?: string): OrderRecord {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }
    const from = order.status;
    if (!validateStatusTransition(from, to)) {
      throw new BadRequestException(
        `Transição de estado inválida: ${from} → ${to}`,
      );
    }
    order.status = to;
    order.updatedAt = new Date();
    this.appendHistory(order.id, { from, to, ...(note != null && { note }) });
    return order;
  }

  historyFor(orderId: string): OrderStatusHistoryRecord[] {
    return this.history.get(orderId) ?? [];
  }

  private appendHistory(
    orderId: string,
    entry: { from?: OrderStatus; to: OrderStatus; note?: string },
  ): void {
    const list = this.history.get(orderId) ?? [];
    const record: OrderStatusHistoryRecord = {
      id: nextCuid(),
      orderId,
      to: entry.to,
      createdAt: new Date(),
      ...(entry.from ? { from: entry.from } : {}),
      ...(entry.note ? { note: entry.note } : {}),
    };
    list.push(record);
    this.history.set(orderId, list);
  }
}
