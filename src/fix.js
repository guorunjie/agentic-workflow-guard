import { scanProject } from "./scan.js";

export async function renderFixPlan(root) {
  const findings = await scanProject(root);
  const lines = ["# Fix plan", ""];
  if (!findings.length) {
    lines.push("No findings to fix.");
    return `${lines.join("\n")}\n`;
  }
  for (const finding of findings) {
    lines.push(`## ${finding.ruleId}: ${finding.title}`);
    lines.push(`- File: \`${finding.file}\``);
    lines.push(`- Evidence: \`${finding.evidence}\``);
    lines.push(`- Suggested fix: ${finding.remediation}`);
    lines.push("");
  }
  lines.push("Dry-run only: review this plan before editing workflows.");
  return `${lines.join("\n")}\n`;
}
