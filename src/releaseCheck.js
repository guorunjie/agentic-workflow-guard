import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { supportedAgents } from "./agentSupport.js";
import { policyProfiles } from "./config.js";
import { rules } from "./rules/index.js";
import { serializeStaticMetadata, staticMetadataTargets } from "./staticMetadata.js";
import { readJson, readText, exists } from "./utils/files.js";

const execFileAsync = promisify(execFile);

const schemaVersion = "1.0.0";
const requiredSchemas = [
  "schemas/agentic-workflow-guard-report.schema.json",
  "schemas/agentic-workflow-guard-fix-report.schema.json",
  "schemas/agentic-workflow-guard-rule-pack.schema.json",
  "schemas/agentic-workflow-guard-benchmark-corpus.schema.json",
  "schemas/agentic-workflow-guard-benchmark-report.schema.json"
];
const requiredPlatforms = [
  "github-actions",
  "bitbucket-pipelines",
  "gitlab-ci",
  "travis-ci",
  "drone-ci",
  "teamcity",
  "harness",
  "tekton",
  "argo-workflows",
  "aws-codebuild",
  "google-cloud-build",
  "circleci",
  "azure-pipelines",
  "jenkins",
  "buildkite",
  "n8n",
  "activepieces",
  "dify",
  "flowise",
  "langflow",
  "zapier",
  "make",
  "pipedream",
  "node-red",
  "airflow",
  "mcp",
  "browser-automation"
];
const requiredAgentIds = ["agents-md", "claude", "codex", "gemini", "openclaw", "hermes", "cursor", "copilot", "mcp-resources"];
const stableRuleIds = ["AWI001", "AWI002", "AWI003", "AWI004", "AWI005", "AWI006", "AWI007", "AWI008", "AWI009", "AWI010"];

function gate(id, title, status, evidence, remediation) {
  return {
    id,
    title,
    status,
    evidence: Array.isArray(evidence) ? evidence : [evidence],
    ...(remediation ? { remediation } : {})
  };
}

function pass(id, title, evidence) {
  return gate(id, title, "pass", evidence);
}

function fail(id, title, evidence, remediation) {
  return gate(id, title, "fail", evidence, remediation);
}

function warn(id, title, evidence, remediation) {
  return gate(id, title, "warn", evidence, remediation);
}

function sameSet(actual, expected) {
  return actual.length === expected.length && expected.every((item) => actual.includes(item));
}

function statusCount(gates, status) {
  return gates.filter((item) => item.status === status).length;
}

async function fileGate(root, file) {
  if (!(await exists(path.join(root, file)))) {
    return fail(`file:${file}`, `Required file ${file}`, "Missing.", `Restore ${file} before cutting a release.`);
  }
  const content = await readText(root, file);
  if (content.trim().length <= 20) {
    return fail(`file:${file}`, `Required file ${file}`, "File is empty or too small.", `Populate ${file} with release-ready content.`);
  }
  return pass(`file:${file}`, `Required file ${file}`, "Present.");
}

