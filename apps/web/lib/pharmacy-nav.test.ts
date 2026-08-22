import { describe, expect, it } from "vitest";
import { isPharmacyNavItemActive, PHARMACY_NAV_ITEMS } from "./pharmacy-nav";

describe("pharmacy-nav", () => {
  it("expõe as 9 rotas do portal (sem a base)", () => {
    expect(PHARMACY_NAV_ITEMS).toHaveLength(9);
    const hrefs = PHARMACY_NAV_ITEMS.map((item) => item.href);
    expect(hrefs).toEqual([
      "/dashboard/pharmacy/overview",
      "/dashboard/pharmacy/orders",
      "/dashboard/pharmacy/catalog",
      "/dashboard/pharmacy/inventory",
      "/dashboard/pharmacy/prescriptions",
      "/dashboard/pharmacy/customers",
      "/dashboard/pharmacy/delivery",
      "/dashboard/pharmacy/finance",
      "/dashboard/pharmacy/settings",
    ]);
  });

  it("todas as rotas são únicas e sob o prefixo do portal", () => {
    const hrefs = PHARMACY_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href.startsWith("/dashboard/pharmacy/")).toBe(true);
    }
  });

  it("deteta a rota ativa", () => {
    expect(
      isPharmacyNavItemActive(
        "/dashboard/pharmacy/orders",
        "/dashboard/pharmacy/orders",
      ),
    ).toBe(true);
    expect(
      isPharmacyNavItemActive(
        "/dashboard/pharmacy/orders",
        "/dashboard/pharmacy/orders/123",
      ),
    ).toBe(true);
    expect(
      isPharmacyNavItemActive(
        "/dashboard/pharmacy/orders",
        "/dashboard/pharmacy/overview",
      ),
    ).toBe(false);
  });
});
