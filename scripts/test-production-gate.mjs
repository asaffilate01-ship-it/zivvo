import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { artifactManifestSha, listArtifactFiles } from "./lib/release-contract.mjs";
import { validateArtifactParity, validateProductionCandidate } from "./lib/production-gate.mjs";

const sha = "a".repeat(40);
const root = mkdtempSync(join(tmpdir(), "zivvo-production-gate-"));

try {
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "index.html"), "<div id=\"root\"></div>");
  writeFileSync(join(root, "assets", "app.js"), "console.log('zivvo');");
  const files = listArtifactFiles(root);
  const releaseEvidence = {
    schemaVersion: 1,
    application: "zivvo",
    version: "1.2.0-rc.1",
    commitSha: sha,
    environment: "production",
    appUrl: "https://zivvo.de",
    files,
    artifactManifestSha256: artifactManifestSha(files),
  };
  const embeddedRelease = {
    application: "zivvo",
    version: releaseEvidence.version,
    commitSha: sha,
    environment: "production",
    artifactManifestSha256: releaseEvidence.artifactManifestSha256,
  };
  const requiredChecks = ["release commit", "release environment", "backend health", "header content-security-policy"];
  const acceptanceEvidence = {
    schemaVersion: 1,
    application: "zivvo",
    commitSha: sha,
    environment: "staging",
    checks: [
      ...requiredChecks.map((name) => ({ name, ok: true })),
      ...Array.from({ length: 16 }, (_, index) => ({ name: `contract ${index}`, ok: true })),
    ],
  };
  const evidenceLinks = Object.fromEntries(
    ["security", "database", "payments", "legal", "accessibility", "operations", "native"]
      .map((name) => [name, `https://evidence.zivvo.de/releases/${sha}/${name}`]),
  );

  assert.deepEqual(validateProductionCandidate({
    releaseEvidence,
    embeddedRelease,
    acceptanceEvidence,
    expectedCommitSha: sha,
    releaseScope: "web-and-native",
    evidenceLinks,
  }), []);
  assert.deepEqual(validateArtifactParity(root, releaseEvidence), []);

  const wrongCommit = validateProductionCandidate({
    releaseEvidence,
    embeddedRelease,
    acceptanceEvidence,
    expectedCommitSha: "b".repeat(40),
    releaseScope: "web",
    evidenceLinks,
  });
  assert(wrongCommit.includes("expectedCommitSha"));
  assert(wrongCommit.includes("stagingAcceptance.commitSha"));

  const missingEvidence = validateProductionCandidate({
    releaseEvidence,
    embeddedRelease,
    acceptanceEvidence,
    expectedCommitSha: sha,
    releaseScope: "web",
    evidenceLinks: { ...evidenceLinks, legal: "https://example.com/approval" },
  });
  assert(missingEvidence.includes("evidence.legal"));

  writeFileSync(join(root, "assets", "app.js"), "tampered");
  assert(validateArtifactParity(root, releaseEvidence).includes("artifactFiles"));
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("Production candidate gate contract passed (7 assertions). ");
