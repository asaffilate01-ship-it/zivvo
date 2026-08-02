import { readFileSync } from "node:fs";
import { validateReleaseEvidence } from "./lib/release-contract.mjs";

const path = process.env.RELEASE_EVIDENCE_PATH || "release-evidence.json";
const evidence = JSON.parse(readFileSync(path, "utf8"));
const expected = {
  commitSha: process.env.RELEASE_COMMIT_SHA?.trim().toLowerCase(),
  environment: process.env.RELEASE_ENVIRONMENT?.trim(),
};
const failures = validateReleaseEvidence(evidence, expected);

if (failures.length > 0) {
  console.error(`Release evidence is invalid: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`Release evidence verified for ${evidence.environment} at ${evidence.commitSha}.`);
