import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { mcpResourcePack, renderMcpResourcesJson } from "../src/mcpResources.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("MCP resource pack uses resource descriptors with stable custom URIs", () => {
  const uris = mcpResourcePack.resources.map((resource) => resource.uri);

  assert.equal(mcpResourcePack.protocolRevision, "2025-06-18");
  assert.ok(uris.includes("awg://rules/core"));
  assert.ok(uris.includes("awg://rules/registry"));
  assert.ok(uris.includes("awg://benchmarks/fixtures"));
  assert.ok(uris.includes("awg://schemas/report"));
  assert.ok(uris.includes("awg://schemas/fix-report"));
  assert.ok(uris.includes("awg://schemas/rule-pack"));
  assert.ok(uris.includes("awg://policies/profiles"));
  assert.ok(uris.includes("awg://docs/rule-marketplace"));
  assert.ok(uris.includes("awg://playbooks/github-actions"));
  assert.ok(uris.includes("awg://playbooks/ci-pipelines"));
  assert.ok(mcpResourcePack.resources.every((resource) => resource.uri.startsWith("awg://")));
  assert.ok(mcpResourcePack.resources.every((resource) => resource.name && resource.mimeType && resource.path));
});

test("static MCP resource manifest matches the CLI resource pack and references existing files", async () => {
  const staticManifest = JSON.parse(await readFile("mcp/resources/agentic-workflow-guard.resources.json", "utf8"));
  const runtimeManifest = JSON.parse(renderMcpResourcesJson());

  assert.deepEqual(staticManifest, runtimeManifest.resourcePack);
  for (const resource of staticManifest.resources) {
    const content = await readFile(resource.path, "utf8");
    assert.ok(content.length > 20);
  }
});

test("CLI mcp resources emits markdown and JSON resource manifests", async () => {
  const markdown = await execFileAsync("node", [bin, "mcp", "resources"]);
  const json = await execFileAsync("node", [bin, "mcp", "resources", "--format", "json"]);
  const parsed = JSON.parse(json.stdout);

  assert.match(markdown.stdout, /MCP Resource Pack/);
  assert.match(markdown.stdout, /awg:\/\/rules\/core/);
  assert.equal(parsed.resourcePack.name, "agentic-workflow-guard-mcp-resources");
  assert.ok(parsed.resourcePack.resources.some((resource) => resource.uri === "awg://playbooks/browser-automation"));
  assert.ok(parsed.resourcePack.resources.some((resource) => resource.uri === "awg://playbooks/ci-pipelines"));
  assert.ok(parsed.resourcePack.resources.some((resource) => resource.uri === "awg://schemas/fix-report"));
  assert.ok(parsed.resourcePack.resources.some((resource) => resource.uri === "awg://schemas/rule-pack"));
  assert.ok(parsed.resourcePack.resources.some((resource) => resource.uri === "awg://rules/registry"));
});
