import { NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { PricingService } from "./pricing.service.js";
import type { SupplierService } from "./supplier.service.js";

describe("PricingService", () => {
  const org = "00000000-0000-4000-8000-000000000000";
  const market = "AO";
  const supplierId = "c1234567890abcdef00000001";
  const productId = "c1234567890abcdef00000021";

  function createSupplierServiceMock(throwOnMissing = false): SupplierService {
    return {
      getById: (oid: string, mc: string, sid: string) => {
        if (throwOnMissing && sid !== supplierId) {
          throw new NotFoundException(`Fornecedor ${sid} não encontrado`);
        }
        return { id: supplierId } as any;
      },
    } as SupplierService;
  }

  function setup() {
    const supplierService = createSupplierServiceMock();
    const svc = new PricingService(supplierService);
    return { svc };
  }

  it("selects the applicable tier and computes lineTotalMinor without volume discount", () => {
    const { svc } = setup();
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 1,
      maxQty: 49,
      unitPriceMinor: 1000,
    });
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 50,
      unitPriceMinor: 800,
    });
    const result = svc.calculatePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      quantity: 10,
    });
    expect(result.unitPriceMinor).toBe(1000);
    expect(result.lineTotalMinor).toBe(10000);
    expect(result.volumeDiscountBps).toBeUndefined();
  });

  it("selects the most specific (highest minQty) tier that covers the quantity", () => {
    const { svc } = setup();
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 1,
      maxQty: 49,
      unitPriceMinor: 1000,
    });
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 50,
      unitPriceMinor: 800,
    });
    const result = svc.calculatePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      quantity: 100,
    });
    expect(result.unitPriceMinor).toBe(800);
  });

  it("applies volume discount (basis points) on top of the selected tier", () => {
    const { svc } = setup();
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 1,
      unitPriceMinor: 1000,
    });
    svc.createVolumePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minVolume: 20,
      discountBps: 1000,
    });
    const result = svc.calculatePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      quantity: 25,
    });
    expect(result.unitPriceMinor).toBe(900);
    expect(result.volumeDiscountBps).toBe(1000);
    expect(result.lineTotalMinor).toBe(900 * 25);
  });

  it("does not apply volume discount when quantity is below minVolume", () => {
    const { svc } = setup();
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 1,
      unitPriceMinor: 1000,
    });
    svc.createVolumePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minVolume: 20,
      discountBps: 1000,
    });
    const result = svc.calculatePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      quantity: 5,
    });
    expect(result.unitPriceMinor).toBe(1000);
    expect(result.volumeDiscountBps).toBeUndefined();
  });

  it("throws NotFoundException when no tier is applicable", () => {
    const { svc } = setup();
    expect(() =>
      svc.calculatePrice({
        organizationId: org,
        marketCode: market,
        supplierId,
        productId,
        quantity: 5,
      }),
    ).toThrow(NotFoundException);
  });

  it("throws NotFoundException when quantity is below all tier minQty", () => {
    const { svc } = setup();
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId,
      minQty: 100,
      unitPriceMinor: 500,
    });
    expect(() =>
      svc.calculatePrice({
        organizationId: org,
        marketCode: market,
        supplierId,
        productId,
        quantity: 10,
      }),
    ).toThrow(NotFoundException);
  });

  it("createPriceTier rejects a supplier outside the tenant scope", () => {
    const supplierService = createSupplierServiceMock(true);
    const svc = new PricingService(supplierService);
    expect(() =>
      svc.createPriceTier({
        organizationId: "11111111-1111-4111-8111-111111111111",
        marketCode: market,
        supplierId: "non-existent-supplier-id",
        productId,
        minQty: 1,
        unitPriceMinor: 1000,
      }),
    ).toThrow(NotFoundException);
  });

  it("listPriceTiers filters by productId", () => {
    const { svc } = setup();
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId: "prod-a",
      minQty: 1,
      unitPriceMinor: 1000,
    });
    svc.createPriceTier({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId: "prod-b",
      minQty: 1,
      unitPriceMinor: 2000,
    });

    const tiers = svc.listPriceTiers(org, market, supplierId, "prod-a");
    expect(tiers).toHaveLength(1);
    expect(tiers[0]!.productId).toBe("prod-a");
  });

  it("listVolumePrices filters by productId", () => {
    const { svc } = setup();
    svc.createVolumePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId: "prod-a",
      minVolume: 10,
      discountBps: 500,
    });
    svc.createVolumePrice({
      organizationId: org,
      marketCode: market,
      supplierId,
      productId: "prod-b",
      minVolume: 10,
      discountBps: 500,
    });

    const volumes = svc.listVolumePrices(org, market, supplierId, "prod-a");
    expect(volumes).toHaveLength(1);
    expect(volumes[0]!.productId).toBe("prod-a");
  });
});
