import { describe, expect, it } from "vitest";
import {
  allowedRoutePrefixes,
  canAccessRoute,
  defaultRouteFor,
  PORTAL_PREFIX,
} from "./routes";

describe("routes — prefixo por portal", () => {
  it("mapeia cada portal ao seu prefixo", () => {
    expect(PORTAL_PREFIX).toEqual({
      CONSUMER: "/dashboard/consumer",
      PHARMACY: "/dashboard/pharmacy",
      SUPPLIER: "/dashboard/supplier",
      BUSINESS: "/dashboard/business",
      PLATFORM: "/admin",
    });
  });
});

describe("routes — Pharmacy Portal (05 §1.2)", () => {
  it("OWNER/ADMIN acedem a todas as rotas da farmácia", () => {
    const owner = allowedRoutePrefixes("PHARMACY", ["OWNER"]);
    expect(owner).toContain("/dashboard/pharmacy/orders");
    expect(owner).toContain("/dashboard/pharmacy/finance");
    expect(owner).toContain("/dashboard/pharmacy/settings");
    expect(
      canAccessRoute("PHARMACY", ["OWNER"], "/dashboard/pharmacy/inventory"),
    ).toBe(true);
    expect(
      canAccessRoute("PHARMACY", ["ADMIN"], "/dashboard/pharmacy/settings"),
    ).toBe(true);
  });

  it("PHARMACIST tem prescrições, pedidos e stock, sem financeiro nem definições", () => {
    const pharmacist = allowedRoutePrefixes("PHARMACY", ["PHARMACIST"]);
    expect(pharmacist).toContain("/dashboard/pharmacy/prescriptions");
    expect(pharmacist).toContain("/dashboard/pharmacy/orders");
    expect(pharmacist).toContain("/dashboard/pharmacy/inventory");
    expect(pharmacist).not.toContain("/dashboard/pharmacy/finance");
    expect(pharmacist).not.toContain("/dashboard/pharmacy/settings");
    expect(
      canAccessRoute("PHARMACY", ["PHARMACIST"], "/dashboard/pharmacy/finance"),
    ).toBe(false);
  });

  it("FINANCE só acede ao financeiro", () => {
    const finance = allowedRoutePrefixes("PHARMACY", ["FINANCE"]);
    expect(finance).toContain("/dashboard/pharmacy/finance");
    expect(
      canAccessRoute("PHARMACY", ["FINANCE"], "/dashboard/pharmacy/orders"),
    ).toBe(false);
  });

  it("INVENTORY acede a stock e pedidos", () => {
    expect(
      canAccessRoute(
        "PHARMACY",
        ["INVENTORY"],
        "/dashboard/pharmacy/inventory",
      ),
    ).toBe(true);
    expect(
      canAccessRoute("PHARMACY", ["INVENTORY"], "/dashboard/pharmacy/orders"),
    ).toBe(true);
    expect(
      canAccessRoute(
        "PHARMACY",
        ["INVENTORY"],
        "/dashboard/pharmacy/prescriptions",
      ),
    ).toBe(false);
  });

  it("VIEWER tem leitura essencial", () => {
    expect(canAccessRoute("PHARMACY", ["VIEWER"], "/dashboard/pharmacy")).toBe(
      true,
    );
    expect(
      canAccessRoute("PHARMACY", ["VIEWER"], "/dashboard/pharmacy/settings"),
    ).toBe(false);
  });
});

describe("routes — Supplier Portal (05 §1.2)", () => {
  it("SALES acede a catálogo e cotações, sem logística", () => {
    const sales = allowedRoutePrefixes("SUPPLIER", ["SALES"]);
    expect(sales).toContain("/dashboard/supplier/catalog");
    expect(sales).toContain("/dashboard/supplier/quotations");
    expect(sales).not.toContain("/dashboard/supplier/logistics");
    expect(sales).not.toContain("/dashboard/supplier/finance");
  });

  it("LOGISTICS acede a entregas, sem catálogo", () => {
    const logistics = allowedRoutePrefixes("SUPPLIER", ["LOGISTICS"]);
    expect(logistics).toContain("/dashboard/supplier/logistics");
    expect(logistics).not.toContain("/dashboard/supplier/catalog");
  });
});

