import { expect, test } from "@playwright/test";
import {
  ADMIN_ORG,
  ADMIN_USER,
  CUSTOMER_ORG,
  CUSTOMER_USER,
  signInAs,
} from "./helpers.js";

const BASE_URL = process.env.WEB_ORIGIN ?? "http://localhost:3000";

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

test.describe("Authentication E2E", () => {
  test("sign-in with empty fields shows validation errors", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/sign-in`);
    await page
      .getByRole("button", { name: /entrar|iniciar.*sessão|sign in/i })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("sign-in with invalid credentials shows error", async ({ page }) => {
    await page.goto(`${BASE_URL}/sign-in`);
    await page.getByLabel(/email/i).fill("invalido@exemplo.ao");
    await page.getByLabel(/palavra-passe|password/i).fill("errada123");
    await page
      .getByRole("button", { name: /entrar|iniciar.*sessão|sign in/i })
      .click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("mock customer session persists after reload", async ({ page }) => {
    await signInAs(page, CUSTOMER_USER, CUSTOMER_ORG, "CONSUMER", ["CONSUMER"]);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /catálogo|catalog/i }),
    ).toBeVisible();
  });

  test("mock admin session works", async ({ page }) => {
    await signInAs(page, ADMIN_USER, ADMIN_ORG, "PLATFORM", [
      "PLATFORM",
      "ADMIN",
    ]);
    await page.goto("/");
    await expect(page.getByText(/Brócolis|brocolis/i)).toBeVisible();
  });
});
