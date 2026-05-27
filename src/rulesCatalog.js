import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { rules } from "./rules/index.js";

export const coreRulePack = {
  name: "agentic-workflow-guard-core-rules",
  version: "0.2.0",
  description: "Core static-analysis rules for AI automation workflow security.",
  platforms: ["github-actions", "n8n", "mcp", "activepieces", "zapier", "make", "pipedream", "node-red", "airflow"],
  rules: Object.keys(rules)
};

function entriesFor(query) {
  if (!query) return Object.entries(rules);
  const needle = query.toLowerCase();
  return Object.entries(rules).filter(([id, rule]) => `${id} ${rule.title} ${rule.risk} ${rule.remediation}`.toLowerCase().includes(needle));
}

function renderRuleEntries(entries, title) {
  const lines = ["# Agentic Workflow Guard Rule Marketplace", ""];
  if (title) {
    lines.push(title);
    lines.push("");
  }
  for (const [id, rule] of entries) {
    lines.push(`## ${id}: ${rule.title}`);
    lines.push(`- Severity: ${rule.severity}`);
    lines.push(`- Risk: ${rule.risk}`);
    lines.push(`- Remediation: ${rule.remediation}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export function renderRules(format = "markdown") {
  if (format === "json") return `${JSON.stringify({ rules, packs: [coreRulePack] }, null, 2)}\n`;
  return renderRuleEntries(Object.entries(rules));
}

export function renderRuleSearch(query, format = "markdown") {
  const matches = entriesFor(query);
  if (format === "json") return `${JSON.stringify({ query, rules: Object.fromEntries(matches) }, null, 2)}\n`;
  return renderRuleEntries(matches, `Search: ${query || "all"}`);
}

export function renderRulePacks(format = "markdown") {
  if (format === "json") return `${JSON.stringify({ packs: [coreRulePack] }, null, 2)}\n`;
  return `# Agentic Workflow Guard Rule Packs

## core
- Name: ${coreRulePack.name}
- Version: ${coreRulePack.version}
- Platforms: ${coreRulePack.platforms.join(", ")}
- Rules: ${coreRulePack.rules.join(", ")}
`;
}

export async function installRulePack(root, name = "core") {
  if (!["core", coreRulePack.name].includes(name)) {
    throw new Error(`Unknown rule pack: ${name}`);
  }
  const outputDir = path.join(root, ".awg", "rules");
  const outputPath = path.join(outputDir, `${coreRulePack.name}.json`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(coreRulePack, null, 2)}\n`);
  return outputPath;
}
