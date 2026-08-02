import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { artifactManifestSha, listArtifactFiles, validateReleaseEvidence } from "./release-contract.mjs";

export const RELEASE_SCOPES = new Set(["web", "web-and-native"]);

export const REQUIRED_PRODUCTION_EVIDENCE = Object.freeze([
  "security",
  "database",
  "payments",
  "legal",
  "accessibility",
  "operations",
]);

const forbiddenEvidenceHosts = /(?:^|\.)(?:example\.com|example\.org|example\.net|localhost|invalid)$/i;

const isEvidenceUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && !url.hash
      && !forbiddenEvidenceHosts.test(url.hostname)
      && url.pathname !== "/";
  } catch {
    return false;
  }
};

export const sha256File = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

export function validateArtifactParity(dist, releaseEvidence) {
  const files = listArtifactFiles(dist);
  const failures = [];
  if (JSON.stringify(files) !== JSON.stringify(releaseEvidence?.files)) failures.push("artifactFiles");
  if (artifactManifestSha(files) !== releaseEvidence?.artifactManifestSha256) failures.push("artifactManifestSha256");
  return [...new Set(failures)];
}

export function validateProductionCandidate({
  releaseEvidence,
  embeddedRelease,
  acceptanceEvidence,
  expectedCommitSha,
  releaseScope,
  evidenceLinks,
}) {
  const failures = validateReleaseEvidence(releaseEvidence, {
    commitSha: expectedCommitSha,
    environment: "production",
  });

  if (!RELEASE_SCOPES.has(releaseScope)) failures.push("releaseScope");

  for (const key of ["application", "version", "commitSha", "environment", "artifactManifestSha256"]) {
    if (embeddedRelease?.[key] !== releaseEvidence?.[key]) failures.push(`embeddedRelease.${key}`);
  }

  if (acceptanceEvidence?.schemaVersion !== 1) failures.push("stagingAcceptance.schemaVersion");
  if (acceptanceEvidence?.application !== "zivvo") failures.push("stagingAcceptance.application");
  if (acceptanceEvidence?.commitSha !== expectedCommitSha) failures.push("stagingAcceptance.commitSha");
  if (acceptanceEvidence?.environment !== "staging") failures.push("stagingAcceptance.environment");
  if (acceptanceEvidence?.error) failures.push("stagingAcceptance.error");
  if (!Array.isArray(acceptanceEvidence?.checks) || acceptanceEvidence.checks.length < 20) {
    failures.push("stagingAcceptance.checks");
  } else {
    if (acceptanceEvidence.checks.some((check) => check?.ok !== true)) failures.push("stagingAcceptance.failedCheck");
    for (const name of ["release commit", "release environment", "backend health", "header content-security-policy"]) {
      if (!acceptanceEvidence.checks.some((check) => check?.name === name && check.ok === true)) {
        failures.push(`stagingAcceptance.${name}`);
      }
    }
  }

  for (const key of REQUIRED_PRODUCTION_EVIDENCE) {
    if (!isEvidenceUrl(evidenceLinks?.[key])) failures.push(`evidence.${key}`);
  }
  if (releaseScope === "web-and-native" && !isEvidenceUrl(evidenceLinks?.native)) {
    failures.push("evidence.native");
  }

  return [...new Set(failures)];
}
