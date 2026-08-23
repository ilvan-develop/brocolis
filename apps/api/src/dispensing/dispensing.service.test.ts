import { FinPayMockProvider } from "@brocolis/finpay";
import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { InventoryService } from "../inventory/inventory.service.js";
import { OrdersService } from "../orders/orders.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import { DispensingService } from "./dispensing.service.js";
import { PrescriptionService } from "./prescription.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const PH = "c1234567890abcdef00000001";
const PRODUCT = "c1234567890abcdef00000021";
const OTC_PRODUCT = "c1234567890abcdef00000022";
const PHARMACIST = "c1234567890abcdef00000031";
const ORDER = "c000000000000000000000201";

const scope = { organizationId: ORG, marketCode: "AO" } as const;
const file = { uri: "https://cdn.brocolis.ao/rx/1.jpg", type: "image/jpeg" };

type Services = {
  orders: OrdersService;
  payments: PaymentsService;
  inventory: InventoryService;
  prescriptions: PrescriptionService;
  dispensing: DispensingService;
  finpay: FinPayMockProvider;
};

function setup(itemProductId = PRODUCT): Services {
  const finpay = new FinPayMockProvider();
  const orders = new OrdersService();
  const payments = new PaymentsService(orders, undefined, finpay);
  const inventory = new InventoryService();
  const prescriptions = new PrescriptionService();
  const dispensing = new DispensingService(
    orders,
    payments,
    inventory,
    prescriptions,
  );

  orders.place({
    id: ORDER,
    organizationId: ORG,
    marketCode: "AO",
    items: [
      {
        productId: itemProductId,
        pharmacyId: PH,
        quantity: 10,
        unitPriceMinor: 250,
        lineTotalMinor: 2500,
        currency: "AOA",
      },
    ],
    summary: {
      subtotalMinor: 2500,
      deliveryFeeMinor: 1500,
      vatMinor: 0,
      discountMinor: 0,
      totalMinor: 4000,
      currency: "AOA",
    },
    splits: [
      {
        pharmacyId: PH,
        subtotalMinor: 2500,
        deliveryFeeMinor: 0,
        totalMinor: 2500,
        currency: "AOA",
      },
    ],
  });

  inventory.receiveBatch({
    ...scope,
    productId: itemProductId,
    pharmacyId: PH,
    batchNumber: "LOTE-DISP-1",
    expiryDate: new Date("2027-01-01"),
    receivedQty: 100,
    costPriceMinor: 800,
  });

  return { orders, payments, inventory, prescriptions, dispensing, finpay };
}

async function confirmPayment(s: Services, amount = 4000) {
  const payment = await s.payments.createPayment({
    ...scope,
    orderId: ORDER,
    amountMinor: amount,
    currency: "AOA",
    method: "REFERENCE",
  });
  await s.payments.handleWebhook({
    eventId: "evt_disp_1",
    eventType: "CONFIRMED",
    intentId: payment.intentId,
    orderId: ORDER,
    amountMinor: amount,
    currency: "AOA",
  });
}

function approvePrescription(s: Services) {
  const rx = s.prescriptions.upload({
    ...scope,
    orderId: ORDER,
    files: [file],
  });
  return s.prescriptions.respond(
    { ...scope, prescriptionId: rx.id, action: "APPROVE" },
    PHARMACIST,
  );
}

