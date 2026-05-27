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
  assert.match(skill, /agentic-workflow-guard-auditor/);
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
  const rules = await readFile(path.join(root, "rules", "marketplace.json"), "utf8");
  const registry = await readFile(path.join(root, "rules", "registry.json"), "utf8");
  const community = await readFile(path.join(root, "rules", "community", "agentic-workflow-guard-github-actions-hardening.json"), "utf8");
  const playbook = await readFile(path.join(root, "docs", "playbooks", "github-actions.md"), "utf8");
  const ciPlaybook = await readFile(path.join(root, "docs", "playbooks", "ci-pipelines.md"), "utf8");
  const marketplaceGuide = await readFile(path.join(root, "docs", "rule-marketplace.md"), "utf8");

  assert.match(stdout, /Installed mcp-resources/);
  assert.match(manifest, /awg:\/\/rules\/core/);
  assert.match(fixSchema, /Agentic Workflow Guard Fix Report/);
  assert.match(rulePackSchema, /Agentic Workflow Guard Rule Pack/);
  assert.match(rules, /agentic-workflow-guard-core-rules/);
  assert.match(registry, /github-actions-hardening/);
  assert.match(community, /AWI004/);
  assert.match(playbook, /GitHub Actions/);
  assert.match(ciPlaybook, /Azure Pipelines/);
  assert.match(ciPlaybook, /Jenkins/);
  assert.match(marketplaceGuide, /rules registry/);
});
