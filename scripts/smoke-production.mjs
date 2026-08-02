import { writeFileSync } from "node:fs";
import { COMMIT_SHA, RELEASE_ENVIRONMENTS } from "./lib/release-contract.mjs";

const baseUrl = new URL(process.env.SMOKE_BASE_URL || "");
const expectedCommitSha = (process.env.SMOKE_EXPECTED_COMMIT_SHA || "").trim().toLowerCase();
const expectedEnvironment = (process.env.SMOKE_EXPECTED_ENVIRONMENT || "").trim();
const healthUrl = process.env.SMOKE_HEALTH_URL?.trim();
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);

if ((!isLocal && baseUrl.protocol !== "https:") || baseUrl.username || baseUrl.password || baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
  throw new Error("SMOKE_BASE_URL must be an HTTPS origin without credentials or a path");
}
if (!COMMIT_SHA.test(expectedCommitSha)) throw new Error("SMOKE_EXPECTED_COMMIT_SHA must be a full commit SHA");
if (!RELEASE_ENVIRONMENTS.has(expectedEnvironment)) throw new Error("SMOKE_EXPECTED_ENVIRONMENT must be staging or production");
if (!healthUrl) throw new Error("SMOKE_HEALTH_URL is required");
const parsedHealthUrl = new URL(healthUrl);
const healthIsLocal = ["localhost", "127.0.0.1", "::1"].includes(parsedHealthUrl.hostname);
if ((!healthIsLocal && parsedHealthUrl.protocol !== "https:") || parsedHealthUrl.username || parsedHealthUrl.password) throw new Error("SMOKE_HEALTH_URL must be HTTPS without credentials");

const checks = [];
const record = (name, ok, detail = "") => {
  checks.push({ name, ok, detail });
  if (!ok) throw new Error(`${name} failed${detail ? `: ${detail}` : ""}`);
};

async function fetchChecked(url, expectedContentType, expectedOrigin = baseUrl.origin) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
  record(`${url.pathname} status`, response.ok, `${response.status}`);
  record(`${url.pathname} origin`, new URL(response.url).origin === expectedOrigin, response.url);
  record(`${url.pathname} content type`, response.headers.get("content-type")?.includes(expectedContentType), response.headers.get("content-type") || "missing");
  return response;
}

try {
  const home = await fetchChecked(new URL("/", baseUrl), "text/html");
  const requiredHeaders = ["content-security-policy", "x-content-type-options", "referrer-policy", "permissions-policy"];
  if (!isLocal) requiredHeaders.push("strict-transport-security");
  for (const header of requiredHeaders) record(`header ${header}`, Boolean(home.headers.get(header)), "missing");

  const homeBody = await home.text();
  record("home application shell", /<div[^>]+id=["']root["']/.test(homeBody));
  for (const route of ["/login", "/privacy", "/terms"]) {
    const response = await fetchChecked(new URL(route, baseUrl), "text/html");
    await response.arrayBuffer();
  }

  const releaseResponse = await fetchChecked(new URL("/release.json", baseUrl), "application/json");
  const release = await releaseResponse.json();
  record("release application", release.application === "zivvo", String(release.application));
  record("release commit", release.commitSha === expectedCommitSha, String(release.commitSha));
  record("release environment", release.environment === expectedEnvironment, String(release.environment));
  record("release manifest", /^[0-9a-f]{64}$/.test(release.artifactManifestSha256 || ""));

  const healthResponse = await fetchChecked(parsedHealthUrl, "application/json", parsedHealthUrl.origin);
  const health = await healthResponse.json();
  record("backend health", health.status === "ok" && health.service === "zivvo", JSON.stringify(health));

  const evidence = {
    schemaVersion: 1,
    application: "zivvo",
    commitSha: expectedCommitSha,
    environment: expectedEnvironment,
    baseUrl: baseUrl.origin,
    healthUrl,
    checkedAt: new Date().toISOString(),
    checks,
  };
  writeFileSync(process.env.SMOKE_EVIDENCE_PATH || "post-deploy-evidence.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Post-deploy smoke checks passed (${checks.length} checks).`);
} catch (error) {
  writeFileSync(process.env.SMOKE_EVIDENCE_PATH || "post-deploy-evidence.json", `${JSON.stringify({
    schemaVersion: 1,
    application: "zivvo",
    commitSha: expectedCommitSha,
    environment: expectedEnvironment,
    baseUrl: baseUrl.origin,
    healthUrl,
    checkedAt: new Date().toISOString(),
    checks,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2)}\n`);
  throw error;
}
