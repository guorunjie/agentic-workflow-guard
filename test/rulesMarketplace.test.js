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

test("rules install writes core rule pack metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "core", root]);
  const installed = await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-core-rules.json"), "utf8");
  const parsed = JSON.parse(installed);

  assert.match(stdout, /Installed/);
  assert.equal(parsed.name, "agentic-workflow-guard-core-rules");
  assert.ok(parsed.rules.includes("AWI009"));
});
