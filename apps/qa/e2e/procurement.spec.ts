import { expect, test } from "@playwright/test";

test.describe("Procurement B2B E2E", () => {
  test("RFQ → Quotation → PO → Approval flow", async ({ page }) => {
    await page.goto("/business");

    await expect(
      page.getByRole("heading", { name: /aquisições b2b/i }),
    ).toBeVisible();

    await page.goto("/business/rfqs");
    await expect(
      page.getByRole("heading", { name: /pedidos de cotação/i }),
    ).toBeVisible();

    await page.goto("/business/purchase-orders");
    await expect(
      page.getByRole("heading", { name: /ordens de compra/i }),
    ).toBeVisible();

    await page.goto("/business/approvals");
    await expect(
      page.getByRole("heading", { name: /aprovações/i }),
    ).toBeVisible();

    await page.goto("/business/credit");
    await expect(page.getByRole("heading", { name: /crédito/i })).toBeVisible();

    await page.goto("/business/suppliers");
    await expect(
      page.getByRole("heading", { name: /fornecedores/i }),
    ).toBeVisible();
  });

  test("Supplier portal navigation", async ({ page }) => {
    await page.goto("/supplier");
    await expect(
      page.getByRole("heading", { name: /fornecedores/i }),
    ).toBeVisible();

    await page.goto("/supplier/rfqs");
    await expect(
      page.getByRole("heading", { name: /pedidos de cotação/i }),
    ).toBeVisible();

    await page.goto("/supplier/quotations");
    await expect(
      page.getByRole("heading", { name: /cotações/i }),
    ).toBeVisible();

    await page.goto("/supplier/orders");
    await expect(
      page.getByRole("heading", { name: /ordens de compra/i }),
    ).toBeVisible();

    await page.goto("/supplier/catalog");
    await expect(
      page.getByRole("heading", { name: /preços e tiers/i }),
    ).toBeVisible();
  });
});
