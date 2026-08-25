import { database } from "@brocolis/db";
import { Injectable, NotFoundException } from "@nestjs/common";

export type SupplierRecord = {
  id: string;
  organizationId: string;
  marketCode: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  contactEmail?: string;
  contactPhone?: string;
  address?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSupplierInput = {
  organizationId: string;
  marketCode: string;
  name: string;
  slug: string;
  contactEmail?: string;
  contactPhone?: string;
};

@Injectable()
export class SupplierService {
  create(input: CreateSupplierInput): SupplierRecord {
    const record = database().supplier.create({
      data: {
        organizationId: input.organizationId,
        marketCode: input.marketCode,
        name: input.name,
        slug: input.slug,
        status: "ACTIVE",
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      },
    });
    return record as SupplierRecord;
  }

  getById(
    organizationId: string,
    marketCode: string,
    supplierId: string,
  ): SupplierRecord {
    const supplier = database().supplier.findUnique({
      where: { id: supplierId, organizationId, marketCode },
    });
    if (!supplier) {
      throw new NotFoundException(`Fornecedor ${supplierId} não encontrado`);
    }
    return supplier as SupplierRecord;
  }

  async listByOrg(
    organizationId: string,
    marketCode: string,
    page = 1,
    pageSize = 20,
  ): Promise<{
    items: SupplierRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const where = { organizationId, marketCode };
    const [items, total] = await Promise.all([
      database().supplier.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      database().supplier.count({ where }),
    ]);
    return {
      items: items as SupplierRecord[],
      total,
      page,
      pageSize,
    };
  }
}
