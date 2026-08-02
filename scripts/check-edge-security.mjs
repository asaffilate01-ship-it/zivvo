import { existsSync, readFileSync } from "node:fs";

const configPath = "supabase/config.toml";
const config = readFileSync(configPath, "utf8");
const entries = [...config.matchAll(/\[functions\.([^\]]+)]\s*\nverify_jwt\s*=\s*false/g)].map((match) => match[1]);

const policies = new Map([
  ["create-checkout", "user"],
  ["customer-portal", "user"],
  ["check-subscription", "user"],
  ["boost-checkout", "user"],
  ["deposit-checkout", "user"],
  ["inspection-checkout", "user"],
  ["reserve-deposit", "user"],
  ["winner-payment", "user"],
  ["arbitrage-payment", "user"],
  ["stripe-webhook", "webhook"],
  ["expire-reservations", "cron"],
  ["close-auction", "cron"],
  ["health-check", "rate-limited-public"],
  ["newsletter-subscribe", "rate-limited-public"],
  ["contact-submit", "rate-limited-public"],
  ["sitemap", "public-read-only"],
]);

const requiredMarker = {
  user: /\brequire(?:User|Admin)\b/,
  webhook: /\bverifyWebhook\b/,
  cron: /\brequireCron\b/,
  "rate-limited-public": /\bconsumeAnonymousRateLimit\b/,
  "public-read-only": /\benv\("APP_URL"\)/,
};

const failures = [];

for (const name of entries) {
  const policy = policies.get(name);
  const sourcePath = `supabase/functions/${name}/index.ts`;
  if (!policy) {
    failures.push(`${name} disables gateway JWT verification without an explicit security policy`);
    continue;
  }
  if (!existsSync(sourcePath)) {
    failures.push(`${name} is configured but ${sourcePath} does not exist`);
    continue;
  }

  const source = readFileSync(sourcePath, "utf8");
  if (!requiredMarker[policy].test(source)) {
    failures.push(`${name} does not implement its ${policy} protection marker`);
  }
  if (/Access-Control-Allow-Origin["']?\s*:\s*["']\*["']/.test(source)) {
    failures.push(`${name} uses wildcard CORS while gateway JWT verification is disabled`);
  }
}

for (const name of policies.keys()) {
  if (!entries.includes(name)) failures.push(`${name} has a security policy but is missing from ${configPath}`);
}

if (failures.length > 0) {
  console.error(`Edge Function security policy failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Edge Function security policy passed (${entries.length} gateway exceptions checked).`);
