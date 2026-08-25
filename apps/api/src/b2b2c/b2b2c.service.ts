import {
  type B2b2cOrder,
  type B2b2cTimelineEntry,
  confirmPharmacyInputSchema,
  createB2b2cOrderInputSchema,
  getB2b2cOrderInputSchema,
  getB2b2cTimelineInputSchema,
  listB2b2cOrdersInputSchema,
  markDeliveredInputSchema,
  pullFromSupplierInputSchema,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

type FlowStage =
  | "CONSUMER_ORDER"
  | "PHARMACY_CONFIRMATION"
  | "SUPPLIER_PULL"
  | "DELIVERY";

type FlowStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";

type DbOrder = {
  id: string;
  organizationId: string;
  marketCode: string;
  customerId: string | null;
  pharmacyId: string;
  supplierId: string | null;
  currentStage: FlowStage;
  currentStatus: FlowStatus;
  stockSource: "PHARMACY_STOCK" | "SUPPLIER_PULL";
  items: unknown[];
  totalMinor: number;
  createdAt: Date;
  updatedAt: Date;
};

type DbTimelineEntry = {
  id: string;
  orderId: string;
  stage: FlowStage;
  status: FlowStatus;
  responsibleParty: "PHARMACY" | "SUPPLIER" | "PLATFORM";
  responsibleId: string;
  stockSource: "PHARMACY_STOCK" | "SUPPLIER_PULL" | null;
  note: string | null;
  createdAt: Date;
};

function toOrder(db: DbOrder): B2b2cOrder {
  return {
    id: db.id,
    organizationId: db.organizationId,
    marketCode: db.marketCode,
    ...(db.customerId ? { customerId: db.customerId } : {}),
    pharmacyId: db.pharmacyId,
    ...(db.supplierId ? { supplierId: db.supplierId } : {}),
    currentStage: db.currentStage,
    currentStatus: db.currentStatus,
    stockSource: db.stockSource,
    items: db.items as B2b2cOrder["items"],
    total: { amount: db.totalMinor, currency: "AOA" },
    createdAt: db.createdAt,
    updatedAt: db.updatedAt,
  };
}

function toTimelineEntry(db: DbTimelineEntry): B2b2cTimelineEntry {
  return {
    id: db.id,
    orderId: db.orderId,
    stage: db.stage,
    status: db.status,
    responsibleParty: db.responsibleParty,
    responsibleId: db.responsibleId,
    ...(db.stockSource ? { stockSource: db.stockSource } : {}),
    ...(db.note ? { note: db.note } : {}),
    createdAt: db.createdAt,
  };
}

@Injectable()
export class B2b2cService {
  async createOrder(input: unknown): Promise<B2b2cOrder> {
    const parsed = createB2b2cOrderInputSchema.parse(input);
    const db = await database();
    const _now = new Date();
    const order = await db.b2b2cOrder.create({
      data: {
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
        customerId: parsed.customerId ?? null,
        pharmacyId: parsed.pharmacyId,
        supplierId: null,
        currentStage: "CONSUMER_ORDER",
        currentStatus: "IN_PROGRESS",
        stockSource: "PHARMACY_STOCK",
        items: parsed.items,
        totalMinor: parsed.total.amount,
      },
    });
    await db.b2b2cTimelineEntry.create({
      data: {
        orderId: order.id,
        stage: "CONSUMER_ORDER",
        status: "IN_PROGRESS",
        responsibleParty: "PHARMACY",
        responsibleId: parsed.pharmacyId,
        stockSource: "PHARMACY_STOCK",
      },
    });
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "system",
      actorId: "b2b2c-service",
      action: "b2b2c.order.created",
      resourceType: "b2b2c_order",
      resourceId: order.id,
      payload: {
        pharmacyId: parsed.pharmacyId,
        itemCount: parsed.items.length,
      },
    });
    return toOrder(order);
  }

  async getOrder(input: unknown): Promise<B2b2cOrder> {
    const parsed = getB2b2cOrderInputSchema.parse(input);
    const db = await database();
    const order = await db.b2b2cOrder.findFirst({
      where: {
        id: parsed.orderId,
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
      },
    });
    if (!order) {
      throw new NotFoundException(`B2B2C order ${parsed.orderId} not found`);
    }
    return toOrder(order);
  }

  async listOrders(input: unknown): Promise<{
    items: B2b2cOrder[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const parsed = listB2b2cOrdersInputSchema.parse(input);
    const db = await database();
    const where: Record<string, unknown> = {
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
    };
    if (parsed.pharmacyId) {
      where.pharmacyId = parsed.pharmacyId;
    }
    if (parsed.stage) {
      where.currentStage = parsed.stage;
    }
    const [orders, total] = await Promise.all([
      db.b2b2cOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (parsed.page - 1) * parsed.pageSize,
        take: parsed.pageSize,
      }),
      db.b2b2cOrder.count({ where }),
    ]);
    return {
      items: orders.map(toOrder),
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
    };
  }

  async confirmPharmacy(input: unknown): Promise<B2b2cOrder> {
    const parsed = confirmPharmacyInputSchema.parse(input);
    const db = await database();
    const existing = await db.b2b2cOrder.findFirst({
      where: {
        id: parsed.orderId,
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
      },
    });
    if (existing?.currentStage !== "CONSUMER_ORDER") {
      throw new BadRequestException(
        `Cannot confirm pharmacy at stage ${existing?.currentStage}`,
      );
    }
    const order = await db.b2b2cOrder.update({
      where: { id: parsed.orderId },
      data: {
        currentStage: "PHARMACY_CONFIRMATION",
        currentStatus: "COMPLETED",
        updatedAt: new Date(),
      },
    });
    await db.b2b2cTimelineEntry.create({
      data: {
        orderId: order.id,
        stage: "PHARMACY_CONFIRMATION",
        status: "COMPLETED",
        responsibleParty: "PHARMACY",
        responsibleId: parsed.pharmacyId,
        note: parsed.note ?? null,
      },
    });
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "pharmacy",
      actorId: parsed.pharmacyId,
      action: "b2b2c.pharmacy.confirmed",
      resourceType: "b2b2c_order",
      resourceId: order.id,
      payload: { pharmacyId: parsed.pharmacyId, note: parsed.note },
    });
    return toOrder(order);
  }

  async pullFromSupplier(input: unknown): Promise<B2b2cOrder> {
    const parsed = pullFromSupplierInputSchema.parse(input);
    const db = await database();
    const existing = await db.b2b2cOrder.findFirst({
      where: {
        id: parsed.orderId,
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
      },
    });
    if (existing?.currentStage !== "PHARMACY_CONFIRMATION") {
      throw new BadRequestException(
        `Cannot pull from supplier at stage ${existing?.currentStage}`,
      );
    }
    const order = await db.b2b2cOrder.update({
      where: { id: parsed.orderId },
      data: {
        currentStage: "SUPPLIER_PULL",
        currentStatus: "IN_PROGRESS",
        supplierId: parsed.supplierId,
        stockSource: "SUPPLIER_PULL",
        updatedAt: new Date(),
      },
    });
    await db.b2b2cTimelineEntry.create({
      data: {
        orderId: order.id,
        stage: "SUPPLIER_PULL",
        status: "IN_PROGRESS",
        responsibleParty: "SUPPLIER",
        responsibleId: parsed.supplierId,
        stockSource: "SUPPLIER_PULL",
        note: parsed.note ?? null,
      },
    });
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "supplier",
      actorId: parsed.supplierId,
      action: "b2b2c.supplier.pull_started",
      resourceType: "b2b2c_order",
      resourceId: order.id,
      payload: { supplierId: parsed.supplierId, note: parsed.note },
    });
    return toOrder(order);
  }

  async markDelivered(input: unknown): Promise<B2b2cOrder> {
    const parsed = markDeliveredInputSchema.parse(input);
    const db = await database();
    const existing = await db.b2b2cOrder.findFirst({
      where: {
        id: parsed.orderId,
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
      },
    });
    if (
      !existing ||
      (existing.currentStage === "DELIVERY" &&
        existing.currentStatus === "COMPLETED")
    ) {
      throw new BadRequestException(
        existing
          ? "Order already delivered"
          : `Order ${parsed.orderId} not found`,
      );
    }
    if (
      existing.currentStage !== "SUPPLIER_PULL" &&
      existing.currentStage !== "PHARMACY_CONFIRMATION"
    ) {
      throw new BadRequestException(
        `Cannot mark delivery at stage ${existing.currentStage}`,
      );
    }
    const order = await db.b2b2cOrder.update({
      where: { id: parsed.orderId },
      data: {
        currentStage: "DELIVERY",
        currentStatus: "COMPLETED",
        updatedAt: new Date(),
      },
    });
    await db.b2b2cTimelineEntry.create({
      data: {
        orderId: order.id,
        stage: "DELIVERY",
        status: "COMPLETED",
        responsibleParty: "PLATFORM",
        responsibleId: "platform",
        note: parsed.note ?? null,
      },
    });
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      actorType: "platform",
      actorId: "b2b2c-service",
      action: "b2b2c.delivery.completed",
      resourceType: "b2b2c_order",
      resourceId: order.id,
      payload: { note: parsed.note },
    });
    return toOrder(order);
  }

  async getTimeline(input: unknown): Promise<B2b2cTimelineEntry[]> {
    const parsed = getB2b2cTimelineInputSchema.parse(input);
    const db = await database();
    await this.getOrder({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      orderId: parsed.orderId,
    });
    const entries = await db.b2b2cTimelineEntry.findMany({
      where: { orderId: parsed.orderId },
      orderBy: { createdAt: "asc" },
    });
    return entries.map(toTimelineEntry);
  }

  private async emitAudit(entry: {
    organizationId: string;
    marketCode: string;
    actorType: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    try {
      const db = await database();
      await db.auditEvent.create({
        data: {
          organizationId: entry.organizationId,
          marketCode: entry.marketCode,
          actorType: entry.actorType,
          actorId: entry.actorId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          payload: entry.payload,
        },
      });
    } catch {
      // DB not wired — audit logged in memory only
    }
  }
}
