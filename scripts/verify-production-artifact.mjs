import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

for (const path of [".env.production.local", ".env.production", ".env.local", ".env"]) {
  if (existsSync(path)) process.loadEnvFile(path);
}

const artifactRoot = process.env.RELEASE_ARTIFACT_PATH || "dist";
const files = [];
const visit = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (/\.(?:html|js|json)$/i.test(entry.name)) files.push(path);
  }
};
visit(artifactRoot);

const artifact = files.map((path) => readFileSync(path, "utf8")).join("\n");
const requiredValues = [
  "VITE_LEGAL_COMPANY_NAME",
  "VITE_LEGAL_MANAGING_DIRECTOR",
  "VITE_LEGAL_STREET",
  "VITE_LEGAL_REGISTER_NUMBER",
  "VITE_LEGAL_VAT_ID",
  "VITE_LEGAL_SUPERVISORY_AUTHORITY",
  "VITE_SUPPORT_EMAIL",
  "VITE_PRIVACY_EMAIL",
  "VITE_COMPLAINTS_EMAIL",
  "VITE_ACCESSIBILITY_EMAIL",
];
const forbiddenValues = [
  "25K+",
  "3.2K+",
  "4,7/5",
  "Trustpilot 5★",
  "Alle Systeme betriebsbereit",
  "All systems operational",
  "TÜV-geprüfte Partner",
  "ec.europa.eu/consumers/odr",
  "HRB 000000",
  "Musterstraße 1",
];

const failures = [];
for (const name of requiredValues) {
  const value = process.env[name]?.trim();
  if (!value || !artifact.includes(value)) failures.push(`${name} is not embedded in the release artifact`);
}
for (const value of forbiddenValues) {
  if (artifact.includes(value)) failures.push(`unsupported or placeholder claim remains: ${value}`);
}

if (failures.length > 0) {
  console.error(`Production artifact verification failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Production artifact verified (${files.length} text assets, ${requiredValues.length} public configuration values).`);