describe("routes — Business Portal (05 §1.2)", () => {
  it("BUYER acede a procurement e pedidos, sem aprovações", () => {
    const buyer = allowedRoutePrefixes("BUSINESS", ["BUYER"]);
    expect(buyer).toContain("/dashboard/business/procurement");
    expect(buyer).toContain("/dashboard/business/orders");
    expect(buyer).not.toContain("/dashboard/business/approvals");
    expect(
      canAccessRoute("BUSINESS", ["BUYER"], "/dashboard/business/approvals"),
    ).toBe(false);
  });

  it("APPROVER só acede a aprovações", () => {
    const approver = allowedRoutePrefixes("BUSINESS", ["APPROVER"]);
    expect(approver).toContain("/dashboard/business/approvals");
    expect(
      canAccessRoute(
        "BUSINESS",
        ["APPROVER"],
        "/dashboard/business/procurement",
      ),
    ).toBe(false);
  });

  it("ADMIN tem acesso total ao portal business", () => {
    expect(
      canAccessRoute("BUSINESS", ["ADMIN"], "/dashboard/business/finance"),
    ).toBe(true);
    expect(
      canAccessRoute("BUSINESS", ["ADMIN"], "/dashboard/business/settings"),
    ).toBe(true);
  });
});

describe("routes — Platform (05 §1.2)", () => {
  it("COMPLIANCE acede a compliance/auditoria, sem marketplace", () => {
    const compliance = allowedRoutePrefixes("PLATFORM", ["COMPLIANCE"]);
    expect(compliance).toContain("/admin/compliance");
    expect(compliance).toContain("/admin/audit");
    expect(compliance).not.toContain("/admin/marketplace");
    expect(
      canAccessRoute("PLATFORM", ["COMPLIANCE"], "/admin/marketplace"),
    ).toBe(false);
  });

  it("SUPPORT acede a suporte e pedidos, sem financeiro", () => {
    expect(canAccessRoute("PLATFORM", ["SUPPORT"], "/admin/support")).toBe(
      true,
    );
    expect(canAccessRoute("PLATFORM", ["SUPPORT"], "/admin/orders")).toBe(true);
    expect(canAccessRoute("PLATFORM", ["SUPPORT"], "/admin/finance")).toBe(
      false,
    );
  });

  it("platform_admin ignora a matrix (bypass RBAC)", () => {
    expect(canAccessRoute("PLATFORM", ["ADMIN"], "/admin/analytics")).toBe(
      true,
    );
    expect(canAccessRoute("PLATFORM", ["ADMIN"], "/admin/marketplace")).toBe(
      true,
    );
  });
});

describe("routes — Consumer", () => {
  it("consumidor acede às rotas B2C", () => {
    const consumer = allowedRoutePrefixes("CONSUMER", ["CONSUMER"]);
    expect(consumer).toContain("/dashboard/consumer");
    expect(consumer).toContain("/cart");
    expect(canAccessRoute("CONSUMER", ["CONSUMER"], "/checkout")).toBe(true);
    expect(
      canAccessRoute("CONSUMER", ["CONSUMER"], "/dashboard/pharmacy"),
    ).toBe(false);
  });
});

describe("routes — fronteiras de prefixo", () => {
  it("não confunde rotas com prefixos parecidos", () => {
    expect(
      canAccessRoute(
        "PHARMACY",
        ["FINANCE"],
        "/dashboard/pharmacy/finance/export",
      ),
    ).toBe(true);
    expect(
      canAccessRoute("PHARMACY", ["FINANCE"], "/dashboard/pharmacy/financial"),
    ).toBe(false);
  });

  it("devolve a rota padrão do portal", () => {
    expect(defaultRouteFor("PHARMACY", ["ADMIN"])).toBe("/dashboard/pharmacy");
    expect(defaultRouteFor("CONSUMER", ["CONSUMER"])).toBe(
      "/dashboard/consumer",
    );
    expect(defaultRouteFor("BUSINESS", ["APPROVER"])).toBe(
      "/dashboard/business",
    );
  });
});
