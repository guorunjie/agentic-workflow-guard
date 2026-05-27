import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("package metadata reflects the expanded v0.7 auditability release", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.version, "0.7.0");
  assert.match(pkg.description, /portable skill pack/i);
  assert.ok(pkg.keywords.includes("node-red"));
  assert.ok(pkg.keywords.includes("airflow"));
  assert.ok(pkg.keywords.includes("browser-use"));
  assert.equal(pkg.scripts.benchmark, "node ./bin/agentic-workflow-guard.js benchmark");
  assert.equal(pkg.scripts["mcp:resources"], "node ./bin/agentic-workflow-guard.js mcp resources --format json");
  assert.equal(pkg.scripts["scan:strict"], "node ./bin/agentic-workflow-guard.js scan . --profile strict");
  assert.ok(pkg.files.includes("mcp"));
});

test("README documents marketplace SARIF upload, config, baseline, patch, profiles, suppression reports, benchmark, MCP resources, and install helpers", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /github\/codeql-action\/upload-sarif/);
  assert.match(readme, /fix \. --apply/);
  assert.match(readme, /fix \. --patch/);
  assert.match(readme, /baseline create/);
  assert.match(readme, /agents install/);
  assert.match(readme, /rules verify/);
  assert.match(readme, /benchmark/);
  assert.match(readme, /mcp resources/);
  assert.match(readme, /--profile strict/);
  assert.match(readme, /awg-ignore AWI001/);
  assert.match(readme, /Suppressed findings/);
  assert.match(readme, /\.awg\.yml/);
});

test("GitHub Action writes SARIF output files for Code Scanning upload", async () => {
  const action = await readFile("action.yml", "utf8");

  assert.match(action, /output:/);
  assert.match(action, /awg\.sarif/);
});

test("CI workflow uses current Node runtime actions", async () => {
  const workflow = await readFile(".github/workflows/test.yml", "utf8");

  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version: 24/);
});

test("repository ships examples for new workflow platform scanners", async () => {
  const files = [
    "examples/vulnerable-node-red/flows.json",
    "examples/vulnerable-make/scenario.blueprint.json",
    "examples/vulnerable-pipedream/workflow.json",
    "examples/vulnerable-airflow/agent_dag.py",
    "examples/vulnerable-browser-trace/browser-trace.json",
    "benchmarks/fixtures.json",
    "examples/safe-node-red/flows.json",
    "examples/safe-make/scenario.blueprint.json",
    "examples/safe-pipedream/workflow.json",
    "examples/safe-airflow/agent_dag.py",
    "examples/safe-browser-trace/browser-trace.json",
    "examples/unsafe-ai-pr-bot/.github/workflows/pr-bot.yml",
    "mcp/resources/agentic-workflow-guard.resources.json",
    "docs/playbooks/github-actions.md",
    "docs/playbooks/n8n.md",
    "docs/playbooks/mcp.md",
    "docs/playbooks/low-code.md",
    "docs/playbooks/browser-automation.md",
    "docs/policy-profiles-and-suppressions.md",
    "docs/index.md",
    "docs/npm-publish.md",
    ".awg.example.yml"
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.ok(content.length > 20);
  }
});
