import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";

import { buildReleaseStatus, buildReleaseStatusPlan, renderReleaseStatus } from "../src/releaseStatus.js";

const execFileAsync = promisify(execFile);

function successRunner({ hasSecret = true, npmAuth = true, published = false } = {}) {
  return async (command, args) => {
    const text = [command, ...args].join(" ");
    if (text === "git status --short --branch") return { stdout: "## main...origin/main\n", stderr: "" };
    if (text === "git rev-parse HEAD") return { stdout: "4dc710dd3e828efb19288ce572561cb396c393d0\n", stderr: "" };
    if (text === "git rev-parse v1.0.0^{}") return { stdout: "4dc710dd3e828efb19288ce572561cb396c393d0\n", stderr: "" };
    if (text.startsWith("gh repo view")) return { stdout: JSON.stringify({ visibility: "PUBLIC", url: "https://github.com/guorunjie/agentic-workflow-guard" }), stderr: "" };
    if (text.startsWith("gh release view")) return { stdout: JSON.stringify({ tagName: "v1.0.0", isDraft: true, name: "v1.0.0 - CI-grade scanner" }), stderr: "" };
    if (text.startsWith("gh run list")) {
      return {
        stdout: JSON.stringify([{ databaseId: 26549933895, status: "completed", conclusion: "success", event: "workflow_dispatch", createdAt: "2026-05-28T01:57:05Z" }]),
        stderr: ""
      };
    }
    if (text.startsWith("gh secret list")) return { stdout: JSON.stringify(hasSecret ? [{ name: "NPM_TOKEN", updatedAt: "2026-05-28T00:00:00Z" }] : []), stderr: "" };
    if (text === "npm whoami") {
      if (npmAuth) return { stdout: "guorunjie\n", stderr: "" };
      const error = new Error("not logged in");
      error.stderr = "npm error code ENEEDAUTH";
      throw error;
    }
    if (text.startsWith("npm view")) {
      if (published) return { stdout: JSON.stringify("1.0.0"), stderr: "" };
      const error = new Error("not published");
      error.stderr = "npm error code E404";
      throw error;
    }
    throw new Error(`unexpected command: ${text}`);
  };
}

test("release status dry-run plans prepublish checks without network calls", async () => {
  const plan = await buildReleaseStatusPlan(process.cwd(), { version: "1.0.0" });

  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.summary.planned, 9);
  assert.deepEqual(
    plan.checks.map((check) => check.id),
    [
      "git-worktree",
      "git-tag",
      "github-repository",
      "github-release",
      "release-workflow-dry-run",
      "npm-token-secret",
      "npm-local-auth",
      "npm-registry-publication",
      "publishing-credential"
    ]
  );
});

test("release status is ready when NPM_TOKEN exists even before npm publication", async () => {
  const status = await buildReleaseStatus(process.cwd(), {
    version: "1.0.0",
    runner: successRunner({ hasSecret: true, npmAuth: false, published: false })
  });

  assert.equal(status.summary.fail, 0);
  assert.equal(status.summary.readyToPublish, true);
  assert.equal(status.checks.find((check) => check.id === "npm-token-secret").status, "pass");
  assert.equal(status.checks.find((check) => check.id === "npm-local-auth").status, "warn");
  assert.equal(status.checks.find((check) => check.id === "npm-registry-publication").status, "warn");
  assert.equal(status.checks.find((check) => check.id === "publishing-credential").status, "pass");
});

test("release status fails when no publish credential is available", async () => {
  const status = await buildReleaseStatus(process.cwd(), {
    version: "1.0.0",
    runner: successRunner({ hasSecret: false, npmAuth: false, published: false })
  });

  assert.equal(status.summary.readyToPublish, false);
  assert.equal(status.checks.find((check) => check.id === "publishing-credential").status, "fail");
  assert.match(renderReleaseStatus(status), /No GitHub NPM_TOKEN secret or local npm login/);
});

test("release status renders JSON and CLI dry-run exits cleanly", async () => {
  const plan = await buildReleaseStatusPlan(process.cwd(), { version: "1.0.0" });
  assert.equal(JSON.parse(renderReleaseStatus(plan, "json")).name, "agentic-workflow-guard-release-status");

  const { stdout } = await execFileAsync("node", ["scripts/release-status.js", "--version", "1.0.0", "--dry-run", "--format", "json"]);
  assert.equal(JSON.parse(stdout).mode, "dry-run");
});
