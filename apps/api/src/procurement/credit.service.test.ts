import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { CreditService } from "./credit.service.js";

describe("CreditService", () => {
  let svc: CreditService;
  const org = "00000000-0000-4000-8000-000000000000";
  const market = "AO";
  const supplierId = "c1234567890abcdef00000001";

  beforeEach(() => {
    svc = new CreditService();
  });

  it("creates credit account", () => {
    const acc = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 1000000,
    });
    expect(acc.status).toBe("ACTIVE");
    expect(acc.creditLimitMinor).toBe(1000000);
    expect(acc.balanceMinor).toBe(0);
    expect(acc.currency).toBe("AOA");
  });

  it("creates credit account with custom currency", () => {
    const acc = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 500000,
      currency: "USD",
    });
    expect(acc.currency).toBe("USD");
  });

  it("returns existing account when called twice (idempotent)", () => {
    const a1 = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 1000000,
    });
    const a2 = svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 2000000,
    });
    expect(a2.id).toBe(a1.id);
    expect(a2.creditLimitMinor).toBe(1000000);
  });

  it("check returns available when within limit", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 1000000,
    });
    const result = svc.check({
      organizationId: org,
      marketCode: market,
      supplierId,
      amountMinor: 500000,
    });
    expect(result.available).toBe(true);
    expect(result.creditLimitMinor).toBe(1000000);
    expect(result.balanceMinor).toBe(0);
    expect(result.requestedMinor).toBe(500000);
  });

  it("check returns unavailable when exceeding limit", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 100000,
    });
    const result = svc.check({
      organizationId: org,
      marketCode: market,
      supplierId,
      amountMinor: 200000,
    });
    expect(result.available).toBe(false);
  });

  it("check returns unavailable when exceeding limit", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 1000000,
    });
    svc.debit(org, supplierId, 300000);
    const after = svc.getAccount(org, supplierId);
    expect(after?.balanceMinor).toBe(300000);
  });

  it("credit decreases balance", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 1000000,
    });
    svc.debit(org, supplierId, 300000);
    svc.credit(org, supplierId, 100000);
    const after = svc.getAccount(org, supplierId);
    expect(after?.balanceMinor).toBe(200000);
  });

  it("credit does not go below zero", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 1000000,
    });
    svc.debit(org, supplierId, 100000);
    svc.credit(org, supplierId, 200000);
    const after = svc.getAccount(org, supplierId);
    expect(after?.balanceMinor).toBe(0);
  });

  it("debit rejects when exceeding limit", () => {
    svc.create({
      organizationId: org,
      marketCode: market,
      supplierId,
      creditLimitMinor: 100000,
    });
    expect(() => svc.debit(org, supplierId, 200000)).toThrow(
      BadRequestException,
    );
  });

  it("debit rejects when exceeding limit", () => {
    const acc = svc.getAccount(org, "non-existent");
    expect(acc).toBeNull();
  });

  it("check rejects for non-existent account", () => {
    expect(() =>
      svc.check({
        organizationId: org,
        marketCode: market,
        supplierId: "non-existent",
        amountMinor: 1000,
      }),
    ).toThrow(NotFoundException);
  });

  it("debit rejects for non-existent account", () => {
    expect(() => svc.debit(org, "non-existent", 1000)).toThrow(
      NotFoundException,
    );
  });

  it("credit rejects for non-existent account", () => {
    expect(() => svc.credit(org, "non-existent", 1000)).toThrow(
      NotFoundException,
    );
  });
});
