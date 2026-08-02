import { readFileSync } from "node:fs";

const publicFiles = [
  "src/components/Footer.tsx",
  "src/components/HeroSearch.tsx",
  "src/pages/Index.tsx",
  "src/pages/Leasing.tsx",
  "src/pages/DealerLanding.tsx",
  "src/pages/Pitch.tsx",
  "src/pages/Impressum.tsx",
  "src/pages/ComplaintsPolicy.tsx",
  "src/i18n/locales/de.json",
  "src/i18n/locales/en.json",
];

const forbiddenClaims = [
  "25K+",
  "3.2K+",
  "98%",
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
for (const path of publicFiles) {
  const content = readFileSync(path, "utf8");
  for (const claim of forbiddenClaims) {
    if (content.includes(claim)) failures.push(`${path}: ${claim}`);
  }
}

if (failures.length > 0) {
  console.error(`Public claims policy failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Public claims policy passed (${publicFiles.length} surfaces checked).`);
