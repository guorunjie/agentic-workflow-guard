import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function unsafeWorkflowProject(prefix = "awg-fix-json-") {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  const workflowDir = path.join(root, ".github", "workflows");
  const workflowPath = path.join(workflowDir, "agent.yml");
  await mkdir(workflowDir, { recursive: true });
  await writeFile(
    workflowPath,
    `
name: json fix
on: issues
jobs:
  triage:
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/ai-inference@v1
        id: agent
        with:
          prompt: "Triage \${{ github.event.issue.body }}"
      - run: bash -c "\${{ steps.agent.outputs.result }}"
`
  );
  return { root, workflowPath };
}

test("fix --format json emits recipe confidence and patch availability", async () => {
  const { root, workflowPath } = await unsafeWorkflowProject();
  const before = await readFile(workflowPath, "utf8");

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--format", "json"]);
  const report = JSON.parse(stdout);
  const after = await readFile(workflowPath, "utf8");

  assert.equal(after, before);
  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.mode, "dry-run");
  assert.ok(report.summary.automaticRecipes >= 2);
  assert.ok(report.summary.manualRecipes >= 2);
  assert.equal(report.summary.changedFiles, 0);
  assert.ok(report.changes.some((change) => change.file === ".github/workflows/agent.yml"));

  const permissionRecipe = report.recipes.find((recipe) => recipe.ruleId === "AWI003");
  const dryRunRecipe = report.recipes.find((recipe) => recipe.ruleId === "AWI008");
  const promptRecipe = report.recipes.find((recipe) => recipe.ruleId === "AWI001");
  const shellRecipe = report.recipes.find((recipe) => recipe.ruleId === "AWI002");

  assert.equal(permissionRecipe.mode, "automatic");
  assert.equal(permissionRecipe.confidence, "high");
  assert.equal(dryRunRecipe.id, "ci-dry-run-env");
  assert.equal(dryRunRecipe.mode, "automatic");
  assert.equal(promptRecipe.mode, "manual");
  assert.equal(shellRecipe.mode, "manual");
});

test("fix --apply --format json reports changed files after applying safe recipes", async () => {
  const { root, workflowPath } = await unsafeWorkflowProject("awg-fix-json-apply-");

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--apply", "--format", "json"]);
  const report = JSON.parse(stdout);
  const updated = await readFile(workflowPath, "utf8");

  assert.equal(report.mode, "apply");
  assert.equal(report.summary.changedFiles, 1);
  assert.match(updated, /contents: read/);
  assert.match(updated, /pull-requests: read/);
  assert.ok(report.changes.some((change) => change.applied === true));
});
