# Agentic Workflow Guard

Find dangerous AI automation workflows before agents get write access.

Semgrep-style scanning for AI automation workflows: find prompt-injection paths, overpowered tools, unsafe GitHub Actions, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite agent jobs, risky n8n, Dify, Flowise, Langflow, and low-code workflow side effects, and MCP permission leaks before your AI automation runs.

Five-command demo:

```bash
npx agentic-workflow-guard init .
npx agentic-workflow-guard scan examples/unsafe-ai-pr-bot --format markdown
npx agentic-workflow-guard scan examples/unsafe-ai-pr-bot --format sarif --output awg.sarif
npx agentic-workflow-guard fix examples/unsafe-ai-pr-bot --patch
npx agentic-workflow-guard skillpack > skillpack.yaml
```

The exported `skillpack.yaml` can be compiled by [Skillpack Forge](https://github.com/guorunjie/skillpack-forge) into `AGENTS.md`, Claude Skills, Codex Skills, Cursor rules, and Copilot instructions. The package also ships portable Gemini, OpenClaw, and Hermes skill bundles through `agents install`.

Public docs and stable schema URLs are available on GitHub Pages at `https://guorunjie.github.io/agentic-workflow-guard/`.

Start with [Demo Playbook](docs/demos.md) when you want a quick story for the risk: untrusted input -> AI decision -> write-capable side effect.

Agentic Workflow Guard is a static security scanner for AI automation workflows. It scans repositories and workflow exports for risky paths such as:

- untrusted GitHub issue, Bitbucket pull request, GitLab merge request, Travis pull request, Drone pull request, TeamCity branch, Harness codebase or trigger context, Tekton params, Argo workflow parameters, CodeBuild webhook context, Cloud Build trigger substitutions, CircleCI branch, Azure Pipelines pull request, Jenkins change request, Buildkite branch or commit message, or commit text entering an agent prompt;
- model output flowing into shell commands;
- AI jobs with write permissions;
- Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite agent jobs that execute model output or expose CI tokens, secrets, credentials, contexts, service connections, deployments, OIDC tokens, Kubernetes secret refs, or variable groups;
- n8n webhook or email triggers flowing through AI nodes into HTTP, code, or command nodes;
- broad MCP filesystem, shell, browser, or GitHub tools;
- low-code automation flows that chain AI steps into side effects;
- Dify, Flowise, Langflow, Node-RED, Make, Pipedream, and Airflow workflows where LLM output reaches HTTP, tools, shell, or deployment actions;
- browser-use, Skyvern, Playwright, and Puppeteer traces where AI decisions reach browser side effects.

## Why This Can Win Stars

High-star automation projects show the pattern:

- [n8n](https://github.com/n8n-io/n8n) and [Activepieces](https://github.com/activepieces/activepieces) prove workflow automation plus AI/MCP integrations is a large developer category.
- [Dify](https://github.com/langgenius/dify) proves agentic workflow development is a production platform category.
- [browser-use](https://github.com/browser-use/browser-use), [Skyvern](https://github.com/Skyvern-AI/skyvern), and [Playwright MCP](https://github.com/microsoft/playwright-mcp) prove browser/tool automation for agents is sticky.
- [Anthropic Skills](https://github.com/anthropics/skills), [AGENTS.md](https://github.com/agentsmd/agents.md), Gemini CLI context files, and [awesome-copilot](https://github.com/github/awesome-copilot) show that agent instructions and skills are becoming a distribution layer.

The crowded side is building more automation. The open wedge is guarding automation before it runs. Agentic Workflow Guard is built for that gap: a local, CI-friendly, no-LLM scanner that gives security teams and maintainers concrete findings before an agent gets write access.

## Use Cases

Agentic Workflow Guard is useful when automation touches external input, credentials, or write-capable tools.

| Scenario | What it protects |
| --- | --- |
| AI-powered GitHub Actions | Prevents issue, PR, comment, or discussion text from steering an agent into privileged workflow actions. |
| Agent jobs in Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite | Catches pull request text, merge request text, branch names, workflow parameters, commit messages, CI tokens, Travis secure env, Drone secrets, TeamCity secure parameters, Harness secrets, Tekton/Argo Kubernetes secret refs, CodeBuild Secrets Manager or Parameter Store env, Cloud Build Secret Manager env, CircleCI contexts, Azure service connections, Jenkins credentials, Bitbucket deployments/OIDC tokens, Buildkite env secrets, and variable groups reaching agent prompts or shell sinks. |
| n8n operations workflows | Detects Webhook or email triggers flowing through AI nodes into HTTP, Code, Execute Command, or credential-bearing nodes. |
| MCP tool configs | Flags broad filesystem, shell, browser, GitHub, Docker, Kubernetes, or cloud tools before agents can call them. |
| Low-code AI automation | Finds Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, and Node-RED flows where AI output is chained into API calls, tools, requests, or code execution. |
| Airflow AI DAGs | Catches DAGs that combine LLM calls with Bash, Docker, Kubernetes, HTTP, or Python side-effect operators. |
| Browser automation agents | Flags browser-use, Skyvern, Playwright, and Puppeteer traces where AI-driven steps click, fill, submit, upload, or approve. |
| CI and code scanning | Emits SARIF so workflow risks can be tracked like code vulnerabilities. |
| Agent skill reviews | Ships instructions and skill bundles so Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, Hermes, and AGENTS.md-aware agents can audit workflows consistently. |

## Quick Start

Initialize a repository with `.awg.yml` and a GitHub Actions workflow:

```bash
node ./bin/agentic-workflow-guard.js init .
```

Run against the unsafe AI PR bot demo:

```bash
node ./bin/agentic-workflow-guard.js scan examples/unsafe-ai-pr-bot --format markdown
```

Run against a repository:

```bash
node ./bin/agentic-workflow-guard.js scan . --format markdown
```

Fail CI on medium and high findings:

```bash
node ./bin/agentic-workflow-guard.js scan . --profile strict --format sarif > awg.sarif
```

Emit SARIF for GitHub Code Scanning:

```bash
node ./bin/agentic-workflow-guard.js scan . --format sarif --output awg.sarif
```

Print stable JSON schemas:

```bash
node ./bin/agentic-workflow-guard.js schema report
node ./bin/agentic-workflow-guard.js schema fix
node ./bin/agentic-workflow-guard.js schema config
node ./bin/agentic-workflow-guard.js schema rule-pack
node ./bin/agentic-workflow-guard.js schema benchmark-corpus
node ./bin/agentic-workflow-guard.js schema benchmark-report
```

Explain a rule:

```bash
node ./bin/agentic-workflow-guard.js explain AWI001
```

Preview remediation:

```bash
node ./bin/agentic-workflow-guard.js fix . --dry-run
node ./bin/agentic-workflow-guard.js fix . --format json
node ./bin/agentic-workflow-guard.js fix . --format json --output awg-fix.json
```

Generate a reviewable patch without editing files:

```bash
node ./bin/agentic-workflow-guard.js fix . --patch
```

Apply low-risk automatic fixes:

```bash
node ./bin/agentic-workflow-guard.js fix . --apply
```

Create a baseline for existing findings:

```bash
node ./bin/agentic-workflow-guard.js baseline create .
node ./bin/agentic-workflow-guard.js scan . --baseline .awg-baseline.json
```

Verify the bundled benchmark fixtures:

```bash
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js benchmark --format json
```

Export the public benchmark corpus metadata:

```bash
node ./bin/agentic-workflow-guard.js benchmark corpus --format json
```

Export the MCP resource pack:

```bash
node ./bin/agentic-workflow-guard.js mcp resources --format json
```

Inspect and install focused rule packs:

```bash
node ./bin/agentic-workflow-guard.js rules registry --format json
node ./bin/agentic-workflow-guard.js rules install github-actions-hardening .
node ./bin/agentic-workflow-guard.js rules install ci-pipeline-hardening .
node ./bin/agentic-workflow-guard.js rules install mcp-tool-governance .
```

Initialize config and CI scaffolding:

```bash
node ./bin/agentic-workflow-guard.js init . --profile balanced
node ./bin/agentic-workflow-guard.js init . --ci none
node ./bin/agentic-workflow-guard.js init . --force
```

Export a Skillpack Forge manifest:

```bash
node ./bin/agentic-workflow-guard.js skillpack > skillpack.yaml
npx skillpack-forge compile . --dry-run
npx skillpack-forge compile .
npx skillpack-forge doctor .
npx skillpack-forge diff .
```

Confirm mainstream agent support:

```bash
node ./bin/agentic-workflow-guard.js agents
node ./bin/agentic-workflow-guard.js agents install claude .
node ./bin/agentic-workflow-guard.js agents install gemini .
node ./bin/agentic-workflow-guard.js agents install mcp-resources .
```

## Commands

| Command | Purpose |
| --- | --- |
| `init [path] --ci github-actions|none` | Scaffolds `.awg.yml` and, by default, `.github/workflows/agentic-workflow-guard.yml` for Code Scanning adoption. |
| `init [path] --profile advisory|balanced|strict --force` | Chooses rollout strictness and overwrites existing scaffolded files when explicitly requested. |
| `scan [path] --format markdown` | Human-readable report for local review, issues, and PRs. |
| `scan [path] --format json` | Machine-readable findings. |
| `scan [path] --format sarif` | GitHub Code Scanning compatible output. |
| `scan [path] --output awg.sarif` | Writes the selected report format to a file and prints a short summary. |
| `scan [path] --profile advisory|balanced|strict` | Controls exit severity for rollout, default CI, or strict enforcement. |
| `scan [path] --baseline .awg-baseline.json` | Suppresses existing findings so CI can fail only on new risks. |
| `baseline create [path]` | Writes `.awg-baseline.json` with stable finding fingerprints. |
| `fix [path] --dry-run` | Generates a remediation plan without editing workflows. |
| `fix [path] --format json` | Emits structured fix recipes with confidence, automatic/manual mode, patch availability, approval snippets, next steps, and changed file counts. |
| `fix [path] --output awg-fix.json` | Writes the selected fix plan, JSON recipe report, or patch preview to a file for PR bots and agent loops. |
| `fix [path] --patch` | Emits a reviewable diff for low-risk permission downgrades, MCP filesystem read-only scoping, and CI dry-run defaults without editing files. |
| `fix [path] --apply` | Applies low-risk GitHub Actions permission downgrades, MCP filesystem root narrowing/read-only settings, and GitHub/Bitbucket/GitLab/Travis/Drone/TeamCity/Harness/Tekton/Argo/CodeBuild/Cloud Build/CircleCI/Azure/Jenkins/Buildkite dry-run markers, then leaves remaining findings for review. |
| `explain <rule-id>` | Shows risk and remediation for a rule. |
| `rules --format markdown|json` | Local rule marketplace/catalog. |
| `rules list` | Lists installable rule packs. |
| `rules registry` | Prints the bundled and community rule-pack registry with aliases, checksums, and install commands. |
| `rules search <query>` | Searches rules by platform, risk, or remediation text. |
| `rules install core [path]` | Installs v1 core rule pack metadata and a lock file into `.awg/rules/`. |
| `rules install github-actions-hardening [path]` | Installs a focused GitHub Actions community rule pack. |
| `rules install ci-pipeline-hardening [path]` | Installs a focused Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite community rule pack. |
| `rules install low-code-automation [path]` | Installs a focused low-code and browser automation community rule pack. |
| `rules install mcp-tool-governance [path]` | Installs a focused MCP tool governance community rule pack. |
| `rules verify <file>` | Verifies rule pack schema metadata and checksum before use. |
| `schema report` | Emits the stable JSON Schema for `scan --format json` reports. |
| `schema fix` | Emits the stable JSON Schema for `fix --format json` recipe reports. |
| `schema config` | Emits the stable JSON Schema for `.awg.yml`, `.awg.yaml`, and `.awg.json` repository config. |
| `schema rule-pack` | Emits the stable rule pack schema for marketplace metadata. |
| `schema benchmark-corpus` | Emits the stable benchmark corpus metadata schema. |
| `schema benchmark-report` | Emits the stable benchmark scoring report schema. |
| `benchmark [path] --format markdown|json` | Runs safe/vulnerable fixture snapshots and emits a scored benchmark report. |
| `benchmark corpus [path] --format markdown|json` | Emits portable metadata for the vulnerable/safe benchmark corpus. |
| `mcp resources --format markdown|json` | Prints MCP-style resource descriptors for rules, benchmarks, skills, and remediation playbooks. |
| `agents --format markdown|json` | Prints the supported AI agent instruction and skill outputs. |
| `agents install <target> [path]` | Installs Claude, Codex, Gemini, OpenClaw, Hermes, Cursor, Copilot, AGENTS.md, or MCP resource files into a project. |
| `release check [path] --target 1.0.0` | Runs the v1 release gates for schemas, rule IDs, platform fixtures, agent files, Action metadata, docs, and npm readiness. |
| `npm run release:prepare -- --version 1.0.1 --dry-run` | Previews the package version bump and release-tag doc updates before the next release. |
| `npm run release:status -- --version 1.0.0` | Checks the release tag, GitHub Release, latest release dry-run, `NPM_TOKEN`, npm auth, and npm publication state before launch. |
| `npm run release:verify -- --version 1.0.0 --dry-run` | Prints the GitHub Release, npm registry, and npx smoke checks to run after publication. |
| `npm run release:sync:check` | Verifies generated rule-pack, benchmark corpus, and MCP resource JSON files are in sync with runtime metadata. |
| `skillpack` | Emits a Skillpack Forge manifest for Claude, Codex, Cursor, Copilot, and AGENTS.md. |

## Agent Compatibility

Agentic Workflow Guard now covers the mainstream agent context surfaces used by AI coding tools.

| Agent | Support | Files |
| --- | --- | --- |
| AGENTS.md ecosystem | Supported | `AGENTS.md` |
| Claude Code | Supported | `.claude/skills/agentic-workflow-guard-auditor/SKILL.md` |
| Codex | Supported | `.codex/skills/agentic-workflow-guard-auditor/SKILL.md` |
| Cursor | Supported | `.cursor/rules/agentic-workflow-guard.mdc` |
| GitHub Copilot | Supported | `.github/copilot-instructions.md` |
| Gemini CLI | Supported | `GEMINI.md`, `.gemini/skills/agentic-workflow-guard-auditor/SKILL.md` |
| OpenClaw | Supported | `skills/agentic-workflow-guard-auditor/SKILL.md`, `.openclaw/skills/agentic-workflow-guard-auditor/SKILL.md` |
| Hermes | Supported | `skills/agentic-workflow-guard-auditor/SKILL.md`, `.hermes/skills/agentic-workflow-guard-auditor/SKILL.md` |
| MCP resource pack | Supported | `mcp/resources/agentic-workflow-guard.resources.json`, `rules/marketplace.json`, `rules/registry.json`, `rules/community/*.json`, `benchmarks/fixtures.json`, `benchmarks/corpus.json`, `schemas/*.json`, `docs/playbooks/*.md` |

Claude, Codex, Cursor, Copilot, AGENTS.md, and Gemini use repository-local instruction files directly. OpenClaw and Hermes support is shipped as portable `SKILL.md` bundles so teams can use the shared `skills/` package, a namespaced project copy, or their runtime-specific skill install directory. The MCP resource pack uses stable `awg://` URIs so an MCP server or agent runtime can expose the core rules, benchmark fixtures, benchmark corpus, report schemas, auditor skill, and remediation playbooks as contextual resources.

## Rule Catalog

| Rule | Severity | What it catches |
| --- | --- | --- |
| `AWI001` | High | Untrusted CI or workflow context reaches an agent prompt. |
| `AWI002` | High | Agent output flows into shell or workflow commands. |
| `AWI003` | High | AI workflow has write-capable permissions. |
| `AWI004` | High | `pull_request_target` combines elevated context with agent/script execution. |
| `AWI005` | High | n8n untrusted trigger reaches AI and side-effect node. |
| `AWI006` | High | MCP exposes broad high-risk tools. |
| `AWI007` | Medium | Secrets or environment values are visible to agent context. |
| `AWI008` | Medium | Agentic workflow lacks approval, allowlist, dry-run, or safe-output controls. |
| `AWI009` | Medium | Workflow automation chains AI into side-effect actions. |
| `AWI010` | Medium | Browser automation trace chains AI into side-effect actions. |

## Configuration

Add `.awg.yml` to tune CI behavior:

```yaml
ignore:
  - node_modules/**
  - dist/**
profile: balanced
severityThreshold: high
rules:
  AWI007: off
```

`profile` controls rollout mode: `advisory` reports without blocking normal findings, `balanced` fails on high severity findings, and `strict` fails on medium and high findings. `severityThreshold` can override the profile default. `rules` can disable noisy checks for a repository, while `ignore` removes generated files or fixture directories from scanning. Use `.awg-baseline.json` when adopting the scanner in an existing repository and you want CI to fail only on newly introduced findings.

The config format is documented by a stable schema:

```bash
node ./bin/agentic-workflow-guard.js schema config
```

The public schema URL is `https://guorunjie.github.io/agentic-workflow-guard/schemas/config.schema.json`.

For reviewed exceptions, use inline suppressions with a reason:

```yaml
# awg-ignore AWI001: issue body is copied from an internal release form
prompt: "Summarize ${{ github.event.issue.body }}"
```

Suppression comments without a reason are ignored. See [Policy Profiles and Suppressions](docs/policy-profiles-and-suppressions.md) for rollout guidance.

JSON and Markdown reports include a `Suppressed findings` audit trail so reviewed exceptions remain visible in CI logs and security reviews.

## GitHub Action

Use this repository as a GitHub Action and upload SARIF to GitHub Code Scanning:

```bash
node ./bin/agentic-workflow-guard.js init .
```

```yaml
name: agentic workflow guard

on:
  pull_request:
  push:
    branches: [main]

jobs:
  guard:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v6
      - uses: guorunjie/agentic-workflow-guard@v1.0.0
        with:
          path: .
          format: sarif
          profile: balanced
          output: awg.sarif
          fix-format: json
          fix-output: awg-fix.json
        continue-on-error: true
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: awg.sarif
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: agentic-workflow-guard-fix-report
          path: awg-fix.json
```

For GitHub Marketplace, use a release tag, for example `guorunjie/agentic-workflow-guard@v1.0.0`. The optional `fix-output` input writes a structured remediation artifact for PR bots, review comments, or follow-up agent loops.

## Examples

```bash
node ./bin/agentic-workflow-guard.js scan examples/unsafe-ai-pr-bot --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-github-action --format json
node ./bin/agentic-workflow-guard.js scan examples/safe-github-action --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-bitbucket-pipelines --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-gitlab-ci --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-travis-ci --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-drone-ci --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-teamcity --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-harness --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-tekton --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-argo-workflows --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-aws-codebuild --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-google-cloud-build --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-circleci --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-azure-pipelines --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-buildkite --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-jenkins --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-n8n --format sarif
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-mcp --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-dify --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-flowise --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-langflow --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-node-red --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-make --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-pipedream --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-zapier --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-airflow --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-browser-trace --format markdown
node ./bin/agentic-workflow-guard.js scan examples/safe-browser-trace --format markdown
node ./bin/agentic-workflow-guard.js fix examples/unsafe-ai-pr-bot --format json
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js benchmark --format json
node ./bin/agentic-workflow-guard.js benchmark corpus --format json
node ./bin/agentic-workflow-guard.js mcp resources
```

## Evolution Roadmap

The goal is to become the safety skill for mainstream automation platforms.

| Stage | Coverage | Output |
| --- | --- | --- |
| v0.1 | GitHub Actions, n8n, MCP config, low-code JSON heuristics | CLI, SARIF, GitHub Action, rule catalog, Skillpack Forge export |
| v0.2 | Activepieces, Zapier, Make, Pipedream, Node-RED, Airflow | Platform examples and native risk evidence |
| v0.3 | Baseline mode, browser traces, agent install helpers, patch output | `baseline create`, `fix --patch`, `agents install`, AWI010 |
| v0.4 | Rule marketplace and benchmark snapshots | `rules list/search/install/verify`, checksums, `benchmark` |
| v0.5 | Mainstream agent skill package | Claude/Codex/Cursor/Copilot/Gemini/OpenClaw/Hermes/AGENTS generated and tested, MCP resources, remediation playbooks |
| v0.9 | Structured remediation plans | `fix --format json`, `fix --output`, recipe confidence, automatic/manual modes, fix report schema |
| v0.10 | Trusted marketplace metadata | Rule pack schema, compatibility metadata, provenance, install lock file |
| v0.11 | Public docs and schema URLs | GitHub Pages artifact, Marketplace page, schema aliases, `docs:build` |
| v0.12 | Zapier benchmark coverage | Zapier-specific evidence, vulnerable/safe Zap fixtures, benchmark matrix |
| v0.13 | GitLab CI and CircleCI coverage | CI agent scanner, token/context evidence, vulnerable/safe CI fixtures |
| v0.14 | Azure Pipelines and Jenkins coverage | Service connection and credential evidence, vulnerable/safe pipeline fixtures |
| v0.15 | Platform-aware remediation engine | GitHub permissions, MCP filesystem read-only scoping, and GitHub/GitLab/CircleCI/Azure/Jenkins dry-run defaults in `fix --patch`, `fix --apply`, and JSON recipes |
| v0.16 | Approval snippet recipes | `fix --format json` and Markdown plans include next steps plus approval, artifact, scope, and allowlist snippets |
| v0.17 | Community rule-pack registry | Installable `github-actions-hardening`, `ci-pipeline-hardening`, `low-code-automation`, and `mcp-tool-governance` packs, registry JSON, docs, and MCP resources |
| v0.18 | Benchmark corpus distribution | Static corpus JSON, corpus CLI output, Pages, MCP, and agent install distribution |
| v0.19 | Benchmark schemas and scoring | `benchmark --format json`, pass-rate scoring, corpus/report schemas, Pages and MCP schema distribution |
| v0.20 | Marketplace and install readiness | Action self-smoke workflow, Marketplace metadata polish, package smoke script, demo playbook |
| v1.0 prep | Buildkite, Bitbucket Pipelines, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, and CI rule-pack expansion | Buildkite, Bitbucket, Travis, Drone, TeamCity, Harness, Tekton, Argo, CodeBuild, and Cloud Build scanners, dry-run fixes, safe/vulnerable fixtures, benchmark corpus, and `ci-pipeline-hardening` rule pack |
| v1.0 | CI-grade scanner for agentic automation | Stable schema, SemVer rules, release-tagged GitHub Action, npm package, and GitHub Marketplace release |

See [ROADMAP.md](ROADMAP.md) for the full path to mainstream platform coverage, [docs/v1-readiness.md](docs/v1-readiness.md) for the remaining 1.0 release gates, and [docs/use-cases-and-growth.md](docs/use-cases-and-growth.md) for the high-star growth strategy.

## Contributing And Security

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before adding platform scanners, rule packs, benchmark fixtures, fix recipes, or agent outputs.
- Use [SECURITY.md](SECURITY.md) for scanner bypasses, unsafe automatic fixes, package integrity issues, and private vulnerability reporting guidance.
- Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) in public issues, reviews, and security-sensitive discussions.
- Pull requests should use the checklist in `.github/pull_request_template.md`; issue templates cover bug reports, platform coverage requests, and rule-pack proposals.

## Development

```bash
npm test
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-github-action --format json
node ./bin/agentic-workflow-guard.js benchmark --format json
node ./bin/agentic-workflow-guard.js benchmark corpus --format json
node ./bin/agentic-workflow-guard.js mcp resources --format json
npm run docs:build
npm run smoke:package
npm run release:prepare -- --version 1.0.1 --dry-run
npm run release:status -- --version 1.0.0 --dry-run
npm run release:verify -- --version 1.0.0 --dry-run
npm run release:sync:check
npm run release:check
npm pack --dry-run
```

Agentic Workflow Guard is intentionally deterministic: no LLM call, no API key, no hosted service.
