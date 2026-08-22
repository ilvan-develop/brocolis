import { createOrderInputSchema } from "@brocolis/contracts";
import { database } from "@brocolis/db";
import { BadRequestException, Injectable, Optional } from "@nestjs/common";
import type { CartRecord, CartService } from "../cart/cart.service.js";
import { nextCuid } from "../cuid.js";
import type {
  OrderSummaryRecord,
  OrdersService,
} from "../orders/orders.service.js";

export type DeliveryFeeConfig = {
  zoneFees: Record<string, number>;
  flatFee: number;
};

export const DEFAULT_DELIVERY_FEES: DeliveryFeeConfig = {
  zoneFees: { urban: 1500, suburban: 3500 },
  flatFee: 2500,
};

export type CreateCheckoutOptions = {
  organizationId: string;
  marketCode: string;
  customerId?: string;
  deliveryAddress?: {
    zone?: string;
    addressLine: string;
    city?: string;
    referencePoint?: string;
  };
  idempotencyKey?: string;
  deliveryFees?: DeliveryFeeConfig;
};

export type OrderTotalsResult = {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  discountMinor: number;
};

export function computeDeliveryFee(
  zone: string | undefined,
  config: DeliveryFeeConfig = DEFAULT_DELIVERY_FEES,
): number {
  if (!zone) {
    return config.flatFee;
  }
  return config.zoneFees[zone] ?? config.flatFee;
}

export function computeOrderTotals(
  items: readonly { unitPriceMinor: number; quantity: number }[],
  deliveryFeeMinor: number,
  discountMinor = 0,
): OrderTotalsResult {
  const subtotalMinor = items.reduce(
    (sum, item) => sum + item.unitPriceMinor * item.quantity,
    0,
  );
  const totalMinor = Math.max(
    0,
    subtotalMinor + deliveryFeeMinor - discountMinor,
  );
  return { subtotalMinor, deliveryFeeMinor, totalMinor, discountMinor };
}

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

/**
 * Checkout F2 — cria o pedido a partir do carrinho com total em minor units,
 * idempotência por idempotencyKey e AuditEvent na mesma operação.
 */
@Injectable()
export class CheckoutService {
  private readonly auditEvents: AuditLogEntry[] = [];
  private readonly fees: DeliveryFeeConfig;

  constructor(
    readonly _cart: CartService,
    private readonly orders: OrdersService,
    @Optional() deliveryFees?: DeliveryFeeConfig,
  ) {
    this.fees = deliveryFees ?? DEFAULT_DELIVERY_FEES;
  }

  createOrder(cart: CartRecord, options: CreateCheckoutOptions) {
    const scope = createOrderInputSchema
      .pick({
        organizationId: true,
        marketCode: true,
        customerId: true,
        deliveryAddress: true,
        idempotencyKey: true,
      })
      .parse(options);

    if (
      cart.organizationId !== scope.organizationId ||
      cart.marketCode !== scope.marketCode
    ) {
      throw new BadRequestException(
        "Carrinho e scope de checkout não coincidem",
      );
    }
    if (cart.items.length === 0) {
      throw new BadRequestException("Carrinho vazio");
    }

    if (scope.idempotencyKey) {
      const existing = this.orders.findByIdempotencyKey(
        scope.organizationId,
        scope.marketCode,
        scope.idempotencyKey,
      );
      if (existing) {
        return existing;
      }
    }

    const items = cart.items.map((item) => ({
      productId: item.productId,
      pharmacyId: item.pharmacyId,
      quantity: item.quantity,
      unitPriceMinor: item.unitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
      currency: item.currency,
    }));

    const deliveryFeeMinor = computeDeliveryFee(
      scope.deliveryAddress?.zone,
      this.fees,
    );
    const totals = computeOrderTotals(items, deliveryFeeMinor);

    const splits = this.buildSplits(items);
    const summary: OrderSummaryRecord = {
      subtotalMinor: totals.subtotalMinor,
      deliveryFeeMinor: totals.deliveryFeeMinor,
      vatMinor: 0,
      discountMinor: totals.discountMinor,
      totalMinor: totals.totalMinor,
      currency: cart.currency,
    };

    const order = this.orders.place({
      id: nextCuid(),
      organizationId: scope.organizationId,
      marketCode: scope.marketCode,
      items,
      summary,
      splits,
      ...(scope.customerId ? { customerId: scope.customerId } : {}),
      ...(scope.idempotencyKey ? { idempotencyKey: scope.idempotencyKey } : {}),
      ...(scope.deliveryAddress
        ? { deliveryAddress: scope.deliveryAddress }
        : {}),
    });

    void this.emitAudit({
      organizationId: order.organizationId,
      marketCode: order.marketCode,
      action: "order.created",
      resourceType: "order",
      resourceId: order.id,
      payload: {
        totalMinor: order.summary.totalMinor,
        itemCount: items.length,
      },
    });
    return order;
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private buildSplits(
    items: readonly {
      productId: string;
      pharmacyId: string;
      quantity: number;
      unitPriceMinor: number;
      lineTotalMinor: number;
      currency: string;
    }[],
  ) {
    const byPharmacy = new Map<string, (typeof items)[number][]>();
    for (const item of items) {
      const bucket = byPharmacy.get(item.pharmacyId);
      if (bucket) {
        bucket.push(item);
      } else {
        byPharmacy.set(item.pharmacyId, [item]);
      }
    }
    const splits: {
      pharmacyId: string;
      subtotalMinor: number;
      deliveryFeeMinor: number;
      totalMinor: number;
      currency: string;
    }[] = [];
    for (const [pharmacyId, bucket] of byPharmacy) {
      const subtotalMinor = bucket.reduce(
        (sum, item) => sum + item.lineTotalMinor,
        0,
      );
      splits.push({
        pharmacyId,
        subtotalMinor,
        deliveryFeeMinor: 0,
        totalMinor: subtotalMinor,
        currency: bucket[0]?.currency ?? "AOA",
      });
    }
    return splits;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "checkout-service",
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload,
      } as never);
    } catch {
      // DB ainda não wired — auditoria fica registada em memória.
    }
  }
}
