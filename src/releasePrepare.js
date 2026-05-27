import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { semverPattern } from "./version.js";

export const releasePrepareTagFiles = ["README.md", "docs/github-action-marketplace.md", "docs-site/marketplace.html"];

const actionRefPattern = /guorunjie\/agentic-workflow-guard@v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g;
const releaseTagPattern = /v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/g;

function countMatches(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

function publicChange(change) {
  const { content: _content, ...rest } = change;
  return rest;
}

async function collectReleasePrepare(root, targetVersion) {
  if (!targetVersion) throw new Error("Missing release version. Use --version <semver>.");
  if (!semverPattern.test(targetVersion)) throw new Error(`Invalid release version: ${targetVersion}`);

  const targetTag = `v${targetVersion}`;
  const targetActionRef = `guorunjie/agentic-workflow-guard@${targetTag}`;
  const packagePath = path.join(root, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const currentVersion = packageJson.version;
  const changes = [];
  const writes = [];

  if (packageJson.version !== targetVersion) {
    const nextPackageJson = { ...packageJson, version: targetVersion };
    const content = `${JSON.stringify(nextPackageJson, null, 2)}\n`;
    changes.push({
      file: "package.json",
      kind: "package-version",
      changed: true,
      before: currentVersion,
      after: targetVersion
    });
    writes.push({ file: "package.json", content });
  } else {
    changes.push({
      file: "package.json",
      kind: "package-version",
      changed: false,
      before: currentVersion,
      after: targetVersion
    });
  }

  for (const file of releasePrepareTagFiles) {
    const absolute = path.join(root, file);
    const current = await readFile(absolute, "utf8");
    const actionRefs = countMatches(current, actionRefPattern);
    const releaseTags = countMatches(current, releaseTagPattern);
    const next = current.replace(actionRefPattern, targetActionRef).replace(releaseTagPattern, targetTag);
    const changed = next !== current;
    changes.push({
      file,
      kind: "release-tag",
      changed,
      replacements: changed ? releaseTags : 0,
      actionRefs,
      releaseTags
    });
    if (changed) writes.push({ file, content: next });
  }

  const followUpCommands = [
    "npm run release:sync",
    "node ./bin/agentic-workflow-guard.js skillpack > skillpack.yaml",
    "node ../skillpack-forge/bin/skillpack-forge.js compile .",
    `npm run release:check -- --target ${targetVersion}`,
    "npm test",
    "npm run smoke:package",
    "npm run docs:build",
    "npm pack --dry-run",
    "git diff --check"
  ];
  const changedCount = changes.filter((change) => change.changed).length;
  const plan = {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-release-prepare",
    currentVersion,
    targetVersion,
    targetTag,
    summary: {
      total: changes.length,
      changed: changedCount,
      unchanged: changes.length - changedCount
    },
    changes: changes.map(publicChange),
    followUpCommands
  };

  return { plan, writes };
}

export async function buildReleasePreparePlan(root = ".", options = {}) {
  const { plan } = await collectReleasePrepare(root, options.version);
  return {
    ...plan,
    mode: "dry-run",
    applied: false
  };
}

export async function prepareRelease(root = ".", options = {}) {
  const { plan, writes } = await collectReleasePrepare(root, options.version);
  const apply = Boolean(options.apply);
  if (apply) {
    for (const item of writes) await writeFile(path.join(root, item.file), item.content);
  }
  return {
    ...plan,
    mode: apply ? "apply" : "dry-run",
    applied: apply
  };
}

export function renderReleasePrepare(result, format = "markdown") {
  if (format === "json") return `${JSON.stringify(result, null, 2)}\n`;
  const lines = [
    result.applied ? "# Release prepare applied" : "# Release prepare dry run",
    "",
    `- Current version: ${result.currentVersion}`,
    `- Target version: ${result.targetVersion}`,
    `- Changes: ${result.summary.changed} changed, ${result.summary.unchanged} unchanged`,
    ""
  ];

  if (!result.applied) {
    lines.push("No files were changed. Rerun with `--apply` to write the planned release updates.", "");
  }

  lines.push("## Planned file updates");
  for (const change of result.changes) {
    if (change.kind === "package-version") {
      lines.push(`- ${change.file}: ${change.changed ? `${change.before} -> ${change.after}` : "already matches target"}`);
      continue;
    }
    const detail = change.changed ? `${change.replacements} release tag replacement${change.replacements === 1 ? "" : "s"}` : "already matches target";
    lines.push(`- ${change.file}: ${detail}`);
  }

  lines.push("", "## Follow-up commands");
  for (const command of result.followUpCommands) lines.push(`- \`${command}\``);
  lines.push("");
  return `${lines.join("\n")}\n`;
}
