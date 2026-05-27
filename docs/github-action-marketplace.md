# GitHub Action Marketplace Guide

Agentic Workflow Guard is packaged as a composite GitHub Action so teams can add AI automation scanning without a hosted service or API key.

## Recommended Workflow

```yaml
name: agentic workflow guard

on:
  pull_request:
  push:
    branches: [main]

jobs:
  guard:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
     - uses: actions/checkout@v6
      - uses: guorunjie/agentic-workflow-guard@v0.20.0
        with:
          path: .
          format: sarif
          profile: balanced
          output: awg.sarif
        continue-on-error: true
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: awg.sarif
```

## Marketplace Checklist

- Keep `action.yml` description concrete and searchable.
- Use a release tag such as `v0.20.0` in docs and examples.
- Keep SARIF output as the default Action output path.
- Keep the repository CI `action-smoke` job green so the Marketplace install path is tested on every push.
- Include README examples for local CLI, GitHub Action, SARIF upload, `scan --output`, stable report schema, fix report schema, rule pack schema, benchmark corpus schema, benchmark report schema, baseline mode, policy profiles, inline suppressions, `fix --format json`, `fix --patch`, `fix --apply`, config, `rules registry`, `rules verify`, `benchmark`, `benchmark --format json`, `benchmark corpus`, `mcp resources`, browser traces, and agent support.
- Keep `npm test`, `npm run smoke:package`, `npm pack --dry-run`, and Skillpack Forge doctor green before cutting a release tag.
