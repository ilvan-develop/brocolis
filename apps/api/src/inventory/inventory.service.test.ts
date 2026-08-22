import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import {
  evaluateAlerts,
  fifoAllocate,
  InventoryService,
  isExpired,
} from "./inventory.service.js";

const ORG = "00000000-0000-4000-8000-000000000000";
const PH = "c1234567890abcdef00000001";
const PRODUCT = "c1234567890abcdef00000021";
const OTHER_PRODUCT = "c1234567890abcdef00000022";

const NOW = new Date("2026-01-10T12:00:00Z");

const scope = { organizationId: ORG, marketCode: "AO" } as const;

function batch(id: string, expiryDate: string, remainingQty: number) {
  return {
    id,
    expiryDate: new Date(expiryDate),
    remainingQty,
    productId: PRODUCT,
    pharmacyId: PH,
    batchNumber: id,
    receivedQty: remainingQty,
    costPriceMinor: 1000,
    organizationId: ORG,
    marketCode: "AO",
    createdAt: new Date(),
  };
}

function receive(service: InventoryService, expiry = "2026-06-01", qty = 100) {
  return service.receiveBatch({
    organizationId: ORG,
    marketCode: "AO",
    productId: PRODUCT,
    pharmacyId: PH,
    batchNumber: `LOTE-${expiry}-${qty}`,
    expiryDate: new Date(expiry),
    receivedQty: qty,
    costPriceMinor: 800,
  });
}

describe("fifoAllocate — FIFO por validade (RF-43)", () => {
  it("reserva do lote com validade mais próxima", () => {
    const result = fifoAllocate(
      [batch("b1", "2026-06-01", 30), batch("b2", "2026-02-01", 20)],
      15,
      NOW,
    );
    expect(result.allocations).toEqual([{ batchId: "b2", qty: 15 }]);
    expect(result.remaining).toBe(0);
  });

  it("reparte entre lotes quando um lote não cobre a quantidade", () => {
    const result = fifoAllocate(
      [
        batch("b1", "2026-06-01", 30),
        batch("b2", "2026-02-01", 20),
        batch("b3", "2026-04-01", 10),
      ],
      40,
      NOW,
    );
    expect(result.allocations).toEqual([
      { batchId: "b2", qty: 20 },
      { batchId: "b3", qty: 10 },
      { batchId: "b1", qty: 10 },
    ]);
    expect(result.remaining).toBe(0);
  });

  it("reporta stock insuficiente (OOS) sem alocar a mais", () => {
    const result = fifoAllocate([batch("b1", "2026-06-01", 30)], 60, NOW);
    expect(result.allocations).toEqual([{ batchId: "b1", qty: 30 }]);
    expect(result.remaining).toBe(30);
  });

  it("bloqueia lotes vencidos (RF-44)", () => {
    const result = fifoAllocate(
      [
        batch("b-expired", "2025-12-01", 50),
        batch("b-valid", "2026-03-01", 10),
      ],
      5,
      NOW,
    );
    expect(result.allocations).toEqual([{ batchId: "b-valid", qty: 5 }]);
    expect(result.remaining).toBe(0);
  });

  it("devolve vazio quando só existem lotes vencidos", () => {
    const result = fifoAllocate([batch("b-expired", "2025-12-01", 50)], 5, NOW);
    expect(result.allocations).toEqual([]);
    expect(result.remaining).toBe(5);
  });

  it("isExpired deteta validade <= agora", () => {
    expect(isExpired(new Date("2025-12-01"), NOW)).toBe(true);
    expect(isExpired(new Date("2026-08-01"), NOW)).toBe(false);
  });
});

