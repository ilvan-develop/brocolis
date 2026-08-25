import { expect, test } from "@playwright/test";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto(`${BASE_URL}/sign-in`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/palavra-passe|password/i).fill(password);
  await page
    .getByRole("button", { name: /entrar|iniciar.*sessão|sign in/i })
    .click();
  await page.waitForURL(`${BASE_URL}/`);
}

test.describe("Smoke E2E", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /catálogo|catalog/i }),
    ).toBeVisible();
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: /entrar|iniciar.*sessão|sign in/i }),
    ).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /criar.*conta|register/i }),
    ).toBeVisible();
  });
});
