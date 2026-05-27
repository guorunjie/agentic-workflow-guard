# Agentic Workflow Guard

Security scanner and portable skill pack for AI automation workflows.

Find prompt-injection paths, overpowered tools, unsafe GitHub Actions, risky n8n flows, low-code workflow side effects, and MCP permission leaks before your AI automation runs.

Agentic Workflow Guard is a static security scanner for AI automation workflows. It scans repositories and workflow exports for risky paths such as:

- untrusted GitHub issue or pull request text entering an agent prompt;
- model output flowing into shell commands;
- AI jobs with write permissions;
- n8n webhook or email triggers flowing through AI nodes into HTTP, code, or command nodes;
- broad MCP filesystem, shell, browser, or GitHub tools;
- low-code automation flows that chain AI steps into side effects;
- Node-RED, Make, Pipedream, and Airflow workflows where LLM output reaches HTTP, shell, or deployment actions.

```bash
npx agentic-workflow-guard scan . --format markdown
npx agentic-workflow-guard scan . --format sarif
npx agentic-workflow-guard explain AWI001
npx agentic-workflow-guard agents
```

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
| n8n operations workflows | Detects Webhook or email triggers flowing through AI nodes into HTTP, Code, Execute Command, or credential-bearing nodes. |
| MCP tool configs | Flags broad filesystem, shell, browser, GitHub, Docker, Kubernetes, or cloud tools before agents can call them. |
| Low-code AI automation | Finds Activepieces, Zapier, Make, Pipedream, and Node-RED flows where AI output is chained into API calls or code execution. |
| Airflow AI DAGs | Catches DAGs that combine LLM calls with Bash, Docker, Kubernetes, HTTP, or Python side-effect operators. |
| CI and code scanning | Emits SARIF so workflow risks can be tracked like code vulnerabilities. |
| Agent skill reviews | Ships instructions and skill bundles so Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, Hermes, and AGENTS.md-aware agents can audit workflows consistently. |

## Quick Start

Run against a repository:

```bash
node ./bin/agentic-workflow-guard.js scan . --format markdown
```

Emit SARIF for GitHub Code Scanning:

```bash
node ./bin/agentic-workflow-guard.js scan . --format sarif > awg.sarif
```

Explain a rule:

```bash
node ./bin/agentic-workflow-guard.js explain AWI001
```

Preview remediation:

```bash
node ./bin/agentic-workflow-guard.js fix . --dry-run
```

Apply low-risk permission fixes:

```bash
node ./bin/agentic-workflow-guard.js fix . --apply
```

Start from the sample config:

```bash
cp .awg.example.yml .awg.yml
```

Export a Skillpack Forge manifest:

```bash
node ./bin/agentic-workflow-guard.js skillpack > skillpack.yaml
```

Confirm mainstream agent support:

```bash
node ./bin/agentic-workflow-guard.js agents
```

## Commands

| Command | Purpose |
| --- | --- |
| `scan [path] --format markdown` | Human-readable report for local review, issues, and PRs. |
| `scan [path] --format json` | Machine-readable findings. |
| `scan [path] --format sarif` | GitHub Code Scanning compatible output. |
| `fix [path] --dry-run` | Generates a remediation plan without editing workflows. |
| `fix [path] --apply` | Applies low-risk GitHub Actions permission downgrades and leaves remaining findings for review. |
| `explain <rule-id>` | Shows risk and remediation for a rule. |
| `rules --format markdown|json` | Local rule marketplace/catalog. |
| `rules list` | Lists installable rule packs. |
| `rules search <query>` | Searches rules by platform, risk, or remediation text. |
| `rules install core [path]` | Installs core rule pack metadata into `.awg/rules/`. |
| `agents --format markdown|json` | Prints the supported AI agent instruction and skill outputs. |
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

Claude, Codex, Cursor, Copilot, AGENTS.md, and Gemini use repository-local instruction files directly. OpenClaw and Hermes support is shipped as portable `SKILL.md` bundles so teams can use the shared `skills/` package, a namespaced project copy, or their runtime-specific skill install directory.

## Rule Catalog

| Rule | Severity | What it catches |
| --- | --- | --- |
| `AWI001` | High | Untrusted GitHub event context reaches an agent prompt. |
| `AWI002` | High | Agent output flows into shell or workflow commands. |
| `AWI003` | High | AI workflow has write-capable permissions. |
| `AWI004` | High | `pull_request_target` combines elevated context with agent/script execution. |
| `AWI005` | High | n8n untrusted trigger reaches AI and side-effect node. |
| `AWI006` | High | MCP exposes broad high-risk tools. |
| `AWI007` | Medium | Secrets or environment values are visible to agent context. |
| `AWI008` | Medium | Agentic workflow lacks approval, allowlist, dry-run, or safe-output controls. |
| `AWI009` | Medium | Workflow automation chains AI into side-effect actions. |

## Configuration

Add `.awg.yml` to tune CI behavior:

```yaml
ignore:
  - node_modules/**
  - dist/**
severityThreshold: high
rules:
  AWI007: off
```

`severityThreshold` controls the CLI exit code. `rules` can disable noisy checks for a repository, while `ignore` removes generated files or fixture directories from scanning.

## GitHub Action

Use this repository as a GitHub Action and upload SARIF to GitHub Code Scanning:

```yaml
name: agentic workflow guard

on:
  pull_request:
  push:
    branches: [main]

jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: guorunjie/agentic-workflow-guard@main
        with:
          path: .
          format: sarif
        continue-on-error: true
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: awg.sarif
```

For GitHub Marketplace, use the version tag once a release is cut, for example `guorunjie/agentic-workflow-guard@v0.2.0`.

## Examples

```bash
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-github-action --format json
node ./bin/agentic-workflow-guard.js scan examples/safe-github-action --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-n8n --format sarif
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-mcp --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-node-red --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-make --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-pipedream --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-airflow --format markdown
```

## Evolution Roadmap

The goal is to become the safety skill for mainstream automation platforms.

| Stage | Coverage | Output |
| --- | --- | --- |
| v0.1 | GitHub Actions, n8n, MCP config, low-code JSON heuristics | CLI, SARIF, GitHub Action, rule catalog, Skillpack Forge export |
| v0.2 | Activepieces, Zapier, Make, Pipedream, Node-RED, Airflow | Platform examples and native risk evidence |
| v0.3 | Auto-fix recipes for permissions, prompt gates, dry-run wrappers | `fix --apply` with permission patch review |
| v0.4 | Rule marketplace and community rule packs | `rules list/search/install`, external rule metadata |
| v0.5 | Mainstream agent skill package | Claude/Codex/Cursor/Copilot/Gemini/OpenClaw/Hermes/AGENTS generated and tested |
| v1.0 | CI-grade scanner for agentic automation | Stable schema, SemVer rules, GitHub Marketplace release |

See [ROADMAP.md](ROADMAP.md) for the full path to mainstream platform coverage and [docs/use-cases-and-growth.md](docs/use-cases-and-growth.md) for the high-star growth strategy.

## Development

```bash
npm test
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-github-action --format json
npm pack --dry-run
```

Agentic Workflow Guard is intentionally deterministic: no LLM call, no API key, no hosted service.
