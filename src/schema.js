import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function renderReportSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-report.schema.json"), "utf8");
}

export async function renderFixReportSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-fix-report.schema.json"), "utf8");
}

export async function renderConfigSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-config.schema.json"), "utf8");
}

export async function renderRulePackSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-rule-pack.schema.json"), "utf8");
}

export async function renderBenchmarkCorpusSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-benchmark-corpus.schema.json"), "utf8");
}

export async function renderBenchmarkReportSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-benchmark-report.schema.json"), "utf8");
}
