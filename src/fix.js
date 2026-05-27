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

const dryRunVariable = "AGENTIC_WORKFLOW_GUARD_DRY_RUN";

function insertIntoExistingBlock(text, blockStartIndex, line) {
  const lineEnd = text.indexOf("\n", blockStartIndex);
  if (lineEnd === -1) return `${text}\n${line}`;
  return `${text.slice(0, lineEnd + 1)}${line}${text.slice(lineEnd + 1)}`;
}

function insertYamlVariableAtTopLevel(text) {
  const variables = text.match(/^variables:\s*$/m);
  if (!variables) {
    return {
      text: `variables:\n  ${dryRunVariable}: "true"\n\n${text}`,
      changed: true
    };
  }

  const afterVariables = text.slice(variables.index + variables[0].length);
  const firstVariableLine = afterVariables.split(/\r?\n/).slice(1).find((line) => line.trim().length > 0);
  const listVariable = firstVariableLine?.match(/^(\s*)-\s+/);
  const mappingIndent = firstVariableLine && /^\s+\S/.test(firstVariableLine) ? firstVariableLine.match(/^(\s*)/)?.[1] : "  ";
  const line = listVariable
    ? `${listVariable[1]}- name: ${dryRunVariable}\n${listVariable[1]}  value: "true"\n`
    : `${mappingIndent}${dryRunVariable}: "true"\n`;

  return {
    text: insertIntoExistingBlock(text, variables.index, line),
    changed: true
  };
}

function insertYamlDryRunBlockBeforeSteps(text, blockName) {
  const steps = text.match(/^(\s*)steps:\s*$/m);
  if (!steps) return { text, changed: false };

  const indent = steps[1];
  const beforeSteps = text.slice(0, steps.index);
  const existingBlockPattern = new RegExp(`^${indent}${blockName}:\\s*$`, "m");
  const existingBlock = beforeSteps.match(existingBlockPattern);
  if (existingBlock) {
    return {
      text: insertIntoExistingBlock(text, existingBlock.index, `${indent}  ${dryRunVariable}: "true"\n`),
      changed: true
    };
  }

  const updated = text.replace(/^(\s*)steps:\s*$/m, (line, stepIndent) => {
    return `${stepIndent}${blockName}:\n${stepIndent}  ${dryRunVariable}: "true"\n${line}`;
  });
  return { text: updated, changed: updated !== text };
}

