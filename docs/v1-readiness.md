# v1.0 Readiness

As of 2026-05-28, Agentic Workflow Guard has 1.0.0 release metadata, a `v1.0.0` tag, and a draft GitHub Release prepared. The scanner covers mainstream CI, low-code, MCP, browser automation, structured reports, rule packs, benchmark scoring, one-command project initialization, public docs, and portable agent skills. The remaining work is publication proof: npm authentication, npm registry publication, and live registry/Marketplace verification.

## Earliest Practical Timeline

- v1.0.0 package metadata, static marketplace metadata, benchmark corpus metadata, release-tagged Action examples, tag, and draft Release are prepared.
- v1.0.0 can be published after npm authentication works and the release gates below are green with `--require-npm-auth`.
- Patch releases should use `npm run release:prepare -- --version 1.0.1 --dry-run` before changing release-tagged docs.

With npm access resolved, this is now a same-day final release task. A longer 1-2 day window is only needed if you want an extra external smoke test before publishing.

## Release Gates

| Gate | Required evidence |
| --- | --- |
| Stable finding schema | `node ./bin/agentic-workflow-guard.js schema report` matches the shipped JSON schema and README integration examples. |
| Stable fix recipe schema | `schema fix` covers recipe mode, confidence, patch availability, snippets, next steps, changed files, CI dry-run defaults, and MCP filesystem read-only scoping. |
| Stable config schema | `schema config` documents `.awg.yml`, `.awg.yaml`, and `.awg.json` profiles, thresholds, ignore globs, and rule toggles. |
| Stable rule pack schema | `schema rule-pack`, `rules registry`, `rules install`, and `rules verify` agree on provenance, checksum, compatibility, and license metadata. |
| Stable benchmark schemas | `schema benchmark-corpus`, `schema benchmark-report`, `benchmark corpus --format json`, and `benchmark --format json` stay in sync. |
| Stable rule IDs | Existing `AWI###` IDs, severity levels, and default profile behavior are frozen for SemVer compatibility. |
| GitHub Marketplace | `agentic-workflow-guard init .` scaffolds the release-tagged `uses: guorunjie/agentic-workflow-guard@v1.0.0` workflow, runs, and uploads SARIF. |
| Setup doctor | `agentic-workflow-guard doctor .` validates repository config, schema annotation, Action setup, optional rule-pack lock file, and optional baseline file. |
| npm release | `npm whoami` or `NPM_TOKEN`, `npm pack --dry-run`, `npm run smoke:package`, `npm run release:status` before publishing, `npm run release:publish -- --otp <code>` for local 2FA publishing, and `npm run release:verify` after publishing. |
| Documentation site | GitHub Pages publishes schema aliases, Marketplace page, benchmark corpus, and demo entry points. |
| CI release gates | The remote `test` workflow runs `release-gates` with static metadata drift checks, `release check`, package smoke, and `npm pack --dry-run`. |
| Platform matrix | Vulnerable and safe examples exist for GitHub Actions, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, Buildkite, n8n, Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, MCP, and browser automation. |
| Agent matrix | Generated instructions are present and tested for AGENTS.md, Claude, Codex, Gemini, OpenClaw, Hermes, Cursor, and GitHub Copilot. |

## Current Blockers

- Local npm authentication is available, but this npm account requires a fresh 2FA OTP or a granular access token with 2FA bypass for the final publish step.
- The package has not been published to npm, so the `npx agentic-workflow-guard` public install path still needs live registry proof.
- The `v1.0.0` GitHub Release is still a draft and should be published after npm publish is ready.
- GitHub Marketplace still needs the release-tagged `guorunjie/agentic-workflow-guard@v1.0.0` path verified after the final Release is published.

## Recommended v1.0 Cut Plan

1. Confirm the repository is clean and remote `main` has green `test` and `pages` workflows.
2. Add `NPM_TOKEN` as a repository secret with `gh secret set NPM_TOKEN --repo guorunjie/agentic-workflow-guard`, or resolve local npm authentication and run `npm run release:publish -- --version 1.0.0 --plan`.
3. Run the full local gate:

```bash
npm test
node ./bin/agentic-workflow-guard.js init /tmp/awg-init-smoke --force
node ./bin/agentic-workflow-guard.js doctor /tmp/awg-init-smoke
node ./bin/agentic-workflow-guard.js schema config
npm run release:prepare -- --version 1.0.1 --dry-run
npm run smoke:package
npm run release:sync:check
npm run release:check -- --target 1.0.0 --require-npm-auth
npm run release:status -- --version 1.0.0
npm run release:publish -- --version 1.0.0 --plan
npm run release:verify -- --version 1.0.0 --dry-run
npm run docs:build
node ../skillpack-forge/bin/skillpack-forge.js doctor .
npm pack --dry-run
git diff --check
```

4. Push, wait for remote `test` and `pages`, and verify `action-smoke`.
5. Verify the remote `release-gates` job is green.
6. Run the `release` workflow manually with `tag=v1.0.0` and `dry_run=true`.
7. Run `npm run release:status -- --version 1.0.0`, then publish locally with `npm run release:publish -- --version 1.0.0 --otp <6-digit-code>` or publish the draft `v1.0.0` GitHub Release after `NPM_TOKEN` is configured.
8. Publish the draft GitHub Release after npm is public; the release workflow skips duplicate npm publication when the version already exists.
9. Run `npm run release:verify -- --version 1.0.0` to verify GitHub Release, npm package page, npx CLI help, and the published schema command.

## Post-1.0 Growth

- Split benchmark fixtures into a standalone public benchmark repository if integrations start depending on the corpus.
- Add signed external rule-pack publishing once community rule contributions appear.
- Add richer native parsers for each low-code platform export format while keeping the current heuristic scanner as fallback.
- Add PR bot examples that use JSON fix recipes to open reviewable remediation pull requests.
