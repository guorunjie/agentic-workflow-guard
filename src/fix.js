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

async function applyFixes(root, findings) {
  const files = [...new Set(findings.filter((finding) => finding.ruleId === "AWI003").map((finding) => stripLineSuffix(finding.file)))];
  const changedFiles = [];

  for (const file of files) {
    const absolute = path.join(root, file);
    const original = await readFile(absolute, "utf8");
    const result = applyPermissionFix(original);
    if (!result.changed) continue;
    await writeFile(absolute, result.text);
    changedFiles.push(file);
  }

  return changedFiles;
}

export async function renderFixPlan(root, options = {}) {
  const findings = await scanProject(root);
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
