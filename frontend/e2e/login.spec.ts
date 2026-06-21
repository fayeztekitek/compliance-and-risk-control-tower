import { test, expect } from "@playwright/test";

test.describe("Authentication flows", () => {
  test("should display login page and sign in with valid credentials", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1")).toContainText("Compliance & Risk");
    await expect(page.getByPlaceholder("you@vermeg.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();

    await page.getByPlaceholder("you@vermeg.com").fill("fayez.tekitek@vermeg.com");
    await page.getByPlaceholder("••••••••").fill("admin123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=RiskTower")).toBeVisible();
    await expect(page.locator("text=Executive Dashboard")).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("you@vermeg.com").fill("wrong@email.com");
    await page.getByPlaceholder("••••••••").fill("wrongpass");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator("text=Login failed")).toBeVisible();
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@vermeg.com").fill("fayez.tekitek@vermeg.com");
    await page.getByPlaceholder("••••••••").fill("admin123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByTitle("Logout").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
