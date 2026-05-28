import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("package metadata reflects the v1.0 release-ready package", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(pkg.version, "1.0.0");
  assert.match(pkg.description, /Semgrep-style scanner/i);
  assert.match(pkg.description, /marketplace action smoke tests/i);
  assert.match(pkg.description, /portable skills/i);
  assert.equal(pkg.repository?.url, "git+https://github.com/guorunjie/agentic-workflow-guard.git");
  assert.equal(pkg.homepage, "https://github.com/guorunjie/agentic-workflow-guard#readme");
  assert.equal(pkg.bugs?.url, "https://github.com/guorunjie/agentic-workflow-guard/issues");
  assert.equal(pkg.bin?.["agentic-workflow-guard"], "bin/agentic-workflow-guard.js");
  assert.ok(pkg.keywords.includes("bitbucket-pipelines"));
  assert.ok(pkg.keywords.includes("gitlab-ci"));
  assert.ok(pkg.keywords.includes("travis-ci"));
  assert.ok(pkg.keywords.includes("drone-ci"));
  assert.ok(pkg.keywords.includes("teamcity"));
  assert.ok(pkg.keywords.includes("harness"));
  assert.ok(pkg.keywords.includes("harness-ci"));
  assert.ok(pkg.keywords.includes("tekton"));
  assert.ok(pkg.keywords.includes("tekton-pipelines"));
  assert.ok(pkg.keywords.includes("argo-workflows"));
  assert.ok(pkg.keywords.includes("aws-codebuild"));
  assert.ok(pkg.keywords.includes("google-cloud-build"));
  assert.ok(pkg.keywords.includes("circleci"));
  assert.ok(pkg.keywords.includes("azure-pipelines"));
  assert.ok(pkg.keywords.includes("jenkins"));
  assert.ok(pkg.keywords.includes("buildkite"));
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
  assert.equal(pkg.scripts["release:status"], "node ./scripts/release-status.js");
  assert.equal(pkg.scripts["release:verify"], "node ./scripts/verify-release.js");
  assert.equal(pkg.scripts["release:sync"], "node ./scripts/sync-static.js");
  assert.equal(pkg.scripts["release:sync:check"], "node ./scripts/sync-static.js --check");
  assert.equal(pkg.scripts["scan:strict"], "node ./bin/agentic-workflow-guard.js scan . --profile strict");
  assert.ok(pkg.files.includes("mcp"));
  assert.ok(pkg.files.includes("schemas"));
  assert.ok(pkg.files.includes("docs-site"));
  assert.ok(pkg.files.includes("scripts"));
  assert.ok(pkg.files.includes("CONTRIBUTING.md"));
  assert.ok(pkg.files.includes("SECURITY.md"));
  assert.ok(pkg.files.includes("CODE_OF_CONDUCT.md"));
  assert.ok(pkg.files.includes(".github/copilot-instructions.md"));
  assert.ok(pkg.files.includes(".github/pull_request_template.md"));
  assert.ok(pkg.files.includes(".github/ISSUE_TEMPLATE"));
  assert.ok(pkg.files.includes(".github/workflows/release.yml"));
});

test("README documents marketplace SARIF upload, output files, schemas, structured fixes, rule packs, config, baseline, patch, profiles, suppression reports, benchmark, MCP resources, and install helpers", async () => {
  const readme = await readFile("README.md", "utf8");

  assert.match(readme, /github\/codeql-action\/upload-sarif/);
  assert.match(readme, /actions\/upload-artifact@v4/);
  assert.match(readme, /Bitbucket Pipelines/);
  assert.match(readme, /GitLab CI/);
  assert.match(readme, /Travis CI/);
  assert.match(readme, /Drone CI/);
  assert.match(readme, /TeamCity/);
  assert.match(readme, /Harness CI\/CD/);
  assert.match(readme, /Tekton Pipelines/);
  assert.match(readme, /Argo Workflows/);
  assert.match(readme, /AWS CodeBuild/);
  assert.match(readme, /Google Cloud Build/);
  assert.match(readme, /CircleCI/);
  assert.match(readme, /Azure Pipelines/);
  assert.match(readme, /Jenkins/);
  assert.match(readme, /Buildkite/);
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
  assert.match(readme, /ci-pipeline-hardening/);
  assert.match(readme, /mcp-tool-governance/);
  assert.match(readme, /rules verify/);
  assert.match(readme, /rule pack schema/);
  assert.match(readme, /benchmark/);
  assert.match(readme, /benchmark corpus/);
  assert.match(readme, /benchmarks\/corpus\.json/);
  assert.match(readme, /Demo Playbook/);
  assert.match(readme, /v1-readiness\.md/);
  assert.match(readme, /release check \[path\] --target 1\.0\.0/);
  assert.match(readme, /npm run release:prepare -- --version 1\.0\.1 --dry-run/);
  assert.match(readme, /npm run release:status -- --version 1\.0\.0/);
  assert.match(readme, /npm run release:verify -- --version 1\.0\.0 --dry-run/);
  assert.match(readme, /npm run release:sync:check/);
  assert.match(readme, /npm run release:check/);
  assert.match(readme, /npm run smoke:package/);
  assert.match(readme, /mcp resources/);
  assert.match(readme, /--profile strict/);
  assert.match(readme, /awg-ignore AWI001/);
  assert.match(readme, /Suppressed findings/);
  assert.match(readme, /\.awg\.yml/);
  assert.match(readme, /CONTRIBUTING\.md/);
  assert.match(readme, /SECURITY\.md/);
  assert.match(readme, /CODE_OF_CONDUCT\.md/);
});

