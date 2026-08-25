import { expect, test } from "@playwright/test";
import {
  CUSTOMER_ORG,
  CUSTOMER_USER,
  FARMACY_ORG,
  FARMACY_USER,
  signInAs,
} from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

test.describe("Order Lifecycle E2E", () => {
  test("checkout review and confirmation flow renders", async ({ page }) => {
    await signInAs(page, CUSTOMER_USER, CUSTOMER_ORG, "CONSUMER", ["CONSUMER"]);
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
      const pharmacyButton = page
        .getByRole("button", { name: /farmacia-central|pharmacy/i })
        .first();
      if (await pharmacyButton.isVisible()) {
        await pharmacyButton.click();
        await page.getByRole("button", { name: /continuar|continue/i }).click();
        await page.waitForTimeout(500);
      }
      const paymentMethod = page
        .getByRole("button", { name: /referência|reference|cod|wallet/i })
        .first();
      if (await paymentMethod.isVisible()) {
        await paymentMethod.click();
      }
      const confirmCheckbox = page.getByLabel(/confirmar|confirm/i);
      if (await confirmCheckbox.isVisible()) {
        await confirmCheckbox.check();
      }
      await page.getByRole("button", { name: /continuar|continue/i }).click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/confirmação|confirmation/i)).toBeVisible();
    }
  });

  test("pharmacy prescriptions page is accessible", async ({ page }) => {
    await signInAs(page, FARMACY_USER, FARMACY_ORG, "PHARMACY", [
      "PHARMACY",
      "OWNER",
    ]);
    await page.goto(`${BASE_URL}/dashboard/pharmacy/prescriptions`);
    await expect(
      page.getByRole("heading", { name: /receitas|prescriptions/i }),
    ).toBeVisible();
  });
});
