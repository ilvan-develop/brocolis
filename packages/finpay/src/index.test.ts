import { describe, expect, it } from "vitest";
import { createFinpayStore, FinPayMockProvider } from "./index.js";

describe("FinPayMockProvider", () => {
  it("cria um PaymentIntent em PENDING com montante em minor units", async () => {
    const provider = new FinPayMockProvider();
    const intent = await provider.createIntent({
      orderId: "c000000000000000000000001",
      amountMinor: 12500,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    expect(intent.status).toBe("PENDING");
    expect(intent.intentId).toMatch(/^fp_/);
    expect(intent.amountMinor).toBe(12500);
    expect(intent.currency).toBe("AOA");
    expect(intent.orderId).toBe("c000000000000000000000001");
  });

  it("é idempotente pela mesma idempotencyKey", async () => {
    const provider = new FinPayMockProvider();
    const first = await provider.createIntent({
      orderId: "c000000000000000000000002",
      amountMinor: 500,
      idempotencyKey: "order:c000000000000000000000002",
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    const second = await provider.createIntent({
      orderId: "c000000000000000000000002",
      amountMinor: 500,
      idempotencyKey: "order:c000000000000000000000002",
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    expect(second.intentId).toBe(first.intentId);
  });

  it("é idempotente por orderId+amount quando sem chave", async () => {
    const provider = new FinPayMockProvider();
    const base = {
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    };
    const first = await provider.createIntent({
      orderId: "c000000000000000000000003",
      amountMinor: 750,
      ...base,
    });
    const second = await provider.createIntent({
      orderId: "c000000000000000000000003",
      amountMinor: 750,
      ...base,
    });
    expect(second.intentId).toBe(first.intentId);
  });

  it("cria intent distinta quando o montante difere", async () => {
    const provider = new FinPayMockProvider();
    const base = {
      orderId: "c000000000000000000000004",
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    };
    const first = await provider.createIntent({ ...base, amountMinor: 100 });
    const second = await provider.createIntent({ ...base, amountMinor: 200 });
    expect(second.intentId).not.toBe(first.intentId);
  });

  it("webhookConfirm devolve evento CONFIRMED e atualiza o estado", async () => {
    const provider = new FinPayMockProvider();
    const intent = await provider.createIntent({
      orderId: "c000000000000000000000005",
      amountMinor: 900,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    const event = await provider.webhookConfirm(intent.intentId);
    expect(event.eventType).toBe("CONFIRMED");
    expect(event.intentId).toBe(intent.intentId);
    expect(event.amountMinor).toBe(900);
    expect((await provider.getIntent(intent.intentId)).status).toBe(
      "CONFIRMED",
    );
  });

  it("webhookConfirm é replay-safe (mesmo eventId repetido)", async () => {
    const provider = new FinPayMockProvider();
    const intent = await provider.createIntent({
      orderId: "c000000000000000000000006",
      amountMinor: 300,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    const first = await provider.webhookConfirm(intent.intentId);
    const replay = await provider.webhookConfirm(intent.intentId);
    expect(replay.eventId).toBe(first.eventId);
    expect(replay.eventType).toBe("CONFIRMED");
  });

  it("webhookFail devolve evento FAILED", async () => {
    const provider = new FinPayMockProvider();
    const intent = await provider.createIntent({
      orderId: "c000000000000000000000007",
      amountMinor: 1500,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    const event = await provider.webhookFail(intent.intentId);
    expect(event.eventType).toBe("FAILED");
    expect((await provider.getIntent(intent.intentId)).status).toBe("FAILED");
  });

  it("lança erro para intent inexistente", async () => {
    const provider = new FinPayMockProvider();
    await expect(provider.getIntent("fp_nao_existe")).rejects.toThrow(
      /não encontrada/,
    );
    await expect(provider.webhookConfirm("fp_nao_existe")).rejects.toThrow(
      /não encontrada/,
    );
  });

  it("refund apenas aceita intents CONFIRMED", async () => {
    const provider = new FinPayMockProvider();
    const pending = await provider.createIntent({
      orderId: "c000000000000000000000008",
      amountMinor: 10,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    await expect(provider.refund(pending.intentId)).rejects.toThrow(
      /apenas de intents CONFIRMED/,
    );
    const confirmed = await provider.createIntent({
      orderId: "c000000000000000000000009",
      amountMinor: 10,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    await provider.webhookConfirm(confirmed.intentId);
    const refunded = await provider.refund(confirmed.intentId);
    expect(refunded.status).toBe("REFUNDED");
  });

  it("suporta store injectada e partilhável", async () => {
    const store = createFinpayStore();
    const provider = new FinPayMockProvider(store);
    const intent = await provider.createIntent({
      orderId: "c000000000000000000000010",
      amountMinor: 1,
      organizationId: "00000000-0000-4000-8000-000000000000",
      marketCode: "AO",
    });
    expect(store.intents.size).toBe(1);
    expect(store.byOrder.get("c000000000000000000000010")).toBe(
      intent.intentId,
    );
  });
});
