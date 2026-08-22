import type {
  InventoryAlertThresholds,
  InventoryAlertType,
} from "@brocolis/contracts";
import {
  adjustStockInputSchema,
  listInventoryInputSchema,
  receiveBatchInputSchema,
  updateReorderPointInputSchema,
} from "@brocolis/contracts";
import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";

export type StockMovementType =
  | "RECEIPT"
  | "ADJUSTMENT"
  | "DISPENSE"
  | "REFUND"
  | "RESERVATION"
  | "RELEASE";

export type InventoryItemRecord = {
  id: string;
  productId: string;
  pharmacyId: string;
  quantityOnHand: number;
  reorderPoint: number;
  batchId?: string;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BatchRecord = {
  id: string;
  productId: string;
  pharmacyId: string;
  batchNumber: string;
  expiryDate: Date;
  receivedQty: number;
  remainingQty: number;
  costPriceMinor: number;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
};

export type StockMovementRecord = {
  id: string;
  itemId: string;
  batchId?: string;
  type: StockMovementType;
  qty: number;
  reason?: string;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
};

export type InventoryAlertRecord = {
  id: string;
  itemId: string;
  pharmacyId: string;
  type: InventoryAlertType;
  message?: string;
  thresholds?: InventoryAlertThresholds;
  organizationId: string;
  marketCode: string;
  createdAt: Date;
};

export type InventoryScope = {
  organizationId: string;
  marketCode: string;
};

export type FifoAllocation = {
  batchId: string;
  qty: number;
};

export type FifoAllocateResult = {
  allocations: FifoAllocation[];
  remaining: number;
};

export const DEFAULT_ALERT_THRESHOLDS: InventoryAlertThresholds = {
  low: 0,
  critical: 0,
  expiringDays: 90,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Batch vencido é bloqueado (RF-44) — nunca pode ser dispensado. */
export function isExpired(expiryDate: Date, now = new Date()): boolean {
  return expiryDate.getTime() <= now.getTime();
}

/**
 * FIFO por validade (RF-43): reserva dos lotes não expirados com
 * validade mais próxima, consumindo primeiro o que expira primeiro.
 * `remaining > 0` indica stock insuficiente (OOS).
 */
export function fifoAllocate(
  batches: readonly {
    id: string;
    expiryDate: Date;
    remainingQty: number;
  }[],
  qtyNeeded: number,
  now = new Date(),
): FifoAllocateResult {
  const eligible = batches
    .filter((b) => b.remainingQty > 0 && !isExpired(b.expiryDate, now))
    .sort(
      (a, b) =>
        a.expiryDate.getTime() - b.expiryDate.getTime() ||
        a.id.localeCompare(b.id),
    );
  const allocations: FifoAllocation[] = [];
  let remaining = qtyNeeded;
  for (const batch of eligible) {
    if (remaining <= 0) {
      break;
    }
    const qty = Math.min(batch.remainingQty, remaining);
    allocations.push({ batchId: batch.id, qty });
    remaining -= qty;
  }
  return { allocations, remaining };
}

const ALERT_ORDER: readonly InventoryAlertType[] = [
  "LOW",
  "CRITICAL",
  "EXPIRING",
  "EXPIRED",
];

/**
 * Avalia os 4 tipos de alerta (RF-42): LOW stock, CRITICAL (zero),
 * EXPIRING (dentro do horizonte configurado) e EXPIRED (vencido).
 */
export function evaluateAlerts(
  item: { quantityOnHand: number; reorderPoint: number },
  batches: readonly { expiryDate: Date; remainingQty: number }[],
  thresholds: InventoryAlertThresholds = DEFAULT_ALERT_THRESHOLDS,
  now = new Date(),
): InventoryAlertType[] {
  const alerts: InventoryAlertType[] = [];
  const qty = item.quantityOnHand;
  if (qty <= item.reorderPoint) {
    alerts.push("LOW");
  }
  if (qty <= thresholds.critical) {
    alerts.push("CRITICAL");
  }
  const horizon = now.getTime() + thresholds.expiringDays * DAY_MS;
  const noVencidos = (b: { expiryDate: Date; remainingQty: number }) =>
    b.remainingQty > 0;
  if (
    batches.some(
      (b) =>
        noVencidos(b) &&
        b.expiryDate.getTime() > now.getTime() &&
        b.expiryDate.getTime() <= horizon,
    )
  ) {
    alerts.push("EXPIRING");
  }
  if (batches.some((b) => noVencidos(b) && isExpired(b.expiryDate, now))) {
    alerts.push("EXPIRED");
  }
  const seen = new Set<InventoryAlertType>();
  return ALERT_ORDER.filter((type) => {
    if (alerts.includes(type) && !seen.has(type)) {
      seen.add(type);
      return true;
    }
    return false;
  });
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
 * Inventário F3 — stock por lote e validade (RF-40), movimentos auditados
 * (RF-41) e avaliação de alertas (RF-42). Store em memória ainda sem DB.
 */
@Injectable()
export class InventoryService {
  private readonly items = new Map<string, InventoryItemRecord>();
  private readonly batches = new Map<string, BatchRecord>();
  private readonly movements: StockMovementRecord[] = [];
  private readonly alerts: InventoryAlertRecord[] = [];
  private readonly auditEvents: AuditLogEntry[] = [];

  receiveBatch(input: unknown): {
    item: InventoryItemRecord;
    batch: BatchRecord;
    movement: StockMovementRecord;
  } {
    const parsed = receiveBatchInputSchema.parse(input);
    const duplicate = [...this.batches.values()].find(
      (b) =>
        b.pharmacyId === parsed.pharmacyId &&
        b.productId === parsed.productId &&
        b.batchNumber.toLowerCase() === parsed.batchNumber.toLowerCase(),
    );
    if (duplicate) {
      throw new BadRequestException(
        `Lote ${parsed.batchNumber} já rececionado nesta farmácia`,
      );
    }

    let item = this.findItem(
      parsed.organizationId,
      parsed.marketCode,
      parsed.productId,
      parsed.pharmacyId,
    );
    const now = new Date();
    if (!item) {
      item = {
        id: nextCuid(),
        productId: parsed.productId,
        pharmacyId: parsed.pharmacyId,
        quantityOnHand: 0,
        reorderPoint: 0,
        organizationId: parsed.organizationId,
        marketCode: parsed.marketCode,
        createdAt: now,
        updatedAt: now,
      };
      this.items.set(item.id, item);
    }

    const batch: BatchRecord = {
      id: nextCuid(),
      productId: parsed.productId,
      pharmacyId: parsed.pharmacyId,
      batchNumber: parsed.batchNumber,
      expiryDate: parsed.expiryDate,
      receivedQty: parsed.receivedQty,
      remainingQty: parsed.receivedQty,
      costPriceMinor: parsed.costPriceMinor,
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      createdAt: now,
    };
    this.batches.set(batch.id, batch);
    if (!item.batchId) {
      item.batchId = batch.id;
    }
    item.quantityOnHand += parsed.receivedQty;
    item.updatedAt = now;

    const movement = this.recordMovement(
      item.id,
      batch.id,
      "RECEIPT",
      parsed.receivedQty,
      `receção do lote ${batch.batchNumber}`,
      parsed,
    );
    this.evaluateAndAlert(item, parsed);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "inventory.batch_received",
      resourceType: "batch",
      resourceId: batch.id,
      payload: { productId: batch.productId, receivedQty: batch.receivedQty },
    });
    return { item, batch, movement };
  }

  adjustStock(input: unknown): {
    item: InventoryItemRecord;
    movement: StockMovementRecord;
  } {
    const parsed = adjustStockInputSchema.parse(input);
    const item = this.getItemScoped(
      parsed.organizationId,
      parsed.marketCode,
      parsed.itemId,
    );
    const newQty = item.quantityOnHand + parsed.qty;
    if (newQty < 0) {
      throw new BadRequestException("Ajuste de stock deixaria saldo negativo");
    }
    item.quantityOnHand = newQty;
    item.updatedAt = new Date();

    const movement = this.recordMovement(
      item.id,
      undefined,
      "ADJUSTMENT",
      parsed.qty,
      parsed.reason,
      parsed,
    );
    this.evaluateAndAlert(item, parsed);
    void this.emitAudit({
      organizationId: parsed.organizationId,
      marketCode: parsed.marketCode,
      action: "inventory.adjusted",
      resourceType: "inventory_item",
      resourceId: item.id,
      payload: { delta: parsed.qty, reason: parsed.reason ?? null },
    });
    return { item, movement };
  }

  listByItem(input: unknown): {
    items: InventoryItemRecord[];
    total: number;
  } {
    const parsed = listInventoryInputSchema.parse(input);
    let list = [...this.items.values()].filter(
      (item) =>
        item.organizationId === parsed.organizationId &&
        item.marketCode === parsed.marketCode,
    );
    if (parsed.pharmacyId) {
      list = list.filter((item) => item.pharmacyId === parsed.pharmacyId);
    }
    if (parsed.productId) {
      list = list.filter((item) => item.productId === parsed.productId);
    }
    list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const start = parsed.cursor ? this.cursorIndex(list, parsed.cursor) : 0;
    const items = list.slice(start, start + parsed.limit);
    return { items, total: list.length };
  }

  updateReorderPoint(input: unknown): InventoryItemRecord {
    const parsed = updateReorderPointInputSchema.parse(input);
    const item = this.getItemScoped(
      parsed.organizationId,
      parsed.marketCode,
      parsed.itemId,
    );
    item.reorderPoint = parsed.reorderPoint;
    item.updatedAt = new Date();
    this.evaluateAndAlert(item, parsed);
    return item;
  }

  batchesForProduct(
    pharmacyId: string,
    productId: string,
    scope: InventoryScope,
  ): BatchRecord[] {
    return [...this.batches.values()].filter(
      (b) =>
        b.pharmacyId === pharmacyId &&
        b.productId === productId &&
        b.organizationId === scope.organizationId &&
        b.marketCode === scope.marketCode,
    );
  }

  /**
   * Deduz stock dos lotes alocados (DISPENSE, RF-43). Usada pela dispensa
   * — lotes vencidos nunca chegam aqui (fifoAllocate já os bloqueia).
   */
  deductDispense(
    allocations: readonly FifoAllocation[],
    reason: string,
    scope: InventoryScope,
  ): StockMovementRecord[] {
    const movements: StockMovementRecord[] = [];
    for (const allocation of allocations) {
      const batch = this.getBatchScoped(allocation.batchId, scope);
      if (batch.remainingQty < allocation.qty) {
        throw new BadRequestException(
          `Quantidade insuficiente no lote ${batch.batchNumber}`,
        );
      }
      batch.remainingQty -= allocation.qty;
      const item = this.requireItemFor(
        batch.pharmacyId,
        batch.productId,
        scope,
      );
      item.quantityOnHand -= allocation.qty;
      item.updatedAt = new Date();
      const movement = this.recordMovement(
        item.id,
        batch.id,
        "DISPENSE",
        -allocation.qty,
        reason,
        scope,
      );
      movements.push(movement);
      this.evaluateAndAlert(item, scope);
    }
    return movements;
  }

  /**
   * Reposição de stock num pedido devolvido (REFUND, RF-73). O stock volta
   * para o lote não vencido de validade mais próxima (prioridade de venda).
   * Sem lote elegível, cria um lote virtual de reposição.
   */
  pushRefund(
    items: readonly {
      productId: string;
      pharmacyId: string;
      quantity: number;
    }[],
    reason: string,
    scope: InventoryScope,
  ): StockMovementRecord[] {
    const movements: StockMovementRecord[] = [];
    for (const item of items) {
      const eligible = this.batchesForProduct(
        item.pharmacyId,
        item.productId,
        scope,
      )
        .filter((b) => !isExpired(b.expiryDate))
        .sort(
          (a, b) =>
            a.expiryDate.getTime() - b.expiryDate.getTime() ||
            a.id.localeCompare(b.id),
        );
      const now = new Date();
      const batch =
        eligible[0] ??
        ({
          id: nextCuid(),
          productId: item.productId,
          pharmacyId: item.pharmacyId,
          batchNumber: `REFUND-${nextCuid()}`,
          expiryDate: new Date(now.getTime() + 365 * DAY_MS),
          receivedQty: item.quantity,
          remainingQty: item.quantity,
          costPriceMinor: 0,
          organizationId: scope.organizationId,
          marketCode: scope.marketCode,
          createdAt: now,
        } satisfies BatchRecord);
      if (!eligible[0]) {
        this.batches.set(batch.id, batch);
      } else {
        batch.remainingQty += item.quantity;
      }
      const invItem = this.requireItemFor(
        item.pharmacyId,
        item.productId,
        scope,
      );
      invItem.quantityOnHand += item.quantity;
      invItem.updatedAt = now;
      const movement = this.recordMovement(
        invItem.id,
        batch.id,
        "REFUND",
        item.quantity,
        reason,
        scope,
      );
      movements.push(movement);
      this.evaluateAndAlert(invItem, scope);
    }
    return movements;
  }

  movementsFor(itemId: string): StockMovementRecord[] {
    return this.movements.filter((m) => m.itemId === itemId);
  }

  alertsFor(itemId: string): InventoryAlertRecord[] {
    return this.alerts.filter((a) => a.itemId === itemId);
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private getItemScoped(
    organizationId: string,
    marketCode: string,
    itemId: string,
  ): InventoryItemRecord {
    const item = this.items.get(itemId);
    if (
      !item ||
      item.organizationId !== organizationId ||
      item.marketCode !== marketCode
    ) {
      throw new NotFoundException(
        `Item de inventário ${itemId} não encontrado`,
      );
    }
    return item;
  }

  private getBatchScoped(batchId: string, scope: InventoryScope): BatchRecord {
    const batch = this.batches.get(batchId);
    if (
      !batch ||
      batch.organizationId !== scope.organizationId ||
      batch.marketCode !== scope.marketCode
    ) {
      throw new NotFoundException(`Lote ${batchId} não encontrado`);
    }
    return batch;
  }

  private findItem(
    organizationId: string,
    marketCode: string,
    productId: string,
    pharmacyId: string,
  ): InventoryItemRecord | undefined {
    return [...this.items.values()].find(
      (item) =>
        item.organizationId === organizationId &&
        item.marketCode === marketCode &&
        item.productId === productId &&
        item.pharmacyId === pharmacyId,
    );
  }

  private requireItemFor(
    pharmacyId: string,
    productId: string,
    scope: InventoryScope,
  ): InventoryItemRecord {
    const item = this.findItem(
      scope.organizationId,
      scope.marketCode,
      productId,
      pharmacyId,
    );
    if (!item) {
      throw new NotFoundException(
        `Item de inventário em falta (${productId}@${pharmacyId})`,
      );
    }
    return item;
  }

  private recordMovement(
    itemId: string,
    batchId: string | undefined,
    type: StockMovementType,
    qty: number,
    reason: string | undefined,
    scope: InventoryScope,
  ): StockMovementRecord {
    const movement: StockMovementRecord = {
      id: nextCuid(),
      itemId,
      type,
      qty,
      organizationId: scope.organizationId,
      marketCode: scope.marketCode,
      createdAt: new Date(),
      ...(batchId ? { batchId } : {}),
      ...(reason ? { reason } : {}),
    };
    this.movements.push(movement);
    return movement;
  }

  private evaluateAndAlert(item: InventoryItemRecord, scope: InventoryScope) {
    const batches = this.batchesForProduct(
      item.pharmacyId,
      item.productId,
      scope,
    );
    const types = evaluateAlerts(item, batches, DEFAULT_ALERT_THRESHOLDS);
    const now = new Date();
    for (const type of types) {
      this.alerts.push({
        id: nextCuid(),
        itemId: item.id,
        pharmacyId: item.pharmacyId,
        type,
        message: this.alertMessage(type, item),
        thresholds: DEFAULT_ALERT_THRESHOLDS,
        organizationId: scope.organizationId,
        marketCode: scope.marketCode,
        createdAt: now,
      });
    }
  }

  private alertMessage(
    type: InventoryAlertType,
    item: InventoryItemRecord,
  ): string {
    switch (type) {
      case "LOW":
        return `Stock baixo (${item.quantityOnHand} ≤ ponto de reposição ${item.reorderPoint})`;
      case "CRITICAL":
        return `Stock crítico — sem unidades disponíveis`;
      case "EXPIRING":
        return `Lote a expirar nos próximos ${DEFAULT_ALERT_THRESHOLDS.expiringDays} dias`;
      case "EXPIRED":
        return `Lote vencido — venda bloqueada`;
    }
  }

  private cursorIndex(
    list: readonly InventoryItemRecord[],
    cursor: string,
  ): number {
    const index = list.findIndex((item) => item.id === cursor);
    return index === -1 ? 0 : index;
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "inventory-service",
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
