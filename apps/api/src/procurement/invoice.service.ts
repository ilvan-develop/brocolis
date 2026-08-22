import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { nextCuid } from "../cuid.js";
import type { PurchaseOrderRecord } from "./purchase-order.service.js";

export type InvoiceStatus = "ISSUED" | "PAID" | "CANCELED";

export type InvoiceRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  purchaseOrderId: string;
  supplierId: string;
  invoiceNumber: string;
  totalAmountMinor: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const INVOICEABLE_PO_STATUSES: PurchaseOrderRecord["status"][] = [
  "DELIVERED",
  "COMPLETED",
];

/**
 * F4 — Faturação B2B: emite uma fatura a partir de uma PurchaseOrder já
 * entregue (DELIVERED/COMPLETED). O export AGT/SAF-T em si é delegado ao
 * ComplianceService (type="PURCHASES"), reaproveitando a infraestrutura
 * genérica já existente em vez de duplicar a lógica de export.
 */
@Injectable()
export class InvoiceService {
  private readonly invoices = new Map<string, InvoiceRecord>();
  private readonly byPurchaseOrder = new Map<string, string>();

  issue(
    organizationId: string,
    marketCode: string,
    po: PurchaseOrderRecord,
  ): InvoiceRecord {
    if (!INVOICEABLE_PO_STATUSES.includes(po.status)) {
      throw new BadRequestException(
        `PurchaseOrder ${po.id} precisa estar entregue para faturar (estado atual: ${po.status})`,
      );
    }
    const existingId = this.byPurchaseOrder.get(po.id);
    if (existingId) {
      const existing = this.invoices.get(existingId);
      if (existing) return existing;
    }
    const id = nextCuid();
    const now = new Date();
    const record: InvoiceRecord = {
      id,
      organizationId,
      marketCode,
      purchaseOrderId: po.id,
      supplierId: po.supplierId,
      invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
      totalAmountMinor: po.totalAmountMinor,
      currency: po.currency,
      status: "ISSUED",
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.invoices.set(id, record);
    this.byPurchaseOrder.set(po.id, id);
    return record;
  }

  getById(
    organizationId: string,
    marketCode: string,
    invoiceId: string,
  ): InvoiceRecord {
    const invoice = this.invoices.get(invoiceId);
    if (
      !invoice ||
      invoice.organizationId !== organizationId ||
      invoice.marketCode !== marketCode
    ) {
      throw new NotFoundException(`Fatura ${invoiceId} não encontrada`);
    }
    return invoice;
  }

  listByOrg(organizationId: string, marketCode: string): InvoiceRecord[] {
    return [...this.invoices.values()]
      .filter(
        (i) => i.organizationId === organizationId && i.marketCode === marketCode,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
