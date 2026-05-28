import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { test } from "node:test";

import { initProject } from "../src/initProject.js";
import { exists } from "../src/utils/files.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function tempRoot() {
  return mkdtemp(path.join(tmpdir(), "awg-init-"));
}

test("initProject scaffolds config and GitHub Actions workflow", async () => {
  const root = await tempRoot();
  const result = await initProject(root, { profile: "strict" });

  assert.equal(result.profile, "strict");
  assert.deepEqual(
    result.files.map((file) => file.status),
    ["created", "created"]
  );

  const config = await readFile(path.join(root, ".awg.yml"), "utf8");
  assert.match(config, /profile: strict/);
  assert.match(config, /severityThreshold: medium/);
  assert.match(config, /AWI010: on/);

  const workflow = await readFile(path.join(root, ".github/workflows/agentic-workflow-guard.yml"), "utf8");
  assert.match(workflow, /guorunjie\/agentic-workflow-guard@v1\.0\.0/);
  assert.match(workflow, /format: sarif/);
  assert.match(workflow, /github\/codeql-action\/upload-sarif@v3/);
  assert.match(workflow, /fix-output: awg-fix\.json/);
});

test("initProject preserves existing files unless forced", async () => {
  const root = await tempRoot();
  await mkdir(path.join(root, ".github/workflows"), { recursive: true });
  await writeFile(path.join(root, ".awg.yml"), "profile: advisory\n");
  await writeFile(path.join(root, ".github/workflows/agentic-workflow-guard.yml"), "name: custom\n");

  const skipped = await initProject(root);
  assert.deepEqual(
    skipped.files.map((file) => file.status),
    ["skipped", "skipped"]
  );
  assert.equal(await readFile(path.join(root, ".awg.yml"), "utf8"), "profile: advisory\n");

  const overwritten = await initProject(root, { profile: "balanced", force: true });
  assert.deepEqual(
    overwritten.files.map((file) => file.status),
    ["overwritten", "overwritten"]
  );
  assert.match(await readFile(path.join(root, ".awg.yml"), "utf8"), /profile: balanced/);
});

test("initProject can skip CI workflow scaffolding", async () => {
  const root = await tempRoot();
  const result = await initProject(root, { ci: "none" });

  assert.equal(result.ci, "none");
  assert.deepEqual(result.files.map((file) => file.file), [".awg.yml"]);
  assert.equal(await exists(path.join(root, ".awg.yml")), true);
  assert.equal(await exists(path.join(root, ".github/workflows/agentic-workflow-guard.yml")), false);
});

test("CLI init reports scaffolded files", async () => {
  const root = await tempRoot();
  const { stdout } = await execFileAsync("node", [bin, "init", root, "--profile", "advisory"]);

  assert.match(stdout, /Agentic Workflow Guard init/);
  assert.match(stdout, /Profile: advisory/);
  assert.match(stdout, /\.github\/workflows\/agentic-workflow-guard\.yml/);
  assert.match(await readFile(path.join(root, ".awg.yml"), "utf8"), /severityThreshold: critical/);
});
