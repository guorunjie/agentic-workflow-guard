---
name: agentic-workflow-guard-auditor
description: Use when auditing GitHub Actions, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, Buildkite, n8n, Dify, Flowise, Langflow, MCP, Node-RED, Make, Pipedream, Airflow, browser automation, or AI automation for AWI001-AWI010 risks.
---

# agentic-workflow-guard-auditor

## Project
Static security scanner for AI automation workflows across GitHub Actions, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, Buildkite, n8n, Dify, Flowise, Langflow, MCP configs, browser traces, Airflow DAGs, and low-code workflow exports.

## Workflow
- Run agentic-workflow-guard scan . --format markdown
- Use agentic-workflow-guard scan . --format sarif --output awg.sarif for GitHub Code Scanning uploads
- Use agentic-workflow-guard schema report when integrating machine-readable JSON reports
- Use agentic-workflow-guard schema fix when integrating structured fix recipe reports
- Use agentic-workflow-guard schema rule-pack when integrating trusted marketplace metadata
- Use agentic-workflow-guard schema benchmark-corpus and schema benchmark-report when integrating benchmark metadata
- Use agentic-workflow-guard scan . --profile strict in write-capable or sensitive automation repositories
- Use agentic-workflow-guard scan . --baseline .awg-baseline.json in existing repositories
- Use awg-ignore AWI001: reason only for reviewed suppressions with an audit reason
- Review Suppressed findings in JSON and Markdown reports before accepting exceptions
- Prioritize high severity AWI001-AWI006 findings and review medium AWI007-AWI010 findings
- Use agentic-workflow-guard explain AWI001 for rule-specific remediation
- Use agentic-workflow-guard fix . --patch for reviewable GitHub permission, MCP filesystem scope, and CI dry-run diffs
- Use agentic-workflow-guard fix . --format json for recipe confidence, automatic/manual modes, approval snippets, and next steps
- Use agentic-workflow-guard fix . --format json --output awg-fix.json when PR bots or agent loops need a fix artifact
- Use agentic-workflow-guard fix . --apply only for low-risk permission downgrades, MCP filesystem read-only scoping, and CI dry-run defaults
- Use agentic-workflow-guard rules search <platform> to find relevant marketplace rules
- Use agentic-workflow-guard rules registry --format json to inspect bundled and community rule-pack aliases and checksums
- Use agentic-workflow-guard rules verify <file> before trusting external rule packs; it checks schema metadata and checksum
- Use agentic-workflow-guard benchmark to verify fixture snapshots
- Use agentic-workflow-guard benchmark --format json for scored benchmark reports with missing and unexpected rules
- Use agentic-workflow-guard benchmark corpus --format json to expose portable safe/vulnerable benchmark metadata
- Use agentic-workflow-guard mcp resources --format json to expose rules, benchmarks, skill instructions, and remediation playbooks
- Use docs/demos.md when explaining the fastest GitHub Actions, n8n, MCP, browser automation, and benchmark demos
- Use npm run docs:build to verify the GitHub Pages artifact and stable schema URL aliases
- Use npm run smoke:package before releases to install the packed tarball and run the CLI through npx
- Use npm run release:prepare -- --version 1.0.1 --dry-run before releases to preview package version and release-tag changes
- Use npm run release:status -- --version 1.0.0 before publishing to check the tag, GitHub Release, release dry-run, NPM_TOKEN, npm auth, and npm publication state
- Use npm run release:verify -- --version 1.0.0 after publishing to verify GitHub Release, npm registry, npx help, and schema smoke
- Use npm run release:sync:check before releases to verify generated rule-pack, benchmark corpus, and MCP resource JSON files
- Use agentic-workflow-guard agents install <target> to install agent context files into another project
- Use agentic-workflow-guard agents to confirm Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, Hermes, and AGENTS.md support files
- Prefer dry-run and approval gates before write-capable automation

## Commands
- install: `npm install`
- test: `npm test`
- scan: `npm run scan`
- scan-strict: `node ./bin/agentic-workflow-guard.js scan . --profile strict`
- scan-output: `node ./bin/agentic-workflow-guard.js scan . --format sarif --output awg.sarif`
- benchmark: `node ./bin/agentic-workflow-guard.js benchmark`
- benchmark-report: `node ./bin/agentic-workflow-guard.js benchmark --format json`
- benchmark-corpus: `node ./bin/agentic-workflow-guard.js benchmark corpus --format json`
- mcp-resources: `node ./bin/agentic-workflow-guard.js mcp resources --format json`
- docs-build: `npm run docs:build`
- smoke-package: `npm run smoke:package`
- release-prepare: `npm run release:prepare -- --version 1.0.1 --dry-run`
- release-status: `npm run release:status -- --version 1.0.0`
- release-verify: `npm run release:verify -- --version 1.0.0 --dry-run`
- release-sync-check: `npm run release:sync:check`
- schema: `node ./bin/agentic-workflow-guard.js schema report`
- schema-fix: `node ./bin/agentic-workflow-guard.js schema fix`
- schema-rule-pack: `node ./bin/agentic-workflow-guard.js schema rule-pack`
- schema-benchmark-corpus: `node ./bin/agentic-workflow-guard.js schema benchmark-corpus`
- schema-benchmark-report: `node ./bin/agentic-workflow-guard.js schema benchmark-report`
- baseline: `node ./bin/agentic-workflow-guard.js baseline create .`
- fix-json: `node ./bin/agentic-workflow-guard.js fix . --format json`
- fix-output: `node ./bin/agentic-workflow-guard.js fix . --format json --output awg-fix.json`
- patch: `node ./bin/agentic-workflow-guard.js fix . --patch`
- fix: `node ./bin/agentic-workflow-guard.js fix . --apply`
- rules: `node ./bin/agentic-workflow-guard.js rules search github`
- rules-registry: `node ./bin/agentic-workflow-guard.js rules registry --format json`
- agents: `node ./bin/agentic-workflow-guard.js agents`
- install-agent: `node ./bin/agentic-workflow-guard.js agents install claude .`

## Principles
- Treat external workflow input as untrusted until validated
- Keep AI-generated output away from shell and write-capable tools
- Require human approval, allowlists, or dry-run mode before side effects
