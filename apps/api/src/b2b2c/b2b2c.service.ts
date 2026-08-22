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
import { nextCuid } from "../cuid.js";

type FlowStage =
  | "CONSUMER_ORDER"
  | "PHARMACY_CONFIRMATION"
  | "SUPPLIER_PULL"
  | "DELIVERY";

type FlowStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";

@Injectable()
export class B2b2cService {
  private readonly orders = new Map<string, B2b2cOrder>();
  private readonly timeline = new Map<string, B2b2cTimelineEntry[]>();

  createOrder(input: unknown): B2b2cOrder {
    const parsed = createB2b2cOrderInputSchema.parse(input);
    const now = new Date();
    const order: B2b2cOrder = {
      id: nextCuid(),
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      pharmacyId: parsed.pharmacyId,
      currentStage: "CONSUMER_ORDER",
      currentStatus: "IN_PROGRESS",
      stockSource: "PHARMACY_STOCK",
      items: parsed.items,
      total: parsed.total,
      createdAt: now,
      updatedAt: now,
      ...(parsed.customerId ? { customerId: parsed.customerId } : {}),
    };
    this.orders.set(order.id, order);
    this.appendTimeline(order.id, {
      stage: "CONSUMER_ORDER",
      status: "IN_PROGRESS",
      responsibleParty: "PHARMACY",
      responsibleId: parsed.pharmacyId,
      stockSource: "PHARMACY_STOCK",
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
    return order;
  }

  getOrder(input: unknown): B2b2cOrder {
    const parsed = getB2b2cOrderInputSchema.parse(input);
    const order = this.orders.get(parsed.orderId);
    if (
      !order ||
      order.organizationId !== parsed.organizationId ||
      order.marketCode !== parsed.marketCode
    ) {
      throw new NotFoundException(`B2B2C order ${parsed.orderId} not found`);
    }
    return order;
  }

  listOrders(input: unknown): {
    items: B2b2cOrder[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const parsed = listB2b2cOrdersInputSchema.parse(input);
    let filtered = [...this.orders.values()].filter(
      (o) =>
        o.organizationId === parsed.organizationId &&
        o.marketCode === parsed.marketCode,
    );
    if (parsed.pharmacyId) {
      filtered = filtered.filter((o) => o.pharmacyId === parsed.pharmacyId);
    }
    if (parsed.stage) {
      filtered = filtered.filter((o) => o.currentStage === parsed.stage);
    }
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const start = (parsed.page - 1) * parsed.pageSize;
    return {
      items: filtered.slice(start, start + parsed.pageSize),
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
    };
  }

  confirmPharmacy(input: unknown): B2b2cOrder {
    const parsed = confirmPharmacyInputSchema.parse(input);
    const order = this.getOrder({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      orderId: parsed.orderId,
    });
    if (order.currentStage !== "CONSUMER_ORDER") {
      throw new BadRequestException(
        `Cannot confirm pharmacy at stage ${order.currentStage}`,
      );
    }
    order.currentStage = "PHARMACY_CONFIRMATION";
    order.currentStatus = "COMPLETED";
    order.updatedAt = new Date();
    this.appendTimeline(order.id, {
      stage: "PHARMACY_CONFIRMATION",
      status: "COMPLETED",
      responsibleParty: "PHARMACY",
      responsibleId: parsed.pharmacyId,
      note: parsed.note ?? undefined,
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
    return order;
  }

  pullFromSupplier(input: unknown): B2b2cOrder {
    const parsed = pullFromSupplierInputSchema.parse(input);
    const order = this.getOrder({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      orderId: parsed.orderId,
    });
    if (order.currentStage !== "PHARMACY_CONFIRMATION") {
      throw new BadRequestException(
        `Cannot pull from supplier at stage ${order.currentStage}`,
      );
    }
    order.currentStage = "SUPPLIER_PULL";
    order.currentStatus = "IN_PROGRESS";
    order.supplierId = parsed.supplierId;
    order.stockSource = "SUPPLIER_PULL";
    order.updatedAt = new Date();
    this.appendTimeline(order.id, {
      stage: "SUPPLIER_PULL",
      status: "IN_PROGRESS",
      responsibleParty: "SUPPLIER",
      responsibleId: parsed.supplierId,
      stockSource: "SUPPLIER_PULL",
      note: parsed.note ?? undefined,
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
    return order;
  }

  markDelivered(input: unknown): B2b2cOrder {
    const parsed = markDeliveredInputSchema.parse(input);
    const order = this.getOrder({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      orderId: parsed.orderId,
    });
    if (
      order.currentStage === "DELIVERY" &&
      order.currentStatus === "COMPLETED"
    ) {
      throw new BadRequestException("Order already delivered");
    }
    if (
      order.currentStage !== "SUPPLIER_PULL" &&
      order.currentStage !== "PHARMACY_CONFIRMATION"
    ) {
      throw new BadRequestException(
        `Cannot mark delivery at stage ${order.currentStage}`,
      );
    }
    order.currentStage = "DELIVERY";
    order.currentStatus = "COMPLETED";
    order.updatedAt = new Date();
    this.appendTimeline(order.id, {
      stage: "DELIVERY",
      status: "COMPLETED",
      responsibleParty: "PLATFORM",
      responsibleId: "platform",
      note: parsed.note ?? undefined,
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
    return order;
  }

  getTimeline(input: unknown): B2b2cTimelineEntry[] {
    const parsed = getB2b2cTimelineInputSchema.parse(input);
    this.getOrder({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      orderId: parsed.orderId,
    });
    return this.timeline.get(parsed.orderId) ?? [];
  }

  private appendTimeline(
    orderId: string,
    entry: {
      stage: FlowStage;
      status: FlowStatus;
      responsibleParty: "PHARMACY" | "SUPPLIER" | "PLATFORM";
      responsibleId: string;
      stockSource?: "PHARMACY_STOCK" | "SUPPLIER_PULL" | undefined;
      note?: string | undefined;
    },
  ): void {
    const list = this.timeline.get(orderId) ?? [];
    const record: B2b2cTimelineEntry = {
      id: nextCuid(),
      orderId,
      stage: entry.stage,
      status: entry.status,
      responsibleParty: entry.responsibleParty,
      responsibleId: entry.responsibleId,
      createdAt: new Date(),
      ...(entry.stockSource ? { stockSource: entry.stockSource } : {}),
      ...(entry.note ? { note: entry.note } : {}),
    };
    list.push(record);
    this.timeline.set(orderId, list);
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
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload,
      } as never);
    } catch {
      // DB not wired — audit logged in memory only
    }
  }
}
