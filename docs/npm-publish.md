# NPM Publish Checklist

Use this checklist before publishing `agentic-workflow-guard` to npm.

## Package Readiness

1. Confirm `package.json` version matches the GitHub release tag.
2. Confirm `README.md`, `LICENSE`, `action.yml`, `rules`, `mcp`, `docs`, `examples`, `benchmarks`, and generated agent instruction files are included in `package.json#files`.
3. Preview the version and release-tag edits with `npm run release:prepare -- --version <version> --dry-run`; use `--apply` only when cutting the release branch or tag.
4. Confirm `package.json#bin.agentic-workflow-guard` is `bin/agentic-workflow-guard.js` so npm keeps the CLI entrypoint during publish.
5. Run the full verification suite:

```bash
npm run release:prepare -- --version 1.0.0 --dry-run
npm test
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js init /tmp/awg-init-smoke --force
node ./bin/agentic-workflow-guard.js benchmark --format json
node ./bin/agentic-workflow-guard.js benchmark corpus --format json
node ./bin/agentic-workflow-guard.js mcp resources --format json
node ./bin/agentic-workflow-guard.js schema report
node ./bin/agentic-workflow-guard.js schema fix
node ./bin/agentic-workflow-guard.js schema config
node ./bin/agentic-workflow-guard.js schema rule-pack
node ./bin/agentic-workflow-guard.js schema benchmark-corpus
node ./bin/agentic-workflow-guard.js schema benchmark-report
npm run docs:build
npm run smoke:package
npm run release:sync:check
npm run release:check -- --target 1.0.0 --require-npm-auth
npm run release:status -- --version 1.0.0
npm run release:verify -- --version 1.0.0 --dry-run
npm pack --dry-run
```

## GitHub Release Workflow

The preferred v1 path is `.github/workflows/release.yml`.

1. Add an npm automation token as the repository secret `NPM_TOKEN`.

```bash
gh secret set NPM_TOKEN --repo guorunjie/agentic-workflow-guard
```

2. Run the `release` workflow manually with `tag=v1.0.0` and `dry_run=true`.
3. Run `npm run release:status -- --version 1.0.0`; the final prepublish status should show `Ready to publish: yes`.
4. Publish the draft GitHub Release for `v1.0.0`.
5. The `release` workflow will check out the tag, verify the package version, run tests, run release gates with npm auth, build the package, require `NPM_TOKEN` for real publishing, and publish with provenance.

The workflow uses `npm publish --provenance --access public` for the real release and `npm publish --dry-run --provenance --access public` for manual dry runs.

## Manual Publication

```bash
npm publish --provenance --access public
```

After publishing, verify:

```bash
npm run release:verify -- --version 1.0.0
```

Use `--allow-draft` only while validating the draft GitHub Release before it is published. The final 1.0 verification should run without that flag so a draft release fails the gate.

If `npm whoami` returns `ENEEDAUTH`, authenticate with `npm adduser` or configure the `NPM_TOKEN` automation secret before running `npm publish`.

## Release Notes

Mention scanner coverage, policy profiles, suppression audit trails, stable report, fix, config, rule pack, benchmark corpus, and benchmark report schemas, `init`, `scan --output`, `fix --format json`, `fix --output`, approval snippets, trusted rule marketplace metadata, community rule-pack registry, public benchmark corpus, scored benchmark reports, MCP resources, Skillpack Forge output, GitHub Action usage, and benchmark status. Keep the npm package aligned with the GitHub release tag.
