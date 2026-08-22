import {
  requestRefundInputSchema,
  verifyPharmacyInputSchema,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import { type FinPayAdapter, finpay } from "@brocolis/finpay";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";
import type { InventoryService } from "../inventory/inventory.service.js";
import type { OrdersService } from "../orders/orders.service.js";
import type { PaymentsService } from "../payments/payments.service.js";

export type PharmacyStatus =
  | "VERIFIED"
  | "PREMIUM_VERIFIED"
  | "PENDING_VERIFICATION"
  | "SUSPENDED";

export type PharmacyRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  name: string;
  slug: string;
  status: PharmacyStatus;
  ownerUserId: string;
  documentUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PharmacistRecord = {
  id: string;
  pharmacyId: string;
  userId: string;
  role: "PHARMACIST";
  active: boolean;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
};

export type PharmacyMembership = {
  pharmacyId: string;
  userId: string;
  role: "PHARMACIST";
};

export type RegistrarInput = {
  name: string;
  slug: string;
  organizationId: string;
  marketCode: string;
  ownerUserId: string;
};

export type PharmacyVerificationRecord = {
  id: string;
  pharmacyId: string;
  status: PharmacyStatus;
  documentUrls?: string[];
  verifiedBy?: string;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PharmacyScope = {
  organizationId: string;
  marketCode: string;
};

export type RefundStatus = "INITIATED" | "APPROVED" | "REFUNDED" | "FAILED";

export type RefundRecord = {
  id: string;
  orderId: string;
  amountMinor: number;
  reason: string;
  status: RefundStatus;
  organizationId: string;
  marketCode: string;
  finpayRef?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

const REFUNDABLE_STATUS = new Set([
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
]);

/**
 * Pharmacy F3 — registo de farmácia (owner vira farmacêutico), verificação
 * documental (RF-30/31) e reembolsos (RF-73/103) via FinPay.
 */
@Injectable()
export class PharmacyService {
  private readonly pharmacies = new Map<string, PharmacyRecord>();
  private readonly pharmacists = new Map<string, PharmacistRecord[]>();
  private readonly memberships = new Map<string, PharmacyMembership[]>();
  private readonly verifications = new Map<
    string,
    PharmacyVerificationRecord[]
  >();
  private readonly refunds = new Map<string, RefundRecord>();
  private readonly auditEvents: AuditLogEntry[] = [];
  private readonly ordersService: OrdersService;
  private readonly paymentsService: PaymentsService | null;
  private readonly inventoryService: InventoryService | null;
  private readonly adapter: FinPayAdapter;

  constructor(
    orders: OrdersService,
    @Optional() payments?: PaymentsService,
    @Optional() inventory?: InventoryService,
    @Optional() adapter?: FinPayAdapter,
  ) {
    this.ordersService = orders;
    this.paymentsService = payments ?? null;
    this.inventoryService = inventory ?? null;
    this.adapter = adapter ?? finpay;
  }

  registerPharmacy(input: RegistrarInput): {
    pharmacy: PharmacyRecord;
    pharmacist: PharmacistRecord;
  } {
    if (!input.name?.trim() || !input.slug?.trim()) {
      throw new BadRequestException("name e slug são obrigatórios");
    }
    const duplicate = [...this.pharmacies.values()].find(
      (p) => p.organizationId === input.organizationId && p.slug === input.slug,
    );
    if (duplicate) {
      throw new BadRequestException(
        `Farmácia com slug ${input.slug} já registada na organização`,
      );
    }
    const now = new Date();
    const pharmacy: PharmacyRecord = {
      id: nextCuid(),
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      name: input.name.trim(),
      slug: input.slug.trim(),
      status: "PENDING_VERIFICATION",
      ownerUserId: input.ownerUserId,
      createdAt: now,
      updatedAt: now,
    };
    this.pharmacies.set(pharmacy.id, pharmacy);

    const pharmacist: PharmacistRecord = {
      id: nextCuid(),
      pharmacyId: pharmacy.id,
      userId: input.ownerUserId,
      role: "PHARMACIST",
      active: true,
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      createdAt: now,
    };
    const roster = this.pharmacists.get(pharmacy.id) ?? [];
    roster.push(pharmacist);
    this.pharmacists.set(pharmacy.id, roster);
    const members = this.memberships.get(input.organizationId) ?? [];
    members.push({
      pharmacyId: pharmacy.id,
      userId: input.ownerUserId,
      role: "PHARMACIST",
    });
    this.memberships.set(input.organizationId, members);

    void this.emitAudit({
      organizationId: input.organizationId,
      marketCode: input.marketCode,
      action: "pharmacy.registered",
      resourceType: "pharmacy",
      resourceId: pharmacy.id,
      payload: { slug: pharmacy.slug, ownerUserId: input.ownerUserId },
    });
    return { pharmacy, pharmacist };
  }

  verifyPharmacy(input: unknown): PharmacyVerificationRecord {
    const parsed = verifyPharmacyInputSchema.parse(input);
    const pharmacy = this.getPharmacyScoped(parsed);
    const now = new Date();
    const verification: PharmacyVerificationRecord = {
      id: nextCuid(),
      pharmacyId: parsed.pharmacyId,
      status: parsed.status,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      createdAt: now,
      updatedAt: now,
      ...(parsed.documentUrls ? { documentUrls: parsed.documentUrls } : {}),
    };
    const history = this.verifications.get(parsed.pharmacyId) ?? [];
    history.push(verification);
    this.verifications.set(parsed.pharmacyId, history);
    pharmacy.status = parsed.status;
    pharmacy.updatedAt = now;
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "pharmacy.verified",
      resourceType: "pharmacy",
      resourceId: pharmacy.id,
      payload: { status: parsed.status },
    });
    return verification;
  }

  listPharmacistsByOrg(
    organizationId: string,
    marketCode?: string,
  ): PharmacistRecord[] {
    return [...this.pharmacists.values()]
      .flat()
      .filter(
        (p) =>
          p.organizationId === organizationId &&
          (marketCode === undefined || p.marketCode === marketCode) &&
          p.active,
      );
  }

  /**
   * Reembolso RF-73/103: Refund INITIATED → FinPay refund (intent CONFIRMED)
   * → Payment REFUNDED + stock reposto (movimento REFUND).
   */
  async refundOrder(orderId: string, input: unknown): Promise<RefundRecord> {
    const parsed = requestRefundInputSchema.parse({
      orderId,
      ...(input as object),
    });
    const order = this.getRefundableOrder(parsed.orderId, parsed);

    const payment = this.paymentsService?.getPaymentByOrder(orderId);
    const refund: RefundRecord = {
      id: nextCuid(),
      orderId,
      amountMinor: order.summary.totalMinor,
      reason: parsed.reason,
      status: "INITIATED",
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.refunds.set(refund.id, refund);

    try {
      if (payment) {
        if (payment.status !== "CONFIRMED") {
          refund.status = "FAILED";
          refund.updatedAt = new Date();
        } else {
          const intent = await this.adapter.refund(payment.intentId);
          refund.finpayRef = intent.intentId;
          refund.status = "REFUNDED";
          refund.updatedAt = new Date();
          this.paymentsService?.markRefunded(orderId, parsed.reason);
        }
      } else {
        refund.status = "APPROVED";
        refund.updatedAt = new Date();
      }
    } catch {
      refund.status = "FAILED";
      refund.updatedAt = new Date();
    }

    if (refund.status === "REFUNDED" || refund.status === "APPROVED") {
      this.inventoryService?.pushRefund(
        order.items,
        `reembolso do pedido ${orderId}`,
        parsed,
      );
    }

    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "order.refunded",
      resourceType: "refund",
      resourceId: refund.id,
      payload: {
        orderId,
        status: refund.status,
        amountMinor: refund.amountMinor,
      },
    });
    return refund;
  }

  getRefund(
    organizationId: string,
    marketCode: string,
    refundId: string,
  ): RefundRecord {
    const refund = this.refunds.get(refundId);
    if (
      !refund ||
      refund.organizationId !== organizationId ||
      refund.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Reembolso ${refundId} não encontrado`);
    }
    return refund;
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private getPharmacyScoped(
    parsed: PharmacyScope & { pharmacyId: string },
  ): PharmacyRecord {
    const pharmacy = this.pharmacies.get(parsed.pharmacyId);

    if (
      !pharmacy ||
      pharmacy.organizationId !== parsed.organizationId ||
      pharmacy.marketCode !== parsed.marketCode
    ) {
      throw new NotFoundException(
        `Farmácia ${parsed.pharmacyId} não encontrada`,
      );
    }
    return pharmacy;
  }

  private getRefundableOrder(orderId: string, parsed: PharmacyScope) {
    const order = this.ordersService.getOrder({
      orderId,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
    });
    if (!REFUNDABLE_STATUS.has(order.status)) {
      throw new BadRequestException(
        `Pedido em ${order.status} não é reembolsável`,
      );
    }
    return order;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "pharmacy-service",
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
