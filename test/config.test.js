import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { loadConfig } from "../src/config.js";
import { scanProject } from "../src/scan.js";

async function projectWithWorkflow(workflow, config) {
  const root = await mkdtemp(path.join(tmpdir(), "awg-config-"));
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await writeFile(path.join(root, ".github", "workflows", "agent.yml"), workflow);
  if (config) {
    await writeFile(path.join(root, ".awg.yml"), config);
  }
  return root;
}

test("loadConfig reads yaml ignore paths, disabled rules, and severity threshold", async () => {
  const root = await projectWithWorkflow("", `
ignore:
  - examples/**
severityThreshold: medium
rules:
  AWI001: off
`);

  const config = await loadConfig(root);

  assert.deepEqual(config.ignore, ["examples/**"]);
  assert.equal(config.severityThreshold, "medium");
  assert.equal(config.rules.AWI001, "off");
});

test("scanProject honors disabled rules from .awg.yml", async () => {
  const root = await projectWithWorkflow(`
name: agent triage
on: issues
jobs:
  triage:
    permissions:
      contents: read
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize \${{ github.event.issue.body }}"
      - run: echo "dry-run with human approval"
`, `
rules:
  AWI001: off
`);

  const findings = await scanProject(root);

  assert.equal(findings.some((finding) => finding.ruleId === "AWI001"), false);
});

test("scanProject honors ignored files from .awg.yml", async () => {
  const root = await projectWithWorkflow(`
name: agent triage
on: issues
jobs:
  triage:
    permissions:
      contents: write
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize \${{ github.event.issue.body }}"
`, `
ignore:
  - .github/workflows/agent.yml
`);

  const findings = await scanProject(root);

  assert.deepEqual(findings, []);
});
