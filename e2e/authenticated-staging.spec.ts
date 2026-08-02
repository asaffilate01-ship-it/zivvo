import { expect, test } from "@playwright/test";

const staging = {
  supabaseUrl: process.env.STAGING_SUPABASE_URL?.trim(),
  publishableKey: process.env.STAGING_SUPABASE_PUBLISHABLE_KEY?.trim(),
  email: process.env.STAGING_E2E_USER_EMAIL?.trim(),
  password: process.env.STAGING_E2E_USER_PASSWORD,
};

test("staging test user can authenticate and access protected buyer journeys", async ({ page, request }) => {
  test.skip(
    Object.values(staging).some((value) => !value),
    "Dedicated staging credentials are available only in the protected staging Environment",
  );

  const supabaseUrl = new URL(staging.supabaseUrl!);
  if (supabaseUrl.protocol !== "https:" || !supabaseUrl.hostname.endsWith(".supabase.co")) {
    throw new Error("STAGING_SUPABASE_URL must be an HTTPS supabase.co project URL");
  }

  const response = await request.post(`${supabaseUrl.origin}/auth/v1/token?grant_type=password`, {
    headers: {
      apikey: staging.publishableKey!,
      Authorization: `Bearer ${staging.publishableKey}`,
      "Content-Type": "application/json",
    },
    data: { email: staging.email, password: staging.password },
  });
  expect(response.ok(), `Staging authentication returned HTTP ${response.status()}`).toBeTruthy();

  const session = await response.json();
  expect(session.access_token).toBeTruthy();
  expect(session.refresh_token).toBeTruthy();
  const storageKey = `sb-${supabaseUrl.hostname.split(".")[0]}-auth-token`;
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: storageKey, value: JSON.stringify(session) },
  );

  for (const route of ["/profile", "/saved", "/inbox"]) {
    await page.goto(route);
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
    await expect(page.locator("#root")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/application error|failed to render/i);
  }
});
