import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function fingerprintFinding(finding) {
  return Buffer.from(`${finding.ruleId}\0${finding.file}\0${finding.evidence}`).toString("base64url");
}

export function withFingerprints(findings) {
  return findings.map((finding) => ({
    fingerprint: fingerprintFinding(finding),
    ruleId: finding.ruleId,
    severity: finding.severity,
    file: finding.file,
    evidence: finding.evidence
  }));
}

export async function writeBaseline(root, findings, file = ".awg-baseline.json") {
  const outputPath = path.isAbsolute(file) ? file : path.join(root, file);
  const payload = {
    version: 1,
    generatedBy: "agentic-workflow-guard",
    findings: withFingerprints(findings)
  };
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  return outputPath;
}

export async function readBaseline(file) {
  const payload = JSON.parse(await readFile(file, "utf8"));
  return new Set((payload.findings ?? []).map((finding) => finding.fingerprint));
}

export async function suppressBaseline(findings, file) {
  if (!file) return findings;
  const fingerprints = await readBaseline(file);
  return findings.filter((finding) => !fingerprints.has(fingerprintFinding(finding)));
}
