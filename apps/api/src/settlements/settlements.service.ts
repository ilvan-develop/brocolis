import { createSettlementInputSchema } from "@brocolis/contracts";
import { database } from "@brocolis/db";
import { type FinPayAdapter, finpay } from "@brocolis/finpay";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";
import type { OrdersService } from "../orders/orders.service.js";

export type SettlementStatus = "PENDING" | "PAID" | "FAILED";

export type SettlementComputation = {
  grossMinor: number;
  commissionRateBps: number;
  commissionMinor: number;
  reserveMinor: number;
  netMinor: number;
};

export type ConfirmedOrderLike = {
  amountMinor: number;
  confirmedAt: Date;
};

export type PharmacySettlementRecord = {
  id: string;
  pharmacyId: string;
  organizationId: string;
  marketCode: string;
  periodStart: Date;
  periodEnd: Date;
  grossMinor: number;
  commissionRateBps: number;
  commissionMinor: number;
  netMinor: number;
  reserveMinor: number;
  status: SettlementStatus;
  finpayRef?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const DEFAULT_COMMISSION_RATE_BPS = 500; // 5% (07-FINPAY §5)
const DEFAULT_RESERVE_DAYS = 7;

/**
 * Cálculo do settlement semanal (RF-104): comissão e reserva em int minor
 * units — zero floats (10-BEST-PRACTICES #2). Ordens cujo pagamento ainda
 * não venceu a reserva de N dias ficam retidas em `reserveMinor`.
 */
export function computeWeeklySettlement(
  confirmed: readonly ConfirmedOrderLike[],
  options: {
    commissionRateBps?: number;
    reserveDays?: number;
    now?: Date;
  } = {},
): SettlementComputation {
  const commissionRateBps =
    options.commissionRateBps ?? DEFAULT_COMMISSION_RATE_BPS;
  const reserveDays = options.reserveDays ?? DEFAULT_RESERVE_DAYS;
  const now = options.now ?? new Date();
  const cutoff = now.getTime() - reserveDays * 24 * 60 * 60 * 1000;

  let grossMinor = 0;
  let reserveMinor = 0;
  for (const payment of confirmed) {
    if (payment.confirmedAt.getTime() <= cutoff) {
      grossMinor += payment.amountMinor;
    } else {
      reserveMinor += payment.amountMinor;
    }
  }
  const commissionMinor = Math.floor((grossMinor * commissionRateBps) / 10000);
  const netMinor = grossMinor - commissionMinor;
  return {
    grossMinor,
    commissionRateBps,
    commissionMinor,
    reserveMinor,
    netMinor,
  };
}

export type PayoutLike = {
  payout?: (input: {
    settlementId: string;
    pharmacyId: string;
    amountMinor: number;
    currency: string;
    organizationId: string;
    marketCode: string;
  }) => Promise<{ reference?: string; ref?: string; payoutRef?: string }>;
};

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

/**
 * Settlements F3 — agrega pedidos entregues no período, calcula comissão e
 * reserva (RF-104) e persiste PharmacySettlement; o payout via FinPay é
 * chamado quando o adapter expõe `payout` (placeholder local caso contrário).
 */
@Injectable()
export class SettlementsService {
  private readonly settlements = new Map<string, PharmacySettlementRecord>();
  private readonly commissionRates = new Map<string, number>();
  private readonly auditEvents: AuditLogEntry[] = [];
  private readonly ordersService: OrdersService;
  private readonly adapter: FinPayAdapter & PayoutLike;

  constructor(orders: OrdersService, @Optional() adapter?: FinPayAdapter) {
    this.ordersService = orders;
    this.adapter = adapter ?? finpay;
  }

  setCommissionRate(
    organizationId: string,
    marketCode: string,
    rateBps: number,
  ): void {
    if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) {
      throw new BadRequestException(
        "CommissionRate deve estar entre 0 e 10000 bps",
      );
    }
    this.commissionRates.set(`${organizationId}:${marketCode}`, rateBps);
  }

  commissionRateFor(organizationId: string, marketCode: string): number {
    return (
      this.commissionRates.get(`${organizationId}:${marketCode}`) ??
      DEFAULT_COMMISSION_RATE_BPS
    );
  }

  /** Cálculo puro sobre o período — sem persistência. */
  computeSettlement(input: unknown): SettlementComputation {
    const parsed = createSettlementInputSchema.parse(input);
    const confirmed = this.paymentsInPeriod(parsed);
    const now = new Date();
    return computeWeeklySettlement(confirmed, {
      commissionRateBps: this.commissionRateFor(
        parsed.organizationId,
        parsed.marketCode,
      ),
      reserveDays: DEFAULT_RESERVE_DAYS,
      now,
    });
  }

  async createSettlement(input: unknown): Promise<PharmacySettlementRecord> {
    const parsed = createSettlementInputSchema.parse(input);
    const commissionRateBps = this.commissionRateFor(
      parsed.organizationId,
      parsed.marketCode,
    );
    const confirmed = this.paymentsInPeriod(parsed);
    const math = computeWeeklySettlement(confirmed, {
      commissionRateBps,
      reserveDays: DEFAULT_RESERVE_DAYS,
      now: parsed.periodEnd,
    });

    const now = new Date();
    const record: PharmacySettlementRecord = {
      id: nextCuid(),
      pharmacyId: parsed.pharmacyId,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      grossMinor: math.grossMinor,
      commissionRateBps: math.commissionRateBps,
      commissionMinor: math.commissionMinor,
      netMinor: math.netMinor,
      reserveMinor: math.reserveMinor,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    this.settlements.set(record.id, record);

    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "settlement.computed",
      resourceType: "pharmacy_settlement",
      resourceId: record.id,
      payload: {
        grossMinor: record.grossMinor,
        commissionMinor: record.commissionMinor,
        reserveMinor: record.reserveMinor,
        netMinor: record.netMinor,
      },
    });

    const ref = await this.payout(record);
    record.finpayRef = ref;
    record.status = ref.startsWith("payout_") ? "PAID" : "PENDING";
    this.settlements.set(record.id, record);
    return record;
  }

  getSettlement(
    organizationId: string,
    marketCode: string,
    settlementId: string,
  ): PharmacySettlementRecord {
    const record = this.settlements.get(settlementId);
    if (
      !record ||
      record.organizationId !== organizationId ||
      record.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Settlement ${settlementId} não encontrado`);
    }
    return record;
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private paymentsInPeriod(parsed: {
    organizationId: string;
    marketCode: string;
    pharmacyId: string;
    periodStart: Date;
    periodEnd: Date;
  }): ConfirmedOrderLike[] {
    const orders = this.ordersService.listAll(
      parsed.organizationId,
      parsed.marketCode,
    );
    const inPeriod = orders.filter(
      (order) =>
        order.status === "DELIVERED" &&
        order.updatedAt.getTime() >= parsed.periodStart.getTime() &&
        order.updatedAt.getTime() <= parsed.periodEnd.getTime(),
    );
    const confirmed: ConfirmedOrderLike[] = [];
    for (const order of inPeriod) {
      for (const split of order.splits) {
        if (split.pharmacyId !== parsed.pharmacyId) {
          continue;
        }
        confirmed.push({
          amountMinor: split.totalMinor,
          confirmedAt: order.updatedAt,
        });
      }
    }
    return confirmed;
  }

  private async payout(record: PharmacySettlementRecord): Promise<string> {
    if (typeof this.adapter.payout === "function") {
      const result = await this.adapter.payout({
        settlementId: record.id,
        pharmacyId: record.pharmacyId,
        amountMinor: record.netMinor,
        currency: "AOA",
        organizationId: record.organizationId,
        marketCode: record.marketCode,
      });
      return (
        result.reference ??
        result.ref ??
        result.payoutRef ??
        `payout_${record.id}`
      );
    }
    // @brocolis/finpay ainda não expõe payout — place onde local e fica PENDING.
    return `pending_${record.id}`;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "settlements-service",
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
