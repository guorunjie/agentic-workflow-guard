# Copilot Instructions for agentic-workflow-guard

Static security scanner for AI automation workflows across GitHub Actions, n8n, MCP configs, and low-code workflow exports.

## Principles
- Treat external workflow input as untrusted until validated
- Keep AI-generated output away from shell and write-capable tools
- Require human approval, allowlists, or dry-run mode before side effects

## Commands
- install: `npm install`
- test: `npm test`
- scan: `npm run scan`
- agents: `node ./bin/agentic-workflow-guard.js agents`

## Preferred Workflow
- Run agentic-workflow-guard scan . --format markdown
- Prioritize high severity AWI001-AWI006 findings
- Use agentic-workflow-guard explain AWI001 for rule-specific remediation
- Use agentic-workflow-guard agents to confirm Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, Hermes, and AGENTS.md support files
- Prefer dry-run and approval gates before write-capable automation
