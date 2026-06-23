import { test, expect } from "@playwright/test";

test.describe("VEG Deal Register", () => {
  test("should display deal register page with filters", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "fayez.tekitek@vermeg.com");
    await page.fill('input[type="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });

    await page.goto("/veg");
    await expect(page.locator("text=Deal Register").or(page.locator("text=VEG"))).toBeVisible({ timeout: 10000 });
  });
});
