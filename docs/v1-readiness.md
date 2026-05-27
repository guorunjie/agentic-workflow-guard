# v1.0 Readiness

As of 2026-05-28, Agentic Workflow Guard is functionally close to 1.0. The scanner already covers mainstream CI, low-code, MCP, browser automation, structured reports, rule packs, benchmark scoring, public docs, and portable agent skills. The remaining work is release hardening: stable contracts, publication, and proof that every claimed platform path is verified.

## Earliest Practical Timeline

- v0.20.0 is the Marketplace and install-readiness release.
- v1.0.0-rc.1 can be cut after npm publication works and the release gates below are green.
- v1.0.0 can follow once the release candidate has a clean CI run, public docs, GitHub Marketplace usage, and no schema or rule-ID changes needed.

With npm access resolved, this is a 1-2 day release-candidate task and a 2-4 day 1.0 stabilization task.

## Release Gates

| Gate | Required evidence |
| --- | --- |
| Stable finding schema | `node ./bin/agentic-workflow-guard.js schema report` matches the shipped JSON schema and README integration examples. |
| Stable fix recipe schema | `schema fix` covers recipe mode, confidence, patch availability, snippets, next steps, and changed files. |
| Stable rule pack schema | `schema rule-pack`, `rules registry`, `rules install`, and `rules verify` agree on provenance, checksum, compatibility, and license metadata. |
| Stable benchmark schemas | `schema benchmark-corpus`, `schema benchmark-report`, `benchmark corpus --format json`, and `benchmark --format json` stay in sync. |
| Stable rule IDs | Existing `AWI###` IDs, severity levels, and default profile behavior are frozen for SemVer compatibility. |
| GitHub Marketplace | A release-tagged `uses: guorunjie/agentic-workflow-guard@v1.0.0` example runs and uploads SARIF. |
| npm release | `npm whoami`, `npm pack --dry-run`, `npm run smoke:package`, and `npm publish --dry-run` pass before publishing. |
| Documentation site | GitHub Pages publishes schema aliases, Marketplace page, benchmark corpus, and demo entry points. |
| CI release gates | The remote `test` workflow runs `release-gates` with static metadata drift checks, `release check`, package smoke, and `npm pack --dry-run`. |
| Platform matrix | Vulnerable and safe examples exist for GitHub Actions, GitLab CI, CircleCI, Azure Pipelines, Jenkins, n8n, Activepieces, Zapier, Make, Pipedream, MCP, and browser automation. |
| Agent matrix | Generated instructions are present and tested for AGENTS.md, Claude, Codex, Gemini, OpenClaw, Hermes, Cursor, and GitHub Copilot. |

## Current Blockers

- npm authentication is not available on this machine yet; `npm whoami` returns `ENEEDAUTH`.
- The package has not been published to npm, so the `npx agentic-workflow-guard` public install path still needs live registry proof.
- The GitHub Action has v0.20 release-tag proof; v1.0 still needs the same Marketplace path verified after the final tag.

## Recommended v1.0 Cut Plan

1. Confirm the repository is clean and remote `main` has green `test` and `pages` workflows.
2. Resolve npm authentication and run `npm publish --dry-run`.
3. Preview the version and release-tag edits with `npm run release:prepare -- --version 1.0.0 --dry-run`.
4. Apply the release prep with `npm run release:prepare -- --version 1.0.0 --apply`, then run `npm run release:sync` and regenerate the Skillpack Forge outputs.
5. Run the full local gate:

```bash
npm test
npm run release:prepare -- --version 1.0.0 --dry-run
npm run smoke:package
npm run release:sync:check
npm run release:check -- --target 1.0.0 --require-npm-auth
npm run docs:build
node ../skillpack-forge/bin/skillpack-forge.js doctor .
npm pack --dry-run
git diff --check
```

6. Push, wait for remote `test` and `pages`, and verify `action-smoke`.
7. Verify the remote `release-gates` job is green.
8. Create `v1.0.0-rc.1`; test the release-tagged Action in a clean workflow.
9. Publish npm after the release candidate passes.
10. Create `v1.0.0`; verify GitHub Release, GitHub Marketplace, npm package page, Pages site, and install smoke.

## Post-1.0 Growth

- Split benchmark fixtures into a standalone public benchmark repository if integrations start depending on the corpus.
- Add signed external rule-pack publishing once community rule contributions appear.
- Add richer native parsers for each low-code platform export format while keeping the current heuristic scanner as fallback.
- Add PR bot examples that use JSON fix recipes to open reviewable remediation pull requests.
