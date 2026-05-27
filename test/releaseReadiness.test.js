import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("package metadata reflects the v0.17 community rule-pack registry release", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.version, "0.17.0");
  assert.match(pkg.description, /Semgrep-style scanner/i);
  assert.match(pkg.description, /portable skills/i);
  assert.ok(pkg.keywords.includes("gitlab-ci"));
  assert.ok(pkg.keywords.includes("circleci"));
  assert.ok(pkg.keywords.includes("azure-pipelines"));
  assert.ok(pkg.keywords.includes("jenkins"));
  assert.ok(pkg.keywords.includes("zapier"));
  assert.ok(pkg.keywords.includes("make"));
  assert.ok(pkg.keywords.includes("pipedream"));
  assert.ok(pkg.keywords.includes("node-red"));
  assert.ok(pkg.keywords.includes("airflow"));
  assert.ok(pkg.keywords.includes("browser-use"));
  assert.ok(pkg.keywords.includes("rule-packs"));
  assert.equal(pkg.scripts.benchmark, "node ./bin/agentic-workflow-guard.js benchmark");
  assert.equal(pkg.scripts["mcp:resources"], "node ./bin/agentic-workflow-guard.js mcp resources --format json");
  assert.equal(pkg.scripts["schema:report"], "node ./bin/agentic-workflow-guard.js schema report");
  assert.equal(pkg.scripts["schema:fix"], "node ./bin/agentic-workflow-guard.js schema fix");
  assert.equal(pkg.scripts["schema:rule-pack"], "node ./bin/agentic-workflow-guard.js schema rule-pack");
  assert.equal(pkg.scripts["docs:build"], "node ./scripts/build-pages.js");
  assert.equal(pkg.scripts["scan:strict"], "node ./bin/agentic-workflow-guard.js scan . --profile strict");
  assert.ok(pkg.files.includes("mcp"));
  assert.ok(pkg.files.includes("schemas"));
  assert.ok(pkg.files.includes("docs-site"));
  assert.ok(pkg.files.includes("scripts"));
});

test("README documents marketplace SARIF upload, output files, schemas, structured fixes, rule packs, config, baseline, patch, profiles, suppression reports, benchmark, MCP resources, and install helpers", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /github\/codeql-action\/upload-sarif/);
  assert.match(readme, /GitLab CI/);
  assert.match(readme, /CircleCI/);
  assert.match(readme, /Azure Pipelines/);
  assert.match(readme, /Jenkins/);
  assert.match(readme, /--output awg\.sarif/);
  assert.match(readme, /schema report/);
  assert.match(readme, /schema fix/);
  assert.match(readme, /schema rule-pack/);
  assert.match(readme, /fix \. --format json/);
  assert.match(readme, /fix \. --apply/);
  assert.match(readme, /fix \. --patch/);
  assert.match(readme, /CI dry-run defaults/);
  assert.match(readme, /approval snippets/);
  assert.match(readme, /baseline create/);
  assert.match(readme, /agents install/);
  assert.match(readme, /rules registry/);
  assert.match(readme, /github-actions-hardening/);
  assert.match(readme, /rules verify/);
  assert.match(readme, /rule pack schema/);
  assert.match(readme, /benchmark/);
  assert.match(readme, /mcp resources/);
  assert.match(readme, /--profile strict/);
  assert.match(readme, /awg-ignore AWI001/);
  assert.match(readme, /Suppressed findings/);
  assert.match(readme, /\.awg\.yml/);
});

test("GitHub Action writes SARIF output files for Code Scanning upload", async () => {
  const action = await readFile("action.yml", "utf8");

  assert.match(action, /output:/);
  assert.match(action, /awg\.sarif/);
  assert.match(action, /profile:/);
  assert.match(action, /baseline:/);
  assert.match(action, /report-path/);
  assert.match(action, /GITHUB_STEP_SUMMARY/);
});

test("CI workflow uses current Node runtime actions", async () => {
  const workflow = await readFile(".github/workflows/test.yml", "utf8");

  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version: 24/);
});

test("Pages workflow publishes generated docs and stable schema URLs", async () => {
  const workflow = await readFile(".github/workflows/pages.yml", "utf8");

  assert.match(workflow, /npm run docs:build/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(workflow, /site-dist/);
});

test("repository ships examples for new workflow platform scanners", async () => {
  const files = [
    "examples/vulnerable-node-red/flows.json",
    "examples/vulnerable-gitlab-ci/.gitlab-ci.yml",
    "examples/vulnerable-circleci/.circleci/config.yml",
    "examples/vulnerable-azure-pipelines/azure-pipelines.yml",
    "examples/vulnerable-jenkins/Jenkinsfile",
    "examples/vulnerable-make/scenario.blueprint.json",
    "examples/vulnerable-pipedream/workflow.json",
    "examples/vulnerable-zapier/zap.json",
    "examples/vulnerable-airflow/agent_dag.py",
    "examples/vulnerable-browser-trace/browser-trace.json",
    "benchmarks/fixtures.json",
    "rules/registry.json",
    "rules/community/agentic-workflow-guard-github-actions-hardening.json",
    "rules/community/agentic-workflow-guard-low-code-automation.json",
    "examples/safe-node-red/flows.json",
    "examples/safe-gitlab-ci/.gitlab-ci.yml",
    "examples/safe-circleci/.circleci/config.yml",
    "examples/safe-azure-pipelines/azure-pipelines.yml",
    "examples/safe-jenkins/Jenkinsfile",
    "examples/safe-make/scenario.blueprint.json",
    "examples/safe-pipedream/workflow.json",
    "examples/safe-zapier/zap.json",
    "examples/safe-airflow/agent_dag.py",
    "examples/safe-browser-trace/browser-trace.json",
    "examples/unsafe-ai-pr-bot/.github/workflows/pr-bot.yml",
    "mcp/resources/agentic-workflow-guard.resources.json",
    "docs/playbooks/github-actions.md",
    "docs/playbooks/ci-pipelines.md",
    "docs/playbooks/n8n.md",
    "docs/playbooks/mcp.md",
    "docs/playbooks/low-code.md",
    "docs/playbooks/browser-automation.md",
    "docs/policy-profiles-and-suppressions.md",
    "docs/rule-marketplace.md",
    "docs/index.md",
    "docs-site/index.html",
    "docs-site/marketplace.html",
    "scripts/build-pages.js",
    "docs/npm-publish.md",
    "schemas/agentic-workflow-guard-report.schema.json",
    "schemas/agentic-workflow-guard-fix-report.schema.json",
    "schemas/agentic-workflow-guard-rule-pack.schema.json",
    ".awg.example.yml"
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.ok(content.length > 20);
  }
});
