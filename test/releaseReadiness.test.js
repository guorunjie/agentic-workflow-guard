import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("package metadata reflects the v0.20 marketplace and install readiness release", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.version, "0.20.0");
  assert.match(pkg.description, /Semgrep-style scanner/i);
  assert.match(pkg.description, /marketplace action smoke tests/i);
  assert.match(pkg.description, /portable skills/i);
  assert.ok(pkg.keywords.includes("gitlab-ci"));
  assert.ok(pkg.keywords.includes("circleci"));
  assert.ok(pkg.keywords.includes("azure-pipelines"));
  assert.ok(pkg.keywords.includes("jenkins"));
  assert.ok(pkg.keywords.includes("dify"));
  assert.ok(pkg.keywords.includes("flowise"));
  assert.ok(pkg.keywords.includes("langflow"));
  assert.ok(pkg.keywords.includes("zapier"));
  assert.ok(pkg.keywords.includes("make"));
  assert.ok(pkg.keywords.includes("pipedream"));
  assert.ok(pkg.keywords.includes("node-red"));
  assert.ok(pkg.keywords.includes("airflow"));
  assert.ok(pkg.keywords.includes("browser-use"));
  assert.ok(pkg.keywords.includes("rule-packs"));
  assert.equal(pkg.scripts.benchmark, "node ./bin/agentic-workflow-guard.js benchmark");
  assert.equal(pkg.scripts["benchmark:report"], "node ./bin/agentic-workflow-guard.js benchmark --format json");
  assert.equal(pkg.scripts["benchmark:corpus"], "node ./bin/agentic-workflow-guard.js benchmark corpus --format json");
  assert.equal(pkg.scripts["mcp:resources"], "node ./bin/agentic-workflow-guard.js mcp resources --format json");
  assert.equal(pkg.scripts["schema:report"], "node ./bin/agentic-workflow-guard.js schema report");
  assert.equal(pkg.scripts["schema:fix"], "node ./bin/agentic-workflow-guard.js schema fix");
  assert.equal(pkg.scripts["schema:rule-pack"], "node ./bin/agentic-workflow-guard.js schema rule-pack");
  assert.equal(pkg.scripts["schema:benchmark-corpus"], "node ./bin/agentic-workflow-guard.js schema benchmark-corpus");
  assert.equal(pkg.scripts["schema:benchmark-report"], "node ./bin/agentic-workflow-guard.js schema benchmark-report");
  assert.equal(pkg.scripts["docs:build"], "node ./scripts/build-pages.js");
  assert.equal(pkg.scripts["smoke:package"], "node ./scripts/smoke-package.js");
  assert.equal(pkg.scripts["release:check"], "node ./bin/agentic-workflow-guard.js release check");
  assert.equal(pkg.scripts["release:prepare"], "node ./scripts/prepare-release.js");
  assert.equal(pkg.scripts["release:sync"], "node ./scripts/sync-static.js");
  assert.equal(pkg.scripts["release:sync:check"], "node ./scripts/sync-static.js --check");
  assert.equal(pkg.scripts["scan:strict"], "node ./bin/agentic-workflow-guard.js scan . --profile strict");
  assert.ok(pkg.files.includes("mcp"));
  assert.ok(pkg.files.includes("schemas"));
  assert.ok(pkg.files.includes("docs-site"));
  assert.ok(pkg.files.includes("scripts"));
  assert.ok(pkg.files.includes(".github/copilot-instructions.md"));
});

test("README documents marketplace SARIF upload, output files, schemas, structured fixes, rule packs, config, baseline, patch, profiles, suppression reports, benchmark, MCP resources, and install helpers", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /github\/codeql-action\/upload-sarif/);
  assert.match(readme, /actions\/upload-artifact@v4/);
  assert.match(readme, /GitLab CI/);
  assert.match(readme, /CircleCI/);
  assert.match(readme, /Azure Pipelines/);
  assert.match(readme, /Jenkins/);
  assert.match(readme, /--output awg\.sarif/);
  assert.match(readme, /schema report/);
  assert.match(readme, /schema fix/);
  assert.match(readme, /schema rule-pack/);
  assert.match(readme, /schema benchmark-corpus/);
  assert.match(readme, /schema benchmark-report/);
  assert.match(readme, /benchmark --format json/);
  assert.match(readme, /fix \. --format json/);
  assert.match(readme, /--output awg-fix\.json/);
  assert.match(readme, /fix-output: awg-fix\.json/);
  assert.match(readme, /fix \. --apply/);
  assert.match(readme, /fix \. --patch/);
  assert.match(readme, /CI dry-run defaults/);
  assert.match(readme, /approval snippets/);
  assert.match(readme, /baseline create/);
  assert.match(readme, /agents install/);
  assert.match(readme, /rules registry/);
  assert.match(readme, /github-actions-hardening/);
  assert.match(readme, /mcp-tool-governance/);
  assert.match(readme, /rules verify/);
  assert.match(readme, /rule pack schema/);
  assert.match(readme, /benchmark/);
  assert.match(readme, /benchmark corpus/);
  assert.match(readme, /benchmarks\/corpus\.json/);
  assert.match(readme, /Demo Playbook/);
  assert.match(readme, /v1-readiness\.md/);
  assert.match(readme, /release check \[path\] --target 1\.0\.0/);
  assert.match(readme, /npm run release:prepare -- --version 1\.0\.0-rc\.1 --dry-run/);
  assert.match(readme, /npm run release:sync:check/);
  assert.match(readme, /npm run release:check/);
  assert.match(readme, /npm run smoke:package/);
  assert.match(readme, /mcp resources/);
  assert.match(readme, /--profile strict/);
  assert.match(readme, /awg-ignore AWI001/);
  assert.match(readme, /Suppressed findings/);
  assert.match(readme, /\.awg\.yml/);
});

