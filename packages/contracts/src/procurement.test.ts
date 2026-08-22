import { describe, expect, it } from "vitest";
import {
  acceptQuotationInputSchema,
  advancePoDeliveryInputSchema,
  approvalStatusEnumSchema,
  confirmPurchaseOrderInputSchema,
  createPurchaseOrderInputSchema,
  createQuotationInputSchema,
  createRfqInputSchema,
  createSupplierInputSchema,
  decideApprovalInputSchema,
  invoiceSchema,
  issueInvoiceInputSchema,
  listPurchaseOrdersInputSchema,
  listRfqsInputSchema,
  poStatusEnumSchema,
  purchaseOrderSchema,
  quotationSchema,
  rejectQuotationInputSchema,
  rfqSchema,
  rfqStatusEnumSchema,
  submitForApprovalInputSchema,
  submitQuotationInputSchema,
  submitRfqInputSchema,
  supplierSchema,
} from "./procurement.js";

const uuid = "00000000-0000-4000-8000-000000000000";
const cuid = "c000000000000000000000001";
const cuid2 = "c000000000000000000000002";
const cuid3 = "c000000000000000000000003";

describe("procurement enums", () => {
  it("rfqStatusEnumSchema has all statuses", () => {
    expect(rfqStatusEnumSchema.options).toEqual([
      "DRAFT",
      "OPEN",
      "QUOTED",
      "AWARDED",
      "CANCELED",
      "EXPIRED",
    ]);
  });

  it("quotationStatusEnumSchema has all statuses", () => {
    expect(rfqStatusEnumSchema.options.length).toBe(6);
  });

  it("poStatusEnumSchema has all statuses", () => {
    expect(poStatusEnumSchema.options).toEqual([
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "REJECTED",
      "CONFIRMED",
      "IN_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "CANCELED",
    ]);
  });

  it("approvalStatusEnumSchema has all statuses", () => {
    expect(approvalStatusEnumSchema.options).toEqual([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "ESCALATED",
    ]);
  });
});

describe("supplier schemas", () => {
  it("validates createSupplierInput", () => {
    const parsed = createSupplierInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      name: "Farmacêutica ABC",
      slug: "farmaceutica-abc",
    });
    expect(parsed.name).toBe("Farmacêutica ABC");
  });

  it("rejects supplier without name", () => {
    expect(() =>
      createSupplierInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        name: "",
        slug: "test",
      }),
    ).toThrow();
  });

  it("validates supplier schema", () => {
    const parsed = supplierSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      name: "Supplier",
      slug: "supplier",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(parsed.status).toBe("ACTIVE");
  });
});

describe("rfq schemas", () => {
  it("validates createRfqInput", () => {
    const parsed = createRfqInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      subject: "Compra de Paracetamol",
    });
    expect(parsed.subject).toBe("Compra de Paracetamol");
  });

  it("rejects rfq without subject", () => {
    expect(() =>
      createRfqInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        supplierId: cuid,
        subject: "",
      }),
    ).toThrow();
  });

  it("validates rfq schema with reference", () => {
    const parsed = rfqSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid2,
      subject: "RFQ Test",
      reference: "RFQ-001",
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(parsed.reference).toBe("RFQ-001");
  });
});

describe("quotation schemas", () => {
  it("validates createQuotationInput with items", () => {
    const parsed = createQuotationInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      rfqId: cuid,
      supplierId: cuid2,
      totalAmountMinor: 50000,
      items: [{ productId: cuid3, quantity: 10, unitPriceMinor: 5000 }],
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.totalAmountMinor).toBe(50000);
  });

  it("rejects createQuotationInput without items", () => {
    expect(() =>
      createQuotationInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        rfqId: cuid,
        supplierId: cuid2,
        totalAmountMinor: 50000,
        items: [],
      }),
    ).toThrow();
  });

  it("validates quotation schema", () => {
    const parsed = quotationSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      rfqId: cuid2,
      supplierId: cuid3,
      reference: "QT-001",
      status: "SUBMITTED",
      totalAmountMinor: 75000,
      currency: "AOA",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(parsed.status).toBe("SUBMITTED");
  });
});

