import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { scanProject } from "./scan.js";

function stripLineSuffix(file) {
  return file.replace(/:\d+$/, "");
}

function saferPermissionValue(permission) {
  if (permission === "id-token") return "none";
  return "read";
}

function applyPermissionFix(text) {
  let changed = false;
  const updated = text.replace(/^(\s*)(contents|pull-requests|id-token|issues|actions|deployments|packages):\s*write\s*$/gim, (line, indent, permission) => {
    changed = true;
    return `${indent}${permission}: ${saferPermissionValue(permission)}`;
  });
  return { text: updated, changed };
}

function applyDryRunGuard(text) {
  if (/AGENTIC_WORKFLOW_GUARD_DRY_RUN/.test(text)) return { text, changed: false };
  let changed = false;
  const updated = text.replace(/^(\s*)steps:\s*$/m, (line, indent) => {
    changed = true;
    return `${indent}env:\n${indent}  AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"\n${line}`;
  });
  return { text: updated, changed };
}

function fixableFiles(findings) {
  return [...new Set(findings.filter((finding) => ["AWI003", "AWI008"].includes(finding.ruleId)).map((finding) => stripLineSuffix(finding.file)))];
}

function recipeForFinding(finding) {
  const file = stripLineSuffix(finding.file);
  const recipes = {
    AWI001: {
      id: "gate-untrusted-ci-context",
      mode: "manual",
      confidence: "medium",
      title: "Gate untrusted CI or workflow context before it reaches an agent prompt"
    },
    AWI002: {
      id: "review-agent-output-before-shell",
      mode: "manual",
      confidence: "high",
      title: "Move agent output into a review artifact before shell execution"
    },
    AWI003: {
      id: "github-permissions-read-only",
      mode: "automatic",
      confidence: "high",
      title: "Downgrade write-capable GitHub token permissions"
    },
    AWI004: {
      id: "split-pull-request-target-agent",
      mode: "manual",
      confidence: "high",
      title: "Separate elevated pull_request_target work from untrusted agent execution"
    },
    AWI005: {
      id: "low-code-approval-before-side-effect",
      mode: "manual",
      confidence: "medium",
      title: "Add validation or approval before n8n side-effect nodes"
    },
    AWI006: {
      id: "scope-high-risk-mcp-tools",
      mode: "manual",
      confidence: "high",
      title: "Scope high-risk MCP tools to narrow read-only access"
    },
    AWI007: {
      id: "remove-secrets-from-agent-context",
      mode: "manual",
      confidence: "high",
      title: "Keep secrets out of prompt-visible agent context"
    },
    AWI008: {
      id: "github-dry-run-env",
      mode: "automatic",
      confidence: "medium",
      title: "Add an explicit dry-run safety marker to the workflow"
    },
    AWI009: {
      id: "automation-approval-before-side-effect",
      mode: "manual",
      confidence: "medium",
      title: "Validate model output before workflow automation side effects"
    },
    AWI010: {
      id: "browser-action-allowlist",
      mode: "manual",
      confidence: "medium",
      title: "Add browser action allowlists and approval gates"
    }
  };
  const recipe = recipes[finding.ruleId] ?? {
    id: "review-agentic-workflow-risk",
    mode: "manual",
    confidence: "low",
    title: "Review the agentic workflow risk manually"
  };

  return {
    ...recipe,
    ruleId: finding.ruleId,
    file,
    findingFile: finding.file,
    remediation: finding.remediation
  };
}

function applyRecipes(original, file, findings) {
  const fileFindings = findings.filter((finding) => stripLineSuffix(finding.file) === file);
  let text = original;
  let changed = false;

  if (fileFindings.some((finding) => finding.ruleId === "AWI003")) {
    const result = applyPermissionFix(text);
    text = result.text;
    changed ||= result.changed;
  }

  if (fileFindings.some((finding) => finding.ruleId === "AWI008")) {
    const result = applyDryRunGuard(text);
    text = result.text;
    changed ||= result.changed;
  }

  return { text, changed };
}

async function applyFixes(root, findings) {
  const files = fixableFiles(findings);
  const changedFiles = [];

  for (const file of files) {
    const absolute = path.join(root, file);
    const original = await readFile(absolute, "utf8");
    const result = applyRecipes(original, file, findings);
    if (!result.changed) continue;
    await writeFile(absolute, result.text);
    changedFiles.push(file);
  }

  return changedFiles;
}

