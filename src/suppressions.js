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

function suppressionsFromText(text, file) {
  const suppressions = [];
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = line.match(/\bawg-ignore\s+([A-Z0-9,\s]+)\s*:\s*(\S.*)$/i);
    if (!match) continue;
    for (const ruleId of parseRuleIds(match[1])) {
      if (/^AWI\d{3}$/.test(ruleId)) {
        suppressions.push({ ruleId, file: `${file}:${index + 1}`, reason: match[2].trim() });
      }
    }
  }
  return suppressions;
}

export async function inspectInlineSuppressions(root, findings) {
  const files = [...new Set(findings.map((finding) => stripLocation(finding.file)))];
  const suppressions = new Map();

  for (const file of files) {
    try {
      suppressions.set(file, suppressionsFromText(await readText(root, file), file));
    } catch {
      suppressions.set(file, []);
    }
  }

  const visibleFindings = [];
  const suppressedFindings = [];

  for (const finding of findings) {
    const file = stripLocation(finding.file);
    const suppression = suppressions.get(file)?.find((entry) => entry.ruleId === finding.ruleId);
    if (suppression) {
      suppressedFindings.push({ ...finding, suppressionFile: suppression.file, reason: suppression.reason });
    } else {
      visibleFindings.push(finding);
    }
  }

  return { findings: visibleFindings, suppressions: suppressedFindings };
}

export async function applyInlineSuppressions(root, findings) {
  return (await inspectInlineSuppressions(root, findings)).findings;
}