async function packageGate(root) {
  const pkg = await readJson(root, "package.json");
  const requiredScripts = ["test", "docs:build", "smoke:package", "release:check", "release:prepare", "release:status", "release:verify", "release:sync", "release:sync:check", "benchmark:report", "benchmark:corpus", "mcp:resources"];
  const missingScripts = requiredScripts.filter((script) => !pkg.scripts?.[script]);
  const requiredFiles = ["bin", "src", "rules", "schemas", "mcp", "examples", "benchmarks", "docs", "docs-site", "scripts", "action.yml", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", ".github/copilot-instructions.md", ".github/pull_request_template.md", ".github/ISSUE_TEMPLATE"];
  const missingFiles = requiredFiles.filter((file) => !pkg.files?.includes(file));
  const requiredBin = "bin/agentic-workflow-guard.js";
  const evidence = [
    `version=${pkg.version}`,
    `bin.agentic-workflow-guard=${pkg.bin?.["agentic-workflow-guard"] ?? "missing"}`,
    `repository=${pkg.repository?.url ?? "missing"}`,
    `homepage=${pkg.homepage ?? "missing"}`,
    `scripts=${requiredScripts.filter((script) => pkg.scripts?.[script]).join(", ")}`,
    `files=${requiredFiles.filter((file) => pkg.files?.includes(file)).join(", ")}`
  ];
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(pkg.version)) {
    return fail("package-metadata", "Package metadata", [`Invalid semver version: ${pkg.version}`], "Use a SemVer package version before release.");
  }
  if (missingScripts.length || missingFiles.length) {
    return fail("package-metadata", "Package metadata", [`Missing scripts: ${missingScripts.join(", ") || "none"}`, `Missing files: ${missingFiles.join(", ") || "none"}`], "Restore package scripts and files needed for release verification.");
  }
  if (pkg.bin?.["agentic-workflow-guard"] !== requiredBin) {
    return fail("package-metadata", "Package metadata", [`Invalid bin.agentic-workflow-guard: ${pkg.bin?.["agentic-workflow-guard"] ?? "missing"}`], `Set bin.agentic-workflow-guard to ${requiredBin} so npm installs the CLI without publish auto-correction.`);
  }
  if (!pkg.repository?.url || !pkg.homepage || !pkg.bugs?.url) {
    return fail("package-metadata", "Package metadata", "Missing repository, homepage, or bugs URL.", "Add npm package metadata so the registry page links back to the public project.");
  }
  return pass("package-metadata", "Package metadata", evidence);
}

async function targetVersionGate(root, targetVersion) {
  const pkg = await readJson(root, "package.json");
  if (pkg.version !== targetVersion) {
    return warn("target-version", "Target release version", `package.json is ${pkg.version}; target is ${targetVersion}.`, "Bump package and generated metadata to the target version before cutting the final release.");
  }
  return pass("target-version", "Target release version", `package.json matches target ${targetVersion}.`);
}

async function versionSyncGate(root) {
  const pkg = await readJson(root, "package.json");
  const versionFiles = (await staticMetadataTargets(root))
    .filter((target) => target.value && typeof target.value === "object" && "version" in target.value)
    .map((target) => [target.path, "version"]);
  const mismatches = [];
  for (const [file, field] of versionFiles) {
    const json = await readJson(root, file);
    if (json[field] !== pkg.version) mismatches.push(`${file}:${json[field] ?? "missing"}`);
  }
  if (mismatches.length) {
    return fail("version-sync", "Distributed metadata versions", mismatches, "Regenerate bundled rule, benchmark, and MCP metadata after bumping the package version.");
  }
  return pass("version-sync", "Distributed metadata versions", [`All checked metadata files use ${pkg.version}.`]);
}

async function staticMetadataGate(root) {
  const drift = [];
  const targets = await staticMetadataTargets(root);
  for (const target of targets) {
    const expected = serializeStaticMetadata(target.value);
    let current = "";
    try {
      current = await readText(root, target.path);
    } catch {
      drift.push(`${target.path}: missing`);
      continue;
    }
    if (current !== expected) drift.push(`${target.path}: out of sync`);
  }
  if (drift.length) {
    return fail("static-metadata", "Generated static metadata", drift, "Run `npm run release:sync` and commit the regenerated rule, benchmark, and MCP metadata.");
  }
  return pass("static-metadata", "Generated static metadata", targets.map((target) => target.path));
}

async function schemaGate(root) {
  const missing = [];
  const ids = [];
  for (const file of requiredSchemas) {
    if (!(await exists(path.join(root, file)))) {
      missing.push(file);
      continue;
    }
    const schema = await readJson(root, file);
    ids.push(schema.$id ?? `${file}:missing-$id`);
  }
  if (missing.length || ids.some((id) => !String(id).startsWith("https://guorunjie.github.io/agentic-workflow-guard/"))) {
    return fail("stable-schemas", "Stable public schemas", [`Missing: ${missing.join(", ") || "none"}`, `IDs: ${ids.join(", ")}`], "Keep all schema files present and published under the stable GitHub Pages URL.");
  }
  return pass("stable-schemas", "Stable public schemas", ids);
}

