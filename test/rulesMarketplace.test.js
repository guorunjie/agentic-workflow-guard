import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("rules search finds rules by platform and risk text", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "github"]);

  assert.match(stdout, /AWI001/);
  assert.match(stdout, /GitHub/i);
  assert.doesNotMatch(stdout, /AWI005/);
});

test("rules search finds expanded workflow platforms", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "airflow"]);

  assert.match(stdout, /AWI009/);
  assert.match(stdout, /Airflow/i);
});

test("rules search finds CI platform coverage", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "gitlab"]);

  assert.match(stdout, /AWI001/);
  assert.match(stdout, /GitLab|CI/i);
});

test("rules search finds Azure Pipelines and Jenkins coverage", async () => {
  const azure = await execFileAsync("node", [bin, "rules", "search", "azure"]);
  const jenkins = await execFileAsync("node", [bin, "rules", "search", "jenkins"]);

  assert.match(azure.stdout, /AWI001/);
  assert.match(azure.stdout, /Azure Pipelines/i);
  assert.match(jenkins.stdout, /AWI001/);
  assert.match(jenkins.stdout, /Jenkins/i);
});

test("rules search finds Zapier low-code coverage", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "zapier"]);

  assert.match(stdout, /AWI009/);
  assert.match(stdout, /Zapier/i);
});

test("rules search finds agent workflow builder coverage", async () => {
  const dify = await execFileAsync("node", [bin, "rules", "search", "dify"]);
  const flowise = await execFileAsync("node", [bin, "rules", "search", "flowise"]);
  const langflow = await execFileAsync("node", [bin, "rules", "search", "langflow"]);

  assert.match(dify.stdout, /AWI009/);
  assert.match(flowise.stdout, /AWI009/);
  assert.match(langflow.stdout, /AWI009/);
});

test("rules install writes core rule pack metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "core", root]);
  const installed = await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-core-rules.json"), "utf8");
  const parsed = JSON.parse(installed);

  assert.match(stdout, /Installed/);
  assert.equal(parsed.name, "agentic-workflow-guard-core-rules");
  assert.ok(parsed.rules.includes("AWI009"));
});

test("rules registry lists installable community packs", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "registry", "--format", "json"]);
  const registry = JSON.parse(stdout);

  assert.equal(registry.schemaVersion, "1.0.0");
  assert.ok(registry.packs.some((pack) => pack.alias === "github-actions-hardening" && pack.source === "community"));
  assert.ok(registry.packs.some((pack) => pack.alias === "low-code-automation" && /rules install low-code-automation/.test(pack.install)));
  assert.ok(registry.packs.some((pack) => pack.alias === "mcp-tool-governance" && pack.rules.includes("AWI006")));
});

test("rules install writes community rule pack metadata and lock source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-community-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "github-actions-hardening", root]);
  const installed = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-github-actions-hardening.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-rules.lock.json"), "utf8"));

  assert.match(stdout, /Installed github-actions-hardening/);
  assert.equal(installed.provenance.source, "community");
  assert.deepEqual(installed.platforms, ["github-actions"]);
  assert.equal(lock.packs[0].source, "community");
  assert.equal(lock.packs[0].checksum, installed.checksum);
});

test("rules install writes MCP tool governance community pack metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-mcp-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "mcp-tool-governance", root]);
  const installed = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-mcp-tool-governance.json"), "utf8"));

  assert.match(stdout, /Installed mcp-tool-governance/);
  assert.equal(installed.provenance.source, "community");
  assert.deepEqual(installed.platforms, ["mcp"]);
  assert.deepEqual(installed.rules, ["AWI006"]);
});
