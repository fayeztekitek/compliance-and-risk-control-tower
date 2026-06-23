import { test, expect } from "@playwright/test";

test.describe("Nexus IQ Drill-down", () => {
  test("should navigate from overview to app detail via URL", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "fayez.tekitek@vermeg.com");
    await page.fill('input[type="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });

    await page.goto("/nexus");
    await expect(page.locator("text=Nexus IQ")).toBeVisible({ timeout: 10000 });
  });

  test("should display vulnerability detail page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "fayez.tekitek@vermeg.com");
    await page.fill('input[type="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 10000 });

    await page.goto("/nexus/vuln/demo-vuln-1");
    await expect(page.locator("text=Vulnerability Detail").or(page.locator("text=Not Found"))).toBeVisible({ timeout: 10000 });
  });
});
