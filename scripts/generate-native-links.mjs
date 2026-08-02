import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const appUrl = new URL(process.env.VITE_APP_URL || "");
const iosTeamId = (process.env.IOS_TEAM_ID || "").trim();
const iosBundleId = (process.env.IOS_BUNDLE_ID || "de.zivvo.app").trim();
const androidPackage = (process.env.ANDROID_PACKAGE_NAME || "de.zivvo.app").trim();
const androidFingerprint = (process.env.ANDROID_SHA256_CERT_FINGERPRINT || "").trim().toUpperCase();
const dist = resolve(process.env.RELEASE_DIST_DIR || "dist");

const failures = [];
if (appUrl.protocol !== "https:" || appUrl.pathname !== "/" || appUrl.search || appUrl.hash) failures.push("VITE_APP_URL");
if (!/^[A-Z0-9]{10}$/.test(iosTeamId)) failures.push("IOS_TEAM_ID");
if (!/^[A-Za-z][A-Za-z0-9.-]+$/.test(iosBundleId)) failures.push("IOS_BUNDLE_ID");
if (!/^[A-Za-z][A-Za-z0-9._]+$/.test(androidPackage)) failures.push("ANDROID_PACKAGE_NAME");
if (!/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(androidFingerprint)) failures.push("ANDROID_SHA256_CERT_FINGERPRINT");
if (failures.length > 0) {
  console.error(`Native link configuration is incomplete or invalid: ${failures.join(", ")}`);
  process.exit(1);
}

const routes = ["/car/*", "/auction/*", "/dealer/*", "/browse*", "/saved*"];
const wellKnown = resolve(dist, ".well-known");
mkdirSync(wellKnown, { recursive: true });

const apple = {
  applinks: {
    details: [{ appIDs: [`${iosTeamId}.${iosBundleId}`], components: routes.map((path) => ({ "/": path })) }],
  },
};
const android = [{
  relation: ["delegate_permission/common.handle_all_urls"],
  target: {
    namespace: "android_app",
    package_name: androidPackage,
    sha256_cert_fingerprints: [androidFingerprint],
  },
}];

writeFileSync(resolve(wellKnown, "apple-app-site-association"), `${JSON.stringify(apple, null, 2)}\n`);
writeFileSync(resolve(wellKnown, "assetlinks.json"), `${JSON.stringify(android, null, 2)}\n`);
console.log(`Native link files generated for ${appUrl.hostname}.`);
