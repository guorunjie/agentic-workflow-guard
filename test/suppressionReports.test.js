import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function suppressedProject() {
  const root = await mkdtemp(path.join(tmpdir(), "awg-suppressions-"));
  const workflowDir = path.join(root, ".github", "workflows");
  await mkdir(workflowDir, { recursive: true });
  await writeFile(
    path.join(workflowDir, "agent.yml"),
    `
name: agent triage
on: issues
jobs:
  triage:
    # awg-ignore AWI001: issue body is copied from an internal release form
    permissions:
      contents: read
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize \${{ github.event.issue.body }}"
      - run: echo "dry-run with human approval"
`
  );
  return root;
}

test("JSON scan reports audited inline suppressions", async () => {
  const root = await suppressedProject();
  const { stdout } = await execFileAsync("node", [bin, "scan", root, "--format", "json"]);
  const parsed = JSON.parse(stdout);

  assert.equal(parsed.summary.total, 0);
  assert.equal(parsed.suppressions.length, 1);
  assert.equal(parsed.suppressions[0].ruleId, "AWI001");
  assert.match(parsed.suppressions[0].reason, /internal release form/);
  assert.match(parsed.suppressions[0].file, /\.github\/workflows\/agent\.yml/);
});

test("Markdown scan reports audited inline suppressions", async () => {
  const root = await suppressedProject();
  const { stdout } = await execFileAsync("node", [bin, "scan", root, "--format", "markdown"]);

  assert.match(stdout, /Suppressed findings/);
  assert.match(stdout, /AWI001/);
  assert.match(stdout, /internal release form/);
});
