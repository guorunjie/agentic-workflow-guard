import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { semverPattern } from "./version.js";

const execFileAsync = promisify(execFile);
const defaultRepository = "guorunjie/agentic-workflow-guard";

function commandText(command, args) {
  return [command, ...args].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(" ");
}

function parseJson(stdout, label) {
  try {
    return JSON.parse(stdout);
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

async function packageMetadata(root) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  return {
    packageName: pkg.name,
    version: pkg.version
  };
}

function pass(id, title, detail, command) {
  return { id, title, status: "pass", detail, command };
}

function warn(id, title, detail, command, remediation) {
  return { id, title, status: "warn", detail, command, remediation };
}

function fail(id, title, detail, command, remediation) {
  return { id, title, status: "fail", detail, command, remediation };
}

function planned(id, title, command) {
  return { id, title, status: "planned", command };
}

function firstLine(text) {
  return String(text || "").trim().split("\n").find(Boolean) || "";
}

function buildStatusChecks({ packageName, version, repository }) {
  const tag = `v${version}`;
  return [
    {
      id: "git-worktree",
      title: "Clean git worktree",
      command: commandText("git", ["status", "--short", "--branch"]),
      async run({ runner, root }) {
        const { stdout } = await runner("git", ["status", "--short", "--branch"], { cwd: root });
        const lines = stdout.trim().split("\n").filter(Boolean);
        const dirty = lines.slice(1);
        if (dirty.length) return fail(this.id, this.title, dirty.join("; "), this.command, "Commit or stash local changes before publishing.");
        return pass(this.id, this.title, firstLine(stdout) || "No local changes.", this.command);
      }
    },
    {
      id: "git-tag",
      title: "Release tag points at HEAD",
      command: `${commandText("git", ["rev-parse", "HEAD"])} && ${commandText("git", ["rev-parse", `${tag}^{}`])}`,
      async run({ runner, root }) {
        const head = (await runner("git", ["rev-parse", "HEAD"], { cwd: root })).stdout.trim();
        const tagged = (await runner("git", ["rev-parse", `${tag}^{}`], { cwd: root })).stdout.trim();
        if (head !== tagged) return fail(this.id, this.title, `${tag} points at ${tagged.slice(0, 12)}; HEAD is ${head.slice(0, 12)}.`, this.command, `Move ${tag} to the release commit before publishing.`);
        return pass(this.id, this.title, `${tag} resolves to ${head.slice(0, 12)}.`, this.command);
      }
    },
    {
      id: "github-repository",
      title: "Public GitHub repository",
      command: commandText("gh", ["repo", "view", repository, "--json", "visibility,description,url"]),
      async run({ runner }) {
        const { stdout } = await runner("gh", ["repo", "view", repository, "--json", "visibility,description,url"]);
        const repo = parseJson(stdout, "GitHub repository");
        if (repo.visibility !== "PUBLIC") return fail(this.id, this.title, `visibility=${repo.visibility || "missing"}`, this.command, "Make the repository public before launch.");
        return pass(this.id, this.title, `${repo.url || repository} is PUBLIC.`, this.command);
      }
    },
    {
      id: "github-release",
      title: "GitHub Release draft",
      command: commandText("gh", ["release", "view", tag, "--repo", repository, "--json", "tagName,isDraft,isPrerelease,name,url"]),
      async run({ runner }) {
        const { stdout } = await runner("gh", ["release", "view", tag, "--repo", repository, "--json", "tagName,isDraft,isPrerelease,name,url"]);
        const release = parseJson(stdout, "GitHub Release");
        if (release.tagName !== tag) return fail(this.id, this.title, `Expected ${tag}, got ${release.tagName || "none"}.`, this.command, "Recreate or retarget the draft Release.");
        const state = release.isDraft ? "draft" : "published";
        return pass(this.id, this.title, `${release.name || tag} is ${state}.`, this.command);
      }
    },
    {
      id: "release-workflow-dry-run",
      title: "Release workflow dry-run",
      command: commandText("gh", ["run", "list", "--repo", repository, "--workflow", "release.yml", "--limit", "5", "--json", "databaseId,status,conclusion,event,createdAt,workflowName,displayTitle,url"]),
      async run({ runner }) {
        const { stdout } = await runner("gh", ["run", "list", "--repo", repository, "--workflow", "release.yml", "--limit", "5", "--json", "databaseId,status,conclusion,event,createdAt,workflowName,displayTitle,url"]);
        const runs = parseJson(stdout, "release workflow runs");
        const success = runs.find((run) => run.event === "workflow_dispatch" && run.status === "completed" && run.conclusion === "success");
        if (!success) return warn(this.id, this.title, "No successful manual release workflow dry-run found in the latest 5 release runs.", this.command, `Run the release workflow with tag=${tag} and dry_run=true.`);
        return pass(this.id, this.title, `Latest successful dry-run: ${success.databaseId || success.url || "unknown"} (${success.createdAt || "unknown time"}).`, this.command);
      }
    },
    {
      id: "npm-token-secret",
      title: "GitHub NPM_TOKEN secret",
      command: commandText("gh", ["secret", "list", "--repo", repository, "--json", "name,updatedAt"]),
      async run({ runner }) {
        const { stdout } = await runner("gh", ["secret", "list", "--repo", repository, "--json", "name,updatedAt"]);
        const secrets = parseJson(stdout || "[]", "GitHub secrets");
        const token = secrets.find((secret) => secret.name === "NPM_TOKEN");
        if (!token) return warn(this.id, this.title, "NPM_TOKEN is not configured.", this.command, `Run gh secret set NPM_TOKEN --repo ${repository}.`);
        return pass(this.id, this.title, `NPM_TOKEN is configured${token.updatedAt ? ` (updated ${token.updatedAt})` : ""}.`, this.command);
      }
    },
    {
      id: "npm-local-auth",
      title: "Local npm authentication",
      command: commandText("npm", ["whoami"]),
      async run({ runner }) {
        try {
          const { stdout } = await runner("npm", ["whoami"]);
          return pass(this.id, this.title, `Logged in as ${stdout.trim()}.`, this.command);
        } catch (error) {
          return warn(this.id, this.title, error.stderr?.trim() || error.message, this.command, "Use npm adduser for manual publish, or configure NPM_TOKEN for the GitHub release workflow.");
        }
      }
    },
    {
      id: "npm-registry-publication",
      title: "npm registry publication",
      command: commandText("npm", ["view", `${packageName}@${version}`, "version", "--json"]),
      async run({ runner }) {
        try {
          const { stdout } = await runner("npm", ["view", `${packageName}@${version}`, "version", "--json"]);
          const published = parseJson(stdout, "npm package version");
          if (published !== version) return fail(this.id, this.title, `Expected ${version}, got ${published || "none"}.`, this.command, "Verify the npm dist-tag and package version before announcing the release.");
          return pass(this.id, this.title, `${packageName}@${version} is public on npm.`, this.command);
        } catch (error) {
          return warn(this.id, this.title, `${packageName}@${version} is not public on npm yet.`, this.command, "Publish the package, then run npm run release:verify.");
        }
      }
    }
  ];
}

function summarize(checks) {
  const count = (status) => checks.filter((check) => check.status === status).length;
  const credentialReady = checks.some((check) => ["npm-token-secret", "npm-local-auth"].includes(check.id) && check.status === "pass");
  return {
    total: checks.length,
    pass: count("pass"),
    warn: count("warn"),
    fail: count("fail"),
    planned: count("planned"),
    credentialReady,
    readyToPublish: count("fail") === 0 && credentialReady
  };
}

export async function buildReleaseStatusPlan(root = ".", options = {}) {
  const metadata = await packageMetadata(root);
  const version = options.version ?? metadata.version;
  const packageName = options.packageName ?? metadata.packageName;
  const repository = options.repository ?? defaultRepository;

  if (!version) throw new Error("Missing release version. Use --version <semver>.");
  if (!semverPattern.test(version)) throw new Error(`Invalid release version: ${version}`);
  if (!packageName) throw new Error("Missing package name. Use --package <name>.");

  const checks = buildStatusChecks({ packageName, version, repository }).map((check) => planned(check.id, check.title, check.command));
  checks.push(planned("publishing-credential", "Publishing credential", "NPM_TOKEN secret or npm whoami"));

  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-status",
    mode: "dry-run",
    packageName,
    version,
    tag: `v${version}`,
    repository,
    summary: summarize(checks),
    checks
  };
}

