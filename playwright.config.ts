import { defineConfig, devices } from "@playwright/test";

const requestedBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
let baseURL = "http://127.0.0.1:8080";

if (requestedBaseUrl) {
  const parsed = new URL(requestedBaseUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("PLAYWRIGHT_BASE_URL must be an HTTPS URL without credentials, query parameters or fragments");
  }
  baseURL = parsed.origin;
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: requestedBaseUrl ? undefined : {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_e2e_placeholder",
      VITE_APP_URL: "http://127.0.0.1:8080",
    },
  },
});
