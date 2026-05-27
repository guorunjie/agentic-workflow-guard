import { readText } from "./utils/files.js";

function stripLocation(file) {
  return file.replace(/:\d+$/, "");
}

function parseRuleIds(value) {
  return value
    .split(/[,\s]+/)
    .map((ruleId) => ruleId.trim().toUpperCase())
    .filter(Boolean);
}

function suppressionsFromText(text) {
  const rules = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/\bawg-ignore\s+([A-Z0-9,\s]+)\s*:\s*(\S.*)$/i);
    if (!match) continue;
    for (const ruleId of parseRuleIds(match[1])) {
      if (/^AWI\d{3}$/.test(ruleId)) rules.add(ruleId);
    }
  }
  return rules;
}

export async function applyInlineSuppressions(root, findings) {
  const files = [...new Set(findings.map((finding) => stripLocation(finding.file)))];
  const suppressions = new Map();

  for (const file of files) {
    try {
      suppressions.set(file, suppressionsFromText(await readText(root, file)));
    } catch {
      suppressions.set(file, new Set());
    }
  }

  return findings.filter((finding) => !suppressions.get(stripLocation(finding.file))?.has(finding.ruleId));
}
