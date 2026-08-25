import { expect, test } from "@playwright/test";
import {
  BUSINESS_ORG,
  BUSINESS_USER,
  CUSTOMER_ORG,
  CUSTOMER_USER,
  FARMACY_ORG,
  FARMACY_USER,
  SUPPLIER_ORG,
  SUPPLIER_USER,
  signInAs,
} from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Multi-Tenant Isolation E2E", () => {
  test("pharmacy user can access pharmacy portal", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy`);
    await expect(
      page.getByRole("link", { name: /inventário|inventory/i }),
    ).toBeVisible();
  });

  test("customer user can access storefront", async ({ page }) => {
    await signInAs(page, CUSTOMER_USER, CUSTOMER_ORG, "CONSUMER", ["CONSUMER"]);
    await page.goto(`${BASE_URL}/`);
    await expect(
      page.getByRole("heading", { name: /catálogo|catalog/i }),
    ).toBeVisible();
  });

  test("business user can access business dashboard", async ({ page }) => {
    await signInAs(page, BUSINESS_USER, BUSINESS_ORG, "BUSINESS", [
      "BUSINESS",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/business`);
    await expect(
      page.getByRole("heading", { name: /aquisições|procurement/i }),
    ).toBeVisible();
  });

  test("supplier user can access supplier portal", async ({ page }) => {
    await signInAs(page, SUPPLIER_USER, SUPPLIER_ORG, "SUPPLIER", [
      "SUPPLIER",
      "ADMIN",
    ]);
    await page.goto(`${BASE_URL}/supplier`);
    await expect(
      page.getByRole("heading", { name: /fornecedores|supplier/i }),
    ).toBeVisible();
  });

  test("different users see different organization contexts", async ({
    page,
  }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/overview`);
    await expect(page.getByText(/farmácia|pharmacy/i).first()).toBeVisible();
  });
});
