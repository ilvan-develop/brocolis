import { Injectable, NotFoundException } from "@nestjs/common";
import { nextCuid } from "../cuid.js";
import type { SupplierService } from "./supplier.service.js";

export type PriceTierRecord = {
  id: string;
  supplierId: string;
  productId: string;
  minQty: number;
  maxQty?: number;
  unitPriceMinor: number;
  currency: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type VolumePriceRecord = {
  id: string;
  supplierId: string;
  productId: string;
  minVolume: number;
  discountBps: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePriceTierInput = {
  organizationId: string;
  marketCode: string;
  supplierId: string;
  productId: string;
  minQty: number;
  maxQty?: number;
  unitPriceMinor: number;
  currency?: string;
};

export type CreateVolumePriceInput = {
  organizationId: string;
  marketCode: string;
  supplierId: string;
  productId: string;
  minVolume: number;
  discountBps: number;
};

export type CalculatePriceInput = {
  organizationId: string;
  marketCode: string;
  supplierId: string;
  productId: string;
  quantity: number;
};

export type CalculatedPrice = {
  unitPriceMinor: number;
  tierApplied?: string;
  volumeDiscountBps?: number;
  lineTotalMinor: number;
  currency: string;
};

/**
 * F4 — Preços por Tier e Volume (ADR-0013): seleciona o PriceTier mais
 * específico aplicável à quantidade pedida, depois aplica o desconto de
 * VolumePrice elegível (basis points) sobre o preço unitário do tier.
 */
@Injectable()
export class PricingService {
  private readonly tiers = new Map<string, PriceTierRecord>();
  private readonly volumePrices = new Map<string, VolumePriceRecord>();

  constructor(private readonly supplierService: SupplierService) {}

  createPriceTier(input: CreatePriceTierInput): PriceTierRecord {
    // organizationId+marketCode obrigatórios (regra 3): validados via o
    // fornecedor, que é o único dono transitivo do tier (schema Prisma
    // não duplica organizationId/marketCode em PriceTier).
    this.supplierService.getById(
      input.organizationId,
      input.marketCode,
      input.supplierId,
    );
    const id = nextCuid();
    const now = new Date();
    const record: PriceTierRecord = {
      id,
      supplierId: input.supplierId,
      productId: input.productId,
      minQty: input.minQty,
      unitPriceMinor: input.unitPriceMinor,
      currency: input.currency ?? "AOA",
      active: true,
      createdAt: now,
      updatedAt: now,
      ...(input.maxQty !== undefined ? { maxQty: input.maxQty } : {}),
    };
    this.tiers.set(id, record);
    return record;
  }

  createVolumePrice(input: CreateVolumePriceInput): VolumePriceRecord {
    this.supplierService.getById(
      input.organizationId,
      input.marketCode,
      input.supplierId,
    );
    const id = nextCuid();
    const now = new Date();
    const record: VolumePriceRecord = {
      id,
      supplierId: input.supplierId,
      productId: input.productId,
      minVolume: input.minVolume,
      discountBps: input.discountBps,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.volumePrices.set(id, record);
    return record;
  }

  listPriceTiers(
    organizationId: string,
    marketCode: string,
    supplierId: string,
    productId?: string,
  ): PriceTierRecord[] {
    this.supplierService.getById(organizationId, marketCode, supplierId);
    return [...this.tiers.values()].filter(
      (t) =>
        t.supplierId === supplierId &&
        (productId === undefined || t.productId === productId),
    );
  }

  listVolumePrices(
    organizationId: string,
    marketCode: string,
    supplierId: string,
    productId?: string,
  ): VolumePriceRecord[] {
    this.supplierService.getById(organizationId, marketCode, supplierId);
    return [...this.volumePrices.values()].filter(
      (v) =>
        v.supplierId === supplierId &&
        (productId === undefined || v.productId === productId),
    );
  }

  calculatePrice(input: CalculatePriceInput): CalculatedPrice {
    this.supplierService.getById(
      input.organizationId,
      input.marketCode,
      input.supplierId,
    );

    const candidateTiers = [...this.tiers.values()].filter(
      (t) =>
        t.supplierId === input.supplierId &&
        t.productId === input.productId &&
        t.active &&
        input.quantity >= t.minQty &&
        (t.maxQty === undefined || input.quantity <= t.maxQty),
    );
    if (candidateTiers.length === 0) {
      throw new NotFoundException(
        `Nenhum tier de preço aplicável para o produto ${input.productId} (qtd ${input.quantity})`,
      );
    }
    // Tier mais específico: o de minQty mais alto que ainda cobre a quantidade.
    const tier = candidateTiers.reduce((best, current) =>
      current.minQty > best.minQty ? current : best,
    );

    const candidateVolumes = [...this.volumePrices.values()].filter(
      (v) =>
        v.supplierId === input.supplierId &&
        v.productId === input.productId &&
        v.active &&
        input.quantity >= v.minVolume,
    );
    const volume =
      candidateVolumes.length > 0
        ? candidateVolumes.reduce((best, current) =>
            current.minVolume > best.minVolume ? current : best,
          )
        : undefined;

    const discountBps = volume?.discountBps ?? 0;
    const unitPriceMinor = Math.round(
      tier.unitPriceMinor - (tier.unitPriceMinor * discountBps) / 10000,
    );
    const lineTotalMinor = unitPriceMinor * input.quantity;

    return {
      unitPriceMinor,
      tierApplied: tier.id,
      ...(volume ? { volumeDiscountBps: volume.discountBps } : {}),
      lineTotalMinor,
      currency: tier.currency,
    };
  }
}
