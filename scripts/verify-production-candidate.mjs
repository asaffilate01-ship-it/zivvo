import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCycloneDx, validateCycloneDx } from "./lib/sbom.mjs";
import {
  REQUIRED_PRODUCTION_EVIDENCE,
  sha256File,
  validateArtifactParity,
  validateProductionCandidate,
} from "./lib/production-gate.mjs";

const dist = resolve(process.env.RELEASE_DIST_DIR || "dist");
const releaseEvidencePath = resolve(process.env.RELEASE_EVIDENCE_PATH || "release-evidence.json");
const sbomPath = resolve(process.env.SBOM_PATH || "release-evidence/sbom.cyclonedx.json");
const acceptancePath = resolve(process.env.STAGING_ACCEPTANCE_EVIDENCE_PATH || "staging-acceptance/post-deploy-evidence.json");
const outputPath = resolve(process.env.PRODUCTION_GATE_EVIDENCE_PATH || "production-gate-evidence.json");
const expectedCommitSha = (process.env.RELEASE_COMMIT_SHA || "").trim().toLowerCase();
const releaseScope = (process.env.RELEASE_SCOPE || "web").trim();
const actor = (process.env.PRODUCTION_GATE_ACTOR || "").trim();
const productionRunId = (process.env.PRODUCTION_GATE_RUN_ID || "").trim();
const stagingAcceptanceRunId = (process.env.STAGING_ACCEPTANCE_RUN_ID || "").trim();

const evidenceLinks = Object.fromEntries([
  ...REQUIRED_PRODUCTION_EVIDENCE,
  "native",
].map((key) => [key, process.env[`GO_LIVE_${key.toUpperCase()}_EVIDENCE_URL`]?.trim() || ""]));

const releaseEvidence = JSON.parse(readFileSync(releaseEvidencePath, "utf8"));
const embeddedRelease = JSON.parse(readFileSync(resolve(dist, "release.json"), "utf8"));
const acceptanceEvidence = JSON.parse(readFileSync(acceptancePath, "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const sbom = JSON.parse(readFileSync(sbomPath, "utf8"));

const failures = validateProductionCandidate({
  releaseEvidence,
  embeddedRelease,
  acceptanceEvidence,
  expectedCommitSha,
  releaseScope,
  evidenceLinks,
});
failures.push(...validateArtifactParity(dist, releaseEvidence));
failures.push(...validateCycloneDx(sbom, packageJson).map((failure) => `sbom.${failure}`));
if (JSON.stringify(sbom) !== JSON.stringify(buildCycloneDx(packageJson, packageLock))) failures.push("sbom.lockfileParity");
if (!actor) failures.push("actor");
if (!/^\d+$/.test(productionRunId)) failures.push("productionRunId");
if (!/^\d+$/.test(stagingAcceptanceRunId)) failures.push("stagingAcceptanceRunId");

if (failures.length > 0) {
  console.error(`Production candidate gate failed:\n- ${[...new Set(failures)].join("\n- ")}`);
  process.exit(1);
}

const gateEvidence = {
  schemaVersion: 1,
  application: "zivvo",
  version: releaseEvidence.version,
  commitSha: expectedCommitSha,
  releaseScope,
  approvedAt: new Date().toISOString(),
  approvedBy: actor,
  productionRunId,
  stagingAcceptance: {
    runId: stagingAcceptanceRunId,
    checkedAt: acceptanceEvidence.checkedAt,
    baseUrl: acceptanceEvidence.baseUrl,
    evidenceSha256: sha256File(acceptancePath),
  },
  productionArtifact: {
    appUrl: releaseEvidence.appUrl,
    manifestSha256: releaseEvidence.artifactManifestSha256,
    releaseEvidenceSha256: sha256File(releaseEvidencePath),
    sbomSha256: sha256File(sbomPath),
  },
  externalEvidence: Object.fromEntries(
    Object.entries(evidenceLinks).filter(([key, value]) => value && (key !== "native" || releaseScope === "web-and-native")),
  ),
};

writeFileSync(outputPath, `${JSON.stringify(gateEvidence, null, 2)}\n`);
console.log(`Production candidate verified for ${expectedCommitSha} (${releaseScope}).`);
