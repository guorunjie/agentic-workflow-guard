import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("fix --patch emits a reviewable diff without editing files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-patch-"));
  const workflowDir = path.join(root, ".github", "workflows");
  const workflowPath = path.join(workflowDir, "agent.yml");
  await mkdir(workflowDir, { recursive: true });
  await writeFile(
    workflowPath,
    `
name: auto patch
on: issues
jobs:
  patch:
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Fix \${{ github.event.issue.body }}"
`
  );

  const before = await readFile(workflowPath, "utf8");
  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--patch"]);
  const after = await readFile(workflowPath, "utf8");

  assert.equal(after, before);
  assert.match(stdout, /diff --git/);
  assert.match(stdout, /-      contents: write/);
  assert.match(stdout, /\+      contents: read/);
  assert.match(stdout, /\+      id-token: none/);
});
