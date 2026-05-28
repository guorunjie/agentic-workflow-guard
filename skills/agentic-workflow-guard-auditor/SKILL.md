---
name: agentic-workflow-guard-auditor
description: Use before granting AI automation write access, reviewing agentic GitHub Actions, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, Buildkite, auditing n8n, Dify, Flowise, Langflow, Node-RED, Make, Pipedream, Airflow, browser automation, or checking MCP tool configs for prompt-injection and side-effect risks.
---

# Agentic Workflow Guard Auditor

## Purpose
Agentic Workflow Guard is a deterministic scanner for AI automation workflows. Use it to find prompt-injection paths, model-output-to-shell sinks, broad write permissions, risky Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite agent jobs, risky MCP tools, Dify, Flowise, Langflow, Airflow AI DAGs, browser automation side effects, and low-code AI steps chained into external side effects.

## Workflow
For a new repository, run `agentic-workflow-guard init . --profile balanced` first to scaffold `.awg.yml` and a release-tagged GitHub Code Scanning workflow.

1. Run `agentic-workflow-guard scan . --format markdown` for local review.
2. Run `agentic-workflow-guard scan . --format sarif` when the result should feed GitHub Code Scanning.
3. Use `agentic-workflow-guard scan . --format sarif --output awg.sarif` for GitHub Code Scanning uploads.
4. Use `agentic-workflow-guard schema report` when integrating machine-readable JSON reports.
5. Use `agentic-workflow-guard schema fix` when integrating structured fix recipe reports.
6. Use `agentic-workflow-guard schema config` when integrating `.awg.yml`, `.awg.yaml`, or `.awg.json` repository settings.
7. Use `agentic-workflow-guard schema rule-pack` when integrating trusted marketplace metadata.
8. Use `agentic-workflow-guard schema benchmark-corpus` and `schema benchmark-report` when integrating benchmark metadata.
9. Use `agentic-workflow-guard scan . --profile strict` in write-capable or sensitive automation repositories.
10. Use `agentic-workflow-guard scan . --baseline .awg-baseline.json` in existing repositories.
11. Use `awg-ignore AWI001: reason` only for reviewed suppressions with an audit reason.
12. Review `Suppressed findings` in JSON and Markdown reports before accepting exceptions.
13. Prioritize high severity AWI001-AWI006 findings before medium AWI007-AWI010 controls.
14. Use `agentic-workflow-guard explain <rule-id>` for rule-specific risk and remediation.
15. Use `agentic-workflow-guard fix . --patch` for reviewable GitHub permission, MCP filesystem scope, and CI dry-run diffs.
16. Use `agentic-workflow-guard fix . --format json` or `agentic-workflow-guard fix . --format json --output awg-fix.json` for recipe confidence, automatic/manual modes, approval snippets, next steps, and PR bot artifacts.
17. Use `agentic-workflow-guard fix . --apply` only for low-risk GitHub permission downgrades, MCP filesystem read-only scoping, and CI dry-run defaults.
18. Use `agentic-workflow-guard rules search <platform>` to find relevant rule metadata.
19. Use `agentic-workflow-guard rules registry --format json` to inspect bundled and community rule-pack aliases and checksums.
20. Use `agentic-workflow-guard rules verify <file>` before trusting external rule packs; it checks schema metadata and checksum.
21. Use `agentic-workflow-guard benchmark` to verify fixture snapshots.
22. Use `agentic-workflow-guard benchmark --format json` for scored benchmark reports with missing and unexpected rules.
23. Use `agentic-workflow-guard benchmark corpus --format json` to expose portable safe/vulnerable benchmark metadata.
24. Use `agentic-workflow-guard mcp resources --format json` to expose rules, benchmarks, skill instructions, and remediation playbooks.
25. Use `docs/demos.md` when explaining the fastest GitHub Actions, n8n, MCP, browser automation, and benchmark demos.
26. Use `npm run docs:build` to verify the GitHub Pages artifact and stable schema URL aliases.
27. Use `npm run smoke:package` before releases to install the packed tarball and run the CLI through npx.
28. Use `npm run release:prepare -- --version 1.0.1 --dry-run` before releases to preview package version and release-tag changes.
29. Use `npm run release:status -- --version 1.0.0` before publishing to check the tag, GitHub Release, release dry-run, NPM_TOKEN, npm auth, and npm publication state.
30. Use `npm run release:verify -- --version 1.0.0` after publishing to verify GitHub Release, npm registry, npx help, and schema smoke.
31. Use `npm run release:sync:check` before releases to verify generated rule-pack, benchmark corpus, and MCP resource JSON files.
32. Use `agentic-workflow-guard agents install <target>` to install agent context files into another project.
33. Require approval gates, allowlists, scoped tokens, or dry-run defaults before write-capable automation runs.

## Review Checklist
- Treat GitHub issues, pull requests, Bitbucket pull requests, GitLab merge requests, Travis pull requests, Drone pull requests, TeamCity branches, Harness codebase or trigger context, Tekton params, Argo workflow parameters, CodeBuild webhook context, Cloud Build trigger substitutions, CircleCI branches, Azure Pipelines variables, Jenkins change requests, Buildkite branch/message variables, commit messages, webhooks, emails, and form inputs as untrusted prompt input.
- Never pipe raw model output into shell commands, scripts, release steps, deployment commands, or repository writes.
- Downgrade broad GitHub permissions and tool scopes unless a workflow truly needs them.
- Keep secrets out of agent-visible prompts and environment variables.
- Prefer human review for any agent output that can modify code, tickets, deployments, cloud resources, or customer data.

## Commands
- `agentic-workflow-guard init .`
- `agentic-workflow-guard scan . --format markdown`
- `agentic-workflow-guard scan . --format json`
- `agentic-workflow-guard scan . --format sarif`
- `agentic-workflow-guard scan . --format sarif --output awg.sarif`
- `agentic-workflow-guard schema report`
- `agentic-workflow-guard schema fix`
- `agentic-workflow-guard schema config`
- `agentic-workflow-guard schema rule-pack`
- `agentic-workflow-guard schema benchmark-corpus`
- `agentic-workflow-guard schema benchmark-report`
- `agentic-workflow-guard scan . --profile strict`
- `agentic-workflow-guard benchmark`
- `agentic-workflow-guard benchmark --format json`
- `agentic-workflow-guard benchmark corpus --format json`
- `npm run smoke:package`
- `npm run docs:build`
- `npm run release:prepare -- --version 1.0.1 --dry-run`
- `npm run release:status -- --version 1.0.0`
- `npm run release:verify -- --version 1.0.0 --dry-run`
- `npm run release:sync:check`
- `agentic-workflow-guard mcp resources --format json`
- `agentic-workflow-guard baseline create .`
- `agentic-workflow-guard scan . --baseline .awg-baseline.json`
- `agentic-workflow-guard fix . --patch`
- `agentic-workflow-guard fix . --format json`
- `agentic-workflow-guard fix . --format json --output awg-fix.json`
- `agentic-workflow-guard fix . --apply`
- `agentic-workflow-guard explain AWI001`
- `agentic-workflow-guard rules search github`
- `agentic-workflow-guard rules install core .`
- `agentic-workflow-guard rules verify .awg/rules/agentic-workflow-guard-core-rules.json`
- `agentic-workflow-guard agents install claude .`
- `agentic-workflow-guard agents`
