# GitHub Action Marketplace Guide

Agentic Workflow Guard is packaged as a composite GitHub Action so teams can add AI automation scanning without a hosted service or API key.

## Recommended Workflow

Scaffold the recommended config and workflow:

```bash
npx agentic-workflow-guard init .
npx agentic-workflow-guard doctor .
```

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
      - uses: guorunjie/agentic-workflow-guard@v1.0.0
        with:
          path: .
          format: sarif
          profile: balanced
          output: awg.sarif
          fix-format: json
          fix-output: awg-fix.json
        continue-on-error: true
      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: awg.sarif
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: agentic-workflow-guard-fix-report
          path: awg-fix.json
```

## Marketplace Checklist

- Keep `action.yml` description concrete and searchable.
- Use a release tag such as `v1.0.0` in docs and examples.
- Use `npm run release:prepare -- --version <version> --dry-run` before tagging to preview Action tag updates.
- Keep SARIF output as the default Action output path.
- Keep `agentic-workflow-guard init .` aligned with the recommended workflow so new adopters can start with one command.
- Keep `agentic-workflow-guard doctor .` green for the generated workflow so setup mistakes are caught before CI rollout.
- Keep optional `fix-output` artifacts available for PR bots, review comments, and follow-up agent loops.
- Keep the repository CI `action-smoke` job green so the Marketplace install path is tested on every push.
- Include README examples for local CLI, GitHub Action, SARIF upload, `scan --output`, stable report schema, fix report schema, rule pack schema, benchmark corpus schema, benchmark report schema, baseline mode, policy profiles, inline suppressions, `fix --format json`, `fix --output`, `fix --patch`, `fix --apply`, config, `rules registry`, `rules verify`, `benchmark`, `benchmark --format json`, `benchmark corpus`, `mcp resources`, browser traces, and agent support.
- Keep `npm test`, `npm run smoke:package`, `npm pack --dry-run`, and Skillpack Forge doctor green before cutting a release tag.
