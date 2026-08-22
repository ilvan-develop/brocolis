import { expect, test } from "@playwright/test";

test("web responde com a page inicial", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Brócolis" })).toBeVisible();
});
