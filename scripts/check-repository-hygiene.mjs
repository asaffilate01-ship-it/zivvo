import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { URL } from "node:url";

const trackedResult = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" });

if (trackedResult.status !== 0) {
  console.error("Unable to inspect tracked repository files.");
  process.exit(1);
}

// Deleted files remain in the local index until a commit is created. Filtering
// by existence keeps this check useful both before commit and in clean CI.
const trackedFiles = trackedResult.stdout.split("\0").filter((path) => path && existsSync(path));
const allowedEnvironmentTemplates = new Set([".env.example", "env.example"]);
const forbiddenTrackedFiles = trackedFiles.filter((path) => {
  if (allowedEnvironmentTemplates.has(path)) return false;
  if (/(^|\/)\.env(?:\.|$)/i.test(path)) return true;
  return /(?:^|\/)(?:credentials|service-account)(?:\.|$)|\.(?:pem|p8|p12|pfx|key|jks|keystore|mobileprovision)$/i.test(path);
});

const failures = [];

if (forbiddenTrackedFiles.length > 0) {
  failures.push(`Sensitive runtime files are tracked: ${forbiddenTrackedFiles.join(", ")}`);
}

const ignoreContracts = [
  [".env", true],
  [".env.production", true],
  [".env.example", false],
  ["android/release.jks", true],
  ["ios/App/AuthKey_test.p8", true],
  ["release-evidence.json", true],
  ["release-evidence/sbom.cyclonedx.json", true],
];

for (const [path, shouldBeIgnored] of ignoreContracts) {
  const ignored = spawnSync("git", ["check-ignore", "--no-index", "--quiet", path]).status === 0;
  if (ignored !== shouldBeIgnored) {
    failures.push(`${path} must ${shouldBeIgnored ? "be" : "not be"} ignored`);
  }
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const lockRoot = packageLock.packages?.[""];

if (!lockRoot) failures.push("package-lock.json has no root package record");
if (lockRoot?.version !== packageJson.version) {
  failures.push(`Package version mismatch: package.json=${packageJson.version}, lockfile=${lockRoot?.version ?? "missing"}`);
}

for (const [name, version] of Object.entries(packageJson.dependencies ?? {})) {
  if (lockRoot?.dependencies?.[name] !== version) failures.push(`Lockfile root dependency is stale: ${name}`);
}

for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
  if (lockRoot?.devDependencies?.[name] !== version) failures.push(`Lockfile root dev dependency is stale: ${name}`);
}

for (const [path, dependency] of Object.entries(packageLock.packages ?? {})) {
  if (!dependency?.resolved) continue;
  try {
    const url = new URL(dependency.resolved);
    if (url.protocol !== "https:" || url.hostname !== "registry.npmjs.org") {
      failures.push(`Lockfile package does not use the public npm registry: ${path || "root"}`);
    }
  } catch {
    failures.push(`Lockfile package has an invalid resolved URL: ${path || "root"}`);
  }
  if (!dependency.integrity) failures.push(`Lockfile package has no integrity hash: ${path || "root"}`);
}

const workflowFiles = trackedFiles.filter((path) => /^\.github\/workflows\/.*\.ya?ml$/i.test(path));
for (const path of workflowFiles) {
  const workflow = readFileSync(path, "utf8");
  if (/\brun:\s*npm\s+(?:i|install)\b/m.test(workflow)) {
    failures.push(`Workflow must use npm ci for reproducible installs: ${path}`);
  }
}

const capacitorConfig = readFileSync("capacitor.config.ts", "utf8");
if (/lovableproject\.com|forceHideBadge|cleartext:\s*true/.test(capacitorConfig)) {
  failures.push("Capacitor contains a hosted preview URL or unconditional cleartext transport");
}

const forbiddenProductionFiles = [
  "src/components/BugReportButton.tsx",
  "supabase/functions/dev-seed/index.ts",
  "supabase/functions/maps-key/index.ts",
];

for (const path of forbiddenProductionFiles) {
  if (trackedFiles.includes(path)) failures.push(`Development-only or credential-exposing surface is tracked: ${path}`);
}

const migrations = trackedFiles.filter((path) => path.startsWith("supabase/migrations/") && path.endsWith(".sql"));
const migrationTimestamps = new Map();

for (const path of migrations) {
  const match = path.match(/\/(\d{14})_[a-zA-Z0-9_-]+\.sql$/);
  if (!match) {
    failures.push(`Migration filename is not timestamped correctly: ${path}`);
    continue;
  }

  const existing = migrationTimestamps.get(match[1]);
  if (existing) failures.push(`Duplicate migration timestamp ${match[1]}: ${existing}, ${path}`);
  migrationTimestamps.set(match[1], path);
}

if (failures.length > 0) {
  console.error(`Repository hygiene failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Repository hygiene passed (${trackedFiles.length} tracked files checked).`);
