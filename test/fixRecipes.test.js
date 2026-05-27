import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function workflowProject() {
  const root = await mkdtemp(path.join(tmpdir(), "awg-fix-recipes-"));
  const workflowDir = path.join(root, ".github", "workflows");
  const workflowPath = path.join(workflowDir, "agent.yml");
  await mkdir(workflowDir, { recursive: true });
  await writeFile(
    workflowPath,
    `
name: unsafe agent
on: issues
jobs:
  triage:
    permissions:
      contents: write
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize \${{ github.event.issue.body }}"
`
  );
  return { root, workflowPath };
}

test("fix --patch includes dry-run guard recipe for workflows without controls", async () => {
  const { root } = await workflowProject();

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--patch"]);

  assert.match(stdout, /\+    env:/);
  assert.match(stdout, /\+      AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.doesNotMatch(stdout, /-      - uses: actions\/ai-inference@v1/);
});

test("fix --apply applies dry-run guard recipe without removing prompt evidence", async () => {
  const { root, workflowPath } = await workflowProject();

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(workflowPath, "utf8");

  assert.match(updated, /AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.match(updated, /github\.event\.issue\.body/);
});
