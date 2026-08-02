import { existsSync, readFileSync } from "node:fs";

const APP_ID = "de.zivvo.app";
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const marketingVersion = packageJson.version.match(/^\d+\.\d+\.\d+/)?.[0];
const files = {
  capacitor: "capacitor.config.ts",
  androidManifest: "android/app/src/main/AndroidManifest.xml",
  androidGradle: "android/app/build.gradle",
  iosInfo: "ios/App/App/Info.plist",
  iosProject: "ios/App/App.xcodeproj/project.pbxproj",
  iosEntitlements: "ios/App/App/App.entitlements",
  iosPrivacy: "ios/App/App/PrivacyInfo.xcprivacy",
  iosPackage: "ios/App/CapApp-SPM/Package.swift",
  androidInstrumentationTest: "android/app/src/androidTest/java/de/zivvo/app/ExampleInstrumentedTest.java",
};
const failures = [];

for (const [name, path] of Object.entries(files)) {
  if (!existsSync(path)) failures.push(`${name}:${path}`);
}
if (failures.length > 0) {
  console.error(`Native configuration is incomplete: ${failures.join(", ")}`);
  process.exit(1);
}

const source = Object.fromEntries(Object.entries(files).map(([name, path]) => [name, readFileSync(path, "utf8")]));
const requireMatch = (name, pattern, message) => {
  if (!pattern.test(source[name])) failures.push(message);
};

requireMatch("capacitor", new RegExp(`appId:\\s*['\"]${APP_ID.replaceAll(".", "\\.")}['\"]`), "Capacitor appId");
requireMatch("androidGradle", new RegExp(`applicationId\\s+['\"]${APP_ID.replaceAll(".", "\\.")}['\"]`), "Android applicationId");
requireMatch("androidGradle", new RegExp(`versionName\\s+['\"]${marketingVersion?.replaceAll(".", "\\.")}['\"]`), "Android versionName");
requireMatch("androidManifest", /android:allowBackup="false"/, "Android backup policy");
requireMatch("androidManifest", /android:usesCleartextTraffic="false"/, "Android cleartext policy");
requireMatch("androidManifest", /android:autoVerify="true"/, "Android App Link verification");
requireMatch("androidManifest", /android:host="zivvo\.de"/, "Android Zivvo App Link domain");
for (const capability of ["camera", "location.gps", "location.network"]) {
  requireMatch(
    "androidManifest",
    new RegExp(`<uses-feature\\s+android:name="android\\.hardware\\.${capability.replaceAll(".", "\\.")}"\\s+android:required="false"\\s*/>`),
    `Android optional ${capability} feature`,
  );
}
requireMatch("androidInstrumentationTest", /package de\.zivvo\.app;/, "Android instrumentation package");
requireMatch("androidInstrumentationTest", /assertEquals\("de\.zivvo\.app"/, "Android instrumentation application ID assertion");
requireMatch("iosProject", new RegExp(`PRODUCT_BUNDLE_IDENTIFIER = ${APP_ID.replaceAll(".", "\\.")};`), "iOS bundle identifier");
requireMatch("iosProject", new RegExp(`MARKETING_VERSION = ${marketingVersion?.replaceAll(".", "\\.")};`, "g"), "iOS marketing version");
requireMatch("iosProject", /CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/, "iOS entitlements binding");
requireMatch("iosEntitlements", /applinks:zivvo\.de/, "iOS Universal Link domain");
requireMatch("iosProject", /PrivacyInfo\.xcprivacy in Resources/, "iOS privacy manifest resource binding");
requireMatch("iosPrivacy", /<key>NSPrivacyTracking<\/key>\s*<false\/>/, "iOS tracking declaration");
requireMatch("iosPrivacy", /<key>NSPrivacyCollectedDataTypes<\/key>\s*<array>/, "iOS collected-data declaration");
const capacitorVersion = packageJson.dependencies?.["@capacitor/ios"];
if (!capacitorVersion || capacitorVersion !== packageJson.dependencies?.["@capacitor/core"]) {
  failures.push("Capacitor iOS/core version alignment");
} else {
  requireMatch(
    "iosPackage",
    new RegExp(`capacitor-swift-pm\\.git", exact: "${capacitorVersion.replaceAll(".", "\\.")}"`),
    "iOS Swift package Capacitor version",
  );
}
for (const key of ["NSCameraUsageDescription", "NSLocationWhenInUseUsageDescription", "NSPhotoLibraryUsageDescription"]) {
  if (!source.iosInfo.includes(`<key>${key}</key>`)) failures.push(`iOS ${key}`);
}
if (!marketingVersion) failures.push("package version");

if (failures.length > 0) {
  console.error(`Native configuration policy failed:\n- ${[...new Set(failures)].join("\n- ")}`);
  process.exit(1);
}

console.log(`Native configuration policy passed for ${APP_ID} ${marketingVersion}.`);
