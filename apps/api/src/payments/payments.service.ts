import {
  createPaymentInputSchema,
  finpayWebhookSchema,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import type { FinPayAdapter } from "@brocolis/finpay";
import { finpay, HttpFinPayAdapter } from "@brocolis/finpay";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { nextCuid } from "../cuid.js";
import type { OrdersService } from "../orders/orders.service.js";

export type PaymentMethod = "CARD" | "WALLET" | "REFERENCE" | "COD" | "MOBILE";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";

export type PaymentRecord = {
  id: string;
  intentId: string;
  orderId: string;
  organizationId: string;
  marketCode: string;
  amountMinor: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type WebhookHandlingResult = {
  handled: boolean;
  payment: PaymentRecord | null;
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
 * Pagamentos F2 — cria PaymentIntent via @brocolis/finpay (mock) e consome
 * webhooks CONFIRMED/FAILED com idempotência por eventId (replay-safe).
 */
@Injectable()
export class PaymentsService {
  private readonly payments = new Map<string, PaymentRecord>();
  private readonly byOrder = new Map<string, string>();
  private readonly byIntent = new Map<string, string>();
  private readonly processedEvents = new Map<string, string>();
  private readonly auditEvents: AuditLogEntry[] = [];
  private readonly orders: OrdersService;
  private readonly adapter: FinPayAdapter;

  constructor(
    orders: OrdersService,
    @Optional() config?: ConfigService,
    @Optional() adapter?: FinPayAdapter,
  ) {
    this.orders = orders;
    if (adapter) {
      this.adapter = adapter;
    } else if (config) {
      const baseUrl = config.get<string>("FINPAY_API_URL");
      const apiKey = config.get<string | undefined>("FINPAY_API_KEY");
      this.adapter = baseUrl
        ? new HttpFinPayAdapter({ baseUrl, apiKey })
        : finpay;
    } else {
      this.adapter = finpay;
    }
  }

  async createPayment(input: unknown): Promise<PaymentRecord> {
    const parsed = createPaymentInputSchema.parse(input);
    const order = this.orders.getOrder({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      orderId: parsed.orderId,
    });
    if (order.status !== "PENDING") {
      throw new BadRequestException(
        `Pedido não está em PENDING para pagamento (${order.status})`,
      );
    }
    if (order.summary.totalMinor !== parsed.amountMinor) {
      throw new BadRequestException(
        `Montante não coincide com o total do pedido: ${parsed.amountMinor} vs ${order.summary.totalMinor}`,
      );
    }

    const existingPaymentId = this.byOrder.get(parsed.orderId);
    const existing = existingPaymentId
      ? this.payments.get(existingPaymentId)
      : undefined;
    if (existing && existing.amountMinor === parsed.amountMinor) {
      return existing;
    }

    const intent = await this.adapter.createIntent({
      orderId: parsed.orderId,
      amountMinor: parsed.amountMinor,
      currency: parsed.currency,
      paymentMethod: parsed.method,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      idempotencyKey: `order:${parsed.orderId}`,
    });

    const now = new Date();
    const payment: PaymentRecord = {
      id: nextCuid(),
      intentId: intent.intentId,
      orderId: parsed.orderId,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      amountMinor: parsed.amountMinor,
      currency: parseCurrency(parsed.currency),
      method: parsed.method,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(payment.id, payment);
    this.byOrder.set(payment.orderId, payment.id);
    this.byIntent.set(payment.intentId, payment.id);

    void this.emitAudit({
      organizationId: payment.organizationId,
      marketCode: payment.marketCode,
      action: "payment.intent_created",
      resourceType: "payment",
      resourceId: payment.id,
      payload: { intentId: payment.intentId, amountMinor: payment.amountMinor },
    });
    return payment;
  }

  async handleWebhook(input: unknown): Promise<WebhookHandlingResult> {
    const event = finpayWebhookSchema.parse(input);
    const processedPaymentId = this.processedEvents.get(event.eventId);
    if (processedPaymentId) {
      return {
        handled: false,
        payment: this.payments.get(processedPaymentId) ?? null,
      };
    }

    const payment = this.findByIntent(event.intentId);
    if (!payment) {
      throw new NotFoundException(
        `Pagamento associado ao intent ${event.intentId} não encontrado`,
      );
    }
    if (payment.amountMinor !== event.amountMinor) {
      throw new BadRequestException(
        "Montante do evento não coincide com o pagamento",
      );
    }

    if (event.eventType === "CONFIRMED") {
      if (payment.status !== "CONFIRMED") {
        payment.status = "CONFIRMED";
        payment.updatedAt = new Date();
        this.orders.advanceStatus(
          payment.orderId,
          "CONFIRMED",
          "pagamento confirmado",
        );
      }
    } else {
      if (payment.status !== "FAILED") {
        payment.status = "FAILED";
        payment.updatedAt = new Date();
      }
    }

    this.processedEvents.set(event.eventId, payment.id);
    void this.emitAudit({
      organizationId: payment.organizationId,
      marketCode: payment.marketCode,
      action:
        event.eventType === "CONFIRMED"
          ? "payment.confirmed"
          : "payment.failed",
      resourceType: "payment",
      resourceId: payment.id,
      payload: { eventId: event.eventId, intentId: event.intentId },
    });
    return { handled: true, payment };
  }

  getPaymentByOrder(orderId: string): PaymentRecord | null {
    const paymentId = this.byOrder.get(orderId);
    return paymentId ? (this.payments.get(paymentId) ?? null) : null;
  }

  /**
   * Marca o pagamento de um pedido como REFUNDED (F3 — reembolsos RF-73/103).
   * A transição externa FinPay é feita pelo chamador via `adapter.refund`.
   */
  markRefunded(orderId: string, note?: string): PaymentRecord {
    const payment = this.getPaymentByOrder(orderId);
    if (!payment) {
      throw new NotFoundException(
        `Pagamento do pedido ${orderId} não encontrado`,
      );
    }
    if (payment.status !== "CONFIRMED" && payment.status !== "REFUNDED") {
      throw new BadRequestException(
        `Pagamento ${payment.status} não é reembolsável`,
      );
    }
    if (payment.status !== "REFUNDED") {
      payment.status = "REFUNDED";
      payment.updatedAt = new Date();
      void this.emitAudit({
        organizationId: payment.organizationId,
        marketCode: payment.marketCode,
        action: "payment.refunded",
        resourceType: "payment",
        resourceId: payment.id,
        payload: { orderId, note: note ?? null },
      });
    }
    return payment;
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private findByIntent(intentId: string): PaymentRecord | undefined {
    const paymentId = this.byIntent.get(intentId);
    return paymentId ? this.payments.get(paymentId) : undefined;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "payments-service",
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

function parseCurrency(currency: string): string {
  return currency.toUpperCase();
}
