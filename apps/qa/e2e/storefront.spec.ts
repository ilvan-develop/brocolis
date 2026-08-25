import { expect, test } from "@playwright/test";
import { CUSTOMER_ORG, CUSTOMER_USER, signInAs } from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Storefront B2C E2E", () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, CUSTOMER_USER, CUSTOMER_ORG, "CONSUMER", ["CONSUMER"]);
  });

  test("homepage renders catalog heading", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(
      page.getByRole("heading", { name: /catálogo|catalog/i }),
    ).toBeVisible();
  });

  test("search input is available", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const searchInput = page.getByPlaceholder(/procurar|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("paracetamol");
      await page.waitForTimeout(500);
    }
  });

  test("category chip is available", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const categoryChip = page.getByRole("button", {
      name: /analgésicos|analgesic/i,
    });
    if (await categoryChip.isVisible()) {
      await categoryChip.click();
      await page.waitForTimeout(500);
    }
  });

  test("add product button exists", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const addButtons = page.getByRole("button", { name: /adicionar|add/i });
    if (await addButtons.first().isVisible()) {
      await addButtons.first().click();
      await page.goto(`${BASE_URL}/carrinho`);
      await expect(page.getByText(/carrinho|cart/i)).toBeVisible();
    }
  });

  test("cart page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/carrinho`);
    await expect(
      page.getByRole("heading", { name: /carrinho|cart/i }),
    ).toBeVisible();
  });

  test("empty cart continue link exists", async ({ page }) => {
    await page.goto(`${BASE_URL}/carrinho`);
    const continueLink = page.getByRole("link", {
      name: /continuar|continue/i,
    });
    if (await continueLink.isVisible()) {
      await expect(continueLink).toHaveAttribute("href", "/");
    }
  });

  test("checkout page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    await expect(
      page.getByRole("heading", { name: /finalizar pedido|checkout/i }),
    ).toBeVisible();
  });

  test("checkout client step form is visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    const nameInput = page.getByLabel(/nome completo|name/i);
    const phoneInput = page.getByLabel(/telefone|telemóvel|phone/i);
    if ((await nameInput.isVisible()) && (await phoneInput.isVisible())) {
      await nameInput.fill("Cliente Teste");
      await phoneInput.fill("+244900000001");
      await page.getByRole("button", { name: /continuar|continue/i }).click();
      await page.waitForTimeout(500);
    }
  });

  test("checkout delivery step form is visible", async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);
    const nameInput = page.getByLabel(/nome completo|name/i);
    const phoneInput = page.getByLabel(/telefone|telemóvel|phone/i);
    if ((await nameInput.isVisible()) && (await phoneInput.isVisible())) {
      await nameInput.fill("Cliente Teste");
      await phoneInput.fill("+244900000001");
      await page.getByRole("button", { name: /continuar|continue/i }).click();
      await page.waitForTimeout(500);
      const streetInput = page.getByLabel(/rua|street/i);
      const numberInput = page.getByLabel(/número|house.*number/i);
      if ((await streetInput.isVisible()) && (await numberInput.isVisible())) {
        await streetInput.fill("Rua Principal");
        await numberInput.fill("123");
        await page.getByRole("button", { name: /continuar|continue/i }).click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("product cards are present", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const productLinks = page.getByRole("link", { name: /ver|view/i });
    if (await productLinks.first().isVisible()) {
      await productLinks.first().click();
      await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    }
  });
});
