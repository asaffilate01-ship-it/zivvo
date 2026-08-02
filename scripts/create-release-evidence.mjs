import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { artifactManifestSha, listArtifactFiles, validateReleaseIdentity } from "./lib/release-contract.mjs";

const dist = resolve(process.env.RELEASE_DIST_DIR || "dist");
const commitSha = (process.env.RELEASE_COMMIT_SHA || "").trim().toLowerCase();
const environment = (process.env.RELEASE_ENVIRONMENT || "").trim();
const appUrl = (process.env.VITE_APP_URL || "").trim();
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const checkedOutSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim().toLowerCase();

const failures = validateReleaseIdentity({ commitSha, environment, appUrl, version });
if (!existsSync(dist)) failures.push("dist");
if (commitSha !== checkedOutSha) failures.push("checkedOutCommitSha");
if (failures.length > 0) {
  console.error(`Release evidence could not be created: ${[...new Set(failures)].join(", ")}`);
  process.exit(1);
}

const files = listArtifactFiles(dist);
const evidence = {
  schemaVersion: 1,
  application: "zivvo",
  version,
  commitSha,
  environment,
  appUrl,
  builtAt: new Date().toISOString(),
  artifactManifestSha256: artifactManifestSha(files),
  files,
};

writeFileSync(resolve(dist, "release.json"), `${JSON.stringify({
  application: evidence.application,
  version: evidence.version,
  commitSha: evidence.commitSha,
  environment: evidence.environment,
  builtAt: evidence.builtAt,
  artifactManifestSha256: evidence.artifactManifestSha256,
}, null, 2)}\n`);
writeFileSync(resolve("release-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Release evidence created for ${environment} at ${commitSha}.`);
