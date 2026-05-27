import { rules } from "../rules/index.js";

const levelBySeverity = {
  high: "error",
  medium: "warning",
  low: "note"
};

function location(finding) {
  const [uri, line] = finding.file.split(":");
  return {
    physicalLocation: {
      artifactLocation: { uri },
      region: { startLine: Number(line) || 1 }
    }
  };
}

export function renderSarif(findings) {
  const usedRules = [...new Set(findings.map((finding) => finding.ruleId))];
  return `${JSON.stringify(
    {
      version: "2.1.0",
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      runs: [
        {
          tool: {
            driver: {
              name: "Agentic Workflow Guard",
              informationUri: "https://github.com/guorunjie/agentic-workflow-guard",
              rules: usedRules.map((id) => ({
                id,
                name: rules[id].title,
                shortDescription: { text: rules[id].title },
                fullDescription: { text: rules[id].risk },
                help: { text: rules[id].remediation }
              }))
            }
          },
          results: findings.map((finding) => ({
            ruleId: finding.ruleId,
            level: levelBySeverity[finding.severity] ?? "warning",
            message: { text: `${finding.title}: ${finding.evidence}` },
            locations: [location(finding)]
          }))
        }
      ]
    },
    null,
    2
  )}\n`;
}
