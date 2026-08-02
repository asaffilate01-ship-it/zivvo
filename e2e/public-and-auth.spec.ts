import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public home and navigation render without a fatal error", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Zivvo/i);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /fahrzeuge|browse/i }).first()).toBeVisible();
});

test("authentication form has labels, keyboard access and no serious axe violations", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
  await expect(page.getByLabel(/passwort|password/i)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /hauptinhalt|main content/i })).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact || ""))).toEqual([]);
});

test("mobile viewport retains the primary listing journey", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-specific assertion");
  await page.goto("/browse");
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByRole("navigation").first()).toBeVisible();
});
