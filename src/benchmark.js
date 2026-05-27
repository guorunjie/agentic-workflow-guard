import path from "node:path";

import { scanProject } from "./scan.js";
import { readJson } from "./utils/files.js";
import { packageVersion } from "./version.js";

const corpusSchemaVersion = "1.0.0";
const reportSchemaVersion = "1.0.0";

const fixturePlatforms = [
  ["github-action", "github-actions", "GitHub Actions"],
  ["gitlab-ci", "gitlab-ci", "GitLab CI"],
  ["circleci", "circleci", "CircleCI"],
  ["azure-pipelines", "azure-pipelines", "Azure Pipelines"],
  ["jenkins", "jenkins", "Jenkins"],
  ["n8n", "n8n", "n8n"],
  ["mcp", "mcp", "MCP"],
  ["activepieces", "activepieces", "Activepieces"],
  ["node-red", "node-red", "Node-RED"],
  ["make", "make", "Make"],
  ["pipedream", "pipedream", "Pipedream"],
  ["zapier", "zapier", "Zapier"],
  ["airflow", "airflow", "Airflow"],
  ["browser-trace", "browser-automation", "Browser automation"]
];

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function sameRules(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify([...expected].sort());
}

function ruleDiff(actual, expected) {
  return {
    missingRules: expected.filter((ruleId) => !actual.includes(ruleId)),
    unexpectedRules: actual.filter((ruleId) => !expected.includes(ruleId))
  };
}

export async function runBenchmark(root = ".") {
  const manifest = await readJson(root, "benchmarks/fixtures.json");
  const results = [];

  for (const fixture of manifest.fixtures) {
    const findings = await scanProject(path.join(root, fixture.path));
    const actualRules = sortedUnique(findings.map((finding) => finding.ruleId));
    const expectedRules = sortedUnique(fixture.expectedRules);
    const diff = ruleDiff(actualRules, expectedRules);
    results.push({
      name: fixture.name,
      kind: fixtureKind(fixture),
      ...platformMetadataForFixture(fixture),
      path: fixture.path,
      expectedRules,
      actualRules,
      ...diff,
      passed: sameRules(actualRules, expectedRules)
    });
  }

  return results;
}

function platformMetadataForFixture(fixture) {
  const value = `${fixture.name} ${fixture.path}`.toLowerCase();
  const match = fixturePlatforms.find(([needle]) => value.includes(needle));
  if (!match) return { platformId: "automation", platform: "Automation" };
  return { platformId: match[1], platform: match[2] };
}

function fixtureKind(fixture) {
  if (fixture.name.startsWith("safe-")) return "safe";
  if (fixture.name.startsWith("vulnerable-")) return "vulnerable";
  return fixture.expectedRules.length ? "vulnerable" : "safe";
}

function fixtureRisk(fixture) {
  if (!fixture.expectedRules.length) return "Expected to produce no findings.";
  return `Expected to trigger ${fixture.expectedRules.join(", ")}.`;
}

export function buildBenchmarkCorpusFromManifest(manifest) {
  const fixtures = manifest.fixtures.map((fixture) => ({
    name: fixture.name,
    kind: fixtureKind(fixture),
    ...platformMetadataForFixture(fixture),
    path: fixture.path,
    expectedRules: fixture.expectedRules,
    risk: fixtureRisk(fixture)
  }));
  const platforms = sortedUnique(fixtures.map((fixture) => fixture.platform));
  const ruleIds = sortedUnique(fixtures.flatMap((fixture) => fixture.expectedRules));

  return {
    schemaVersion: corpusSchemaVersion,
    name: "agentic-workflow-guard-benchmark-corpus",
    version: packageVersion,
    generatedBy: `agentic-workflow-guard@${packageVersion}`,
    description: "Reusable vulnerable and safe fixtures for AI automation workflow security scanners.",
    homepage: "https://github.com/guorunjie/agentic-workflow-guard",
    fixtureManifestVersion: manifest.version,
    fixtureCount: fixtures.length,
    platforms,
    ruleIds,
    fixtures
  };
}

export async function loadBenchmarkCorpus(root = ".") {
  const manifest = await readJson(root, "benchmarks/fixtures.json");
  return buildBenchmarkCorpusFromManifest(manifest);
}

export async function benchmarkCorpus(root = ".") {
  return loadBenchmarkCorpus(root);
}

export function buildBenchmarkReport(results) {
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const passRate = results.length ? Number(((passed / results.length) * 100).toFixed(2)) : 100;

  return {
    schemaVersion: reportSchemaVersion,
    name: "agentic-workflow-guard-benchmark-report",
    version: packageVersion,
    generatedBy: `agentic-workflow-guard@${packageVersion}`,
    summary: {
      fixtureCount: results.length,
      passed,
      failed,
      passRate
    },
    platforms: sortedUnique(results.map((result) => result.platform)),
    ruleIds: sortedUnique(results.flatMap((result) => [...result.expectedRules, ...result.actualRules])),
    results
  };
}

export function renderBenchmarkReport(report, format = "markdown") {
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;

  const failed = report.results.filter((result) => !result.passed);
  const lines = [
    failed.length ? "# Benchmark failed" : "# Benchmark passed",
    "",
    `- Score: ${report.summary.passed}/${report.summary.fixtureCount} (${report.summary.passRate}%)`,
    `- Failed: ${report.summary.failed}`,
    ""
  ];
  for (const result of report.results) {
    const diff = result.passed ? "" : ` missing [${result.missingRules.join(", ")}], unexpected [${result.unexpectedRules.join(", ")}]`;
    lines.push(`- ${result.passed ? "PASS" : "FAIL"} ${result.name}: expected [${result.expectedRules.join(", ")}], got [${result.actualRules.join(", ")}]${diff}`);
  }
  return `${lines.join("\n")}\n`;
}

export function renderBenchmark(results, format = "markdown") {
  return renderBenchmarkReport(buildBenchmarkReport(results), format);
}

export function renderBenchmarkCorpus(corpus, format = "markdown") {
  if (format === "json") return `${JSON.stringify(corpus, null, 2)}\n`;

  const lines = [
    "# Agentic Workflow Guard Benchmark Corpus",
    "",
    corpus.description,
    "",
    `- Version: ${corpus.version}`,
    `- Fixtures: ${corpus.fixtureCount}`,
    `- Platforms: ${corpus.platforms.join(", ")}`,
    `- Rules: ${corpus.ruleIds.join(", ")}`,
    "",
    "| Fixture | Kind | Platform | Expected rules | Path |",
    "| --- | --- | --- | --- | --- |"
  ];
  for (const fixture of corpus.fixtures) {
    lines.push(`| ${fixture.name} | ${fixture.kind} | ${fixture.platform} | ${fixture.expectedRules.join(", ") || "none"} | \`${fixture.path}\` |`);
  }
  return `${lines.join("\n")}\n`;
}
