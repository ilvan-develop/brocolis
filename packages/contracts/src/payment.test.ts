import { describe, expect, it } from "vitest";
import {
  createPaymentInputSchema,
  finpayWebhookSchema,
  paymentSchema,
} from "./payment.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";

describe("payment schemas", () => {
  it("valida payment em PENDING por defeito", () => {
    const p = paymentSchema.parse({
      id: cuid,
      intentId: "fp_00000001_abcd",
      orderId: cuid,
      organizationId: uuid,
      marketCode: "AO",
      amountMinor: 2500,
      currency: "AOA",
      method: "REFERENCE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(p.status).toBe("PENDING");
    expect(p.method).toBe("REFERENCE");
  });

  it("rejeita payment com montante negativo", () => {
    expect(() =>
      paymentSchema.parse({
        id: cuid,
        intentId: "fp_00000001_abcd",
        orderId: cuid,
        organizationId: uuid,
        marketCode: "AO",
        amountMinor: -1,
        currency: "AOA",
        method: "CARD",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow();
  });

  it("aceita method COD e normaliza currency", () => {
    const parsed = createPaymentInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      orderId: cuid,
      amountMinor: 500,
      currency: "aoa",
      method: "COD",
    });
    expect(parsed.currency).toBe("AOA");
  });

  it("rejeita method desconhecido", () => {
    expect(() =>
      createPaymentInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        orderId: cuid,
        amountMinor: 500,
        currency: "AOA",
        method: "bitcoin",
      }),
    ).toThrow();
  });

  it("valida webhook CONFIRMED com assinatura", () => {
    const w = finpayWebhookSchema.parse({
      eventId: "evt_00000001",
      eventType: "CONFIRMED",
      intentId: "fp_00000001_abcd",
      orderId: cuid,
      amountMinor: 2500,
      currency: "AOA",
      signature: "abc123",
    });
    expect(w.eventType).toBe("CONFIRMED");
    expect(w.signature).toBe("abc123");
  });

  it("rejeita webhook com eventType inválido", () => {
    expect(() =>
      finpayWebhookSchema.parse({
        eventId: "evt_00000001",
        eventType: "PENDING",
        intentId: "fp_00000001_abcd",
        orderId: cuid,
        amountMinor: 2500,
        currency: "AOA",
      }),
    ).toThrow();
  });
});
