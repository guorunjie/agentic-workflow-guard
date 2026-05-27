import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { scanGitHubActions } from "../src/scanners/githubActions.js";

async function workflowFixture(content) {
  const root = await mkdtemp(path.join(tmpdir(), "awg-gha-"));
  const dir = path.join(root, ".github", "workflows");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "agent.yml"), content);
  return root;
}

test("detects untrusted GitHub event context reaching an agent prompt", async () => {
  const root = await workflowFixture(`
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
`);

  const findings = await scanGitHubActions(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI001"));
});

test("detects model output flowing into shell command and high write permissions", async () => {
  const root = await workflowFixture(`
name: auto patch
on: pull_request_target
jobs:
  patch:
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - id: agent
        uses: openai/agent-action@v1
        with:
          prompt: "Fix \${{ github.event.pull_request.body }}"
      - run: bash -c "\${{ steps.agent.outputs.result }}"
`);

  const findings = await scanGitHubActions(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI003"));
  assert.ok(ids.includes("AWI004"));
});

test("does not produce high findings for a read-only dry-run workflow", async () => {
  const root = await workflowFixture(`
name: safe summarize
on: workflow_dispatch
jobs:
  summarize:
    permissions:
      contents: read
    steps:
      - run: echo "dry-run summary only"
      - run: echo "human approval required before write"
`);

  const findings = await scanGitHubActions(root);

  assert.equal(findings.filter((finding) => finding.severity === "high").length, 0);
});
