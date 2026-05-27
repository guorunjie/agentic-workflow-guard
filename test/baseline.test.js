import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function vulnerableProject() {
  const root = await mkdtemp(path.join(tmpdir(), "awg-baseline-"));
  await mkdir(path.join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    path.join(root, ".github", "workflows", "agent.yml"),
    `
name: triage
on: issues
jobs:
  triage:
    permissions:
      contents: write
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize \${{ github.event.issue.body }}"
`
  );
  return root;
}

test("baseline create writes finding fingerprints", async () => {
  const root = await vulnerableProject();

  const { stdout } = await execFileAsync("node", [bin, "baseline", "create", root]);
  const baseline = JSON.parse(await readFile(path.join(root, ".awg-baseline.json"), "utf8"));

  assert.match(stdout, /Wrote baseline/);
  assert.ok(baseline.findings.some((finding) => finding.ruleId === "AWI001"));
  assert.ok(baseline.findings.every((finding) => finding.fingerprint));
});

test("scan --baseline suppresses existing findings and exits cleanly", async () => {
  const root = await vulnerableProject();
  await execFileAsync("node", [bin, "baseline", "create", root]);

  const { stdout } = await execFileAsync("node", [bin, "scan", root, "--baseline", path.join(root, ".awg-baseline.json"), "--format", "json"]);
  const result = JSON.parse(stdout);

  assert.equal(result.summary.total, 0);
});
