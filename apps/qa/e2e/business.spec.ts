import { expect, test } from "@playwright/test";
import { BUSINESS_ORG, BUSINESS_USER, signInAs } from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Business Procurement E2E", () => {
  test("business dashboard loads with KPIs", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business`);
    await expect(
      page.getByRole("heading", { name: /aquisições b2b|procurement/i }),
    ).toBeVisible();
  });

  test("RFQ page loads", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business/rfqs`);
    await expect(
      page.getByRole("heading", { name: /pedidos de cotação|rfq/i }),
    ).toBeVisible();
  });

  test("Purchase Orders page loads", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business/purchase-orders`);
    await expect(
      page.getByRole("heading", { name: /ordens de compra|purchase orders/i }),
    ).toBeVisible();
  });

  test("Approvals page loads", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business/approvals`);
    await expect(
      page.getByRole("heading", { name: /aprovações|approvals/i }),
    ).toBeVisible();
  });

  test("Credit page loads", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business/credit`);
    await expect(
      page.getByRole("heading", { name: /crédito|credit/i }),
    ).toBeVisible();
  });

  test("Suppliers page loads", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business/suppliers`);
    await expect(
      page.getByRole("heading", { name: /fornecedores|suppliers/i }),
    ).toBeVisible();
  });
});