function ruleStabilityGate() {
  const actualRuleIds = Object.keys(rules).sort();
  const highRules = actualRuleIds.filter((id) => rules[id].severity === "high");
  const mediumRules = actualRuleIds.filter((id) => rules[id].severity === "medium");
  const expectedHigh = stableRuleIds.slice(0, 6);
  const expectedMedium = stableRuleIds.slice(6);
  const profilesStable = policyProfiles.advisory?.severityThreshold === "critical" && policyProfiles.balanced?.severityThreshold === "high" && policyProfiles.strict?.severityThreshold === "medium";
  if (!sameSet(actualRuleIds, stableRuleIds) || !sameSet(highRules, expectedHigh) || !sameSet(mediumRules, expectedMedium) || !profilesStable) {
    return fail(
      "rule-stability",
      "Rule IDs, severities, and policy profiles",
      [`rules=${actualRuleIds.join(", ")}`, `high=${highRules.join(", ")}`, `medium=${mediumRules.join(", ")}`, `profiles=${JSON.stringify(policyProfiles)}`],
      "Freeze AWI001-AWI010, high/medium severity split, and advisory/balanced/strict thresholds before 1.0."
    );
  }
  return pass("rule-stability", "Rule IDs, severities, and policy profiles", [`rules=${actualRuleIds.join(", ")}`, "profiles=advisory:critical, balanced:high, strict:medium"]);
}

async function platformMatrixGate(root) {
  const corpus = await readJson(root, "benchmarks/corpus.json");
  const fixtureKindsByPlatform = new Map();
  for (const fixture of corpus.fixtures ?? []) {
    const kinds = fixtureKindsByPlatform.get(fixture.platformId) ?? new Set();
    kinds.add(fixture.kind);
    fixtureKindsByPlatform.set(fixture.platformId, kinds);
  }
  const missing = requiredPlatforms.filter((platform) => {
    const kinds = fixtureKindsByPlatform.get(platform);
    return !(kinds?.has("safe") && kinds?.has("vulnerable"));
  });
  if (missing.length) {
    return fail("platform-matrix", "Safe/vulnerable platform benchmark matrix", [`Missing safe+vulnerable pairs: ${missing.join(", ")}`], "Add safe and vulnerable benchmark fixtures for every claimed platform.");
  }
  return pass("platform-matrix", "Safe/vulnerable platform benchmark matrix", [`${requiredPlatforms.length} platforms have safe and vulnerable fixtures.`]);
}

async function agentMatrixGate(root) {
  const ids = supportedAgents.map((agent) => agent.id);
  const missingAgents = requiredAgentIds.filter((id) => !ids.includes(id));
  const missingOutputs = [];
  for (const agent of supportedAgents) {
    for (const output of agent.outputs) {
      if (output.includes("*")) continue;
      if (!(await exists(path.join(root, output)))) missingOutputs.push(output);
    }
  }
  if (missingAgents.length || missingOutputs.length) {
    return fail("agent-matrix", "Mainstream agent compatibility matrix", [`Missing agents: ${missingAgents.join(", ") || "none"}`, `Missing output files: ${missingOutputs.join(", ") || "none"}`], "Restore generated agent files and update supportedAgents before release.");
  }
  return pass("agent-matrix", "Mainstream agent compatibility matrix", [`agents=${requiredAgentIds.join(", ")}`]);
}

