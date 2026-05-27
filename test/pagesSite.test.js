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
  const schemaIndex = JSON.parse(await readFile(path.join(outDir, "schemas", "index.json"), "utf8"));
  const marketplaceRules = JSON.parse(await readFile(path.join(outDir, "rules", "marketplace.json"), "utf8"));

  await stat(path.join(outDir, "404.html"));
  assert.match(index, /Semgrep-style scanning for AI automation workflows/);
  assert.match(index, /schemas\/report\.schema\.json/);
  assert.match(marketplace, /GitHub Action Marketplace/);
  assert.equal(reportSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/report.schema.json");
  assert.equal(fixSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/fix-report.schema.json");
  assert.equal(rulePackSchema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/rule-pack.schema.json");
  assert.ok(schemaIndex.schemas.some((schema) => schema.path === "schemas/rule-pack.schema.json"));
  assert.equal(marketplaceRules.schemaVersion, "1.0.0");
});

test("Pages workflow builds and deploys the generated static site", async () => {
  const workflow = await readFile(".github/workflows/pages.yml", "utf8");
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.scripts["docs:build"], "node ./scripts/build-pages.js");
  assert.match(workflow, /npm run docs:build/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
});
