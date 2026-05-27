import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("rules list exposes a stable checksum for the core rule pack", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "list", "--format", "json"]);
  const parsed = JSON.parse(stdout);

  assert.match(parsed.packs[0].checksum, /^sha256:[a-f0-9]{64}$/);
  assert.ok(parsed.packs[0].rules.includes("AWI010"));
});

test("rules install writes checksum metadata and rules verify accepts it", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-rules-verify-"));

  await execFileAsync("node", [bin, "rules", "install", "core", root]);
  const installedPath = path.join(root, ".awg", "rules", "agentic-workflow-guard-core-rules.json");
  const installed = JSON.parse(await readFile(installedPath, "utf8"));
  const { stdout } = await execFileAsync("node", [bin, "rules", "verify", installedPath]);

  assert.match(installed.checksum, /^sha256:[a-f0-9]{64}$/);
  assert.match(stdout, /verified/i);
});
