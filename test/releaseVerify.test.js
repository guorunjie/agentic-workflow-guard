import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";

import { buildReleaseVerifyPlan, renderReleaseVerify, verifyRelease } from "../src/releaseVerify.js";

const execFileAsync = promisify(execFile);

test("release verify dry-run plans public release checks without network calls", async () => {
  const plan = await buildReleaseVerifyPlan(process.cwd(), { version: "1.0.0" });

  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.packageName, "agentic-workflow-guard");
  assert.equal(plan.version, "1.0.0");
  assert.equal(plan.tag, "v1.0.0");
  assert.equal(plan.summary.total, 5);
  assert.equal(plan.summary.planned, 5);
  assert.deepEqual(
    plan.checks.map((check) => check.id),
    ["git-tag", "github-release", "npm-package", "npx-help", "npx-schema"]
  );
  assert.match(plan.checks.find((check) => check.id === "npm-package").command, /npm view agentic-workflow-guard@1\.0\.0 version --json/);
  assert.match(plan.checks.find((check) => check.id === "npx-help").command, /npx --yes agentic-workflow-guard@1\.0\.0 --help/);
});

test("release verify renders markdown and JSON", async () => {
  const plan = await buildReleaseVerifyPlan(process.cwd(), { version: "1.0.0", allowDraft: true });

  assert.match(renderReleaseVerify(plan), /Release verify dry run/);
  const parsed = JSON.parse(renderReleaseVerify(plan, "json"));
  assert.equal(parsed.allowDraft, true);
  assert.equal(parsed.summary.planned, 5);
});

test("release verify executes checks with an injectable runner", async () => {
  const calls = [];
  const result = await verifyRelease(process.cwd(), {
    version: "1.0.0",
    runner: async (command, args) => {
      calls.push([command, args]);
      const commandText = [command, ...args].join(" ");
      if (commandText.startsWith("git rev-parse")) return { stdout: "13e314bcafe\n", stderr: "" };
      if (commandText.startsWith("gh release view")) {
        return {
          stdout: JSON.stringify({
            tagName: "v1.0.0",
            isDraft: false,
            isPrerelease: false,
            name: "v1.0.0 - CI-grade scanner for agentic automation",
            url: "https://github.com/guorunjie/agentic-workflow-guard/releases/tag/v1.0.0"
          }),
          stderr: ""
        };
      }
      if (commandText.startsWith("npm view")) return { stdout: JSON.stringify("1.0.0"), stderr: "" };
      if (commandText.includes("--help")) return { stdout: "Agentic Workflow Guard\nrelease check\n", stderr: "" };
      if (commandText.includes("schema report")) return { stdout: JSON.stringify({ title: "Agentic Workflow Guard Report" }), stderr: "" };
      throw new Error(`unexpected command: ${commandText}`);
    }
  });

  assert.equal(calls.length, 5);
  assert.equal(result.summary.passed, 5);
  assert.equal(result.summary.failed, 0);
  assert.ok(result.checks.every((check) => check.status === "pass"));
});

test("release verify fails draft releases unless explicitly allowed", async () => {
  const draftRunner = async (command, args) => {
    const commandText = [command, ...args].join(" ");
    if (commandText.startsWith("git rev-parse")) return { stdout: "13e314bcafe\n", stderr: "" };
    if (commandText.startsWith("gh release view")) {
      return {
        stdout: JSON.stringify({
          tagName: "v1.0.0",
          isDraft: true,
          isPrerelease: false,
          name: "v1.0.0 draft",
          url: "https://github.com/guorunjie/agentic-workflow-guard/releases/tag/v1.0.0"
        }),
        stderr: ""
      };
    }
    if (commandText.startsWith("npm view")) return { stdout: JSON.stringify("1.0.0"), stderr: "" };
    if (commandText.includes("--help")) return { stdout: "Agentic Workflow Guard\nrelease check\n", stderr: "" };
    return { stdout: JSON.stringify({ title: "Agentic Workflow Guard Report" }), stderr: "" };
  };

  const blocked = await verifyRelease(process.cwd(), { version: "1.0.0", runner: draftRunner });
  assert.equal(blocked.summary.failed, 1);
  assert.match(blocked.checks.find((check) => check.id === "github-release").detail, /draft release/);

  const allowed = await verifyRelease(process.cwd(), { version: "1.0.0", allowDraft: true, runner: draftRunner });
  assert.equal(allowed.summary.failed, 0);
});

test("release verify CLI supports dry-run JSON output", async () => {
  const { stdout } = await execFileAsync("node", ["scripts/verify-release.js", "--version", "1.0.0", "--dry-run", "--format", "json"]);
  const parsed = JSON.parse(stdout);

  assert.equal(parsed.name, "agentic-workflow-guard-release-verify");
  assert.equal(parsed.mode, "dry-run");
  assert.equal(parsed.summary.planned, 5);
});
