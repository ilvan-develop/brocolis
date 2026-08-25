import { expect, test } from "@playwright/test";
import {
  BUSINESS_ORG,
  BUSINESS_USER,
  SUPPLIER_ORG,
  SUPPLIER_USER,
  signInAs,
} from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Procurement B2B E2E", () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto("/business");
  });

  test("business dashboard loads with key sections", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /aquisições b2b|procurement/i }),
    ).toBeVisible();
  });

  test("RFQ page loads and shows empty state", async ({ page }) => {
    await page.goto("/business/rfqs");
    await expect(
      page.getByRole("heading", { name: /pedidos de cotação|rfq/i }),
    ).toBeVisible();
  });

  test("Purchase Orders page loads", async ({ page }) => {
    await page.goto("/business/purchase-orders");
    await expect(
      page.getByRole("heading", { name: /ordens de compra|purchase orders/i }),
    ).toBeVisible();
  });

  test("Approvals page loads", async ({ page }) => {
    await page.goto("/business/approvals");
    await expect(
      page.getByRole("heading", { name: /aprovações|approvals/i }),
    ).toBeVisible();
  });

  test("Credit page loads", async ({ page }) => {
    await page.goto("/business/credit");
    await expect(
      page.getByRole("heading", { name: /crédito|credit/i }),
    ).toBeVisible();
  });

  test("Suppliers page loads", async ({ page }) => {
    await page.goto("/business/suppliers");
    await expect(
      page.getByRole("heading", { name: /fornecedores|suppliers/i }),
    ).toBeVisible();
  });

  test("Supplier portal navigation", async ({ page }) => {
    await page.goto("/supplier");
    await expect(
      page.getByRole("heading", { name: /fornecedores|supplier/i }),
    ).toBeVisible();

    await page.goto("/supplier/rfqs");
    await expect(
      page.getByRole("heading", { name: /pedidos de cotação|rfq/i }),
    ).toBeVisible();

    await page.goto("/supplier/quotations");
    await expect(
      page.getByRole("heading", { name: /cotações|quotations/i }),
    ).toBeVisible();

    await page.goto("/supplier/orders");
    await expect(
      page.getByRole("heading", { name: /ordens de compra|orders/i }),
    ).toBeVisible();

    await page.goto("/supplier/catalog");
    await expect(
      page.getByRole("heading", { name: /preços e tiers|pricing/i }),
    ).toBeVisible();
  });
});