async function buildFixChanges(root, findings) {
  const files = fixableFiles(findings);
  const changes = [];

  for (const file of files) {
    const absolute = path.join(root, file);
    const original = await readFile(absolute, "utf8");
    const result = applyRecipes(original, file, findings);
    if (result.changed) {
      changes.push({ file, original, updated: result.text });
    }
  }

  return changes;
}

async function buildFixReport(root, findings, options = {}) {
  const recipes = findings.map(recipeForFinding);
  const patchChanges = await buildFixChanges(root, findings);
  const changedFiles = options.apply ? await applyFixes(root, findings) : [];
  const changedFileSet = new Set(changedFiles);
  const automaticRecipes = recipes.filter((recipe) => recipe.mode === "automatic");
  const manualRecipes = recipes.filter((recipe) => recipe.mode === "manual");
  const changes = patchChanges.map((change) => ({
    file: change.file,
    applied: changedFileSet.has(change.file),
    recipeIds: automaticRecipes.filter((recipe) => recipe.file === change.file).map((recipe) => recipe.id)
  }));

  return {
    schemaVersion: "1.0.0",
    mode: options.apply ? "apply" : "dry-run",
    summary: {
      findings: findings.length,
      automaticRecipes: automaticRecipes.length,
      manualRecipes: manualRecipes.length,
      availablePatches: patchChanges.length,
      changedFiles: changedFiles.length
    },
    changes,
    recipes,
    findings
  };
}

function renderPatch(changes) {
  if (!changes.length) return "# Patch preview\n\nNo safe automatic patches were available.\n";
  const lines = ["# Patch preview", ""];
  for (const change of changes) {
    lines.push(`diff --git a/${change.file} b/${change.file}`);
    lines.push(`--- a/${change.file}`);
    lines.push(`+++ b/${change.file}`);
    lines.push("@@");
    lines.push(...diffLines(change.original, change.updated));
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function diffLines(original, updated) {
  const before = original.split(/\r?\n/);
  const after = updated.split(/\r?\n/);
  let prefix = 0;

  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) {
    prefix += 1;
  }

  let beforeSuffix = before.length - 1;
  let afterSuffix = after.length - 1;
  while (beforeSuffix >= prefix && afterSuffix >= prefix && before[beforeSuffix] === after[afterSuffix]) {
    beforeSuffix -= 1;
    afterSuffix -= 1;
  }

  const lines = [];
  for (let index = 0; index < prefix; index += 1) lines.push(` ${before[index]}`);
  for (let index = prefix; index <= beforeSuffix; index += 1) lines.push(`-${before[index]}`);
  for (let index = prefix; index <= afterSuffix; index += 1) lines.push(`+${after[index]}`);
  for (let index = beforeSuffix + 1; index < before.length; index += 1) lines.push(` ${before[index]}`);
  return lines;
}

export async function renderFixPlan(root, options = {}) {
  const findings = await scanProject(root);
  if (options.format === "json") {
    return `${JSON.stringify(await buildFixReport(root, findings, options), null, 2)}\n`;
  }

  if (options.patch) {
    return renderPatch(await buildFixChanges(root, findings));
  }

  const lines = ["# Fix plan", ""];
  if (!findings.length) {
    lines.push("No findings to fix.");
    return `${lines.join("\n")}\n`;
  }

  if (options.apply) {
    const changedFiles = await applyFixes(root, findings);
    lines[0] = "# Applied fixes";
    if (!changedFiles.length) {
      lines.push("No safe automatic fixes were available.");
      lines.push("");
    } else {
      lines.push("Updated GitHub Actions permissions in:");
      for (const file of changedFiles) {
        lines.push(`- \`${file}\``);
      }
      lines.push("");
    }
  }

  for (const finding of findings) {
    lines.push(`## ${finding.ruleId}: ${finding.title}`);
    lines.push(`- File: \`${finding.file}\``);
    lines.push(`- Evidence: \`${finding.evidence}\``);
    lines.push(`- Suggested fix: ${finding.remediation}`);
    lines.push("");
  }
  if (options.apply) {
    lines.push("Applied only low-risk permission downgrades. Review remaining findings before merging.");
  } else {
    lines.push("Dry-run only: review this plan before editing workflows. Use --apply for low-risk permission downgrades.");
  }
  return `${lines.join("\n")}\n`;
}
