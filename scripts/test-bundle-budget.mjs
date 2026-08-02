import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateBundleBudget } from "./lib/bundle-budget.mjs";

const root = mkdtempSync(join(tmpdir(), "zivvo-bundle-budget-"));

try {
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "index.html"), "<div id=\"root\"></div>");
  writeFileSync(join(root, "assets", "app.js"), "console.log('zivvo');");
  writeFileSync(join(root, "assets", "app.css"), ":root{color-scheme:light}");

  assert.deepEqual(validateBundleBudget(root).failures, []);

  writeFileSync(join(root, "assets", "app.js.map"), "{}");
  assert(validateBundleBudget(root).failures.some((failure) => failure.includes("source maps")));

  writeFileSync(join(root, "assets", "oversized.js"), "x".repeat(451 * 1024));
  assert(validateBundleBudget(root).failures.some((failure) => failure.includes("JavaScript chunk budget")));
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log("Bundle budget contract passed (3 scenarios).");
