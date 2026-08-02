import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";

const sha = "a".repeat(40);
const evidencePath = "/tmp/zivvo-smoke-contract-evidence.json";
const server = createServer((req, res) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=()");
  if (req.url === "/release.json") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ application: "zivvo", commitSha: sha, environment: "staging", artifactManifestSha256: "b".repeat(64) }));
    return;
  }
  if (req.url === "/health") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "ok", service: "zivvo" }));
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end("<!doctype html><div id=\"root\"></div>");
});

const run = (port, expectedSha) => new Promise((resolve) => {
  const child = spawn(process.execPath, ["scripts/smoke-production.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SMOKE_BASE_URL: `http://127.0.0.1:${port}`,
      SMOKE_HEALTH_URL: `http://127.0.0.1:${port}/health`,
      SMOKE_EXPECTED_COMMIT_SHA: expectedSha,
      SMOKE_EXPECTED_ENVIRONMENT: "staging",
      SMOKE_EVIDENCE_PATH: evidencePath,
    },
    stdio: "pipe",
  });
  child.on("exit", (code) => resolve(code));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const address = server.address();
  assert(address && typeof address === "object");
  assert.equal(await run(address.port, sha), 0);
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
  assert.equal(evidence.commitSha, sha);
  assert.equal(evidence.error, undefined);
  assert(evidence.checks.length >= 20);
  assert.notEqual(await run(address.port, "c".repeat(40)), 0);
  const rejected = JSON.parse(readFileSync(evidencePath, "utf8"));
  assert.match(rejected.error, /release commit failed/);
} finally {
  await new Promise((resolve) => server.close(resolve));
  rmSync(evidencePath, { force: true });
}

console.log("Post-deploy smoke contract tests passed (7 assertions). ");
