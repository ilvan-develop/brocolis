import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { SupplierService } from "./supplier.service.js";

describe("SupplierService", () => {
  let svc: SupplierService;

  beforeEach(() => {
    svc = new SupplierService();
  });

  const input = {
    organizationId: "00000000-0000-4000-8000-000000000000",
    marketCode: "AO",
    name: "Distribuidora Central",
    slug: "distribuidora-central",
  };

  it("creates supplier in ACTIVE status", () => {
    const supplier = svc.create(input);
    expect(supplier.status).toBe("ACTIVE");
    expect(supplier.name).toBe(input.name);
    expect(supplier.slug).toBe(input.slug);
    expect(supplier.id).toBeDefined();
    expect(supplier.createdAt).toBeInstanceOf(Date);
    expect(supplier.updatedAt).toBeInstanceOf(Date);
  });

  it("creates supplier with optional contact fields", () => {
    const supplier = svc.create({
      ...input,
      contactEmail: "test@example.com",
      contactPhone: "+244900000000",
    });
    expect(supplier.contactEmail).toBe("test@example.com");
    expect(supplier.contactPhone).toBe("+244900000000");
  });

  it("getById returns supplier when found", () => {
    const created = svc.create(input);
    const found = svc.getById(
      created.organizationId,
      created.marketCode,
      created.id,
    );
    expect(found.id).toBe(created.id);
    expect(found.name).toBe(created.name);
  });

  it("getById throws NotFoundException for missing id", () => {
    expect(() =>
      svc.getById(input.organizationId, input.marketCode, "non-existent"),
    ).toThrow(NotFoundException);
  });

  it("getById respects tenant scope", () => {
    const created = svc.create(input);
    expect(() =>
      svc.getById(
        "11111111-1111-4111-8111-111111111111",
        input.marketCode,
        created.id,
      ),
    ).toThrow(NotFoundException);
  });

  it("listByOrg returns only matching org+market", async () => {
    svc.create(input);
    svc.create({ ...input, name: "B", slug: "b" });
    svc.create({
      ...input,
      organizationId: "11111111-1111-4111-8111-111111111111",
      name: "C",
      slug: "c",
    });

    const result = await svc.listByOrg(input.organizationId, input.marketCode);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("listByOrg supports pagination", async () => {
    for (let i = 0; i < 5; i++) {
      svc.create({ ...input, name: `S${i}`, slug: `s${i}` });
    }

    const page1 = await svc.listByOrg(
      input.organizationId,
      input.marketCode,
      1,
      2,
    );
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);

    const page2 = await svc.listByOrg(
      input.organizationId,
      input.marketCode,
      2,
      2,
    );
    expect(page2.items).toHaveLength(2);
    expect(page2.page).toBe(2);
  });

  it("listByOrg sorts by createdAt desc", async () => {
    const first = svc.create(input);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = svc.create({ ...input, name: "B", slug: "b" });

    const result = await svc.listByOrg(input.organizationId, input.marketCode);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.id).toBe(second.id);
    expect(result.items[1]!.id).toBe(first.id);
  });
});