test("GitHub Action writes SARIF and optional fix report files for follow-up jobs", async () => {
  const action = await readFile("action.yml", "utf8");

  assert.match(action, /output:/);
  assert.match(action, /author: guorunjie/);
  assert.match(action, /color: blue/);
  assert.match(action, /description: "Output format: markdown, json, or sarif\."/);
  assert.match(action, /description: "Policy profile: advisory, balanced, or strict\."/);
  assert.match(action, /awg\.sarif/);
  assert.match(action, /profile:/);
  assert.match(action, /baseline:/);
  assert.match(action, /fix-format:/);
  assert.match(action, /fix-output:/);
  assert.match(action, /report-path/);
  assert.match(action, /fix-report-path/);
  assert.match(action, /AWG_FIX_OUTPUT/);
  assert.match(action, /GITHUB_STEP_SUMMARY/);
});

test("CI workflow uses current Node runtime actions", async () => {
  const workflow = await readFile(".github/workflows/test.yml", "utf8");

  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /action-smoke/);
  assert.match(workflow, /release-gates/);
  assert.match(workflow, /uses: \.\//);
  assert.match(workflow, /profile: advisory/);
  assert.match(workflow, /awg-action-smoke\.json/);
  assert.match(workflow, /fix-format: json/);
  assert.match(workflow, /fix-output: awg-action-fix\.json/);
  assert.match(workflow, /awg-action-fix\.json/);
  assert.match(workflow, /npm run release:sync:check/);
  assert.match(workflow, /npm run release:prepare -- --version 1\.0\.0-rc\.1 --dry-run/);
  assert.match(workflow, /npm run release:check -- --format json/);
  assert.match(workflow, /npm run smoke:package/);
  assert.match(workflow, /npm pack --dry-run/);
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
    "examples/vulnerable-dify/app.yml",
    "examples/vulnerable-flowise/chatflow.json",
    "examples/vulnerable-langflow/flow.json",
    "examples/vulnerable-make/scenario.blueprint.json",
    "examples/vulnerable-pipedream/workflow.json",
    "examples/vulnerable-zapier/zap.json",
    "examples/vulnerable-airflow/agent_dag.py",
    "examples/vulnerable-browser-trace/browser-trace.json",
    "benchmarks/fixtures.json",
    "benchmarks/corpus.json",
    "rules/registry.json",
    "rules/community/agentic-workflow-guard-github-actions-hardening.json",
    "rules/community/agentic-workflow-guard-low-code-automation.json",
    "rules/community/agentic-workflow-guard-mcp-tool-governance.json",
    "examples/safe-node-red/flows.json",
    "examples/safe-gitlab-ci/.gitlab-ci.yml",
    "examples/safe-circleci/.circleci/config.yml",
    "examples/safe-azure-pipelines/azure-pipelines.yml",
    "examples/safe-jenkins/Jenkinsfile",
    "examples/safe-dify/app.yml",
    "examples/safe-flowise/chatflow.json",
    "examples/safe-langflow/flow.json",
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
    "docs/demos.md",
    "docs/v1-readiness.md",
    "docs/index.md",
    "docs-site/index.html",
    "docs-site/marketplace.html",
    "scripts/build-pages.js",
    "scripts/prepare-release.js",
    "scripts/smoke-package.js",
    "scripts/sync-static.js",
    "docs/npm-publish.md",
    "schemas/agentic-workflow-guard-report.schema.json",
    "schemas/agentic-workflow-guard-fix-report.schema.json",
    "schemas/agentic-workflow-guard-rule-pack.schema.json",
    "schemas/agentic-workflow-guard-benchmark-corpus.schema.json",
    "schemas/agentic-workflow-guard-benchmark-report.schema.json",
    ".awg.example.yml"
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.ok(content.length > 20);
  }
});
