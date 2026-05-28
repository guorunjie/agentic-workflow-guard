import path from "node:path";

import { parseSimpleYaml, validateConfigSurface } from "./config.js";
import { exists, readJson, readText } from "./utils/files.js";

const configSchemaUrl = "https://guorunjie.github.io/agentic-workflow-guard/schemas/config.schema.json";
const workflowPath = ".github/workflows/agentic-workflow-guard.yml";

function check(id, title, status, evidence, remediation) {
  return {
    id,
    title,
    status,
    evidence: Array.isArray(evidence) ? evidence : [evidence],
    ...(remediation ? { remediation } : {})
  };
}

function statusCount(checks, status) {
  return checks.filter((item) => item.status === status).length;
}

async function loadConfigCandidate(root) {
  const candidates = [
    { file: ".awg.json", type: "json" },
    { file: ".awg.yml", type: "yaml" },
    { file: ".awg.yaml", type: "yaml" }
  ];
  for (const candidate of candidates) {
    const absolute = path.join(root, candidate.file);
    if (!(await exists(absolute))) continue;
    const text = await readText(root, candidate.file);
    if (candidate.type === "json") {
      return { ...candidate, text, config: JSON.parse(text) };
    }
    return { ...candidate, text, config: parseSimpleYaml(text) };
  }
  return null;
}

async function configChecks(root) {
  let candidate;
  try {
    candidate = await loadConfigCandidate(root);
  } catch (error) {
    return [
      check("config", "Repository config", "fail", `Could not parse .awg config: ${error.message}`, "Fix the config syntax or rerun `agentic-workflow-guard init . --force`.")
    ];
  }
  if (!candidate) {
    return [
      check("config", "Repository config", "warn", "No .awg.yml, .awg.yaml, or .awg.json file found.", "Run `agentic-workflow-guard init .` to scaffold policy config.")
    ];
  }

  const issues = validateConfigSurface(candidate.config);
  const hasSchema =
    candidate.type === "json" ? candidate.config?.$schema === configSchemaUrl : candidate.text.includes(configSchemaUrl);
  const checks = [];
  checks.push(check("config", "Repository config", issues.length ? "fail" : "pass", [`Found ${candidate.file}.`, ...(issues.length ? issues : ["Profile, severity threshold, ignore globs, and rule toggles are valid."])], issues.length ? "Run `agentic-workflow-guard schema config` and update the config values." : undefined));
  checks.push(
    check(
      "config-schema",
      "Config schema annotation",
      hasSchema ? "pass" : "warn",
      hasSchema ? `${candidate.file} references ${configSchemaUrl}.` : `${candidate.file} does not reference the public config schema.`,
      hasSchema ? undefined : `Add ${configSchemaUrl} as a YAML language server comment or JSON $schema.`
    )
  );
  return checks;
}

async function workflowCheck(root) {
  if (!(await exists(path.join(root, workflowPath)))) {
    return check("github-action", "GitHub Action workflow", "warn", `${workflowPath} is missing.`, "Run `agentic-workflow-guard init .` to scaffold Code Scanning workflow adoption.");
  }
  const text = await readText(root, workflowPath);
  const required = [
    ["release-tag", /guorunjie\/agentic-workflow-guard@v1\.0\.0/, "uses guorunjie/agentic-workflow-guard@v1.0.0"],
    ["sarif-output", /format:\s*sarif|output:\s*awg\.sarif/, "emits SARIF output"],
    ["upload-sarif", /github\/codeql-action\/upload-sarif@v3/, "uploads SARIF to Code Scanning"],
    ["fix-output", /fix-output:\s*awg-fix\.json/, "writes JSON fix artifact"]
  ];
  const missing = required.filter(([, pattern]) => !pattern.test(text)).map(([, , label]) => label);
  if (missing.length) {
    return check("github-action", "GitHub Action workflow", "fail", [`Found ${workflowPath}.`, `Missing: ${missing.join(", ")}`], "Regenerate the workflow with `agentic-workflow-guard init . --force` or update the Action snippet manually.");
  }
  return check("github-action", "GitHub Action workflow", "pass", [`Found ${workflowPath}.`, "Release-tagged Action, SARIF upload, and fix artifact settings are present."]);
}

async function rulePackCheck(root) {
  const lockPath = ".awg/rules/agentic-workflow-guard-rules.lock.json";
  if (!(await exists(path.join(root, lockPath)))) {
    return check("rule-packs", "Installed rule packs", "pass", "No local rule-pack lock file found; bundled core rules will be used.");
  }
  try {
    const lock = await readJson(root, lockPath);
    const installed = Array.isArray(lock.packs) ? lock.packs : [];
    return check("rule-packs", "Installed rule packs", "pass", `Rule-pack lock file is valid with ${installed.length} installed pack(s).`);
  } catch (error) {
    return check("rule-packs", "Installed rule packs", "fail", `Could not parse ${lockPath}: ${error.message}`, "Reinstall rule packs with `agentic-workflow-guard rules install core .`.");
  }
}

async function baselineCheck(root) {
  const baselinePath = ".awg-baseline.json";
  if (!(await exists(path.join(root, baselinePath)))) {
    return check("baseline", "Baseline file", "pass", "No baseline file configured; scans will evaluate all findings.");
  }
  try {
    const baseline = await readJson(root, baselinePath);
    const count = Array.isArray(baseline.findings) ? baseline.findings.length : 0;
    return check("baseline", "Baseline file", "pass", `Baseline contains ${count} finding fingerprint(s).`);
  } catch (error) {
    return check("baseline", "Baseline file", "fail", `Could not parse ${baselinePath}: ${error.message}`, "Regenerate the baseline with `agentic-workflow-guard baseline create .`.");
  }
}

export async function buildDoctorReport(root = ".") {
  const absoluteRoot = path.resolve(root);
  const checks = [
    ...(await configChecks(absoluteRoot)),
    await workflowCheck(absoluteRoot),
    await rulePackCheck(absoluteRoot),
    await baselineCheck(absoluteRoot)
  ];
  const summary = {
    total: checks.length,
    pass: statusCount(checks, "pass"),
    warn: statusCount(checks, "warn"),
    fail: statusCount(checks, "fail"),
    ready: statusCount(checks, "fail") === 0
  };
  return {
    schemaVersion: "1.0.0",
    name: "agentic-workflow-guard-doctor",
    root: absoluteRoot,
    summary,
    checks
  };
}

export function renderDoctorReport(report, format = "markdown") {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  const lines = [
    report.summary.fail ? "# Agentic Workflow Guard Doctor found issues" : "# Agentic Workflow Guard Doctor",
    "",
    `- Root: ${report.root}`,
    `- Checks: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`,
    ""
  ];
  for (const item of report.checks) {
    lines.push(`## ${item.status.toUpperCase()}: ${item.title}`);
    for (const evidence of item.evidence) lines.push(`- ${evidence}`);
    if (item.remediation) lines.push(`- Remediation: ${item.remediation}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
