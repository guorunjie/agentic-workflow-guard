import { rules } from "./rules/index.js";

export function renderRules(format = "markdown") {
  if (format === "json") return `${JSON.stringify({ rules }, null, 2)}\n`;
  const lines = ["# Agentic Workflow Guard Rule Marketplace", ""];
  for (const [id, rule] of Object.entries(rules)) {
    lines.push(`## ${id}: ${rule.title}`);
    lines.push(`- Severity: ${rule.severity}`);
    lines.push(`- Risk: ${rule.risk}`);
    lines.push(`- Remediation: ${rule.remediation}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
