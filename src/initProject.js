import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { policyProfiles } from "./config.js";
import { exists } from "./utils/files.js";

const supportedCiTargets = new Set(["github-actions", "none"]);
const ruleIds = ["AWI001", "AWI002", "AWI003", "AWI004", "AWI005", "AWI006", "AWI007", "AWI008", "AWI009", "AWI010"];

function validateProfile(profile) {
  if (!policyProfiles[profile]) {
    throw new Error(`Unknown policy profile: ${profile}`);
  }
}

function validateCiTarget(ci) {
  if (!supportedCiTargets.has(ci)) {
    throw new Error(`Unknown CI target: ${ci}. Supported targets: github-actions, none`);
  }
}

export function renderAwgConfig(profile = "balanced") {
  validateProfile(profile);
  const lines = [
    "ignore:",
    "  - node_modules/**",
    "  - dist/**",
    "  - coverage/**",
    "profile: " + profile,
    "severityThreshold: " + policyProfiles[profile].severityThreshold,
    "rules:"
  ];
  for (const ruleId of ruleIds) lines.push(`  ${ruleId}: on`);
  return `${lines.join("\n")}\n`;
}

export function renderGithubActionsWorkflow(profile = "balanced") {
  validateProfile(profile);
  return `name: agentic workflow guard

on:
  pull_request:
  push:
    branches: [main]

jobs:
  guard:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v6
      - uses: guorunjie/agentic-workflow-guard@v1.0.0
        with:
          path: .
          format: sarif
          profile: ${profile}
          output: awg.sarif
          fix-format: json
          fix-output: awg-fix.json
        continue-on-error: true
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: awg.sarif
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: agentic-workflow-guard-fix-report
          path: awg-fix.json
`;
}

async function writeScaffoldFile(root, relative, content, force) {
  const absolute = path.join(root, relative);
  const present = await exists(absolute);
  if (present && !force) return { file: relative, status: "skipped", reason: "exists" };
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content);
  return { file: relative, status: present ? "overwritten" : "created" };
}

export async function initProject(root = ".", options = {}) {
  const absoluteRoot = path.resolve(root);
  const profile = options.profile ?? "balanced";
  const ci = options.ci ?? "github-actions";
  const force = Boolean(options.force);

  validateProfile(profile);
  validateCiTarget(ci);

  const files = [await writeScaffoldFile(absoluteRoot, ".awg.yml", renderAwgConfig(profile), force)];
  if (ci === "github-actions") {
    files.push(await writeScaffoldFile(absoluteRoot, ".github/workflows/agentic-workflow-guard.yml", renderGithubActionsWorkflow(profile), force));
  }

  return { root: absoluteRoot, profile, ci, force, files };
}

export function renderInitSummary(result) {
  const created = result.files.filter((file) => file.status === "created");
  const overwritten = result.files.filter((file) => file.status === "overwritten");
  const skipped = result.files.filter((file) => file.status === "skipped");
  const lines = [
    "Agentic Workflow Guard init",
    "",
    `Root: ${result.root}`,
    `Profile: ${result.profile}`,
    `CI: ${result.ci}`,
    ""
  ];

  if (created.length) {
    lines.push("Created:");
    for (const file of created) lines.push(`- ${file.file}`);
    lines.push("");
  }
  if (overwritten.length) {
    lines.push("Overwritten:");
    for (const file of overwritten) lines.push(`- ${file.file}`);
    lines.push("");
  }
  if (skipped.length) {
    lines.push("Skipped existing files:");
    for (const file of skipped) lines.push(`- ${file.file}`);
    lines.push("");
  }

  lines.push("Next:");
  lines.push("- agentic-workflow-guard scan . --format markdown");
  lines.push("- agentic-workflow-guard scan . --format sarif --output awg.sarif");
  if (result.ci === "github-actions") lines.push("- Commit .awg.yml and .github/workflows/agentic-workflow-guard.yml to enable Code Scanning.");
  return `${lines.join("\n")}\n`;
}
