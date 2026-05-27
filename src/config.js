import path from "node:path";

import { exists, readJson, readText } from "./utils/files.js";

export const policyProfiles = {
  advisory: { severityThreshold: "critical" },
  balanced: { severityThreshold: "high" },
  strict: { severityThreshold: "medium" }
};

const defaultConfig = {
  ignore: [],
  profile: "balanced",
  rules: {},
  severityThreshold: policyProfiles.balanced.severityThreshold
};

function parseScalar(value) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

function parseSimpleYaml(text) {
  const config = {};
  let currentKey = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, "");
    if (!line.trim()) continue;

    const section = line.match(/^([A-Za-z0-9_-]+):\s*$/);
    if (section) {
      currentKey = section[1];
      config[currentKey] = currentKey === "rules" ? {} : [];
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (pair && !line.startsWith(" ")) {
      currentKey = null;
      config[pair[1]] = parseScalar(pair[2]);
      continue;
    }

    const listItem = line.match(/^\s*-\s*(.+)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(config[currentKey])) config[currentKey] = [];
      config[currentKey].push(parseScalar(listItem[1]));
      continue;
    }

    const nestedPair = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.+)$/);
    if (nestedPair && currentKey) {
      if (!config[currentKey] || Array.isArray(config[currentKey])) config[currentKey] = {};
      config[currentKey][nestedPair[1]] = parseScalar(nestedPair[2]);
    }
  }

  return config;
}

function normalizeConfig(config = {}) {
  const profile = policyProfiles[config.profile] ? config.profile : defaultConfig.profile;
  return {
    ignore: Array.isArray(config.ignore) ? config.ignore : [],
    profile,
    rules: config.rules && typeof config.rules === "object" && !Array.isArray(config.rules) ? config.rules : {},
    severityThreshold: config.severityThreshold ?? policyProfiles[profile].severityThreshold
  };
}

export function withPolicyProfile(config, profile) {
  if (!profile) return config;
  if (!policyProfiles[profile]) {
    throw new Error(`Unknown policy profile: ${profile}`);
  }
  return {
    ...config,
    profile,
    severityThreshold: policyProfiles[profile].severityThreshold
  };
}

export async function loadConfig(root) {
  const jsonPath = path.join(root, ".awg.json");
  if (await exists(jsonPath)) {
    return normalizeConfig(await readJson(root, ".awg.json"));
  }

  for (const file of [".awg.yml", ".awg.yaml"]) {
    if (await exists(path.join(root, file))) {
      return normalizeConfig(parseSimpleYaml(await readText(root, file)));
    }
  }

  return { ...defaultConfig };
}

function escapeRegex(value) {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function globToRegex(pattern) {
  const source = pattern
    .split("**")
    .map((part) => part.split("*").map(escapeRegex).join("[^/]*"))
    .join(".*");
  return new RegExp(`^${source}$`);
}

export function isIgnored(file, config) {
  const cleanFile = file.split(":")[0];
  return config.ignore.some((pattern) => globToRegex(pattern).test(cleanFile));
}

export function isRuleEnabled(ruleId, config) {
  return !["off", "disabled", false].includes(config.rules[ruleId]);
}

export function filterFindings(findings, config) {
  return findings.filter((finding) => isRuleEnabled(finding.ruleId, config) && !isIgnored(finding.file, config));
}

export function reachesSeverityThreshold(finding, threshold = "high") {
  const rank = { low: 1, medium: 2, high: 3, critical: 4 };
  return rank[finding.severity] >= rank[threshold];
}