test("repository includes contribution, security, and collaboration templates", async () => {
  const files = [
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/platform_request.md",
    ".github/ISSUE_TEMPLATE/rule_pack_request.md"
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.ok(content.length > 100, `${file} should have actionable content`);
  }

  const contributing = await readFile("CONTRIBUTING.md", "utf8");
  const security = await readFile("SECURITY.md", "utf8");
  const prTemplate = await readFile(".github/pull_request_template.md", "utf8");
  const platformTemplate = await readFile(".github/ISSUE_TEMPLATE/platform_request.md", "utf8");

  assert.match(contributing, /Adding Platform Coverage/);
  assert.match(contributing, /Rule Pack Contributions/);
  assert.match(contributing, /benchmark/);
  assert.match(security, /Reporting A Vulnerability/);
  assert.match(security, /Safe Research Guidelines/);
  assert.match(prTemplate, /npm run release:sync:check/);
  assert.match(prTemplate, /No real secrets/);
  assert.match(platformTemplate, /Vulnerable fixture/);
  assert.match(platformTemplate, /Safe fixture/);
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
  assert.match(workflow, /npm run release:prepare -- --version 1\.0\.1 --dry-run/);
  assert.match(workflow, /npm run release:check -- --format json/);
  assert.match(workflow, /npm run smoke:package/);
  assert.match(workflow, /npm pack --dry-run/);
});

test("release workflow publishes npm packages from release tags", async () => {
  const workflow = await readFile(".github/workflows/release.yml", "utf8");

  assert.match(workflow, /types:\n\s+- published/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /registry-url: https:\/\/registry\.npmjs\.org/);
  assert.match(workflow, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
  assert.match(workflow, /Require NPM_TOKEN for real publish/);
  assert.match(workflow, /NPM_TOKEN repository secret is required for publishing to npm/);
  assert.match(workflow, /npm run release:check -- --target "\$VERSION" --require-npm-auth/);
  assert.match(workflow, /npm publish --provenance --access public/);
  assert.match(workflow, /npm publish --dry-run --provenance --access public/);
  assert.match(workflow, /bin\/agentic-workflow-guard\.js/);
});

test("package smoke covers release status dry-run", async () => {
  const smoke = await readFile("scripts/smoke-package.js", "utf8");

  assert.match(smoke, /release:status/);
  assert.match(smoke, /packageVersion/);
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
    "examples/vulnerable-bitbucket-pipelines/bitbucket-pipelines.yml",
    "examples/vulnerable-gitlab-ci/.gitlab-ci.yml",
    "examples/vulnerable-travis-ci/.travis.yml",
    "examples/vulnerable-drone-ci/.drone.yml",
    "examples/vulnerable-circleci/.circleci/config.yml",
    "examples/vulnerable-azure-pipelines/azure-pipelines.yml",
    "examples/vulnerable-jenkins/Jenkinsfile",
    "examples/vulnerable-buildkite/.buildkite/pipeline.yml",
    "examples/vulnerable-tekton/.tekton/agent-task.yaml",
    "examples/vulnerable-argo-workflows/argo-workflows/agent-deploy.yaml",
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
    "rules/community/agentic-workflow-guard-ci-pipeline-hardening.json",
    "rules/community/agentic-workflow-guard-low-code-automation.json",
    "rules/community/agentic-workflow-guard-mcp-tool-governance.json",
    "examples/safe-node-red/flows.json",
    "examples/safe-bitbucket-pipelines/bitbucket-pipelines.yml",
    "examples/safe-gitlab-ci/.gitlab-ci.yml",
    "examples/safe-travis-ci/.travis.yml",
    "examples/safe-drone-ci/.drone.yml",
    "examples/safe-circleci/.circleci/config.yml",
    "examples/safe-azure-pipelines/azure-pipelines.yml",
    "examples/safe-jenkins/Jenkinsfile",
    "examples/safe-buildkite/.buildkite/pipeline.yml",
    "examples/safe-tekton/.tekton/agent-task.yaml",
    "examples/safe-argo-workflows/argo-workflows/agent-preview.yaml",
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
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    ".github/pull_request_template.md",
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/platform_request.md",
    ".github/ISSUE_TEMPLATE/rule_pack_request.md",
    "docs-site/index.html",
    "docs-site/marketplace.html",
    ".github/workflows/release.yml",
    "scripts/build-pages.js",
    "scripts/prepare-release.js",
    "scripts/release-status.js",
    "scripts/verify-release.js",
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
