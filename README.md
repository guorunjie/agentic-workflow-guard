# Agentic Workflow Guard

Semgrep-style security scanner for AI automation workflows.

Find prompt-injection paths, overpowered tools, unsafe GitHub Actions, risky n8n flows, low-code workflow side effects, and MCP permission leaks before your AI automation runs.

Agentic Workflow Guard is a static security scanner for AI automation workflows. It scans repositories and workflow exports for risky paths such as:

- untrusted GitHub issue or pull request text entering an agent prompt;
- model output flowing into shell commands;
- AI jobs with write permissions;
- n8n webhook or email triggers flowing through AI nodes into HTTP, code, or command nodes;
- broad MCP filesystem, shell, browser, or GitHub tools;
- low-code automation flows that chain AI steps into side effects.

```bash
npx agentic-workflow-guard scan . --format markdown
npx agentic-workflow-guard scan . --format sarif
npx agentic-workflow-guard explain AWI001
```

## Why This Can Win Stars

High-star automation projects show the pattern:

- [n8n](https://github.com/n8n-io/n8n) and [Activepieces](https://github.com/activepieces/activepieces) prove workflow automation plus AI/MCP integrations is a large developer category.
- [Dify](https://github.com/langgenius/dify) proves agentic workflow development is a production platform category.
- [browser-use](https://github.com/browser-use/browser-use), [Skyvern](https://github.com/Skyvern-AI/skyvern), and [Playwright MCP](https://github.com/microsoft/playwright-mcp) prove browser/tool automation for agents is sticky.
- [Anthropic Skills](https://github.com/anthropics/skills), [AGENTS.md](https://github.com/agentsmd/agents.md), and [awesome-copilot](https://github.com/github/awesome-copilot) show that agent instructions and skills are becoming a distribution layer.

The crowded side is building more automation. The open wedge is guarding automation before it runs. Agentic Workflow Guard is built for that gap: a local, CI-friendly, no-LLM scanner that gives security teams and maintainers concrete findings before an agent gets write access.

## Use Cases

Agentic Workflow Guard is useful when automation touches external input, credentials, or write-capable tools.

| Scenario | What it protects |
| --- | --- |
| AI-powered GitHub Actions | Prevents issue, PR, comment, or discussion text from steering an agent into privileged workflow actions. |
| n8n operations workflows | Detects Webhook or email triggers flowing through AI nodes into HTTP, Code, Execute Command, or credential-bearing nodes. |
| MCP tool configs | Flags broad filesystem, shell, browser, GitHub, Docker, Kubernetes, or cloud tools before agents can call them. |
| Low-code AI automation | Finds Activepieces/Zapier/Make/Pipedream-style flows where AI output is chained into API calls or code execution. |
| CI and code scanning | Emits SARIF so workflow risks can be tracked like code vulnerabilities. |
| Agent skill reviews | Generates a Skillpack Forge manifest and agent instructions so Codex, Claude, Cursor, and Copilot can audit workflows consistently. |

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

Export a Skillpack Forge manifest:

```bash
node ./bin/agentic-workflow-guard.js skillpack > skillpack.yaml
```

## Commands

| Command | Purpose |
| --- | --- |
| `scan [path] --format markdown` | Human-readable report for local review, issues, and PRs. |
| `scan [path] --format json` | Machine-readable findings. |
| `scan [path] --format sarif` | GitHub Code Scanning compatible output. |
| `fix [path] --dry-run` | Generates a remediation plan without editing workflows. |
| `explain <rule-id>` | Shows risk and remediation for a rule. |
| `rules --format markdown|json` | Local rule marketplace/catalog. |
| `skillpack` | Emits a Skillpack Forge manifest for Claude, Codex, Cursor, Copilot, and AGENTS.md. |

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
| `AWI009` | Medium | Low-code automation chains AI into side-effect actions. |

## GitHub Action

Use this repository as a GitHub Action:

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
```

## Examples

```bash
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-github-action --format json
node ./bin/agentic-workflow-guard.js scan examples/safe-github-action --format markdown
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-n8n --format sarif
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-mcp --format markdown
```

## Evolution Roadmap

The goal is to become the safety skill for mainstream automation platforms.

| Stage | Coverage | Output |
| --- | --- | --- |
| v0.1 | GitHub Actions, n8n, MCP config, low-code JSON heuristics | CLI, SARIF, GitHub Action, rule catalog, Skillpack Forge export |
| v0.2 | Activepieces, Zapier, Make, Pipedream exports | More scanners and platform-specific examples |
| v0.3 | Auto-fix recipes for permissions, prompt gates, dry-run wrappers | `fix --apply` with patch review |
| v0.4 | Rule marketplace and community rule packs | `rules install`, external rule metadata |
| v0.5 | Mainstream agent skill package | Claude/Codex/Cursor/Copilot/AGENTS generated and tested |
| v1.0 | CI-grade scanner for agentic automation | Stable schema, SemVer rules, GitHub Marketplace release |

See [ROADMAP.md](ROADMAP.md) for the full path to mainstream platform coverage and [docs/use-cases-and-growth.md](docs/use-cases-and-growth.md) for the high-star growth strategy.

## Development

```bash
npm test
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-github-action --format json
npm pack --dry-run
```

Agentic Workflow Guard is intentionally deterministic: no LLM call, no API key, no hosted service.
