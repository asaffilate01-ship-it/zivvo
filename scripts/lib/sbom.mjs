import { Buffer } from "node:buffer";

const encodePurlName = (name) => name.startsWith("@")
  ? `${encodeURIComponent(name.split("/")[0])}/${encodeURIComponent(name.split("/").slice(1).join("/"))}`
  : encodeURIComponent(name);

const packageNameFromPath = (path) => {
  const marker = "node_modules/";
  const index = path.lastIndexOf(marker);
  return index === -1 ? null : path.slice(index + marker.length);
};

const integrityHash = (integrity) => {
  const digest = String(integrity || "").split(/\s+/).find((value) => /^(?:sha256|sha384|sha512)-/.test(value));
  if (!digest) return null;
  const [algorithm, encoded] = digest.split("-", 2);
  return {
    alg: algorithm.toUpperCase().replace("SHA", "SHA-"),
    content: Buffer.from(encoded, "base64").toString("hex").toUpperCase(),
  };
};

export const buildCycloneDx = (packageJson, packageLock) => {
  const components = new Map();

  for (const [path, record] of Object.entries(packageLock.packages ?? {})) {
    if (!path || !record?.version) continue;
    const name = record.name || packageNameFromPath(path);
    if (!name) continue;
    const purl = `pkg:npm/${encodePurlName(name)}@${encodeURIComponent(record.version)}`;
    const component = {
      type: "library",
      "bom-ref": purl,
      name,
      version: record.version,
      purl,
      scope: record.dev ? "optional" : "required",
    };
    const hash = integrityHash(record.integrity);
    if (hash) component.hashes = [hash];
    if (record.resolved) {
      component.externalReferences = [{ type: "distribution", url: record.resolved }];
    }
    components.set(purl, component);
  }

  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      component: {
        type: "application",
        "bom-ref": `pkg:npm/${encodePurlName(packageJson.name)}@${encodeURIComponent(packageJson.version)}`,
        name: packageJson.name,
        version: packageJson.version,
      },
      tools: [{ vendor: "Zivvo", name: "lockfile-sbom", version: "1" }],
    },
    components: [...components.values()].sort((left, right) => left["bom-ref"].localeCompare(right["bom-ref"])),
  };
};

export const validateCycloneDx = (sbom, expected) => {
  const failures = [];
  if (sbom?.bomFormat !== "CycloneDX") failures.push("bomFormat");
  if (sbom?.specVersion !== "1.5") failures.push("specVersion");
  if (sbom?.version !== 1) failures.push("version");
  if (sbom?.metadata?.component?.name !== expected.name) failures.push("applicationName");
  if (sbom?.metadata?.component?.version !== expected.version) failures.push("applicationVersion");
  if (!Array.isArray(sbom?.components) || sbom.components.length < 100) failures.push("components");

  const refs = new Set();
  let previousRef = "";
  for (const component of sbom?.components ?? []) {
    const ref = component?.["bom-ref"];
    if (!ref || refs.has(ref)) failures.push("uniqueBomRefs");
    if (previousRef && previousRef.localeCompare(ref) > 0) failures.push("componentOrder");
    refs.add(ref);
    previousRef = ref || previousRef;
    if (!component?.name || !component?.version || component?.purl !== ref) failures.push(`component:${ref || "unknown"}`);
    for (const reference of component?.externalReferences ?? []) {
      try {
        const url = new URL(reference.url);
        if (url.protocol !== "https:" || url.hostname !== "registry.npmjs.org") failures.push(`registry:${ref}`);
      } catch {
        failures.push(`registry:${ref}`);
      }
    }
  }
  return [...new Set(failures)];
};
