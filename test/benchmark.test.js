import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { loadBenchmarkCorpus } from "../src/benchmark.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("benchmark command verifies fixture snapshots", async () => {
  const { stdout } = await execFileAsync("node", [bin, "benchmark"]);

  assert.match(stdout, /Benchmark passed/);
  assert.match(stdout, /Score: 28\/28 \(100%\)/);
  assert.match(stdout, /vulnerable-gitlab-ci/);
  assert.match(stdout, /vulnerable-circleci/);
  assert.match(stdout, /vulnerable-azure-pipelines/);
  assert.match(stdout, /vulnerable-jenkins/);
  assert.match(stdout, /vulnerable-browser-trace/);
  assert.match(stdout, /safe-activepieces/);
  assert.match(stdout, /vulnerable-zapier/);
});

test("benchmark command emits scored JSON reports", async () => {
  const { stdout } = await execFileAsync("node", [bin, "benchmark", "--format", "json"]);
  const report = JSON.parse(stdout);
  const safeGithubAction = report.results.find((result) => result.name === "safe-github-action");

  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.name, "agentic-workflow-guard-benchmark-report");
  assert.equal(report.version, "0.19.0");
  assert.deepEqual(report.summary, { fixtureCount: 28, passed: 28, failed: 0, passRate: 100 });
  assert.ok(report.platforms.includes("GitHub Actions"));
  assert.ok(report.ruleIds.includes("AWI010"));
  assert.equal(safeGithubAction.passed, true);
  assert.deepEqual(safeGithubAction.expectedRules, []);
  assert.deepEqual(safeGithubAction.actualRules, []);
  assert.deepEqual(safeGithubAction.missingRules, []);
  assert.deepEqual(safeGithubAction.unexpectedRules, []);
});

test("benchmark fixture manifest includes safe and vulnerable platform pairs", async () => {
  const manifest = JSON.parse(await readFile("benchmarks/fixtures.json", "utf8"));
  const names = manifest.fixtures.map((fixture) => fixture.name);

  assert.ok(names.includes("vulnerable-browser-trace"));
  assert.ok(names.includes("safe-browser-trace"));
  assert.ok(names.includes("safe-n8n"));
  assert.ok(names.includes("safe-mcp"));
  assert.ok(names.includes("safe-activepieces"));
  assert.ok(names.includes("vulnerable-gitlab-ci"));
  assert.ok(names.includes("safe-gitlab-ci"));
  assert.ok(names.includes("vulnerable-circleci"));
  assert.ok(names.includes("safe-circleci"));
  assert.ok(names.includes("vulnerable-azure-pipelines"));
  assert.ok(names.includes("safe-azure-pipelines"));
  assert.ok(names.includes("vulnerable-jenkins"));
  assert.ok(names.includes("safe-jenkins"));
  assert.ok(names.includes("vulnerable-zapier"));
  assert.ok(names.includes("safe-zapier"));
});

test("benchmark corpus command emits portable fixture metadata", async () => {
  const { stdout } = await execFileAsync("node", [bin, "benchmark", "corpus", "--format", "json"]);
  const corpus = JSON.parse(stdout);
  const vulnerableGithubAction = corpus.fixtures.find((fixture) => fixture.name === "vulnerable-github-action");

  assert.equal(corpus.schemaVersion, "1.0.0");
  assert.equal(corpus.version, "0.19.0");
  assert.equal(corpus.fixtureCount, 28);
  assert.ok(corpus.platforms.includes("GitHub Actions"));
  assert.ok(corpus.platforms.includes("Azure Pipelines"));
  assert.ok(corpus.platforms.includes("Browser automation"));
  assert.deepEqual(vulnerableGithubAction.expectedRules, ["AWI001", "AWI002", "AWI003", "AWI008"]);
  assert.equal(vulnerableGithubAction.platformId, "github-actions");
  assert.equal(vulnerableGithubAction.kind, "vulnerable");
});

test("static benchmark corpus matches runtime corpus", async () => {
  const staticCorpus = JSON.parse(await readFile("benchmarks/corpus.json", "utf8"));

  assert.deepEqual(staticCorpus, await loadBenchmarkCorpus("."));
});
