# Rule Marketplace

Agentic Workflow Guard ships a small rule marketplace that starts with the bundled core pack and focused community-style packs. Use it when a project wants a narrower rollout than the full AWI001-AWI010 catalog.

## List Packs

```bash
agentic-workflow-guard rules list
agentic-workflow-guard rules registry --format json
```

The registry includes aliases, checksums, install commands, source labels, platforms, and rule IDs.

## Install Packs

```bash
agentic-workflow-guard rules install core .
agentic-workflow-guard rules install github-actions-hardening .
agentic-workflow-guard rules install low-code-automation .
```

Installed packs are written to `.awg/rules/` with `agentic-workflow-guard-rules.lock.json`. The lock file records the pack name, version, checksum, relative path, and source.

## Verify Packs

```bash
agentic-workflow-guard rules verify .awg/rules/agentic-workflow-guard-core-rules.json
agentic-workflow-guard rules verify rules/community/agentic-workflow-guard-github-actions-hardening.json
```

Verification checks required schema metadata before trusting a checksum, then recomputes the checksum from canonical JSON.

## Bundled Registry

| Alias | Source | Platforms | Rules |
| --- | --- | --- | --- |
| `core` | bundled | GitHub Actions, GitLab CI, CircleCI, Azure Pipelines, Jenkins, n8n, MCP, low-code, Dify, Flowise, Langflow, Airflow, browser automation | AWI001-AWI010 |
| `github-actions-hardening` | community | GitHub Actions | AWI001-AWI004, AWI007-AWI008 |
| `low-code-automation` | community | n8n, Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, Airflow, browser automation | AWI005, AWI009-AWI010 |

## Contribution Checklist

- Keep rule IDs within the stable AWI namespace until external custom rule execution lands.
- Include a focused platform list and SemVer compatibility range.
- Include provenance with source, repository, and release tag.
- Run `rules verify` before opening a pull request.
- Add paired safe/vulnerable fixtures when a pack introduces new platform coverage.
