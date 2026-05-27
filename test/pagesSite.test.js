import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("docs:build creates a Pages-ready site with stable schema URLs", async () => {
  const outDir = await mkdtemp(path.join(tmpdir(), "awg-pages-"));

  await execFileAsync("node", ["scripts/build-pages.js", "--out", outDir]);

  const index = await readFile(path.join(outDir, "index.html"), "utf8");
  const marketplace = await readFile(path.join(outDir, "marketplace.html"), "utf8");
  const reportSchema = JSON.parse(await readFile(path.join(outDir, "schemas", "report.schema.json"), "utf8"));
  const fixSchema = JSON.parse(await readFile(path.join(outDir, "schemas", "fix-report.schema.json"), "utf8"));
  const rulePackSchema = JSON.parse(await readFile(path.join(outDir, "schemas", "rule-pack.schema.json"), "utf8"));
  const corpusSchema = JSON.parse(await readFile(path.join(outDir, "schemas", "benchmark-corpus.schema.json"), "utf8"));
  const benchmarkReportSchema = JSON.parse(await readFile(path.join(outDir, "schemas", "benchmark-report.schema.json"), "utf8"));
  const schemaIndex = JSON.parse(await readFile(path.join(outDir, "schemas", "index.json"), "utf8"));
  const marketplaceRules = JSON.parse(await readFile(path.join(outDir, "rules", "marketplace.json"), "utf8"));
  const registry = JSON.parse(await readFile(path.join(outDir, "rules", "registry.json"), "utf8"));
  const communityPack = JSON.parse(await readFile(path.join(outDir, "rules", "community", "agentic-workflow-guard-low-code-automation.json"), "utf8"));
  const mcpPack = JSON.parse(await readFile(path.join(outDir, "rules", "community", "agentic-workflow-guard-mcp-tool-governance.json"), "utf8"));
  const corpus = JSON.parse(await readFile(path.join(outDir, "benchmarks", "corpus.json"), "utf8"));

  await stat(path.join(outDir, "404.html"));
  assert.match(index, /Semgrep-style scanning for AI automation workflows/);
  assert.match(index, /schemas\/report\.schema\.json/);
  assert.match(index, /Demo playbook/);
  assert.match(index, /v1 readiness/);
  assert.match(marketplace, /GitHub Action Marketplace/);
  assert.equal(reportSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/report.schema.json");
  assert.equal(fixSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/fix-report.schema.json");
  assert.equal(rulePackSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/rule-pack.schema.json");
  assert.equal(corpusSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/benchmark-corpus.schema.json");
  assert.equal(benchmarkReportSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/benchmark-report.schema.json");
  assert.ok(schemaIndex.schemas.some((schema) => schema.path === "schemas/rule-pack.schema.json"));
  assert.ok(schemaIndex.schemas.some((schema) => schema.path === "schemas/benchmark-report.schema.json"));
  assert.equal(marketplaceRules.schemaVersion, "1.0.0");
  assert.ok(registry.packs.some((pack) => pack.alias === "low-code-automation"));
  assert.ok(registry.packs.some((pack) => pack.alias === "mcp-tool-governance"));
  assert.equal(communityPack.provenance.source, "community");
  assert.deepEqual(mcpPack.rules, ["AWI006"]);
  assert.equal(corpus.name, "agentic-workflow-guard-benchmark-corpus");
  assert.equal(corpus.fixtureCount, 34);
  assert.ok(corpus.platforms.includes("Dify"));
  assert.ok(corpus.platforms.includes("Flowise"));
  assert.ok(corpus.platforms.includes("Langflow"));
});

test("Pages workflow builds and deploys the generated static site", async () => {
  const workflow = await readFile(".github/workflows/pages.yml", "utf8");
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.scripts["docs:build"], "node ./scripts/build-pages.js");
  assert.match(workflow, /npm run docs:build/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
});
