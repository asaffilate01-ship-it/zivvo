import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { validateBundleBudget } from "./lib/bundle-budget.mjs";

const dist = resolve(process.env.RELEASE_DIST_DIR || "dist");

if (!existsSync(dist)) {
  console.error(`Bundle budget failed: build directory does not exist: ${dist}`);
  process.exit(1);
}

const result = validateBundleBudget(dist);
if (result.failures.length > 0) {
  console.error(`Bundle budget failed:\n- ${result.failures.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Bundle budget passed (${result.summary.files} files, ${result.summary.totalJsBytes} JavaScript bytes, largest chunk ${result.summary.largestJsBytes} bytes).`,
);
