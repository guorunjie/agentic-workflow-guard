import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { rules } from "./rules/index.js";

export const coreRulePack = {
  name: "agentic-workflow-guard-core-rules",
  version: "0.9.0",
  description: "Core static-analysis rules for AI automation workflow security.",
  platforms: ["github-actions", "n8n", "mcp", "activepieces", "zapier", "make", "pipedream", "node-red", "airflow", "browser-use", "playwright", "skyvern"],
  rules: Object.keys(rules)
};

function canonicalJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function checksumFor(pack) {
  const withoutChecksum = { ...pack };
  delete withoutChecksum.checksum;
  return `sha256:${createHash("sha256").update(canonicalJson(withoutChecksum)).digest("hex")}`;
}

export function withChecksum(pack) {
  const payload = { ...pack };
  payload.checksum = checksumFor(payload);
  return payload;
}

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
  if (format === "json") return `${JSON.stringify({ rules, packs: [withChecksum(coreRulePack)] }, null, 2)}\n`;
  return renderRuleEntries(Object.entries(rules));
}

export function renderRuleSearch(query, format = "markdown") {
  const matches = entriesFor(query);
  if (format === "json") return `${JSON.stringify({ query, rules: Object.fromEntries(matches) }, null, 2)}\n`;
  return renderRuleEntries(matches, `Search: ${query || "all"}`);
}

export function renderRulePacks(format = "markdown") {
  const pack = withChecksum(coreRulePack);
  if (format === "json") return `${JSON.stringify({ packs: [pack] }, null, 2)}\n`;
  return `# Agentic Workflow Guard Rule Packs

## core
- Name: ${pack.name}
- Version: ${pack.version}
- Checksum: ${pack.checksum}
- Platforms: ${pack.platforms.join(", ")}
- Rules: ${pack.rules.join(", ")}
`;
}

export async function installRulePack(root, name = "core") {
  if (!["core", coreRulePack.name].includes(name)) {
    throw new Error(`Unknown rule pack: ${name}`);
  }
  const outputDir = path.join(root, ".awg", "rules");
  const pack = withChecksum(coreRulePack);
  const outputPath = path.join(outputDir, `${pack.name}.json`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(pack, null, 2)}\n`);
  return outputPath;
}

export async function verifyRulePack(file) {
  const pack = JSON.parse(await readFile(file, "utf8"));
  const expected = checksumFor(pack);
  if (pack.checksum !== expected) {
    throw new Error(`Rule pack checksum mismatch: expected ${expected}, got ${pack.checksum ?? "missing"}`);
  }
  return { name: pack.name, checksum: expected };
}
