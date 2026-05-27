import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("benchmark command verifies fixture snapshots", async () => {
  const { stdout } = await execFileAsync("node", [bin, "benchmark"]);

  assert.match(stdout, /Benchmark passed/);
  assert.match(stdout, /vulnerable-browser-trace/);
  assert.match(stdout, /safe-activepieces/);
  assert.match(stdout, /vulnerable-zapier/);
});

test("benchmark fixture manifest includes safe and vulnerable platform pairs", async () => {
  const manifest = JSON.parse(await readFile("benchmarks/fixtures.json", "utf8"));
  const names = manifest.fixtures.map((fixture) => fixture.name);

  assert.ok(names.includes("vulnerable-browser-trace"));
  assert.ok(names.includes("safe-browser-trace"));
  assert.ok(names.includes("safe-n8n"));
  assert.ok(names.includes("safe-mcp"));
  assert.ok(names.includes("safe-activepieces"));
  assert.ok(names.includes("vulnerable-zapier"));
  assert.ok(names.includes("safe-zapier"));
});
