# Agentic Workflow Guard Docs

Agentic Workflow Guard is a deterministic security scanner and portable skill pack for AI automation workflows.

## Start Here

- [README](../README.md): quick start, command reference, agent compatibility, and GitHub Action usage.
- [Policy Profiles and Suppressions](policy-profiles-and-suppressions.md): rollout profiles, inline suppression rules, and audit expectations.
- [Benchmark Fixtures](benchmark-fixtures.md): vulnerable and safe fixture coverage.
- [GitHub Action Marketplace Guide](github-action-marketplace.md): release-tagged Action usage and Marketplace checklist.
- [Use Cases and Growth Strategy](use-cases-and-growth.md): positioning, growth path, and optimization directions.
- [NPM Publish Checklist](npm-publish.md): package publication and release verification steps.

## Remediation Playbooks

- [GitHub Actions](playbooks/github-actions.md)
- [n8n](playbooks/n8n.md)
- [MCP Tool Governance](playbooks/mcp.md)
- [Low-Code AI Workflows](playbooks/low-code.md)
- [Browser Automation](playbooks/browser-automation.md)

## Core Verification

```bash
npm test
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js mcp resources --format json
npm pack --dry-run
```
