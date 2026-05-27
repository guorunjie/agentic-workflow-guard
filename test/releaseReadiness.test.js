import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("package metadata reflects the expanded v0.2 platform release", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.version, "0.2.0");
  assert.match(pkg.description, /portable skill pack/i);
  assert.ok(pkg.keywords.includes("node-red"));
  assert.ok(pkg.keywords.includes("airflow"));
});

test("README documents marketplace SARIF upload, config, and fix apply", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /github\/codeql-action\/upload-sarif/);
  assert.match(readme, /fix \. --apply/);
  assert.match(readme, /\.awg\.yml/);
});

test("GitHub Action writes SARIF output files for Code Scanning upload", async () => {
  const action = await readFile("action.yml", "utf8");

  assert.match(action, /output:/);
  assert.match(action, /awg\.sarif/);
});

test("repository ships examples for new workflow platform scanners", async () => {
  const files = [
    "examples/vulnerable-node-red/flows.json",
    "examples/vulnerable-make/scenario.blueprint.json",
    "examples/vulnerable-pipedream/workflow.json",
    "examples/vulnerable-airflow/agent_dag.py",
    ".awg.example.yml"
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.ok(content.length > 20);
  }
});