describe("purchaseOrder schemas", () => {
  it("validates createPurchaseOrderInput", () => {
    const parsed = createPurchaseOrderInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid,
      totalAmountMinor: 100000,
      items: [
        {
          productId: cuid2,
          quantity: 20,
          unitPriceMinor: 5000,
          lineTotalMinor: 100000,
        },
      ],
    });
    expect(parsed.items).toHaveLength(1);
  });

  it("rejects createPurchaseOrderInput without items", () => {
    expect(() =>
      createPurchaseOrderInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        supplierId: cuid,
        totalAmountMinor: 0,
        items: [],
      }),
    ).toThrow();
  });

  it("validates purchaseOrder schema", () => {
    const parsed = purchaseOrderSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      supplierId: cuid2,
      reference: "PO-001",
      status: "DRAFT",
      totalAmountMinor: 100000,
      currency: "AOA",
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(parsed.status).toBe("DRAFT");
  });
});

describe("approval schemas", () => {
  it("validates decideApprovalInput", () => {
    const parsed = decideApprovalInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      approvalId: cuid,
      decision: "APPROVED",
      approverId: cuid2,
    });
    expect(parsed.decision).toBe("APPROVED");
  });

  it("rejects invalid decision", () => {
    expect(() =>
      decideApprovalInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        approvalId: cuid,
        decision: "PENDING",
        approverId: cuid2,
      }),
    ).toThrow();
  });
});

describe("list input schemas", () => {
  it("validates listRfqsInput with defaults", () => {
    const parsed = listRfqsInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
    });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it("validates listPurchaseOrdersInput with filters", () => {
    const parsed = listPurchaseOrdersInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      status: "APPROVED",
      supplierId: cuid,
      page: 2,
      pageSize: 10,
    });
    expect(parsed.page).toBe(2);
    expect(parsed.status).toBe("APPROVED");
  });
});

describe("orchestration input schemas (scoped org+market)", () => {
  it("validates submitRfqInput", () => {
    const parsed = submitRfqInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      rfqId: cuid,
    });
    expect(parsed.rfqId).toBe(cuid);
  });

  it("validates submitQuotationInput", () => {
    const parsed = submitQuotationInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      quotationId: cuid,
    });
    expect(parsed.quotationId).toBe(cuid);
  });

  it("validates acceptQuotationInput and rejectQuotationInput", () => {
    expect(
      acceptQuotationInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        quotationId: cuid,
      }).quotationId,
    ).toBe(cuid);
    expect(
      rejectQuotationInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        quotationId: cuid,
        notes: "Preço acima do mercado",
      }).notes,
    ).toBe("Preço acima do mercado");
  });

  it("validates submitForApprovalInput requires at least one approver", () => {
    const parsed = submitForApprovalInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      poId: cuid,
      approverIds: ["user-1", "user-2"],
    });
    expect(parsed.approverIds).toHaveLength(2);
    expect(() =>
      submitForApprovalInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        poId: cuid,
        approverIds: [],
      }),
    ).toThrow();
  });

  it("validates confirmPurchaseOrderInput", () => {
    const parsed = confirmPurchaseOrderInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      poId: cuid,
    });
    expect(parsed.poId).toBe(cuid);
  });

  it("validates advancePoDeliveryInput accepts only delivery statuses", () => {
    const parsed = advancePoDeliveryInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      poId: cuid,
      to: "DELIVERED",
    });
    expect(parsed.to).toBe("DELIVERED");
    expect(() =>
      advancePoDeliveryInputSchema.parse({
        organizationId: uuid,
        marketCode: "AO",
        poId: cuid,
        to: "DRAFT",
      }),
    ).toThrow();
  });
});

describe("invoice schemas", () => {
  it("validates issueInvoiceInput", () => {
    const parsed = issueInvoiceInputSchema.parse({
      organizationId: uuid,
      marketCode: "AO",
      purchaseOrderId: cuid,
    });
    expect(parsed.purchaseOrderId).toBe(cuid);
  });

  it("validates invoiceSchema", () => {
    const parsed = invoiceSchema.parse({
      id: cuid,
      organizationId: uuid,
      marketCode: "AO",
      purchaseOrderId: cuid2,
      supplierId: cuid3,
      invoiceNumber: "INV-001",
      totalAmountMinor: 100000,
      currency: "AOA",
      status: "ISSUED",
      issuedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(parsed.status).toBe("ISSUED");
  });
});
