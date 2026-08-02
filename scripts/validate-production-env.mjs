import { existsSync } from "node:fs";

for (const path of [".env.production.local", ".env.production", ".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path);
}

const resolved = {
  ...process.env,
  VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_PAYMENTS_CLIENT_TOKEN,
  VITE_GOOGLE_MAPS_BROWSER_KEY: process.env.VITE_GOOGLE_MAPS_BROWSER_KEY || process.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY,
};

const required = [
  "VITE_APP_URL",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_STRIPE_PUBLISHABLE_KEY",
  "VITE_GOOGLE_MAPS_BROWSER_KEY",
  "VITE_TURNSTILE_SITE_KEY",
  "VITE_LEGAL_COMPANY_NAME",
  "VITE_LEGAL_FORM",
  "VITE_LEGAL_MANAGING_DIRECTOR",
  "VITE_LEGAL_STREET",
  "VITE_LEGAL_POSTCODE",
  "VITE_LEGAL_CITY",
  "VITE_LEGAL_PHONE",
  "VITE_LEGAL_EMAIL",
  "VITE_LEGAL_REGISTER_COURT",
  "VITE_LEGAL_REGISTER_NUMBER",
  "VITE_LEGAL_VAT_ID",
  "VITE_LEGAL_CONTENT_RESPONSIBLE",
];

const missing = required.filter((name) => !resolved[name]?.trim());
const placeholders = required.filter((name) => /replace|example|000000|muster/i.test(resolved[name] || ""));
const failures = [...new Set([...missing, ...placeholders])];

for (const name of ["VITE_APP_URL", "VITE_SUPABASE_URL"]) {
  const value = resolved[name];
  if (!value) continue;
  try {
    if (new URL(value).protocol !== "https:") failures.push(name);
  } catch {
    failures.push(name);
  }
}

if (resolved.VITE_STRIPE_PUBLISHABLE_KEY && !resolved.VITE_STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")) {
  failures.push("VITE_STRIPE_PUBLISHABLE_KEY");
}

if (failures.length) {
  console.error(`Production configuration is incomplete or unsafe: ${[...new Set(failures)].join(", ")}`);
  process.exit(1);
}

console.log("Production environment validation passed.");
