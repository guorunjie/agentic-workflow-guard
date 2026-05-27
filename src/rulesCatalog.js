import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { rules } from "./rules/index.js";

const packageVersion = "0.12.0";
const rulePackSchemaVersion = "1.0.0";
const corePlatforms = ["github-actions", "n8n", "mcp", "activepieces", "zapier", "make", "pipedream", "node-red", "airflow", "browser-use", "playwright", "skyvern"];
const coreRuleIds = Object.keys(rules);

export const coreRulePack = {
  schemaVersion: rulePackSchemaVersion,
  name: "agentic-workflow-guard-core-rules",
  version: packageVersion,
  description: "Core static-analysis rules for AI automation workflow security.",
  publisher: "guorunjie",
  license: "MIT",
  homepage: "https://github.com/guorunjie/agentic-workflow-guard",
  compatibility: {
    cli: `>=${packageVersion} <1.0.0`,
    schema: "agentic-workflow-guard-rule-pack@1",
    ruleIds: "AWI001-AWI010"
  },
  platforms: corePlatforms,
  rules: coreRuleIds,
  ruleCount: coreRuleIds.length,
  provenance: {
    source: "bundled",
    repository: "https://github.com/guorunjie/agentic-workflow-guard",
    releaseTag: `v${packageVersion}`
  }
};

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
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

function requireField(pack, field) {
  if (pack[field] === undefined) {
    throw new Error(`Rule pack schema validation failed: missing ${field}`);
  }
}

export function validateRulePack(pack) {
  for (const field of ["schemaVersion", "name", "version", "description", "publisher", "license", "compatibility", "platforms", "rules", "ruleCount", "provenance"]) {
    requireField(pack, field);
  }
  if (pack.schemaVersion !== rulePackSchemaVersion) {
    throw new Error(`Rule pack schema validation failed: expected schemaVersion ${rulePackSchemaVersion}, got ${pack.schemaVersion}`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(pack.version)) {
    throw new Error(`Rule pack schema validation failed: invalid version ${pack.version}`);
  }
  if (!pack.compatibility?.cli || !pack.compatibility?.schema || !pack.compatibility?.ruleIds) {
    throw new Error("Rule pack schema validation failed: missing compatibility.cli, compatibility.schema, or compatibility.ruleIds");
  }
  if (!pack.provenance?.source || !pack.provenance?.repository || !pack.provenance?.releaseTag) {
    throw new Error("Rule pack schema validation failed: missing provenance.source, provenance.repository, or provenance.releaseTag");
  }
  if (!Array.isArray(pack.platforms) || pack.platforms.length === 0) {
    throw new Error("Rule pack schema validation failed: platforms must be a non-empty array");
  }
  if (!Array.isArray(pack.rules) || pack.rules.length === 0) {
    throw new Error("Rule pack schema validation failed: rules must be a non-empty array");
  }
  if (pack.ruleCount !== pack.rules.length) {
    throw new Error(`Rule pack schema validation failed: ruleCount ${pack.ruleCount} does not match rules length ${pack.rules.length}`);
  }
  for (const ruleId of pack.rules) {
    if (!/^AWI[0-9]{3}$/.test(ruleId)) {
      throw new Error(`Rule pack schema validation failed: invalid rule id ${ruleId}`);
    }
  }
  return pack;
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
  const lockPath = path.join(outputDir, "agentic-workflow-guard-rules.lock.json");
  const lock = {
    schemaVersion: rulePackSchemaVersion,
    generatedBy: `agentic-workflow-guard@${packageVersion}`,
    packs: [
      {
        name: pack.name,
        version: pack.version,
        checksum: pack.checksum,
        path: path.relative(root, outputPath),
        source: pack.provenance.source
      }
    ]
  };
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(pack, null, 2)}\n`);
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  return outputPath;
}

export async function verifyRulePack(file) {
  const pack = JSON.parse(await readFile(file, "utf8"));
  validateRulePack(pack);
  const expected = checksumFor(pack);
  if (pack.checksum !== expected) {
    throw new Error(`Rule pack checksum mismatch: expected ${expected}, got ${pack.checksum ?? "missing"}`);
  }
  return { name: pack.name, version: pack.version, schemaVersion: pack.schemaVersion, checksum: expected };
}
