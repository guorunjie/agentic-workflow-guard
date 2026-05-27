import { summarize } from "./json.js";

function renderSuppressionSection(suppressions) {
  if (!suppressions.length) return [];
  const lines = ["## Suppressed findings", ""];
  for (const suppression of suppressions) {
    lines.push(`- ${suppression.ruleId} in \`${suppression.file}\` suppressed at \`${suppression.suppressionFile}\`: ${suppression.reason}`);
  }
  lines.push("");
  return lines;
}

export function renderMarkdown(findings, metadata = {}) {
  const summary = summarize(findings);
  const suppressions = metadata.suppressions ?? [];
  if (!findings.length) {
    const lines = [
      "# Agentic Workflow Guard Report",
      "",
      "No high-risk findings.",
      "",
      `Summary: ${summary.total} total, ${summary.medium} medium, ${summary.low} low, ${suppressions.length} suppressed.`,
      "",
      ...renderSuppressionSection(suppressions)
    ];
    return `${lines.join("\n").trimEnd()}\n`;
  }

  const lines = ["# Agentic Workflow Guard Report", ""];
  if (summary.high === 0) {
    lines.push("No high-risk findings.");
    lines.push("");
  }
  lines.push(`Summary: ${summary.total} total, ${summary.high} high, ${summary.medium} medium, ${summary.low} low, ${suppressions.length} suppressed.`);
  lines.push("");
  for (const finding of findings) {
    lines.push(`## ${finding.ruleId}: ${finding.title}`);
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- File: \`${finding.file}\``);
    lines.push(`- Evidence: \`${finding.evidence}\``);
    lines.push(`- Remediation: ${finding.remediation}`);
    lines.push("");
  }
  lines.push(...renderSuppressionSection(suppressions));
  return `${lines.join("\n")}\n`;
}
