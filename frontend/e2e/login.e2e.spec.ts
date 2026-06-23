import { test, expect } from "@playwright/test";

test.describe("Multi-role Login", () => {
  const users = [
    { email: "fayez.tekitek@vermeg.com", password: "admin123!", role: "ADMIN" },
  ];

  for (const u of users) {
    test(`should login as ${u.role} and see dashboard`, async ({ page }) => {
      await page.goto("/login");
      await page.fill('input[type="email"]', u.email);
      await page.fill('input[type="password"]', u.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("/dashboard", { timeout: 10000 });
      await expect(page.locator("text=RiskTower")).toBeVisible();
    });
  }

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 10000 });
  });
});
