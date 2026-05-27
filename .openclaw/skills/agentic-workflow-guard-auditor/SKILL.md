---
name: agentic-workflow-guard-auditor
description: Use before granting AI automation write access, reviewing agentic GitHub Actions, auditing n8n, Node-RED, Make, Pipedream, Airflow, browser automation, or checking MCP tool configs for prompt-injection and side-effect risks.
---

# Agentic Workflow Guard Auditor

## Purpose
Agentic Workflow Guard is a deterministic scanner for AI automation workflows. Use it to find prompt-injection paths, model-output-to-shell sinks, broad write permissions, risky MCP tools, Airflow AI DAGs, browser automation side effects, and low-code AI steps chained into external side effects.

## Workflow
1. Run `agentic-workflow-guard scan . --format markdown` for local review.
2. Run `agentic-workflow-guard scan . --format sarif` when the result should feed GitHub Code Scanning.
3. Use `agentic-workflow-guard scan . --baseline .awg-baseline.json` in existing repositories.
4. Prioritize high severity AWI001-AWI006 findings before medium AWI007-AWI010 controls.
5. Use `agentic-workflow-guard explain <rule-id>` for rule-specific risk and remediation.
6. Use `agentic-workflow-guard fix . --patch` for a reviewable permission diff.
7. Use `agentic-workflow-guard fix . --apply` only for low-risk GitHub Actions permission downgrades.
8. Use `agentic-workflow-guard rules search <platform>` to find relevant rule metadata.
9. Use `agentic-workflow-guard rules verify <file>` before trusting external rule packs.
10. Use `agentic-workflow-guard benchmark` to verify fixture snapshots.
11. Use `agentic-workflow-guard mcp resources --format json` to expose rules, benchmarks, skill instructions, and remediation playbooks.
12. Use `agentic-workflow-guard agents install <target>` to install agent context files into another project.
13. Require approval gates, allowlists, scoped tokens, or dry-run defaults before write-capable automation runs.

## Review Checklist
- Treat GitHub issues, pull requests, comments, webhooks, emails, and form inputs as untrusted prompt input.
- Never pipe raw model output into shell commands, scripts, release steps, deployment commands, or repository writes.
- Downgrade broad GitHub permissions and tool scopes unless a workflow truly needs them.
- Keep secrets out of agent-visible prompts and environment variables.
- Prefer human review for any agent output that can modify code, tickets, deployments, cloud resources, or customer data.

## Commands
- `agentic-workflow-guard scan . --format markdown`
- `agentic-workflow-guard scan . --format json`
- `agentic-workflow-guard scan . --format sarif`
- `agentic-workflow-guard benchmark`
- `agentic-workflow-guard mcp resources --format json`
- `agentic-workflow-guard baseline create .`
- `agentic-workflow-guard scan . --baseline .awg-baseline.json`
- `agentic-workflow-guard fix . --patch`
- `agentic-workflow-guard fix . --apply`
- `agentic-workflow-guard explain AWI001`
- `agentic-workflow-guard rules search github`
- `agentic-workflow-guard rules install core .`
- `agentic-workflow-guard rules verify .awg/rules/agentic-workflow-guard-core-rules.json`
- `agentic-workflow-guard agents install claude .`
- `agentic-workflow-guard agents`
