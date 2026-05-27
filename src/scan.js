import { filterFindings, loadConfig, reachesSeverityThreshold } from "./config.js";
import { scanBrowserTraces } from "./scanners/browserTrace.js";
import { scanCiWorkflows } from "./scanners/ciWorkflows.js";
import { scanGitHubActions } from "./scanners/githubActions.js";
import { scanLowCodeWorkflows } from "./scanners/lowCode.js";
import { scanMcpConfigs } from "./scanners/mcp.js";
import { scanN8nWorkflows } from "./scanners/n8n.js";
import { inspectInlineSuppressions } from "./suppressions.js";

function dedupe(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.ruleId}:${finding.file}:${finding.evidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scanProject(root, providedConfig) {
  return (await scanProjectWithMetadata(root, providedConfig)).findings;
}

export async function scanProjectWithMetadata(root, providedConfig) {
  const config = providedConfig ?? (await loadConfig(root));
  const groups = await Promise.all([
    scanGitHubActions(root),
    scanCiWorkflows(root),
    scanN8nWorkflows(root),
    scanMcpConfigs(root),
    scanBrowserTraces(root),
    scanLowCodeWorkflows(root)
  ]);
  const filtered = filterFindings(dedupe(groups.flat()), config);
  const result = await inspectInlineSuppressions(root, filtered);
  return {
    findings: result.findings.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.file.localeCompare(b.file)),
    suppressions: result.suppressions.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || a.file.localeCompare(b.file))
  };
}

export function hasHighFindings(findings, config = { severityThreshold: "high" }) {
  return findings.some((finding) => reachesSeverityThreshold(finding, config.severityThreshold));
}
