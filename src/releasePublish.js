import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { semverPattern } from "./version.js";

const execFileAsync = promisify(execFile);
const defaultRepository = "guorunjie/agentic-workflow-guard";

function stringifyCommand(command, args) {
  const redacted = [];
  for (let index = 0; index < args.length; index += 1) {
    const part = args[index];
    if (part === "--otp") {
      redacted.push(part, "<otp>");
      index += 1;
      continue;
    }
    if (part.startsWith("--otp=")) {
      redacted.push("--otp=<otp>");
      continue;
    }
    redacted.push(part);
  }
  return [command, ...redacted].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label} did not return valid JSON.`);
  }
}

async function runCommand(command, args, options = {}) {
  return execFileAsync(command, args, {
    cwd: options.cwd,
    timeout: options.timeout ?? 180_000,
    maxBuffer: 20 * 1024 * 1024
  });
}

async function packageMetadata(root) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  return {
    packageName: pkg.name,
    version: pkg.version
  };
}

function step(id, title, command, status, detail, remediation) {
  return { id, title, command, status, ...(detail ? { detail } : {}), ...(remediation ? { remediation } : {}) };
}

function summarize(steps) {
  const count = (status) => steps.filter((item) => item.status === status).length;
  return {
    total: steps.length,
    passed: count("pass"),
    failed: count("fail"),
    skipped: count("skip"),
    planned: count("planned"),
    ready: count("fail") === 0
  };
}

function firstUsefulLine(text) {
  return String(text || "").trim().split("\n").find((line) => line.trim()) || "";
}

function publishFailureRemediation(detail, version, repository) {
  if (/two-factor|2fa|one-time password|otp/i.test(detail)) {
    return `Rerun npm run release:publish -- --version ${version} --otp <six-digit-code>, or add an npm automation token with gh secret set NPM_TOKEN --repo ${repository} and publish the GitHub Release.`;
  }
  if (/need auth|ENEEDAUTH|not logged in/i.test(detail)) {
    return "Run npm adduser, or publish through the GitHub release workflow with NPM_TOKEN configured.";
  }
  if (/cannot publish over|previously published|already exists/i.test(detail)) {
    return "The version already exists on npm. Run npm run release:verify instead of retrying publish.";
  }
  return "Inspect the npm publish error, fix the publish credential or package metadata issue, and rerun release:publish.";
}

async function resolveMetadata(root, options) {
  const metadata = await packageMetadata(root);
  const version = options.version ?? metadata.version;
  const packageName = options.packageName ?? metadata.packageName;
  const repository = options.repository ?? defaultRepository;

  if (!version) throw new Error("Missing release version. Use --version <semver>.");
  if (!semverPattern.test(version)) throw new Error(`Invalid release version: ${version}`);
  if (!packageName) throw new Error("Missing package name. Use --package <name>.");

  return { version, packageName, repository };
}

function plannedSteps({ version, npmTag, dryRun, otp, provenance, skipVerify, finalVerify }) {
  const statusArgs = ["scripts/release-status.js", "--version", version, "--format", "json"];
  const publishArgs = ["publish", "--access", "public"];
  if (npmTag) publishArgs.push("--tag", npmTag);
  if (provenance) publishArgs.push("--provenance");
  if (dryRun) publishArgs.push("--dry-run");
  if (otp) publishArgs.push("--otp", otp);
  const verifyArgs = ["scripts/verify-release.js", "--version", version];
  if (!finalVerify) verifyArgs.push("--allow-draft");

  const steps = [
    step("release-status", "Prepublish release status", stringifyCommand("node", statusArgs), "planned"),
    step("npm-publish", dryRun ? "npm publish dry-run" : "npm publish", stringifyCommand("npm", publishArgs), "planned")
  ];

  if (skipVerify) {
    steps.push(step("release-verify", "Post-publish release verification", stringifyCommand("node", verifyArgs), "skip", "Skipped by --skip-verify."));
  } else {
    steps.push(step("release-verify", "Post-publish release verification", stringifyCommand("node", verifyArgs), "planned"));
  }

  return steps;
}

export async function buildReleasePublishPlan(root = ".", options = {}) {
  const { version, packageName, repository } = await resolveMetadata(root, options);
  const steps = plannedSteps({
    version,
    npmTag: options.npmTag,
    dryRun: Boolean(options.dryRun),
    otp: options.otp,
    provenance: Boolean(options.provenance),
    skipVerify: Boolean(options.skipVerify),
    finalVerify: Boolean(options.finalVerify)
  });

  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-publish",
    mode: "plan",
    packageName,
    version,
    tag: `v${version}`,
    repository,
    npmTag: options.npmTag ?? "latest",
    dryRun: Boolean(options.dryRun),
    provenance: Boolean(options.provenance),
    finalVerify: Boolean(options.finalVerify),
    summary: summarize(steps),
    steps
  };
}

export async function publishRelease(root = ".", options = {}) {
  if (options.plan) return buildReleasePublishPlan(root, options);

  const { version, packageName, repository } = await resolveMetadata(root, options);
  const runner = options.runner ?? runCommand;
  const timeout = options.timeout;
  const steps = [];

  const statusArgs = ["scripts/release-status.js", "--version", version, "--format", "json"];
  const statusCommand = stringifyCommand("node", statusArgs);
  let alreadyPublished = false;

  try {
    const { stdout } = await runner(process.execPath, statusArgs, { cwd: root, timeout });
    const status = parseJson(stdout, "release status");
    if (!status.summary?.readyToPublish) {
      steps.push(step("release-status", "Prepublish release status", statusCommand, "fail", "Release status is not ready to publish.", `Run npm run release:status -- --version ${version} and resolve failed checks.`));
      return result({ version, packageName, repository, options, steps });
    }
    alreadyPublished = status.checks?.some((check) => check.id === "npm-registry-publication" && check.status === "pass") ?? false;
    steps.push(step("release-status", "Prepublish release status", statusCommand, "pass", `Release status is ready${alreadyPublished ? "; npm package already exists." : "."}`));
  } catch (error) {
    steps.push(step("release-status", "Prepublish release status", statusCommand, "fail", error.stderr?.trim() || error.stdout?.trim() || error.message, `Run npm run release:status -- --version ${version} and resolve failed checks.`));
    return result({ version, packageName, repository, options, steps });
  }

  const publishArgs = ["publish", "--access", "public"];
  if (options.npmTag) publishArgs.push("--tag", options.npmTag);
  if (options.provenance) publishArgs.push("--provenance");
  if (options.dryRun) publishArgs.push("--dry-run");
  if (options.otp) publishArgs.push("--otp", options.otp);
  const publishCommand = stringifyCommand("npm", publishArgs);

  if (alreadyPublished) {
    steps.push(step("npm-publish", options.dryRun ? "npm publish dry-run" : "npm publish", publishCommand, "skip", `${packageName}@${version} is already public on npm.`));
  } else {
    try {
      await runner("npm", publishArgs, { cwd: root, timeout });
      steps.push(step("npm-publish", options.dryRun ? "npm publish dry-run" : "npm publish", publishCommand, "pass", options.dryRun ? "npm publish dry-run completed." : `${packageName}@${version} published to npm.`));
    } catch (error) {
      const detail = error.stderr?.trim() || error.stdout?.trim() || error.message;
      steps.push(step("npm-publish", options.dryRun ? "npm publish dry-run" : "npm publish", publishCommand, "fail", detail, publishFailureRemediation(detail, version, repository)));
      return result({ version, packageName, repository, options, steps });
    }
  }

  const verifyArgs = ["scripts/verify-release.js", "--version", version];
  if (!options.finalVerify) verifyArgs.push("--allow-draft");
  const verifyCommand = stringifyCommand("node", verifyArgs);

  if (options.skipVerify || options.dryRun) {
    steps.push(step("release-verify", "Post-publish release verification", verifyCommand, "skip", options.dryRun ? "Skipped after npm publish dry-run." : "Skipped by --skip-verify."));
  } else {
    try {
      const { stdout } = await runner(process.execPath, verifyArgs, { cwd: root, timeout });
      steps.push(step("release-verify", "Post-publish release verification", verifyCommand, "pass", firstUsefulLine(stdout) || "Release verification passed."));
    } catch (error) {
      steps.push(step("release-verify", "Post-publish release verification", verifyCommand, "fail", error.stderr?.trim() || error.stdout?.trim() || error.message, "Publish the GitHub Release if the only failure is a draft release, then rerun npm run release:verify."));
    }
  }

  return result({ version, packageName, repository, options, steps });
}

function result({ version, packageName, repository, options, steps }) {
  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-publish",
    mode: options.dryRun ? "dry-run" : "publish",
    packageName,
    version,
    tag: `v${version}`,
    repository,
    npmTag: options.npmTag ?? "latest",
    dryRun: Boolean(options.dryRun),
    provenance: Boolean(options.provenance),
    finalVerify: Boolean(options.finalVerify),
    summary: summarize(steps),
    steps
  };
}

export function renderReleasePublish(report, format = "markdown") {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;

  const title = report.mode === "plan" ? "# Release publish plan" : report.dryRun ? "# Release publish dry-run" : "# Release publish";
  const lines = [
    title,
    "",
    `- Package: ${report.packageName}@${report.version}`,
    `- Repository: ${report.repository}`,
    `- Release tag: ${report.tag}`,
    `- npm tag: ${report.npmTag}`,
    `- Provenance: ${report.provenance ? "yes" : "no"}`,
    `- Steps: ${report.summary.passed} pass, ${report.summary.failed} fail, ${report.summary.skipped} skip, ${report.summary.planned} planned`,
    `- Ready: ${report.summary.ready ? "yes" : "no"}`,
    ""
  ];

  lines.push("## Steps");
  for (const item of report.steps) {
    lines.push(`- ${item.status.toUpperCase()}: ${item.title} - \`${item.command}\``);
    if (item.detail) lines.push(`  ${item.detail}`);
    if (item.remediation) lines.push(`  Next: ${item.remediation}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
