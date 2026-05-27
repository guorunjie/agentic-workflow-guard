import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { renderJson } from "../src/reporters/json.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("JSON report includes a stable schema version", () => {
  const parsed = JSON.parse(renderJson([]));

  assert.equal(parsed.schemaVersion, "1.0.0");
  assert.deepEqual(parsed.findings, []);
  assert.deepEqual(parsed.suppressions, []);
});

test("report schema is shipped and describes findings and suppressions", async () => {
  const schema = JSON.parse(await readFile("schemas/agentic-workflow-guard-report.schema.json", "utf8"));

  assert.equal(schema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/report.schema.json");
  assert.ok(schema.required.includes("schemaVersion"));
  assert.ok(schema.required.includes("findings"));
  assert.ok(schema.properties.suppressions);
});

test("CLI schema report emits the shipped report schema", async () => {
  const { stdout } = await execFileAsync("node", [bin, "schema", "report"]);
  const parsed = JSON.parse(stdout);

  assert.equal(parsed.title, "Agentic Workflow Guard Report");
  assert.equal(parsed.properties.schemaVersion.const, "1.0.0");
});

test("CLI schema fix emits the shipped fix report schema", async () => {
  const schema = JSON.parse(await readFile("schemas/agentic-workflow-guard-fix-report.schema.json", "utf8"));
  const { stdout } = await execFileAsync("node", [bin, "schema", "fix"]);
  const parsed = JSON.parse(stdout);

  assert.equal(schema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/fix-report.schema.json");
  assert.equal(parsed.title, "Agentic Workflow Guard Fix Report");
  assert.ok(parsed.required.includes("recipes"));
  assert.ok(parsed.properties.recipes.items.properties.nextSteps);
  assert.ok(parsed.properties.recipes.items.properties.snippets);
});

test("CLI schema benchmark-corpus emits the shipped benchmark corpus schema", async () => {
  const schema = JSON.parse(await readFile("schemas/agentic-workflow-guard-benchmark-corpus.schema.json", "utf8"));
  const { stdout } = await execFileAsync("node", [bin, "schema", "benchmark-corpus"]);
  const parsed = JSON.parse(stdout);

  assert.equal(schema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/benchmark-corpus.schema.json");
  assert.equal(parsed.title, "Agentic Workflow Guard Benchmark Corpus");
  assert.ok(parsed.required.includes("fixtures"));
  assert.ok(parsed.properties.fixtures.items.$ref);
});

test("CLI schema benchmark-report emits the shipped benchmark report schema", async () => {
  const schema = JSON.parse(await readFile("schemas/agentic-workflow-guard-benchmark-report.schema.json", "utf8"));
  const { stdout } = await execFileAsync("node", [bin, "schema", "benchmark-report"]);
  const parsed = JSON.parse(stdout);

  assert.equal(schema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/benchmark-report.schema.json");
  assert.equal(parsed.title, "Agentic Workflow Guard Benchmark Report");
  assert.ok(parsed.required.includes("summary"));
  assert.ok(parsed.properties.results.items.$ref);
});

test("scan --output writes the selected report format and prints a summary", async () => {
  const output = path.join((await import("node:os")).tmpdir(), `awg-report-${Date.now()}.json`);
  const { stdout } = await execFileAsync("node", [bin, "scan", "examples/safe-github-action", "--format", "json", "--output", output]);
  const parsed = JSON.parse(await readFile(output, "utf8"));

  await stat(output);
  assert.equal(parsed.schemaVersion, "1.0.0");
  assert.match(stdout, /Wrote json report/);
  assert.match(stdout, /0 total/);
});
