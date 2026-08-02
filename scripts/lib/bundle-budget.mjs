import { readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

export const DEFAULT_BUNDLE_LIMITS = Object.freeze({
  htmlBytes: 20 * 1024,
  cssAssetBytes: 160 * 1024,
  jsAssetBytes: 450 * 1024,
  totalJsBytes: 3 * 1024 * 1024,
  anyAssetBytes: 2 * 1024 * 1024,
});

const listFiles = (root, directory = root) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(root, path) : [{ path, name: relative(root, path) }];
  })
  .sort((left, right) => left.name.localeCompare(right.name));

export function validateBundleBudget(root, limits = DEFAULT_BUNDLE_LIMITS) {
  const files = listFiles(root).map((file) => ({ ...file, bytes: statSync(file.path).size }));
  const failures = [];
  const index = files.find((file) => file.name === "index.html");
  const scripts = files.filter((file) => extname(file.name) === ".js");
  const styles = files.filter((file) => extname(file.name) === ".css");
  const sourceMaps = files.filter((file) => file.name.endsWith(".map"));

  if (!index) failures.push("index.html is missing");
  if (index && index.bytes > limits.htmlBytes) failures.push(`index.html exceeds ${limits.htmlBytes} bytes`);
  if (scripts.length === 0) failures.push("compiled JavaScript is missing");
  if (styles.length === 0) failures.push("compiled CSS is missing");
  if (sourceMaps.length > 0) failures.push(`production source maps are present: ${sourceMaps.map((file) => file.name).join(", ")}`);

  for (const file of files) {
    if (file.bytes > limits.anyAssetBytes) failures.push(`${file.name} exceeds the maximum asset budget`);
  }
  for (const file of scripts) {
    if (file.bytes > limits.jsAssetBytes) failures.push(`${file.name} exceeds the JavaScript chunk budget`);
  }
  for (const file of styles) {
    if (file.bytes > limits.cssAssetBytes) failures.push(`${file.name} exceeds the CSS asset budget`);
  }

  const totalJsBytes = scripts.reduce((total, file) => total + file.bytes, 0);
  if (totalJsBytes > limits.totalJsBytes) failures.push(`compiled JavaScript total exceeds ${limits.totalJsBytes} bytes`);

  return {
    failures: [...new Set(failures)],
    summary: {
      files: files.length,
      jsFiles: scripts.length,
      cssFiles: styles.length,
      totalJsBytes,
      largestJsBytes: Math.max(0, ...scripts.map((file) => file.bytes)),
      largestCssBytes: Math.max(0, ...styles.map((file) => file.bytes)),
    },
  };
}
