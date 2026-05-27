import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import path from "node:path";
import { test } from "node:test";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function mediumOnlyProject() {
  const root = await mkdtemp(path.join(tmpdir(), "awg-cli-profile-"));
  const workflowDir = path.join(root, ".github", "workflows");
  await mkdir(workflowDir, { recursive: true });
  await writeFile(
    path.join(workflowDir, "agent.yml"),
    `
name: advisory agent
on: workflow_dispatch
jobs:
  triage:
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize internal release notes"
`
  );
  return root;
}

test("CLI scan exits 1 for vulnerable example with JSON findings", async () => {
  await assert.rejects(
    execFileAsync("node", [bin, "scan", "examples/vulnerable-github-action", "--format", "json"]),
    (error) => {
      const parsed = JSON.parse(error.stdout);
      assert.ok(parsed.findings.some((finding) => finding.ruleId === "AWI001"));
      return error.code === 1;
    }
  );
});

test("CLI scan shows the unsafe AI PR bot attack path in SARIF", async () => {
  await assert.rejects(
    execFileAsync("node", [bin, "scan", "examples/unsafe-ai-pr-bot", "--format", "sarif"]),
    (error) => {
      const parsed = JSON.parse(error.stdout);
      const ids = parsed.runs[0].results.map((result) => result.ruleId);
      assert.ok(ids.includes("AWI001"));
      assert.ok(ids.includes("AWI002"));
      assert.ok(ids.includes("AWI003"));
      assert.ok(ids.includes("AWI004"));
      return error.code === 1;
    }
  );
});

test("CLI scan exits 0 for safe example", async () => {
  const { stdout } = await execFileAsync("node", [bin, "scan", "examples/safe-github-action", "--format", "markdown"]);
  assert.match(stdout, /No high-risk findings/);
});

test("CLI scan policy profiles control exit severity", async () => {
  const root = await mediumOnlyProject();

  const balanced = await execFileAsync("node", [bin, "scan", root, "--format", "json"]);
  assert.equal(JSON.parse(balanced.stdout).findings[0].ruleId, "AWI008");

  await assert.rejects(execFileAsync("node", [bin, "scan", root, "--profile", "strict", "--format", "json"]), (error) => {
    assert.equal(JSON.parse(error.stdout).findings[0].ruleId, "AWI008");
    return error.code === 1;
  });

  const advisory = await execFileAsync("node", [bin, "scan", "examples/vulnerable-github-action", "--profile", "advisory", "--format", "json"]);
  assert.ok(JSON.parse(advisory.stdout).findings.some((finding) => finding.severity === "high"));
});

test("CLI fix emits a safe patch plan without editing by default", async () => {
  const { stdout } = await execFileAsync("node", [bin, "fix", "examples/vulnerable-github-action", "--dry-run"]);
  assert.match(stdout, /Fix plan/);
  assert.match(stdout, /AWI001/);
  assert.match(stdout, /Recipe: `gate-untrusted-ci-context`/);
  assert.match(stdout, /Snippet: GitHub environment approval gate/);
});

test("CLI skillpack emits Skillpack Forge manifest", async () => {
  const { stdout } = await execFileAsync("node", [bin, "skillpack"]);
  assert.match(stdout, /agentic-workflow-guard/);
  assert.match(stdout, /AWI001/);
});

test("CLI agents emits mainstream compatibility matrix", async () => {
  const { stdout } = await execFileAsync("node", [bin, "agents"]);
  assert.match(stdout, /Claude Code/);
  assert.match(stdout, /OpenClaw/);
  assert.match(stdout, /Hermes/);
  assert.match(stdout, /Gemini CLI/);
  assert.match(stdout, /MCP resource pack/);
});
