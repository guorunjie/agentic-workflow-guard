import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";

import { initProject } from "../src/initProject.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function tempRoot() {
  return mkdtemp(path.join(tmpdir(), "awg-doctor-"));
}

test("doctor passes for initialized projects", async () => {
  const root = await tempRoot();
  await initProject(root, { profile: "strict" });

  const { stdout } = await execFileAsync("node", [bin, "doctor", root, "--format", "json"]);
  const parsed = JSON.parse(stdout);

  assert.equal(parsed.name, "agentic-workflow-guard-doctor");
  assert.equal(parsed.summary.fail, 0);
  assert.equal(parsed.summary.warn, 0);
  assert.ok(parsed.checks.some((item) => item.id === "config" && item.status === "pass"));
  assert.ok(parsed.checks.some((item) => item.id === "config-schema" && item.status === "pass"));
  assert.ok(parsed.checks.some((item) => item.id === "github-action" && item.status === "pass"));
});

test("doctor warns but exits cleanly before project setup", async () => {
  const root = await tempRoot();
  const { stdout } = await execFileAsync("node", [bin, "doctor", root]);

  assert.match(stdout, /Agentic Workflow Guard Doctor/);
  assert.match(stdout, /WARN: Repository config/);
  assert.match(stdout, /WARN: GitHub Action workflow/);
});

test("doctor fails invalid config values", async () => {
  const root = await tempRoot();
  await writeFile(
    path.join(root, ".awg.json"),
    JSON.stringify(
      {
        $schema: "https://guorunjie.github.io/agentic-workflow-guard/schemas/config.schema.json",
        profile: "chaos",
        severityThreshold: "urgent",
        rules: { AWI999: "sometimes" }
      },
      null,
      2
    )
  );

  await assert.rejects(execFileAsync("node", [bin, "doctor", root, "--format", "json"]), (error) => {
    const parsed = JSON.parse(error.stdout);
    const config = parsed.checks.find((item) => item.id === "config");
    assert.equal(parsed.summary.fail, 1);
    assert.match(config.evidence.join("\n"), /Unknown profile: chaos/);
    assert.match(config.evidence.join("\n"), /Unknown rule ID: AWI999/);
    return error.code === 1;
  });
});

test("doctor fails incomplete GitHub Action setup", async () => {
  const root = await tempRoot();
  await initProject(root, { ci: "none" });
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await writeFile(path.join(root, ".github", "workflows", "agentic-workflow-guard.yml"), "name: awg\njobs: {}\n");

  await assert.rejects(execFileAsync("node", [bin, "doctor", root]), (error) => {
    assert.match(error.stdout, /FAIL: GitHub Action workflow/);
    assert.match(error.stdout, /Missing:/);
    return error.code === 1;
  });
});
