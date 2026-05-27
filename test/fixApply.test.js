import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("fix --apply downgrades write permissions in GitHub Actions workflows", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-fix-"));
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
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Fix \${{ github.event.issue.body }}"
`
  );

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(workflowPath, "utf8");

  assert.match(stdout, /Applied fixes/);
  assert.match(updated, /contents: read/);
  assert.match(updated, /pull-requests: read/);
  assert.match(updated, /id-token: none/);
});
