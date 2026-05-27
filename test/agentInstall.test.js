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
