export function summarize(findings) {
  return findings.reduce(
    (summary, finding) => {
      summary[finding.severity] = (summary[finding.severity] ?? 0) + 1;
      summary.total += 1;
      return summary;
    },
    { total: 0, high: 0, medium: 0, low: 0 }
  );
}

export function renderJson(findings, metadata = {}) {
  const suppressions = metadata.suppressions ?? [];
  return `${JSON.stringify({ schemaVersion: "1.0.0", summary: { ...summarize(findings), suppressed: suppressions.length }, findings, suppressions }, null, 2)}\n`;
}
