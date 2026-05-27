import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { buildReleaseCheck } from "../src/releaseCheck.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("release check reports v1 release gates with no hard failures", async () => {
  const report = await buildReleaseCheck(".");
  const gates = Object.fromEntries(report.gates.map((gate) => [gate.id, gate]));

  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.name, "agentic-workflow-guard-release-readiness");
  assert.equal(report.summary.fail, 0);
  assert.equal(gates["stable-schemas"].status, "pass");
  assert.equal(gates["rule-stability"].status, "pass");
  assert.equal(gates["platform-matrix"].status, "pass");
  assert.equal(gates["agent-matrix"].status, "pass");
  assert.equal(gates["github-action-marketplace"].status, "pass");
  assert.equal(gates["npm-publication"].status, "warn");
});

test("CLI release check emits JSON and target-version warnings for future releases", async () => {
  const json = await execFileAsync("node", [bin, "release", "check", "--format", "json"]);
  const parsed = JSON.parse(json.stdout);

  assert.equal(parsed.summary.fail, 0);
  assert.ok(parsed.gates.some((gate) => gate.id === "npm-publication" && gate.status === "warn"));

  const target = await execFileAsync("node", [bin, "release", "check", "--target", "1.0.0"]);
  assert.match(target.stdout, /Target version: 1\.0\.0/);
  assert.match(target.stdout, /WARN: Target release version/);
  assert.match(target.stdout, /README target tag guorunjie\/agentic-workflow-guard@v1\.0\.0: missing/);
});
