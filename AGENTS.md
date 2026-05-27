# Agent Guide: agentic-workflow-guard

Generated from `skillpack.yaml` by Skillpack Forge.

## Project
Static security scanner for AI automation workflows across GitHub Actions, n8n, MCP configs, browser traces, Airflow DAGs, and low-code workflow exports.

## Working Principles
- Treat external workflow input as untrusted until validated
- Keep AI-generated output away from shell and write-capable tools
- Require human approval, allowlists, or dry-run mode before side effects

## Commands
- install: `npm install`
- test: `npm test`
- scan: `npm run scan`
- scan-strict: `node ./bin/agentic-workflow-guard.js scan . --profile strict`
- scan-output: `node ./bin/agentic-workflow-guard.js scan . --format sarif --output awg.sarif`
- benchmark: `node ./bin/agentic-workflow-guard.js benchmark`
- mcp-resources: `node ./bin/agentic-workflow-guard.js mcp resources --format json`
- schema: `node ./bin/agentic-workflow-guard.js schema report`
- baseline: `node ./bin/agentic-workflow-guard.js baseline create .`
- patch: `node ./bin/agentic-workflow-guard.js fix . --patch`
- fix: `node ./bin/agentic-workflow-guard.js fix . --apply`
- rules: `node ./bin/agentic-workflow-guard.js rules search github`
- agents: `node ./bin/agentic-workflow-guard.js agents`
- install-agent: `node ./bin/agentic-workflow-guard.js agents install claude .`

## Agent Workflows
### agentic-workflow-guard-auditor
Use when auditing GitHub Actions, n8n, MCP, Node-RED, Make, Pipedream, Airflow, browser automation, or AI automation for AWI001-AWI010 risks.

- Run agentic-workflow-guard scan . --format markdown
- Use agentic-workflow-guard scan . --format sarif --output awg.sarif for GitHub Code Scanning uploads
- Use agentic-workflow-guard schema report when integrating machine-readable JSON reports
- Use agentic-workflow-guard scan . --profile strict in write-capable or sensitive automation repositories
- Use agentic-workflow-guard scan . --baseline .awg-baseline.json in existing repositories
- Use awg-ignore AWI001: reason only for reviewed suppressions with an audit reason
- Review Suppressed findings in JSON and Markdown reports before accepting exceptions
- Prioritize high severity AWI001-AWI006 findings and review medium AWI007-AWI010 findings
- Use agentic-workflow-guard explain AWI001 for rule-specific remediation
- Use agentic-workflow-guard fix . --patch for a reviewable permission diff
- Use agentic-workflow-guard fix . --apply only for low-risk permission downgrades
- Use agentic-workflow-guard rules search <platform> to find relevant marketplace rules
- Use agentic-workflow-guard rules verify <file> before trusting external rule packs
- Use agentic-workflow-guard benchmark to verify fixture snapshots
- Use agentic-workflow-guard mcp resources --format json to expose rules, benchmarks, skill instructions, and remediation playbooks
- Use agentic-workflow-guard agents install <target> to install agent context files into another project
- Use agentic-workflow-guard agents to confirm Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, Hermes, and AGENTS.md support files
- Prefer dry-run and approval gates before write-capable automation