describe("evaluateAlerts — 4 tipos (RF-42)", () => {
  it("LOW quando stock <= ponto de reposição", () => {
    expect(
      evaluateAlerts(
        { quantityOnHand: 5, reorderPoint: 10 },
        [],
        undefined,
        NOW,
      ),
    ).toEqual(["LOW"]);
  });

  it("CRITICAL quando stock zero", () => {
    expect(
      evaluateAlerts(
        { quantityOnHand: 0, reorderPoint: 0 },
        [],
        undefined,
        NOW,
      ),
    ).toEqual(["LOW", "CRITICAL"]);
  });

  it("EXPIRING dentro do horizonte configurado (90 dias)", () => {
    expect(
      evaluateAlerts(
        { quantityOnHand: 50, reorderPoint: 0 },
        [batch("b1", "2026-03-20", 30)],
        undefined,
        NOW,
      ),
    ).toEqual(["EXPIRING"]);
  });

  it("EXPIRED quando existe lote vencido", () => {
    expect(
      evaluateAlerts(
        { quantityOnHand: 50, reorderPoint: 0 },
        [batch("b1", "2025-12-01", 30)],
        undefined,
        NOW,
      ),
    ).toEqual(["EXPIRED"]);
  });

  it("combina LOW + EXPIRING + EXPIRED", () => {
    expect(
      evaluateAlerts(
        { quantityOnHand: 4, reorderPoint: 10 },
        [batch("b1", "2025-12-01", 5), batch("b2", "2026-03-20", 5)],
        undefined,
        NOW,
      ),
    ).toEqual(["LOW", "EXPIRING", "EXPIRED"]);
  });

  it("expired-block: lote vencido nunca entra na alocação (RF-44)", () => {
    const service = new InventoryService();
    const expired = service.receiveBatch({
      ...scope,
      productId: PRODUCT,
      pharmacyId: PH,
      batchNumber: "VEN-1",
      expiryDate: new Date("2025-12-01"),
      receivedQty: 10,
      costPriceMinor: 100,
    });
    const batches = service.batchesForProduct(PH, PRODUCT, scope);
    const result = fifoAllocate(batches, 2, NOW);
    expect(result.allocations).toEqual([]);
    expect(service.alertsFor(expired.item.id).map((a) => a.type)).toContain(
      "EXPIRED",
    );
  });
});

describe("InventoryService — receção, ajuste, listagem", () => {
  it("receiveBatch cria item + lote + movimento RECEIPT e soma stock", () => {
    const service = new InventoryService();
    const { item, batch, movement } = receive(service);
    expect(item.quantityOnHand).toBe(100);
    expect(item.reorderPoint).toBe(0);
    expect(batch.remainingQty).toBe(100);
    expect(batch.expiryDate.toISOString()).toContain("2026-06-01");
    expect(movement.type).toBe("RECEIPT");
    expect(movement.qty).toBe(100);
    expect(service.movementsFor(item.id)).toHaveLength(1);
  });

  it("acumula lotes distintos no mesmo item", () => {
    const service = new InventoryService();
    receive(service, "2026-02-01", 40);
    receive(service, "2026-08-01", 60);
    const batches = service.batchesForProduct(PH, PRODUCT, scope);
    expect(batches).toHaveLength(2);
    const item = service.listByItem({ ...scope } as never).items[0];
    expect(item).toBeDefined();
    expect(item?.quantityOnHand).toBe(100);
  });

  it("rejeita batch duplicado na mesma farmácia/produto", () => {
    const service = new InventoryService();
    receive(service, "2026-06-01", 100);
    expect(() => receive(service, "2026-06-01", 100)).toThrowError(
      BadRequestException,
    );
  });

  it("adjustStock aplica variação positiva e negativa", () => {
    const service = new InventoryService();
    const { item } = receive(service);
    service.adjustStock({
      ...scope,
      itemId: item.id,
      qty: -5,
      reason: "quebrado",
    });
    const after = service.adjustStock({
      ...scope,
      itemId: item.id,
      qty: 12,
      reason: "inventário",
    });
    expect(after.item.quantityOnHand).toBe(107);
    expect(service.movementsFor(item.id).map((m) => m.type)).toEqual([
      "RECEIPT",
      "ADJUSTMENT",
      "ADJUSTMENT",
    ]);
  });

  it("rejeita ajuste que deixaria stock negativo", () => {
    const service = new InventoryService();
    const { item } = receive(service, "2026-06-01", 10);
    expect(() =>
      service.adjustStock({ ...scope, itemId: item.id, qty: -11 }),
    ).toThrowError(BadRequestException);
  });

  it("listByItem filtra por farmácia e produto", () => {
    const service = new InventoryService();
    receive(service);
    receive(service, "2026-02-01", 30);
    service.receiveBatch({
      ...scope,
      productId: OTHER_PRODUCT,
      pharmacyId: PH,
      batchNumber: "OUTRO",
      expiryDate: new Date("2026-07-01"),
      receivedQty: 5,
      costPriceMinor: 100,
    });
    const byProduct = service.listByItem({
      ...scope,
      productId: PRODUCT,
    } as never);
    expect(byProduct.items).toHaveLength(1);
    expect(byProduct.total).toBe(1);
    const byPharmacy = service.listByItem({
      ...scope,
      pharmacyId: PH,
    } as never);
    expect(byPharmacy.total).toBe(2);
  });

  it("updateReorderPoint persiste e avalia alerta LOW automaticamente", () => {
    const service = new InventoryService();
    const { item } = receive(service, "2026-06-01", 10);
    const updated = service.updateReorderPoint({
      ...scope,
      itemId: item.id,
      reorderPoint: 20,
    });
    expect(updated.reorderPoint).toBe(20);
    const alerts = service.alertsFor(item.id);
    expect(alerts.map((a) => a.type)).toContain("LOW");
  });
});

