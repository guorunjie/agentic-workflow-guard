import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test } from "node:test";

import { buildReleasePublishPlan, publishRelease, renderReleasePublish } from "../src/releasePublish.js";

const execFileAsync = promisify(execFile);

function readyStatus({ published = false } = {}) {
  return JSON.stringify({
    name: "agentic-workflow-guard-release-status",
    summary: { readyToPublish: true, fail: 0 },
    checks: [
      {
        id: "npm-registry-publication",
        status: published ? "pass" : "warn"
      }
    ]
  });
}

test("release publish plan redacts OTP values", async () => {
  const plan = await buildReleasePublishPlan(process.cwd(), { version: "1.0.0", otp: "123456" });

  assert.equal(plan.mode, "plan");
  assert.equal(plan.summary.planned, 3);
  assert.match(plan.steps.find((item) => item.id === "npm-publish").command, /--otp <otp>/);
  assert.doesNotMatch(renderReleasePublish(plan), /123456/);
});

test("release publish runs status, npm publish, and draft-tolerant verify", async () => {
  const calls = [];
  const result = await publishRelease(process.cwd(), {
    version: "1.0.0",
    otp: "654321",
    runner: async (command, args) => {
      calls.push([command, args]);
      const commandText = [command, ...args].join(" ");
      if (commandText.includes("scripts/release-status.js")) return { stdout: readyStatus(), stderr: "" };
      if (commandText.startsWith("npm publish")) return { stdout: "+ agentic-workflow-guard@1.0.0\n", stderr: "" };
      if (commandText.includes("scripts/verify-release.js")) return { stdout: "# Release verify\n", stderr: "" };
      throw new Error(`unexpected command: ${commandText}`);
    }
  });

  assert.equal(result.summary.failed, 0);
  assert.equal(result.summary.passed, 3);
  assert.deepEqual(
    calls.map(([command, args]) => [command, args.slice(0, 4)]),
    [
      [process.execPath, ["scripts/release-status.js", "--version", "1.0.0", "--format"]],
      ["npm", ["publish", "--access", "public", "--otp"]],
      [process.execPath, ["scripts/verify-release.js", "--version", "1.0.0", "--allow-draft"]]
    ]
  );
  assert.equal(calls[1][1].at(-1), "654321");
  assert.ok(calls[2][1].includes("--allow-draft"));
  assert.doesNotMatch(renderReleasePublish(result), /654321/);
});

test("release publish skips npm publish when the version already exists", async () => {
  const calls = [];
  const result = await publishRelease(process.cwd(), {
    version: "1.0.0",
    runner: async (command, args) => {
      calls.push([command, args]);
      const commandText = [command, ...args].join(" ");
      if (commandText.includes("scripts/release-status.js")) return { stdout: readyStatus({ published: true }), stderr: "" };
      if (commandText.includes("scripts/verify-release.js")) return { stdout: "# Release verify\n", stderr: "" };
      throw new Error(`unexpected command: ${commandText}`);
    }
  });

  assert.equal(result.summary.failed, 0);
  assert.equal(result.steps.find((item) => item.id === "npm-publish").status, "skip");
  assert.equal(calls.length, 2);
});

test("release publish returns actionable 2FA remediation", async () => {
  const result = await publishRelease(process.cwd(), {
    version: "1.0.0",
    runner: async (command, args) => {
      const commandText = [command, ...args].join(" ");
      if (commandText.includes("scripts/release-status.js")) return { stdout: readyStatus(), stderr: "" };
      if (commandText.startsWith("npm publish")) {
        const error = new Error("publish failed");
        error.stderr = "Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.";
        throw error;
      }
      throw new Error(`unexpected command: ${commandText}`);
    }
  });

  assert.equal(result.summary.failed, 1);
  const publishStep = result.steps.find((item) => item.id === "npm-publish");
  assert.match(publishStep.remediation, /--otp <six-digit-code>/);
  assert.match(publishStep.remediation, /NPM_TOKEN/);
});

test("release publish CLI supports plan JSON output", async () => {
  const { stdout } = await execFileAsync("node", ["scripts/publish-release.js", "--version", "1.0.0", "--plan", "--format", "json"]);
  const parsed = JSON.parse(stdout);

  assert.equal(parsed.name, "agentic-workflow-guard-release-publish");
  assert.equal(parsed.mode, "plan");
  assert.equal(parsed.summary.planned, 3);
});
