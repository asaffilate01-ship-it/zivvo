import { existsSync } from "node:fs";

for (const path of [".env.production.local", ".env.production", ".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path);
}

const resolved = {
  ...process.env,
  VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.VITE_PAYMENTS_CLIENT_TOKEN,
  VITE_GOOGLE_MAPS_BROWSER_KEY: process.env.VITE_GOOGLE_MAPS_BROWSER_KEY || process.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY,
};
const releaseEnvironment = (process.env.RELEASE_ENVIRONMENT || "production").trim();
if (!new Set(["staging", "production"]).has(releaseEnvironment)) {
  console.error("RELEASE_ENVIRONMENT must be staging or production");
  process.exit(1);
}

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

const failures = new Set();
const fail = (name) => failures.add(name);
const placeholderPattern = /replace|example|000000|muster|changeme|not[ _-]?configured|\[(?:company|street|postcode|city|email|phone|name)[^\]]*\]|\b(?:todo|tbd)\b/i;

for (const name of required) {
  const value = resolved[name]?.trim();
  if (!value || placeholderPattern.test(value)) fail(name);
}

const parseHttpsUrl = (name) => {
  const value = resolved[name]?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) fail(name);
    return url;
  } catch {
    fail(name);
    return null;
  }
};

const appUrl = parseHttpsUrl("VITE_APP_URL");
if (appUrl) {
  const host = appUrl.hostname.toLowerCase();
  if (releaseEnvironment === "production" && host !== "zivvo.de" && host !== "www.zivvo.de") fail("VITE_APP_URL");
  if (releaseEnvironment === "staging" && (host === "zivvo.de" || host === "www.zivvo.de")) fail("VITE_APP_URL");
  if (appUrl.pathname !== "/" || appUrl.search || appUrl.hash) fail("VITE_APP_URL");
}

const supabaseUrl = parseHttpsUrl("VITE_SUPABASE_URL");
if (supabaseUrl) {
  const expectedHost = `${resolved.VITE_SUPABASE_PROJECT_ID?.trim()}.supabase.co`;
  if (supabaseUrl.hostname !== expectedHost || supabaseUrl.pathname !== "/" || supabaseUrl.search || supabaseUrl.hash) {
    fail("VITE_SUPABASE_URL");
    fail("VITE_SUPABASE_PROJECT_ID");
  }
}

const stripePattern = releaseEnvironment === "production" ? /^pk_live_[A-Za-z0-9_]{16,}$/ : /^pk_test_[A-Za-z0-9_]{16,}$/;
if (!stripePattern.test(resolved.VITE_STRIPE_PUBLISHABLE_KEY || "")) {
  fail("VITE_STRIPE_PUBLISHABLE_KEY");
}

if (!/^AIza[A-Za-z0-9_-]{20,}$/.test(resolved.VITE_GOOGLE_MAPS_BROWSER_KEY || "")) {
  fail("VITE_GOOGLE_MAPS_BROWSER_KEY");
}

if (!/^0x4[A-Za-z0-9_-]{20,}$/.test(resolved.VITE_TURNSTILE_SITE_KEY || "")) {
  fail("VITE_TURNSTILE_SITE_KEY");
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(resolved.VITE_LEGAL_EMAIL || "")) fail("VITE_LEGAL_EMAIL");
if ((resolved.VITE_LEGAL_PHONE || "").replace(/\D/g, "").length < 7) fail("VITE_LEGAL_PHONE");
if (!/^DE\d{9}$/.test((resolved.VITE_LEGAL_VAT_ID || "").replace(/\s/g, ""))) fail("VITE_LEGAL_VAT_ID");

const publishableKey = resolved.VITE_SUPABASE_PUBLISHABLE_KEY || "";
if (/service[_-]?role/i.test(publishableKey)) fail("VITE_SUPABASE_PUBLISHABLE_KEY");

const jwtParts = publishableKey.split(".");
if (jwtParts.length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(jwtParts[1], "base64url").toString("utf8"));
    if (payload.role === "service_role") fail("VITE_SUPABASE_PUBLISHABLE_KEY");
  } catch {
    fail("VITE_SUPABASE_PUBLISHABLE_KEY");
  }
}

if (failures.size > 0) {
  console.error(`Production configuration is incomplete or unsafe: ${[...failures].sort().join(", ")}`);
  process.exit(1);
}

console.log("Production environment validation passed.");