export async function buildReleaseStatus(root = ".", options = {}) {
  if (options.dryRun) return buildReleaseStatusPlan(root, options);

  const metadata = await packageMetadata(root);
  const version = options.version ?? metadata.version;
  const packageName = options.packageName ?? metadata.packageName;
  const repository = options.repository ?? defaultRepository;

  if (!version) throw new Error("Missing release version. Use --version <semver>.");
  if (!semverPattern.test(version)) throw new Error(`Invalid release version: ${version}`);
  if (!packageName) throw new Error("Missing package name. Use --package <name>.");

  const runner = options.runner ?? runCommand;
  const checks = [];
  for (const check of buildStatusChecks({ packageName, version, repository })) {
    try {
      checks.push(await check.run({ runner, root }));
    } catch (error) {
      checks.push(fail(check.id, check.title, error.stderr?.trim() || error.message, check.command));
    }
  }

  const credentialReady = checks.some((check) => ["npm-token-secret", "npm-local-auth"].includes(check.id) && check.status === "pass");
  checks.push(
    credentialReady
      ? pass("publishing-credential", "Publishing credential", "A GitHub NPM_TOKEN secret or local npm login is available.", "NPM_TOKEN secret or npm whoami")
      : fail("publishing-credential", "Publishing credential", "No GitHub NPM_TOKEN secret or local npm login is available.", "NPM_TOKEN secret or npm whoami", `Run gh secret set NPM_TOKEN --repo ${repository}, or authenticate with npm adduser for manual publish.`)
  );

  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-status",
    mode: "status",
    packageName,
    version,
    tag: `v${version}`,
    repository,
    summary: summarize(checks),
    checks
  };
}

export function renderReleaseStatus(result, format = "markdown") {
  if (format === "json") return `${JSON.stringify(result, null, 2)}\n`;

  const title = result.mode === "dry-run" ? "# Release status dry run" : "# Release status";
  const lines = [
    title,
    "",
    `- Package: ${result.packageName}@${result.version}`,
    `- Repository: ${result.repository}`,
    `- Release tag: ${result.tag}`,
    `- Checks: ${result.summary.pass} pass, ${result.summary.warn} warn, ${result.summary.fail} fail, ${result.summary.planned} planned`,
    `- Ready to publish: ${result.summary.readyToPublish ? "yes" : "no"}`,
    ""
  ];

  if (result.mode === "dry-run") lines.push("No live checks were run. Rerun without `--dry-run` before publishing the draft Release.", "");

  lines.push("## Checks");
  for (const check of result.checks) {
    lines.push(`- ${check.status.toUpperCase()}: ${check.title} - \`${check.command}\``);
    if (check.detail) lines.push(`  ${check.detail}`);
    if (check.remediation) lines.push(`  Next: ${check.remediation}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}
