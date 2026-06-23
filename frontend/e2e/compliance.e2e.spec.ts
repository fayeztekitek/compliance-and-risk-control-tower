import { test, expect } from "@playwright/test";

test.describe("Compliance Page", () => {
  test("should display compliance matrix page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "fayez.tekitek@vermeg.com");
    await page.fill('input[type="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });

    await page.goto("/compliance");
    await expect(page.locator("text=Compliance").or(page.locator("text=Matrix"))).toBeVisible({ timeout: 10000 });
  });
});
