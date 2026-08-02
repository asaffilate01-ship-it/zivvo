import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildCycloneDx, validateCycloneDx } from "./lib/sbom.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const output = resolve(process.env.SBOM_PATH || "release-evidence/sbom.cyclonedx.json");
const sbom = buildCycloneDx(packageJson, packageLock);
const failures = validateCycloneDx(sbom, packageJson);

if (failures.length > 0) {
  console.error(`SBOM generation failed: ${failures.join(", ")}`);
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(sbom, null, 2)}\n`);
console.log(`CycloneDX SBOM created with ${sbom.components.length} components at ${output}.`);
