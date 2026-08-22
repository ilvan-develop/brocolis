import { FinPayMockProvider } from "@brocolis/finpay";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { OrdersService } from "../orders/orders.service.js";
import { PaymentsService } from "./payments.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const PH_A = "c1234567890abcdef00000001";

const orderId = "c000000000000000000000201";

function setup() {
  const finpay = new FinPayMockProvider();
  const orders = new OrdersService();
  const payments = new PaymentsService(orders, finpay);
  return { finpay, orders, payments };
}

function placePendingOrder(orders: OrdersService, id = orderId) {
  return orders.place({
    id,
    organizationId: ORG,
    marketCode: "AO",
    items: [
      {
        productId: "c1234567890abcdef00000021",
        pharmacyId: PH_A,
        quantity: 2,
        unitPriceMinor: 250,
        lineTotalMinor: 500,
        currency: "AOA",
      },
    ],
    summary: {
      subtotalMinor: 500,
      deliveryFeeMinor: 2500,
      vatMinor: 0,
      discountMinor: 0,
      totalMinor: 3000,
      currency: "AOA",
    },
    splits: [
      {
        pharmacyId: PH_A,
        subtotalMinor: 500,
        deliveryFeeMinor: 0,
        totalMinor: 500,
        currency: "AOA",
      },
    ],
  });
}

const paymentInput = {
  organizationId: ORG,
  marketCode: "AO",
  orderId,
  amountMinor: 3000,
  currency: "AOA",
  method: "REFERENCE",
} as const;

describe("PaymentsService", () => {
  it("createPayment cria intent via FinPay e payment PENDING", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const payment = await payments.createPayment(paymentInput);
    expect(payment.status).toBe("PENDING");
    expect(payment.intentId).toMatch(/^fp_/);
    expect(payment.amountMinor).toBe(3000);
    expect(payment.method).toBe("REFERENCE");
  });

  it("é idempotente para o mesmo pedido", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const first = await payments.createPayment(paymentInput);
    const second = await payments.createPayment(paymentInput);
    expect(second.id).toBe(first.id);
    expect(payments.getPaymentByOrder(orderId)?.id).toBe(first.id);
  });

  it("rejeita montante diferente do total do pedido", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    await expect(
      payments.createPayment({ ...paymentInput, amountMinor: 999 }),
    ).rejects.toThrowError(BadRequestException);
  });

  it("rejeita pedido fora de PENDING", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    orders.advanceStatus(orderId, "CONFIRMED");
    await expect(payments.createPayment(paymentInput)).rejects.toThrowError(
      BadRequestException,
    );
  });

  it("webhook CONFIRMED confirma payment e avança o pedido", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const payment = await payments.createPayment(paymentInput);
    const result = await payments.handleWebhook({
      eventId: "evt_00000001",
      eventType: "CONFIRMED",
      intentId: payment.intentId,
      orderId,
      amountMinor: 3000,
      currency: "AOA",
    });
    expect(result.handled).toBe(true);
    expect(result.payment?.status).toBe("CONFIRMED");
    expect(
      orders.getOrder({ orderId, organizationId: ORG, marketCode: "AO" })
        .status,
    ).toBe("CONFIRMED");
  });

  it("webhook é replay-safe pelo eventId", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const payment = await payments.createPayment(paymentInput);
    const event = {
      eventId: "evt_00000002",
      eventType: "CONFIRMED" as const,
      intentId: payment.intentId,
      orderId,
      amountMinor: 3000,
      currency: "AOA",
    };
    await payments.handleWebhook(event);
    const replay = await payments.handleWebhook(event);
    expect(replay.handled).toBe(false);
    const order = orders.getOrder({
      orderId,
      organizationId: ORG,
      marketCode: "AO",
    });
    expect(order.status).toBe("CONFIRMED");
    expect(orders.historyFor(orderId)).toHaveLength(2);
  });

  it("webhook FAILED não avança o pedido", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const payment = await payments.createPayment(paymentInput);
    const result = await payments.handleWebhook({
      eventId: "evt_00000003",
      eventType: "FAILED",
      intentId: payment.intentId,
      orderId,
      amountMinor: 3000,
      currency: "AOA",
    });
    expect(result.payment?.status).toBe("FAILED");
    expect(
      orders.getOrder({ orderId, organizationId: ORG, marketCode: "AO" })
        .status,
    ).toBe("PENDING");
  });

  it("rejeita evento de intent desconhecido", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    await expect(
      payments.handleWebhook({
        eventId: "evt_00000004",
        eventType: "CONFIRMED",
        intentId: "fp_00000099_abcd",
        orderId,
        amountMinor: 3000,
        currency: "AOA",
      }),
    ).rejects.toThrowError(NotFoundException);
  });

  it("rejeita evento com montante incompatível", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const payment = await payments.createPayment(paymentInput);
    await expect(
      payments.handleWebhook({
        eventId: "evt_00000005",
        eventType: "CONFIRMED",
        intentId: payment.intentId,
        orderId,
        amountMinor: 1,
        currency: "AOA",
      }),
    ).rejects.toThrowError(BadRequestException);
  });

  it("regista Auditoria de intents e confirmações", async () => {
    const { orders, payments } = setup();
    placePendingOrder(orders);
    const payment = await payments.createPayment(paymentInput);
    await payments.handleWebhook({
      eventId: "evt_00000006",
      eventType: "CONFIRMED",
      intentId: payment.intentId,
      orderId,
      amountMinor: 3000,
      currency: "AOA",
    });
    const actions = payments.getAuditEvents().map((e) => e.action);
    expect(actions).toContain("payment.intent_created");
    expect(actions).toContain("payment.confirmed");
  });
});
