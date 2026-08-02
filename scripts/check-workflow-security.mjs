import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";

const workflowDirectory = ".github/workflows";
const workflowFiles = readdirSync(workflowDirectory)
  .filter((name) => /\.ya?ml$/i.test(name))
  .map((name) => join(workflowDirectory, name));
const failures = [];
let actionCount = 0;

for (const path of workflowFiles) {
  const content = readFileSync(path, "utf8");
  const document = parseDocument(content, { prettyErrors: true, strict: true, uniqueKeys: true });

  for (const error of document.errors) failures.push(`${path}: invalid YAML: ${error.message}`);
  if (document.errors.length === 0) {
    const workflow = document.toJS();
    if (!workflow || typeof workflow !== "object") failures.push(`${path}: workflow must be a YAML object`);
    if (!workflow?.on) failures.push(`${path}: workflow trigger is required`);
    if (!workflow?.jobs || typeof workflow.jobs !== "object") failures.push(`${path}: workflow jobs are required`);
  }

  if (/\bpull_request_target\s*:/.test(content)) failures.push(`${path}: pull_request_target is not permitted`);
  if (/\bpermissions\s*:\s*write-all\b/.test(content)) failures.push(`${path}: write-all permission is not permitted`);
  if (!/^permissions:/m.test(content)) failures.push(`${path}: explicit workflow permissions are required`);

  for (const match of content.matchAll(/\buses:\s*([^\s#]+)@([^\s#]+)/g)) {
    actionCount += 1;
    const [, action, ref] = match;
    if (action.startsWith("./")) continue;
    if (!/^[a-f0-9]{40}$/i.test(ref)) failures.push(`${path}: ${action}@${ref} is not pinned to a full commit SHA`);
  }
}

if (failures.length > 0) {
  console.error(`Workflow security policy failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Workflow security policy passed (${actionCount} immutable action references across ${workflowFiles.length} workflows).`);
