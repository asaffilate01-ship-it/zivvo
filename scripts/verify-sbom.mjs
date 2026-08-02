import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCycloneDx, validateCycloneDx } from "./lib/sbom.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const path = resolve(process.env.SBOM_PATH || "release-evidence/sbom.cyclonedx.json");
const sbom = JSON.parse(readFileSync(path, "utf8"));
const expected = buildCycloneDx(packageJson, packageLock);
const failures = validateCycloneDx(sbom, packageJson);

if (JSON.stringify(sbom) !== JSON.stringify(expected)) failures.push("lockfileParity");
if (failures.length > 0) {
  console.error(`SBOM verification failed: ${[...new Set(failures)].join(", ")}`);
  process.exit(1);
}

console.log(`CycloneDX SBOM verified against package-lock.json (${sbom.components.length} components).`);
