import { expect, test } from "@playwright/test";
import { SUPPLIER_ORG, SUPPLIER_USER, signInAs } from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Supplier Portal E2E", () => {
  test("supplier dashboard loads", async ({ page }) => {
    await signInAs(page, SUPPLIER_USER, SUPPLIER_ORG, "SUPPLIER", [
      "SUPPLIER",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/supplier`);
    await expect(
      page.getByRole("heading", { name: /fornecedores|supplier/i }),
    ).toBeVisible();
  });

  test("supplier RFQs page loads", async ({ page }) => {
    await signInAs(page, SUPPLIER_USER, SUPPLIER_ORG, "SUPPLIER", [
      "SUPPLIER",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/supplier/rfqs`);
    await expect(
      page.getByRole("heading", { name: /pedidos de cotação|rfq/i }),
    ).toBeVisible();
  });

  test("supplier quotations page loads", async ({ page }) => {
    await signInAs(page, SUPPLIER_USER, SUPPLIER_ORG, "SUPPLIER", [
      "SUPPLIER",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/supplier/quotations`);
    await expect(
      page.getByRole("heading", { name: /cotações|quotations/i }),
    ).toBeVisible();
  });

  test("supplier orders page loads", async ({ page }) => {
    await signInAs(page, SUPPLIER_USER, SUPPLIER_ORG, "SUPPLIER", [
      "SUPPLIER",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/supplier/orders`);
    await expect(
      page.getByRole("heading", { name: /ordens de compra|orders/i }),
    ).toBeVisible();
  });

  test("supplier catalog page loads", async ({ page }) => {
    await signInAs(page, SUPPLIER_USER, SUPPLIER_ORG, "SUPPLIER", [
      "SUPPLIER",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/supplier/catalog`);
    await expect(
      page.getByRole("heading", { name: /preços|pricing/i }),
    ).toBeVisible();
  });
});
