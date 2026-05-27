import path from "node:path";

import { scanProject } from "./scan.js";
import { readJson } from "./utils/files.js";

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function sameRules(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify([...expected].sort());
}

export async function runBenchmark(root = ".") {
  const manifest = await readJson(root, "benchmarks/fixtures.json");
  const results = [];

  for (const fixture of manifest.fixtures) {
    const findings = await scanProject(path.join(root, fixture.path));
    const actualRules = sortedUnique(findings.map((finding) => finding.ruleId));
    results.push({
      ...fixture,
      actualRules,
      passed: sameRules(actualRules, fixture.expectedRules)
    });
  }

  return results;
}

export function renderBenchmark(results) {
  const failed = results.filter((result) => !result.passed);
  const lines = [failed.length ? "# Benchmark failed" : "# Benchmark passed", ""];
  for (const result of results) {
    lines.push(`- ${result.passed ? "PASS" : "FAIL"} ${result.name}: expected [${result.expectedRules.join(", ")}], got [${result.actualRules.join(", ")}]`);
  }
  return `${lines.join("\n")}\n`;
}
