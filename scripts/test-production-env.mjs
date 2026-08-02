import { spawnSync } from "node:child_process";

const validEnvironment = {
  VITE_APP_URL: "https://zivvo.de",
  VITE_SUPABASE_URL: "https://zxnyonbgophovotkjmwl.supabase.co",
  VITE_SUPABASE_PROJECT_ID: "zxnyonbgophovotkjmwl",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_ci_contract_123456789",
  VITE_STRIPE_PUBLISHABLE_KEY: "pk_live_ci_contract_123456789",
  VITE_GOOGLE_MAPS_BROWSER_KEY: "AIzaSyCIContractKey1234567890123456789",
  VITE_TURNSTILE_SITE_KEY: "0x4AAAAAAACIContractKey123456789",
  VITE_LEGAL_COMPANY_NAME: "Zivvo",
  VITE_LEGAL_FORM: "GmbH",
  VITE_LEGAL_MANAGING_DIRECTOR: "Release Contract",
  VITE_LEGAL_STREET: "Releaseweg 1",
  VITE_LEGAL_POSTCODE: "10115",
  VITE_LEGAL_CITY: "Berlin",
  VITE_LEGAL_PHONE: "+49 30 1234567",
  VITE_LEGAL_EMAIL: "release-contract@zivvo.de",
  VITE_LEGAL_REGISTER_COURT: "Amtsgericht Berlin",
  VITE_LEGAL_REGISTER_NUMBER: "HRB 12345",
  VITE_LEGAL_VAT_ID: "DE123456789",
  VITE_LEGAL_CONTENT_RESPONSIBLE: "Release Contract",
  VITE_LEGAL_SUPERVISORY_AUTHORITY: "Gewerbeamt Berlin, Releaseweg 2, 10115 Berlin",
  VITE_SUPPORT_EMAIL: "support@zivvo.de",
  VITE_PRIVACY_EMAIL: "privacy@zivvo.de",
  VITE_COMPLAINTS_EMAIL: "complaints@zivvo.de",
  VITE_ACCESSIBILITY_EMAIL: "accessibility@zivvo.de",
};

const runValidator = (overrides = {}) => spawnSync(
  process.execPath,
  ["scripts/validate-production-env.mjs"],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { PATH: process.env.PATH || "", ...validEnvironment, ...overrides },
  },
);

const valid = runValidator();
if (valid.status !== 0) {
  console.error(valid.stderr || valid.stdout);
  process.exit(1);
}

const validStaging = runValidator({
  RELEASE_ENVIRONMENT: "staging",
  VITE_APP_URL: "https://staging.zivvo.de",
  VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_ci_contract_123456789",
});
if (validStaging.status !== 0) {
  console.error(validStaging.stderr || validStaging.stdout);
  process.exit(1);
}

const rejectedCases = [
  { VITE_APP_URL: "https://preview.lovableproject.com" },
  { VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_not_allowed" },
  { VITE_LEGAL_COMPANY_NAME: "[Company Name]" },
  { VITE_COMPLAINTS_EMAIL: "not-an-email" },
  { VITE_SUPABASE_PUBLISHABLE_KEY: "service_role_not_allowed" },
  { VITE_SUPABASE_URL: "https://different-project.supabase.co" },
  { RELEASE_ENVIRONMENT: "production", VITE_APP_URL: "https://staging.zivvo.de" },
  { RELEASE_ENVIRONMENT: "staging", VITE_APP_URL: "https://zivvo.de", VITE_STRIPE_PUBLISHABLE_KEY: "pk_test_ci_contract_123456789" },
  { RELEASE_ENVIRONMENT: "staging", VITE_APP_URL: "https://staging.zivvo.de", VITE_STRIPE_PUBLISHABLE_KEY: "pk_live_ci_contract_123456789" },
];

for (const invalidEnvironment of rejectedCases) {
  const result = runValidator(invalidEnvironment);
  if (result.status === 0) {
    console.error(`Unsafe production environment unexpectedly passed: ${Object.keys(invalidEnvironment).join(", ")}`);
    process.exit(1);
  }
}

console.log(`Release environment contract passed (2 valid and ${rejectedCases.length} rejected cases).`);
