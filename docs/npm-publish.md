# NPM Publish Checklist

Use this checklist before publishing `agentic-workflow-guard` to npm.

## Package Readiness

1. Confirm `package.json` version matches the GitHub release tag.
2. Confirm `README.md`, `LICENSE`, `action.yml`, `rules`, `mcp`, `docs`, `examples`, `benchmarks`, and generated agent instruction files are included in `package.json#files`.
3. Run the full verification suite:

```bash
npm test
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js mcp resources --format json
node ./bin/agentic-workflow-guard.js schema report
node ./bin/agentic-workflow-guard.js schema fix
node ./bin/agentic-workflow-guard.js schema rule-pack
npm pack --dry-run
```

## Publication

```bash
npm publish --access public
```

After publishing, verify:

```bash
npm view agentic-workflow-guard version
npx agentic-workflow-guard --help
npx agentic-workflow-guard scan examples/vulnerable-github-action --format markdown
```

## Release Notes

Mention scanner coverage, policy profiles, suppression audit trails, stable report, fix, and rule pack schemas, `scan --output`, `fix --format json`, trusted rule marketplace metadata, MCP resources, Skillpack Forge output, GitHub Action usage, and benchmark status. Keep the npm package aligned with the GitHub release tag.
