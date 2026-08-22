import { expect, test } from "@playwright/test";

test.describe("B2B2C Network E2E", () => {
  test("Network page renders B2B2C flow stages", async ({ page }) => {
    await page.goto("/network");

    await expect(
      page.getByRole("heading", { name: /rede b2b2c|b2b2c network/i }),
    ).toBeVisible();

    await expect(page.getByText(/consumidor|consumer/i)).toBeVisible();

    await expect(page.getByText(/farmácia|pharmacy/i).first()).toBeVisible();
  });

  test("Audit explorer page loads", async ({ page }) => {
    await page.goto("/audit");

    await expect(
      page.getByRole("heading", { name: /eventos de auditoria|audit events/i }),
    ).toBeVisible();
  });
});
