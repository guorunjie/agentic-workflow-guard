import { summarize } from "./json.js";

export function renderMarkdown(findings) {
  const summary = summarize(findings);
  if (!findings.length) {
    return `# Agentic Workflow Guard Report\n\nNo high-risk findings.\n\nSummary: ${summary.total} total, ${summary.medium} medium, ${summary.low} low.\n`;
  }

  const lines = ["# Agentic Workflow Guard Report", ""];
  if (summary.high === 0) {
    lines.push("No high-risk findings.");
    lines.push("");
  }
  lines.push(`Summary: ${summary.total} total, ${summary.high} high, ${summary.medium} medium, ${summary.low} low.`);
  lines.push("");
  for (const finding of findings) {
    lines.push(`## ${finding.ruleId}: ${finding.title}`);
    lines.push(`- Severity: ${finding.severity}`);
    lines.push(`- File: \`${finding.file}\``);
    lines.push(`- Evidence: \`${finding.evidence}\``);
    lines.push(`- Remediation: ${finding.remediation}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