describe("InventoryService — dispensa e reposições", () => {
  it("deductDispense debita lote + item com movimento DISPENSE", () => {
    const service = new InventoryService();
    const { item } = receive(service, "2026-06-01", 100);
    const movements = service.deductDispense(
      [{ batchId: item.batchId!, qty: 30 }],
      "dispensa pedido X",
      scope,
    );
    expect(movements[0]?.type).toBe("DISPENSE");
    expect(movements[0]?.qty).toBe(-30);
    const batches = service.batchesForProduct(PH, PRODUCT, scope);
    expect(batches[0]?.remainingQty).toBe(70);
    expect(
      service.listByItem({ ...scope } as never).items[0]?.quantityOnHand,
    ).toBe(70);
  });

  it("deductDispense rejeita lote desconhecido (scoping)", () => {
    const service = new InventoryService();
    expect(() =>
      service.deductDispense(
        [{ batchId: "c000000000000000000000099", qty: 1 }],
        "x",
        scope,
      ),
    ).toThrowError(NotFoundException);
  });

  it("pushRefund repõe stock com movimento REFUND", () => {
    const service = new InventoryService();
    // Data de validade distante o suficiente para nunca expirar em relação
    // ao relógio real (isExpired() usa `new Date()`, não um NOW fixo de teste).
    receive(service, "2099-06-01", 100);
    service.deductDispense(
      [
        {
          batchId: service.batchesForProduct(PH, PRODUCT, scope)[0]?.id ?? "",
          qty: 30,
        },
      ],
      "dispensa",
      scope,
    );
    const movements = service.pushRefund(
      [{ productId: PRODUCT, pharmacyId: PH, quantity: 30 }],
      "reembolso pedido Y",
      scope,
    );
    expect(movements[0]?.type).toBe("REFUND");
    expect(movements[0]?.qty).toBe(30);
    const batches = service.batchesForProduct(PH, PRODUCT, scope);
    expect(batches[0]?.remainingQty).toBe(100);
  });

  it("regista auditoria nas mutações críticas", () => {
    const service = new InventoryService();
    const { item } = receive(service);
    service.adjustStock({ ...scope, itemId: item.id, qty: -3 });
    const actions = service.getAuditEvents().map((e) => e.action);
    expect(actions).toContain("inventory.batch_received");
    expect(actions).toContain("inventory.adjusted");
  });
});
