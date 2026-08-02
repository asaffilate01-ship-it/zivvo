import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCycloneDx, validateCycloneDx } from "./lib/sbom.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const first = buildCycloneDx(packageJson, packageLock);
const second = buildCycloneDx(packageJson, packageLock);

assert.deepEqual(first, second, "SBOM output must be deterministic");
assert.deepEqual(validateCycloneDx(first, packageJson), []);

const tampered = structuredClone(first);
tampered.components[0].externalReferences = [{ type: "distribution", url: "https://packages.invalid/dependency.tgz" }];
assert.ok(validateCycloneDx(tampered, packageJson).some((failure) => failure.startsWith("registry:")));

console.log(`SBOM contract passed (3 assertions, ${first.components.length} components).`);
