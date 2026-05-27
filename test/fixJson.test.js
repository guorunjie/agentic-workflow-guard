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
  assert.ok(promptRecipe.nextSteps.some((step) => /approval gate/i.test(step)));
  assert.ok(promptRecipe.snippets.some((snippet) => snippet.label === "GitHub environment approval gate" && snippet.format === "yaml"));
  assert.equal(shellRecipe.mode, "manual");
  assert.ok(shellRecipe.snippets.some((snippet) => /agent-output\.txt/.test(snippet.body)));
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

test("fix --format json marks MCP filesystem scoping as an automatic recipe", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-fix-json-mcp-"));
  const mcpDir = path.join(root, ".cursor");
  await mkdir(mcpDir, { recursive: true });
  await writeFile(
    path.join(mcpDir, "mcp.json"),
    JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "/Users"]
        }
      }
    })
  );

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--format", "json"]);
  const report = JSON.parse(stdout);
  const recipe = report.recipes.find((item) => item.ruleId === "AWI006");

  assert.equal(recipe.id, "scope-mcp-filesystem-readonly");
  assert.equal(recipe.mode, "automatic");
  assert.equal(recipe.confidence, "high");
  assert.ok(recipe.nextSteps.some((step) => /automatic filesystem patch/i.test(step)));
  assert.ok(report.changes.some((change) => change.file === ".cursor/mcp.json" && change.recipeIds.includes("scope-mcp-filesystem-readonly")));
});

test("fix --format json leaves non-filesystem high-risk MCP tools as manual recipes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-fix-json-mcp-browser-"));
  await writeFile(
    path.join(root, ".mcp.json"),
    JSON.stringify({
      mcpServers: {
        browser: {
          command: "npx",
          args: ["@playwright/mcp", "--allow-write"]
        }
      }
    })
  );

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--format", "json"]);
  const report = JSON.parse(stdout);
  const recipe = report.recipes.find((item) => item.ruleId === "AWI006");

  assert.equal(recipe.id, "scope-high-risk-mcp-tools");
  assert.equal(recipe.mode, "manual");
  assert.ok(!recipe.nextSteps.some((step) => /automatic filesystem patch/i.test(step)));
  assert.equal(report.summary.availablePatches, 0);
});
