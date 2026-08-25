import { expect, test } from "@playwright/test";
import { FARMACY_ORG, FARMACY_USER, signInAs } from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Pharmacy Portal E2E", () => {
  test("pharmacy dashboard overview loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/overview`);
    await expect(
      page.getByRole("heading", { name: /visão.*geral|overview/i }),
    ).toBeVisible();
  });

  test("pharmacy inventory page loads with stock data", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/inventory`);
    await expect(
      page.getByRole("heading", { name: /inventário|inventory/i }),
    ).toBeVisible();
  });

  test("pharmacy orders page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/orders`);
    await expect(
      page.getByRole("heading", { name: /pedidos|orders/i }),
    ).toBeVisible();
  });

  test("pharmacy prescriptions page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/prescriptions`);
    await expect(
      page.getByRole("heading", { name: /receitas|prescriptions/i }),
    ).toBeVisible();
  });

  test("pharmacy customers page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/customers`);
    await expect(
      page.getByRole("heading", { name: /clientes|customers/i }),
    ).toBeVisible();
  });

  test("pharmacy delivery page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/delivery`);
    await expect(
      page.getByRole("heading", { name: /entrega|delivery/i }),
    ).toBeVisible();
  });

  test("pharmacy finance page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/finance`);
    await expect(
      page.getByRole("heading", { name: /finanças|finance/i }),
    ).toBeVisible();
  });

  test("pharmacy settings page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/settings`);
    await expect(
      page.getByRole("heading", { name: /configurações|settings/i }),
    ).toBeVisible();
  });

  test("pharmacy catalog page loads", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/catalog`);
    await expect(
      page.getByRole("heading", { name: /catálogo|catalog/i }),
    ).toBeVisible();
  });
});
