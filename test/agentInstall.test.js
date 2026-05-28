import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("agents install gemini writes Gemini context and skill bundle", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-agent-install-"));

  const { stdout } = await execFileAsync("node", [bin, "agents", "install", "gemini", root]);
  const gemini = await readFile(path.join(root, "GEMINI.md"), "utf8");
  const skill = await readFile(path.join(root, ".gemini", "skills", "agentic-workflow-guard-auditor", "SKILL.md"), "utf8");

  assert.match(stdout, /Installed gemini/);
  assert.match(gemini, /Agentic Workflow Guard/);
  assert.match(gemini, /Bitbucket Pipelines/);
  assert.match(gemini, /Travis CI/);
  assert.match(gemini, /Drone CI/);
  assert.match(gemini, /Buildkite/);
  assert.match(skill, /agentic-workflow-guard-auditor/);
  assert.match(skill, /Bitbucket Pipelines/);
  assert.match(skill, /Travis CI/);
  assert.match(skill, /Drone CI/);
  assert.match(skill, /Buildkite/);
});

test("agents install claude writes Claude skill bundle", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-agent-install-"));

  await execFileAsync("node", [bin, "agents", "install", "claude", root]);
  const skill = await readFile(path.join(root, ".claude", "skills", "agentic-workflow-guard-auditor", "SKILL.md"), "utf8");

  assert.match(skill, /agentic-workflow-guard-auditor/);
});

test("agents install mcp-resources writes the MCP resource manifest and playbooks", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-agent-install-"));

  const { stdout } = await execFileAsync("node", [bin, "agents", "install", "mcp-resources", root]);
  const manifest = await readFile(path.join(root, "mcp", "resources", "agentic-workflow-guard.resources.json"), "utf8");
  const fixSchema = await readFile(path.join(root, "schemas", "agentic-workflow-guard-fix-report.schema.json"), "utf8");
  const rulePackSchema = await readFile(path.join(root, "schemas", "agentic-workflow-guard-rule-pack.schema.json"), "utf8");
  const corpusSchema = await readFile(path.join(root, "schemas", "agentic-workflow-guard-benchmark-corpus.schema.json"), "utf8");
  const benchmarkReportSchema = await readFile(path.join(root, "schemas", "agentic-workflow-guard-benchmark-report.schema.json"), "utf8");
  const rules = await readFile(path.join(root, "rules", "marketplace.json"), "utf8");
  const registry = await readFile(path.join(root, "rules", "registry.json"), "utf8");
  const corpus = await readFile(path.join(root, "benchmarks", "corpus.json"), "utf8");
  const community = await readFile(path.join(root, "rules", "community", "agentic-workflow-guard-github-actions-hardening.json"), "utf8");
  const ciCommunity = await readFile(path.join(root, "rules", "community", "agentic-workflow-guard-ci-pipeline-hardening.json"), "utf8");
  const mcpCommunity = await readFile(path.join(root, "rules", "community", "agentic-workflow-guard-mcp-tool-governance.json"), "utf8");
  const playbook = await readFile(path.join(root, "docs", "playbooks", "github-actions.md"), "utf8");
  const ciPlaybook = await readFile(path.join(root, "docs", "playbooks", "ci-pipelines.md"), "utf8");
  const marketplaceGuide = await readFile(path.join(root, "docs", "rule-marketplace.md"), "utf8");
  const demos = await readFile(path.join(root, "docs", "demos.md"), "utf8");
  const v1Readiness = await readFile(path.join(root, "docs", "v1-readiness.md"), "utf8");

  assert.match(stdout, /Installed mcp-resources/);
  assert.match(manifest, /awg:\/\/rules\/core/);
  assert.match(fixSchema, /Agentic Workflow Guard Fix Report/);
  assert.match(rulePackSchema, /Agentic Workflow Guard Rule Pack/);
  assert.match(corpusSchema, /Agentic Workflow Guard Benchmark Corpus/);
  assert.match(benchmarkReportSchema, /Agentic Workflow Guard Benchmark Report/);
  assert.match(rules, /agentic-workflow-guard-core-rules/);
  assert.match(registry, /github-actions-hardening/);
  assert.match(registry, /ci-pipeline-hardening/);
  assert.match(registry, /mcp-tool-governance/);
  assert.match(corpus, /agentic-workflow-guard-benchmark-corpus/);
  assert.match(community, /AWI004/);
  assert.match(ciCommunity, /Bitbucket Pipelines/);
  assert.match(ciCommunity, /Travis CI/);
  assert.match(ciCommunity, /Drone CI/);
  assert.match(ciCommunity, /Buildkite/);
  assert.match(mcpCommunity, /AWI006/);
  assert.match(playbook, /GitHub Actions/);
  assert.match(ciPlaybook, /Bitbucket Pipelines/);
  assert.match(ciPlaybook, /Travis CI/);
  assert.match(ciPlaybook, /Drone CI/);
  assert.match(ciPlaybook, /Azure Pipelines/);
  assert.match(ciPlaybook, /Jenkins/);
  assert.match(ciPlaybook, /Buildkite/);
  assert.match(marketplaceGuide, /rules registry/);
  assert.match(demos, /Demo Playbook/);
  assert.match(v1Readiness, /v1\.0 Readiness/);
});

test("agents install all is a no-op when run against the package root", async () => {
  const { stdout } = await execFileAsync("node", [bin, "agents", "install", "all", process.cwd()]);

  assert.match(stdout, /Installed all/);
  assert.match(stdout, /AGENTS\.md/);
});
