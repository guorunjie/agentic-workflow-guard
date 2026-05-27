import { rules } from "./rules/index.js";

export function explainRule(ruleId) {
  const rule = rules[ruleId];
  if (!rule) return `Unknown rule: ${ruleId}\n`;
  return `# ${ruleId}: ${rule.title}

Severity: ${rule.severity}

Risk:
${rule.risk}

Remediation:
${rule.remediation}
`;
}
