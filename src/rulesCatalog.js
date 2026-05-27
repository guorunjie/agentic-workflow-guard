import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { rules } from "./rules/index.js";

const packageVersion = "0.17.0";
const rulePackSchemaVersion = "1.0.0";
const corePlatforms = ["github-actions", "gitlab-ci", "circleci", "azure-pipelines", "jenkins", "n8n", "mcp", "activepieces", "zapier", "make", "pipedream", "node-red", "airflow", "browser-use", "playwright", "skyvern"];
const coreRuleIds = Object.keys(rules);
const repository = "https://github.com/guorunjie/agentic-workflow-guard";
const rulePackCompatibility = {
  cli: `>=${packageVersion} <1.0.0`,
  schema: "agentic-workflow-guard-rule-pack@1"
};

export const coreRulePack = {
  schemaVersion: rulePackSchemaVersion,
  name: "agentic-workflow-guard-core-rules",
  version: packageVersion,
  description: "Core static-analysis rules for AI automation workflow security.",
  publisher: "guorunjie",
  license: "MIT",
  homepage: repository,
  compatibility: {
    ...rulePackCompatibility,
    ruleIds: "AWI001-AWI010"
  },
  platforms: corePlatforms,
  rules: coreRuleIds,
  ruleCount: coreRuleIds.length,
  provenance: {
    source: "bundled",
    repository,
    releaseTag: `v${packageVersion}`
  }
};

export const communityRulePacks = [
  {
    schemaVersion: rulePackSchemaVersion,
    name: "agentic-workflow-guard-github-actions-hardening",
    version: packageVersion,
    description: "Focused GitHub Actions rule pack for prompt-injection, shell-sink, token, pull_request_target, and missing-control risks.",
    publisher: "guorunjie",
    license: "MIT",
    homepage: repository,
    compatibility: {
      ...rulePackCompatibility,
      ruleIds: "AWI001-AWI004,AWI007-AWI008"
    },
    platforms: ["github-actions"],
    rules: ["AWI001", "AWI002", "AWI003", "AWI004", "AWI007", "AWI008"],
    ruleCount: 6,
    provenance: {
      source: "community",
      repository,
      releaseTag: `v${packageVersion}`
    }
  },
  {
    schemaVersion: rulePackSchemaVersion,
    name: "agentic-workflow-guard-low-code-automation",
    version: packageVersion,
    description: "Focused low-code and browser automation rule pack for n8n, Activepieces, Zapier, Make, Pipedream, Node-RED, Airflow, and browser-agent side effects.",
    publisher: "guorunjie",
    license: "MIT",
    homepage: repository,
    compatibility: {
      ...rulePackCompatibility,
      ruleIds: "AWI005,AWI009-AWI010"
    },
    platforms: ["n8n", "activepieces", "zapier", "make", "pipedream", "node-red", "airflow", "browser-use", "playwright", "skyvern"],
    rules: ["AWI005", "AWI009", "AWI010"],
    ruleCount: 3,
    provenance: {
      source: "community",
      repository,
      releaseTag: `v${packageVersion}`
    }
  }
];

export const availableRulePacks = [coreRulePack, ...communityRulePacks];

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
  for (const field of ["schemaVersion", "name", "version", "description", "publisher", "license", "compatibility", "platforms", "rules", "ruleCount", "provenance", "checksum"]) {
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
  if (format === "json") return `${JSON.stringify({ rules, packs: availableRulePacks.map(withChecksum) }, null, 2)}\n`;
  return renderRuleEntries(Object.entries(rules));
}

export function renderRuleSearch(query, format = "markdown") {
  const matches = entriesFor(query);
  if (format === "json") return `${JSON.stringify({ query, rules: Object.fromEntries(matches) }, null, 2)}\n`;
  return renderRuleEntries(matches, `Search: ${query || "all"}`);
}

export function renderRulePacks(format = "markdown") {
  const packs = availableRulePacks.map(withChecksum);
  if (format === "json") return `${JSON.stringify({ packs }, null, 2)}\n`;
  const lines = ["# Agentic Workflow Guard Rule Packs", ""];
  for (const pack of packs) {
    lines.push(`## ${aliasForPack(pack)}`);
    lines.push(`- Name: ${pack.name}`);
    lines.push(`- Version: ${pack.version}`);
    lines.push(`- Source: ${pack.provenance.source}`);
    lines.push(`- Checksum: ${pack.checksum}`);
    lines.push(`- Platforms: ${pack.platforms.join(", ")}`);
    lines.push(`- Rules: ${pack.rules.join(", ")}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function aliasForPack(pack) {
  if (pack.name === coreRulePack.name) return "core";
  return pack.name.replace(/^agentic-workflow-guard-/, "");
}

function resolveRulePack(name = "core") {
  const match = availableRulePacks.find((pack) => pack.name === name || aliasForPack(pack) === name);
  if (!match) {
    throw new Error(`Unknown rule pack: ${name}`);
  }
  return match;
}

export function ruleRegistry() {
  const packs = availableRulePacks.map((pack) => {
    const checksummed = withChecksum(pack);
    return {
      name: checksummed.name,
      alias: aliasForPack(checksummed),
      version: checksummed.version,
      description: checksummed.description,
      source: checksummed.provenance.source,
      platforms: checksummed.platforms,
      rules: checksummed.rules,
      checksum: checksummed.checksum,
      install: `agentic-workflow-guard rules install ${aliasForPack(checksummed)} .`,
      path: aliasForPack(checksummed) === "core" ? "rules/marketplace.json" : `rules/community/${checksummed.name}.json`
    };
  });
  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-rule-registry",
    version: packageVersion,
    generatedBy: `agentic-workflow-guard@${packageVersion}`,
    packs
  };
}

export function renderRuleRegistry(format = "markdown") {
  const registry = ruleRegistry();
  if (format === "json") return `${JSON.stringify(registry, null, 2)}\n`;
  const lines = ["# Agentic Workflow Guard Rule Registry", ""];
  for (const pack of registry.packs) {
    lines.push(`## ${pack.alias}`);
    lines.push(pack.description);
    lines.push(`- Source: ${pack.source}`);
    lines.push(`- Install: \`${pack.install}\``);
    lines.push(`- Path: \`${pack.path}\``);
    lines.push(`- Checksum: ${pack.checksum}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export async function installRulePack(root, name = "core") {
  const outputDir = path.join(root, ".awg", "rules");
  const pack = withChecksum(resolveRulePack(name));
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
