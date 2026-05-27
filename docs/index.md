# Agentic Workflow Guard Docs

Agentic Workflow Guard is a deterministic security scanner and portable skill pack for AI automation workflows.

## Start Here

- [README](../README.md): quick start, command reference, agent compatibility, and GitHub Action usage.
- [Policy Profiles and Suppressions](policy-profiles-and-suppressions.md): rollout profiles, inline suppression rules, and audit expectations.
- [Benchmark Fixtures](benchmark-fixtures.md): vulnerable and safe fixture coverage plus the public `benchmarks/corpus.json` metadata.
- [Demo Playbook](demos.md): short, high-signal demos for GitHub Actions, n8n, MCP, browser automation, and benchmark proof.
- [v1.0 Readiness](v1-readiness.md): release gates, blockers, and the practical path from v0.20 to v1.0.
- [GitHub Action Marketplace Guide](github-action-marketplace.md): release-tagged Action usage and Marketplace checklist.
- [Report Schema](../schemas/agentic-workflow-guard-report.schema.json): stable JSON schema for machine-readable scan reports.
- [Fix Report Schema](../schemas/agentic-workflow-guard-fix-report.schema.json): stable JSON schema for structured remediation recipes, approval snippets, and next steps.
- [Rule Pack Schema](../schemas/agentic-workflow-guard-rule-pack.schema.json): stable JSON schema for trusted marketplace metadata.
- [Benchmark Corpus Schema](../schemas/agentic-workflow-guard-benchmark-corpus.schema.json): stable JSON schema for public benchmark corpus metadata.
- [Benchmark Report Schema](../schemas/agentic-workflow-guard-benchmark-report.schema.json): stable JSON schema for scored benchmark reports.
- [Rule Marketplace](rule-marketplace.md): bundled and community-style pack registry, install, verify, and contribution workflow.
- [GitHub Pages Site Source](../docs-site/index.html): static docs landing page, Marketplace page, and schema URL aliases.
- [Use Cases and Growth Strategy](use-cases-and-growth.md): positioning, growth path, and optimization directions.
- [NPM Publish Checklist](npm-publish.md): package publication and release verification steps.

## Remediation Playbooks

- [GitHub Actions](playbooks/github-actions.md)
- [GitLab CI, CircleCI, Azure Pipelines, Jenkins, and Buildkite](playbooks/ci-pipelines.md)
- [n8n](playbooks/n8n.md)
- [MCP Tool Governance](playbooks/mcp.md)
- [Low-Code AI Workflows](playbooks/low-code.md)
- [Browser Automation](playbooks/browser-automation.md)

## Core Verification

```bash
npm test
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js benchmark --format json
node ./bin/agentic-workflow-guard.js benchmark corpus --format json
node ./bin/agentic-workflow-guard.js mcp resources --format json
node ./bin/agentic-workflow-guard.js schema report
node ./bin/agentic-workflow-guard.js schema fix
node ./bin/agentic-workflow-guard.js schema rule-pack
node ./bin/agentic-workflow-guard.js schema benchmark-corpus
node ./bin/agentic-workflow-guard.js schema benchmark-report
node ./bin/agentic-workflow-guard.js release check --target 1.0.0
npm run release:prepare -- --version 1.0.0-rc.1 --dry-run
npm run docs:build
npm run smoke:package
npm run release:sync:check
npm pack --dry-run
```
