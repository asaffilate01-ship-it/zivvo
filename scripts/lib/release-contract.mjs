import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const RELEASE_ENVIRONMENTS = new Set(["staging", "production"]);
export const COMMIT_SHA = /^[0-9a-f]{40}$/;

export function validateReleaseIdentity({ commitSha, environment, appUrl, version }) {
  const failures = [];
  if (!COMMIT_SHA.test(commitSha || "")) failures.push("commitSha");
  if (!RELEASE_ENVIRONMENTS.has(environment)) failures.push("environment");
  if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) failures.push("version");
  try {
    const url = new URL(appUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) failures.push("appUrl");
  } catch {
    failures.push("appUrl");
  }
  return [...new Set(failures)];
}

export function listArtifactFiles(root, excluded = new Set(["release.json"])) {
  const files = [];
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const absolute = join(directory, name);
      const stats = statSync(absolute);
      if (stats.isDirectory()) visit(absolute);
      if (!stats.isFile()) continue;
      const path = relative(root, absolute).split(sep).join("/");
      if (excluded.has(path)) continue;
      const contents = readFileSync(absolute);
      files.push({ path, bytes: contents.length, sha256: createHash("sha256").update(contents).digest("hex") });
    }
  };
  visit(root);
  return files;
}

export function artifactManifestSha(files) {
  return createHash("sha256").update(JSON.stringify(files)).digest("hex");
}

export function validateReleaseEvidence(evidence, expected = {}) {
  const failures = validateReleaseIdentity(evidence || {});
  if (evidence?.schemaVersion !== 1) failures.push("schemaVersion");
  if (evidence?.application !== "zivvo") failures.push("application");
  if (!Array.isArray(evidence?.files) || evidence.files.length === 0) failures.push("files");
  if (!/^[0-9a-f]{64}$/.test(evidence?.artifactManifestSha256 || "")) failures.push("artifactManifestSha256");
  if (Array.isArray(evidence?.files) && evidence.artifactManifestSha256 !== artifactManifestSha(evidence.files)) failures.push("artifactManifestSha256");
  if (expected.commitSha && evidence?.commitSha !== expected.commitSha) failures.push("expectedCommitSha");
  if (expected.environment && evidence?.environment !== expected.environment) failures.push("expectedEnvironment");
  return [...new Set(failures)];
}