function applyJenkinsDryRunGuard(text) {
  const existingEnvironment = text.match(/^(\s*)environment\s*\{\s*$/m);
  if (existingEnvironment) {
    return {
      text: insertIntoExistingBlock(text, existingEnvironment.index, `${existingEnvironment[1]}  ${dryRunVariable} = 'true'\n`),
      changed: true
    };
  }

  const updated = text.replace(/^(\s*)agent\s+any\s*$/m, (line, indent) => {
    return `${line}\n${indent}environment {\n${indent}  ${dryRunVariable} = 'true'\n${indent}}`;
  });
  return { text: updated, changed: updated !== text };
}

function applyDryRunGuard(text, file) {
  if (/AGENTIC_WORKFLOW_GUARD_DRY_RUN/.test(text)) return { text, changed: false };
  if (/^\.github\/workflows\/.+\.ya?ml$/i.test(file)) return insertYamlDryRunBlockBeforeSteps(text, "env");
  if (/^\.circleci\/config\.ya?ml$/i.test(file)) return insertYamlDryRunBlockBeforeSteps(text, "environment");
  if (/^\.gitlab-ci\.ya?ml$/i.test(file) || /^azure-pipelines\.ya?ml$/i.test(file) || /^\.azure-pipelines\/.+\.ya?ml$/i.test(file)) {
    return insertYamlVariableAtTopLevel(text);
  }
  if (/(^|\/)Jenkinsfile(\..*)?$/i.test(file)) return applyJenkinsDryRunGuard(text);
  return { text, changed: false };
}

function fixableFiles(findings) {
  return [...new Set(findings.filter((finding) => ["AWI003", "AWI008"].includes(finding.ruleId)).map((finding) => stripLineSuffix(finding.file)))];
}

function platformForFile(file) {
  if (/^\.github\/workflows\/.+\.ya?ml$/i.test(file)) return "github-actions";
  if (/^\.gitlab-ci\.ya?ml$/i.test(file)) return "gitlab-ci";
  if (/^\.circleci\/config\.ya?ml$/i.test(file)) return "circleci";
  if (/^azure-pipelines\.ya?ml$/i.test(file) || /^\.azure-pipelines\/.+\.ya?ml$/i.test(file)) return "azure-pipelines";
  if (/(^|\/)Jenkinsfile(\..*)?$/i.test(file)) return "jenkins";
  if (/\.mcp\.json$/i.test(file)) return "mcp";
  if (/browser-trace\.json$/i.test(file)) return "browser-automation";
  return "automation";
}

function snippet(label, format, body) {
  return { label, format, body: body.trim() };
}

function approvalSnippet(platform) {
  const snippets = {
    "github-actions": snippet(
      "GitHub environment approval gate",
      "yaml",
      `
environment: agent-review
permissions:
  contents: read
`
    ),
    "gitlab-ci": snippet(
      "GitLab manual approval gate",
      "yaml",
      `
when: manual
allow_failure: false
`
    ),
    circleci: snippet(
      "CircleCI approval job",
      "yaml",
      `
workflows:
  agent_review:
    jobs:
      - hold:
          type: approval
      - ai_review:
          requires:
            - hold
`
    ),
    "azure-pipelines": snippet(
      "Azure environment approval gate",
      "yaml",
      `
environment: agent-review
`
    ),
    jenkins: snippet(
      "Jenkins input approval gate",
      "groovy",
      `
input message: 'Approve agent side effects?', ok: 'Approve'
`
    )
  };
  return snippets[platform] ?? snippet(
    "Manual approval gate",
    "text",
    "Add a required human approval step immediately before the agent can run write-capable tools or side-effect actions."
  );
}

function guidanceForFinding(ruleId, platform) {
  const approval = approvalSnippet(platform);
  const guidance = {
    AWI001: {
      nextSteps: [
        "Validate or summarize untrusted workflow input before it enters the prompt.",
        "Add a manual approval gate before any agent-visible input can trigger write-capable tools."
      ],
      snippets: [approval]
    },
    AWI002: {
      nextSteps: [
        "Write model output to a review artifact instead of executing it directly.",
        "Validate reviewed output against an allowlist before using it in shell, deploy, release, or repository write steps."
      ],
      snippets: [
        snippet(
          "Review artifact before shell execution",
          "shell",
          `
printf '%s\\n' "$AGENT_OUTPUT" > agent-output.txt
# Review agent-output.txt, then run only allowlisted commands.
`
        )
      ]
    },
    AWI003: {
      nextSteps: [
        "Review the automatic permission downgrade patch.",
        "Move any truly required write operation into a separate approved job."
      ],
      snippets: [
        snippet(
          "Read-only GitHub token baseline",
          "yaml",
          `
permissions:
  contents: read
`
        )
      ]
    },
    AWI004: {
      nextSteps: [
        "Move untrusted pull request analysis to pull_request with read-only permissions.",
        "Keep pull_request_target only for narrowly scoped trusted follow-up work after review."
      ],
      snippets: [
        snippet(
          "Read-only pull request workflow",
          "yaml",
          `
on: pull_request
permissions:
  contents: read
`
        )
      ]
    },
    AWI005: {
      nextSteps: [
        "Insert validation and approval nodes before HTTP, Code, Execute Command, or credential-bearing nodes.",
        "Convert free-form model output into a structured allowlisted schema."
      ],
      snippets: [
        snippet(
          "Low-code approval contract",
          "json",
          `
{
  "approval": { "required": true, "before": "side_effect_node" },
  "allowlist": { "actions": ["read", "comment", "draft"] }
}
`
        )
      ]
    },
    AWI006: {
      nextSteps: [
        "Narrow broad MCP tool roots, hosts, repositories, and command scopes.",
        "Place write-capable tools behind approval or remove them from default agent contexts."
      ],
      snippets: [
        snippet(
          "Scoped MCP filesystem tool",
          "json",
          `
{
  "tools": {
    "filesystem": { "roots": ["./"], "readOnly": true }
  }
}
`
        )
      ]
    },
    AWI007: {
      nextSteps: [
        "Remove secrets and long-lived tokens from prompt-visible environment or context.",
        "Use short-lived scoped credentials only in post-approval write steps."
      ],
      snippets: [
        snippet(
          "Secret isolation reminder",
          "text",
          "Keep secrets outside prompt construction; pass scoped credentials only to reviewed, non-agent write steps."
        )
      ]
    },
    AWI008: {
      nextSteps: [
        "Review the automatic dry-run marker patch.",
        "Replace dry-run-only operation with approval gates and allowlists before enabling side effects."
      ],
      snippets: [approval]
    },
    AWI009: {
      nextSteps: [
        "Validate model output before API calls, notifications, database writes, deployment operators, or code execution.",
        "Require approval for credential-bearing low-code, Zapier, Node-RED, Pipedream, Make, or Airflow actions."
      ],
      snippets: [
        snippet(
          "Automation side-effect policy",
          "json",
          `
{
  "modelOutput": { "schema": "structured", "freeFormTextAllowed": false },
  "sideEffects": { "requiresApproval": true, "allowedActions": ["draft", "preview"] }
}
`
        )
      ]
    },
    AWI010: {
      nextSteps: [
        "Restrict browser automation to allowlisted domains and action names.",
        "Require approval before submit, pay, upload, publish, delete, invite, merge, or deploy actions."
      ],
      snippets: [
        snippet(
          "Browser automation allowlist",
          "json",
          `
{
  "browser": {
    "allowedDomains": ["example.com"],
    "allowedActions": ["navigate", "read", "extract"],
    "approvalRequiredFor": ["click", "fill", "submit", "upload", "delete"]
  }
}
`
        )
      ]
    }
  };

  return guidance[ruleId] ?? {
    nextSteps: ["Review the finding manually and add an explicit control before write-capable agent activity."],
    snippets: [approval]
  };
}

function recipeForFinding(finding) {
  const file = stripLineSuffix(finding.file);
  const platform = platformForFile(file);
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
      id: "ci-dry-run-env",
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
    remediation: finding.remediation,
    ...guidanceForFinding(finding.ruleId, platform)
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
    const result = applyDryRunGuard(text, file);
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
      lines.push("Applied low-risk automatic fixes in:");
      for (const file of changedFiles) {
        lines.push(`- \`${file}\``);
      }
      lines.push("");
    }
  }

  for (const finding of findings) {
    const recipe = recipeForFinding(finding);
    lines.push(`## ${finding.ruleId}: ${finding.title}`);
    lines.push(`- File: \`${finding.file}\``);
    lines.push(`- Evidence: \`${finding.evidence}\``);
    lines.push(`- Suggested fix: ${finding.remediation}`);
    lines.push(`- Recipe: \`${recipe.id}\` (${recipe.mode}, ${recipe.confidence} confidence)`);
    if (recipe.nextSteps.length) {
      lines.push("- Next steps:");
      for (const step of recipe.nextSteps) {
        lines.push(`  - ${step}`);
      }
    }
    for (const item of recipe.snippets) {
      lines.push(`- Snippet: ${item.label}`);
      lines.push(`\`\`\`${item.format}`);
      lines.push(item.body);
      lines.push("```");
    }
    lines.push("");
  }
  if (options.apply) {
    lines.push("Applied only low-risk automatic fixes. Review remaining findings before merging.");
  } else {
    lines.push("Dry-run only: review this plan before editing workflows. Use --apply for low-risk automatic fixes.");
  }
  return `${lines.join("\n")}\n`;
}