async function actionGate(root, targetVersion) {
  const action = await readText(root, "action.yml");
  const readme = await readText(root, "README.md");
  const requiredPatterns = [/branding:/, /color: blue/, /output:/, /profile:/, /baseline:/, /fix-format:/, /fix-output:/, /report-path:/, /fix-report-path:/, /GITHUB_STEP_SUMMARY/];
  const missing = requiredPatterns.filter((pattern) => !pattern.test(action)).map((pattern) => pattern.source);
  const readmeTag = `guorunjie/agentic-workflow-guard@v${targetVersion}`;
  const readmeHasTarget = readme.includes(readmeTag);
  const readmeHasInit = readme.includes("agentic-workflow-guard.js init .") || readme.includes("agentic-workflow-guard init .");
  if (missing.length || !readmeHasTarget || !readmeHasInit) {
    const status = targetVersion === (await readJson(root, "package.json")).version ? "fail" : "warn";
    const evidence = [`Missing action metadata patterns: ${missing.join(", ") || "none"}`, `README target tag ${readmeTag}: ${readmeHasTarget ? "present" : "missing"}`, `README init scaffold command: ${readmeHasInit ? "present" : "missing"}`];
    const remediation = "Keep action metadata Marketplace-ready and update README examples to the release tag before cutting that version.";
    return gate("github-action-marketplace", "GitHub Action Marketplace readiness", status, evidence, remediation);
  }
  return pass("github-action-marketplace", "GitHub Action Marketplace readiness", [`README uses ${readmeTag}.`, "README documents one-command init scaffolding.", "Action metadata includes output/profile/baseline/report-path, optional fix reports, and Step Summary support."]);
}

async function docsGate(root) {
  const files = ["docs/v1-readiness.md", "docs/demos.md", "docs/github-action-marketplace.md", "docs/npm-publish.md", "docs-site/index.html", "docs-site/marketplace.html", ".github/workflows/release.yml"];
  const gates = await Promise.all(files.map((file) => fileGate(root, file)));
  const failed = gates.filter((item) => item.status === "fail");
  if (failed.length) {
    return fail("docs-site", "Docs and Pages entry points", failed.map((item) => `${item.title}: ${item.evidence.join("; ")}`), "Restore docs and Pages entry points before release.");
  }
  return pass("docs-site", "Docs and Pages entry points", files);
}

async function npmGate(requireNpmAuth) {
  if (!requireNpmAuth) {
    return warn("npm-publication", "npm publication", "Skipped live npm auth check. Run `npm whoami` and `npm publish --dry-run` before 1.0.", "Use `release check --require-npm-auth` after logging in to npm.");
  }
  try {
    const { stdout } = await execFileAsync("npm", ["whoami"]);
    return pass("npm-publication", "npm publication", [`npm user=${stdout.trim()}`]);
  } catch (npmError) {
    return fail("npm-publication", "npm publication", npmError.stderr || npmError.message, "Run `npm adduser` or configure npm automation auth, then rerun `release check --require-npm-auth`.");
  }
}

export async function buildReleaseCheck(root = ".", options = {}) {
  const pkg = await readJson(root, "package.json");
  const targetVersion = options.targetVersion ?? pkg.version;
  const gates = [
    await packageGate(root),
    await targetVersionGate(root, targetVersion),
    await versionSyncGate(root),
    await staticMetadataGate(root),
    await schemaGate(root),
    ruleStabilityGate(),
    await platformMatrixGate(root),
    await agentMatrixGate(root),
    await actionGate(root, targetVersion),
    await docsGate(root),
    await npmGate(options.requireNpmAuth)
  ];
  const summary = {
    total: gates.length,
    pass: statusCount(gates, "pass"),
    warn: statusCount(gates, "warn"),
    fail: statusCount(gates, "fail"),
    ready: statusCount(gates, "fail") === 0
  };
  return {
    schemaVersion,
    name: "agentic-workflow-guard-release-readiness",
    version: pkg.version,
    targetVersion,
    generatedBy: `agentic-workflow-guard@${pkg.version}`,
    summary,
    gates
  };
}

export function renderReleaseCheck(report, format = "markdown") {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  const lines = [
    report.summary.fail ? "# Release readiness failed" : "# Release readiness passed",
    "",
    `- Version: ${report.version}`,
    `- Target version: ${report.targetVersion}`,
    `- Gates: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`,
    ""
  ];
  for (const item of report.gates) {
    const label = item.status.toUpperCase();
    lines.push(`## ${label}: ${item.title}`);
    for (const evidence of item.evidence) lines.push(`- ${evidence}`);
    if (item.remediation) lines.push(`- Remediation: ${item.remediation}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}
