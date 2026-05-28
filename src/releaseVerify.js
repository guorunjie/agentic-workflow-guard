import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { semverPattern } from "./version.js";

const execFileAsync = promisify(execFile);
const defaultRepository = "guorunjie/agentic-workflow-guard";

function stringifyCommand(command, args) {
  return [command, ...args].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function parseJsonOutput(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label} did not return valid JSON.`);
  }
}

async function runCommand(command, args, options = {}) {
  return execFileAsync(command, args, {
    cwd: options.cwd,
    timeout: options.timeout ?? 60_000,
    maxBuffer: 10 * 1024 * 1024
  });
}

function normalizeVersionValue(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

async function packageMetadata(root) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  return {
    packageName: pkg.name,
    version: pkg.version
  };
}

function buildChecks({ version, packageName, repository, allowDraft }) {
  const tag = `v${version}`;
  return [
    {
      id: "git-tag",
      title: "Local git tag",
      command: "git",
      args: ["rev-parse", `${tag}^{}`],
      validate({ stdout }) {
        const commit = stdout.trim();
        if (!commit) throw new Error(`${tag} does not resolve to a commit.`);
        return `Resolved ${tag} to ${commit.slice(0, 12)}.`;
      }
    },
    {
      id: "github-release",
      title: "GitHub Release",
      command: "gh",
      args: ["release", "view", tag, "--repo", repository, "--json", "tagName,isDraft,isPrerelease,name,url"],
      validate({ stdout }) {
        const release = parseJsonOutput(stdout, "GitHub Release");
        if (release.tagName !== tag) throw new Error(`Expected release tag ${tag}, got ${release.tagName || "none"}.`);
        if (release.isDraft && !allowDraft) throw new Error(`${tag} is still a draft release.`);
        const state = release.isDraft ? "draft" : "published";
        return `${release.name || tag} is ${state}${release.url ? ` at ${release.url}` : ""}.`;
      }
    },
    {
      id: "npm-package",
      title: "npm package version",
      command: "npm",
      args: ["view", `${packageName}@${version}`, "version", "--json"],
      validate({ stdout }) {
        const published = normalizeVersionValue(parseJsonOutput(stdout, "npm package version"));
        if (published !== version) throw new Error(`Expected npm ${packageName}@${version}, got ${published || "none"}.`);
        return `npm registry exposes ${packageName}@${published}.`;
      }
    },
    {
      id: "npx-help",
      title: "npx CLI help",
      command: "npx",
      args: ["--yes", `${packageName}@${version}`, "--help"],
      validate({ stdout }) {
        if (!stdout.includes("Agentic Workflow Guard") || !stdout.includes("release check")) {
          throw new Error("npx --help output did not include the expected CLI usage.");
        }
        return "npx can execute the published CLI help.";
      }
    },
    {
      id: "npx-schema",
      title: "npx schema smoke",
      command: "npx",
      args: ["--yes", `${packageName}@${version}`, "schema", "report"],
      validate({ stdout }) {
        const schema = parseJsonOutput(stdout, "schema report");
        if (schema.title !== "Agentic Workflow Guard Report") {
          throw new Error("Published CLI did not emit the report schema.");
        }
        return "Published CLI emits the stable report schema.";
      }
    },
    {
      id: "npx-config-schema",
      title: "npx config schema smoke",
      command: "npx",
      args: ["--yes", `${packageName}@${version}`, "schema", "config"],
      validate({ stdout }) {
        const schema = parseJsonOutput(stdout, "schema config");
        if (schema.title !== "Agentic Workflow Guard Config") {
          throw new Error("Published CLI did not emit the config schema.");
        }
        return "Published CLI emits the stable config schema.";
      }
    },
    {
      id: "npx-doctor",
      title: "npx doctor smoke",
      command: "npx",
      args: ["--yes", `${packageName}@${version}`, "doctor", ".", "--format", "json"],
      validate({ stdout }) {
        const report = parseJsonOutput(stdout, "doctor");
        if (report.name !== "agentic-workflow-guard-doctor") {
          throw new Error("Published CLI did not emit the doctor report.");
        }
        return "Published CLI emits the setup doctor report.";
      }
    }
  ];
}

export async function buildReleaseVerifyPlan(root = ".", options = {}) {
  const metadata = await packageMetadata(root);
  const version = options.version ?? metadata.version;
  const packageName = options.packageName ?? metadata.packageName;
  const repository = options.repository ?? defaultRepository;

  if (!version) throw new Error("Missing release version. Use --version <semver>.");
  if (!semverPattern.test(version)) throw new Error(`Invalid release version: ${version}`);
  if (!packageName) throw new Error("Missing package name. Use --package <name>.");

  const checks = buildChecks({
    version,
    packageName,
    repository,
    allowDraft: Boolean(options.allowDraft)
  }).map((check) => ({
    id: check.id,
    title: check.title,
    command: stringifyCommand(check.command, check.args),
    status: "planned"
  }));

  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-verify",
    mode: "dry-run",
    packageName,
    version,
    tag: `v${version}`,
    repository,
    allowDraft: Boolean(options.allowDraft),
    summary: {
      total: checks.length,
      passed: 0,
      failed: 0,
      planned: checks.length
    },
    checks
  };
}

export async function verifyRelease(root = ".", options = {}) {
  if (options.dryRun) return buildReleaseVerifyPlan(root, options);

  const metadata = await packageMetadata(root);
  const version = options.version ?? metadata.version;
  const packageName = options.packageName ?? metadata.packageName;
  const repository = options.repository ?? defaultRepository;

  if (!version) throw new Error("Missing release version. Use --version <semver>.");
  if (!semverPattern.test(version)) throw new Error(`Invalid release version: ${version}`);
  if (!packageName) throw new Error("Missing package name. Use --package <name>.");

  const rawChecks = buildChecks({
    version,
    packageName,
    repository,
    allowDraft: Boolean(options.allowDraft)
  });
  const runner = options.runner ?? runCommand;
  const checks = [];

  for (const check of rawChecks) {
    const publicCheck = {
      id: check.id,
      title: check.title,
      command: stringifyCommand(check.command, check.args)
    };
    try {
      const result = await runner(check.command, check.args, { cwd: root, timeout: options.timeout });
      checks.push({
        ...publicCheck,
        status: "pass",
        detail: check.validate(result)
      });
    } catch (error) {
      checks.push({
        ...publicCheck,
        status: "fail",
        detail: error.stderr?.trim() || error.stdout?.trim() || error.message
      });
    }
  }

  const failed = checks.filter((check) => check.status === "fail").length;
  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-verify",
    mode: "verify",
    packageName,
    version,
    tag: `v${version}`,
    repository,
    allowDraft: Boolean(options.allowDraft),
    summary: {
      total: checks.length,
      passed: checks.length - failed,
      failed,
      planned: 0
    },
    checks
  };
}

export function renderReleaseVerify(result, format = "markdown") {
  if (format === "json") return `${JSON.stringify(result, null, 2)}\n`;

  const title = result.mode === "dry-run" ? "# Release verify dry run" : "# Release verify";
  const lines = [
    title,
    "",
    `- Package: ${result.packageName}@${result.version}`,
    `- Repository: ${result.repository}`,
    `- Release tag: ${result.tag}`,
    `- Checks: ${result.summary.passed} pass, ${result.summary.failed} fail, ${result.summary.planned} planned`,
    ""
  ];

  if (result.mode === "dry-run") {
    lines.push("No network checks were run. Rerun without `--dry-run` after the GitHub Release and npm package are public.", "");
  }

  lines.push("## Checks");
  for (const check of result.checks) {
    const label = check.status.toUpperCase();
    lines.push(`- ${label}: ${check.title} - \`${check.command}\``);
    if (check.detail) lines.push(`  ${check.detail}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
