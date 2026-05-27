import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function renderReportSchema() {
  return readFile(path.join(packageRoot, "schemas", "agentic-workflow-guard-report.schema.json"), "utf8");
}