describe("DispensingService — dispensa com receita", () => {
  it("dispensa após pagamento confirmado + receita aprovada", async () => {
    const s = setup();
    approvePrescription(s);
    await confirmPayment(s);

    const result = await s.dispensing.dispenseFromOrder(
      ORDER,
      PHARMACIST,
      scope,
    );

    expect(result.orderId).toBe(ORDER);
    expect(result.pharmacistId).toBe(PHARMACIST);
    expect(result.allocations).toEqual([
      {
        productId: PRODUCT,
        pharmacyId: PH,
        batchId: expect.any(String),
        qty: 10,
      },
    ]);
    expect(result.dispensedMinor).toBe(2500);
    const item = s.inventory.listByItem({ ...scope } as never).items[0];
    expect(item?.quantityOnHand).toBe(90);
    expect(s.orders.getOrder({ orderId: ORDER, ...scope }).status).toBe(
      "PROCESSING",
    );
  });

  it("rejeita dispensa sem pagamento confirmado (guarda RF-70/71)", async () => {
    const s = setup();
    approvePrescription(s);
    await expect(
      s.dispensing.dispenseFromOrder(ORDER, PHARMACIST, scope),
    ).rejects.toThrowError(BadRequestException);
  });

  it("rejeita dispensa com pagamento ainda PENDING", async () => {
    const s = setup();
    approvePrescription(s);
    const payment = await s.payments.createPayment({
      ...scope,
      orderId: ORDER,
      amountMinor: 4000,
      currency: "AOA",
      method: "REFERENCE",
    });
    expect(payment.status).toBe("PENDING");
    s.orders.advanceStatus(ORDER, "CONFIRMED");
    await expect(
      s.dispensing.dispenseFromOrder(ORDER, PHARMACIST, scope),
    ).rejects.toThrowError(BadRequestException);
  });

  it("rejeita dispensa com receita não aprovada", async () => {
    const s = setup();
    s.prescriptions.upload({ ...scope, orderId: ORDER, files: [file] });
    await confirmPayment(s);
    await expect(
      s.dispensing.dispenseFromOrder(ORDER, PHARMACIST, scope),
    ).rejects.toThrowError(/aprovação/);
  });

  it("dispensa OTC sem receita", async () => {
    const s = setup(OTC_PRODUCT);
    await confirmPayment(s);
    const result = await s.dispensing.dispenseFromOrder(
      ORDER,
      PHARMACIST,
      scope,
    );
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]?.qty).toBe(10);
  });

  it("bloqueia dispensa quando só existe lote vencido (RF-44)", async () => {
    const finpay = new FinPayMockProvider();
    const orders = new OrdersService();
    const payments = new PaymentsService(orders, undefined, finpay);
    const inventory = new InventoryService();
    const prescriptions = new PrescriptionService();
    const dispensing = new DispensingService(
      orders,
      payments,
      inventory,
      prescriptions,
    );

    orders.place({
      id: ORDER,
      organizationId: ORG,
      marketCode: "AO",
      items: [
        {
          productId: PRODUCT,
          pharmacyId: PH,
          quantity: 5,
          unitPriceMinor: 250,
          lineTotalMinor: 1250,
          currency: "AOA",
        },
      ],
      summary: {
        subtotalMinor: 1250,
        deliveryFeeMinor: 1500,
        vatMinor: 0,
        discountMinor: 0,
        totalMinor: 2750,
        currency: "AOA",
      },
      splits: [
        {
          pharmacyId: PH,
          subtotalMinor: 1250,
          deliveryFeeMinor: 0,
          totalMinor: 1250,
          currency: "AOA",
        },
      ],
    });
    inventory.receiveBatch({
      ...scope,
      productId: PRODUCT,
      pharmacyId: PH,
      batchNumber: "VENCIDO",
      expiryDate: new Date("2025-01-01"),
      receivedQty: 100,
      costPriceMinor: 800,
    });
    approvePrescription({
      orders,
      payments,
      inventory,
      prescriptions,
      dispensing,
      finpay,
    });
    const payment = await payments.createPayment({
      ...scope,
      orderId: ORDER,
      amountMinor: 2750,
      currency: "AOA",
      method: "REFERENCE",
    });
    await payments.handleWebhook({
      eventId: "evt_expired_1",
      eventType: "CONFIRMED",
      intentId: payment.intentId,
      orderId: ORDER,
      amountMinor: 2750,
      currency: "AOA",
    });
    await expect(
      dispensing.dispenseFromOrder(ORDER, PHARMACIST, scope),
    ).rejects.toThrowError(/Stock insuficiente/);
  });

  it("rejeita dispensa com stock insuficiente (OOS)", async () => {
    const s = setup();
    approvePrescription(s);
    await confirmPayment(s);
    const batch = s.inventory.batchesForProduct(PH, PRODUCT, scope)[0]!;
    s.inventory.deductDispense(
      [{ batchId: batch.id, qty: 97 }],
      "anterior",
      scope,
    );
    await expect(
      s.dispensing.dispenseFromOrder(ORDER, PHARMACIST, scope),
    ).rejects.toThrowError(/Stock insuficiente/);
  });

  it("audita a dispensa", async () => {
    const s = setup();
    approvePrescription(s);
    await confirmPayment(s);
    await s.dispensing.dispenseFromOrder(ORDER, PHARMACIST, scope);
    const actions = s.dispensing.getAuditEvents().map((e) => e.action);
    expect(actions).toContain("order.dispensed");
  });
});
