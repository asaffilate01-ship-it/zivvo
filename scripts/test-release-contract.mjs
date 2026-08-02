import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { artifactManifestSha, listArtifactFiles, validateReleaseEvidence, validateReleaseIdentity } from "./lib/release-contract.mjs";

const sha = "a".repeat(40);
assert.deepEqual(validateReleaseIdentity({ commitSha: sha, environment: "production", appUrl: "https://zivvo.de", version: "1.2.0-rc.1" }), []);
assert.deepEqual(validateReleaseIdentity({ commitSha: "short", environment: "preview", appUrl: "http://zivvo.de/path", version: "next" }).sort(), ["appUrl", "commitSha", "environment", "version"]);

const root = mkdtempSync(join(tmpdir(), "zivvo-release-contract-"));
try {
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "index.html"), "<div id=\"root\"></div>");
  writeFileSync(join(root, "assets", "app.js"), "console.log('zivvo');");
  writeFileSync(join(root, "release.json"), "ignored");
  const files = listArtifactFiles(root);
  assert.deepEqual(files.map((file) => file.path), ["assets/app.js", "index.html"]);
  const evidence = {
    schemaVersion: 1,
    application: "zivvo",
    version: "1.2.0-rc.1",
    commitSha: sha,
    environment: "staging",
    appUrl: "https://staging.zivvo.de",
    files,
    artifactManifestSha256: artifactManifestSha(files),
  };
  assert.deepEqual(validateReleaseEvidence(evidence, { commitSha: sha, environment: "staging" }), []);
  assert.deepEqual(validateReleaseEvidence({ ...evidence, commitSha: "b".repeat(40) }, { commitSha: sha }), ["expectedCommitSha"]);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("Release contract tests passed (6 assertions). ");
