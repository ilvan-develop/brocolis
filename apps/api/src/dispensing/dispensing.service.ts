import { database } from "@brocolis/db";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import {
  fifoAllocate,
  InventoryService,
} from "../inventory/inventory.service.js";
import type { OrderRecord, OrdersService } from "../orders/orders.service.js";
import type { PaymentsService } from "../payments/payments.service.js";
import type { PrescriptionScope } from "./prescription.service.js";
import { PrescriptionService } from "./prescription.service.js";

export type DispenseAllocation = {
  productId: string;
  pharmacyId: string;
  batchId: string;
  qty: number;
};

export type DispenseResult = {
  orderId: string;
  pharmacistId: string;
  allocations: DispenseAllocation[];
  dispensedMinor: number;
};

export type AuditLogEntry = {
  organizationId: string;
  marketCode: string;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
};

const DISPENSABLE_ORDER_STATUS = new Set(["CONFIRMED", "PROCESSING"]);

/**
 * Dispensa F3 — valida pagamento confirmado (RF-70/71) + receita aprovada
 * (RF-91), faz FIFO por validade (RF-43), bloqueia lotes vencidos (RF-44)
 * e gera movimento DISPENSE auditada.
 */
@Injectable()
export class DispensingService {
  private readonly auditEvents: AuditLogEntry[] = [];
  private readonly ordersService: OrdersService;
  private readonly paymentsService: PaymentsService | null;
  private readonly inventoryService: InventoryService;
  private readonly prescriptionService: PrescriptionService;

  constructor(
    orders: OrdersService,
    @Optional() payments?: PaymentsService,
    @Optional() inventory?: InventoryService,
    @Optional() prescriptions?: PrescriptionService,
  ) {
    this.ordersService = orders;
    this.paymentsService = payments ?? null;
    this.inventoryService = inventory ?? new InventoryService();
    this.prescriptionService = prescriptions ?? new PrescriptionService();
  }

  async dispenseFromOrder(
    orderId: string,
    pharmacistId: string,
    scope: PrescriptionScope,
  ): Promise<DispenseResult> {
    const order = this.ordersService.getOrder({
      orderId,
      organizationId: scope.organizationId,
      marketCode: scope.marketCode,
    });
    this.assertDispensable(order);

    const payment = this.paymentsService?.getPaymentByOrder(orderId);
    if (payment && payment.status !== "CONFIRMED") {
      throw new BadRequestException(
        `Pagamento do pedido em ${payment.status} — dispensa requerida após confirmação`,
      );
    }

    const prescription = this.prescriptionService.getForOrder(orderId, scope);
    if (prescription && prescription.status !== "APPROVED") {
      throw new BadRequestException(
        `Receita em ${prescription.status} — aprovação obrigatória antes da dispensa`,
      );
    }

    const allocations: DispenseAllocation[] = [];
    let dispensedMinor = 0;
    for (const item of order.items) {
      const batches = this.inventoryService.batchesForProduct(
        item.pharmacyId,
        item.productId,
        scope,
      );
      const { allocations: picked, remaining } = fifoAllocate(
        batches,
        item.quantity,
      );
      if (remaining > 0) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.productId}: faltam ${remaining} unidade(s)`,
        );
      }
      this.inventoryService.deductDispense(
        picked,
        `dispensa do pedido ${orderId}`,
        scope,
      );
      for (const allocation of picked) {
        allocations.push({
          productId: item.productId,
          pharmacyId: item.pharmacyId,
          batchId: allocation.batchId,
          qty: allocation.qty,
        });
      }
      dispensedMinor += item.lineTotalMinor;
    }

    if (order.status !== "PROCESSING") {
      this.ordersService.advanceStatus(
        orderId,
        "PROCESSING",
        "dispensa concluída",
      );
    }

    void this.emitAudit({
      organizationId: scope.organizationId,
      marketCode: scope.marketCode,
      action: "order.dispensed",
      resourceType: "order",
      resourceId: orderId,
      payload: { pharmacistId, items: allocations },
    });
    return { orderId, pharmacistId, allocations, dispensedMinor };
  }

  getAuditEvents(): readonly AuditLogEntry[] {
    return this.auditEvents;
  }

  private assertDispensable(order: OrderRecord): void {
    if (!DISPENSABLE_ORDER_STATUS.has(order.status)) {
      throw new BadRequestException(
        `Pedido em ${order.status} não está pronto para dispensa`,
      );
    }
    if (order.items.length === 0) {
      throw new NotFoundException("Pedido sem itens para dispensar");
    }
  }

  private async emitAudit(entry: AuditLogEntry): Promise<void> {
    this.auditEvents.push(entry);
    try {
      const db = await database();
      await db.auditEvent.create({
        organizationId: entry.organizationId,
        marketCode: entry.marketCode,
        actorType: "system",
        actorId: "dispensing-service",
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
