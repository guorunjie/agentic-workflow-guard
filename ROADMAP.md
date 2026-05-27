# Roadmap

Agentic Workflow Guard should evolve from a lightweight scanner into a complete automation safety skill that covers mainstream platforms.

North star:

> Become the default security scanner people install before giving AI automation write access.

## v0.1: Launchable Scanner

- GitHub Actions scanner for prompt injection, shell sinks, write permissions, `pull_request_target`, secret exposure, and missing controls.
- n8n scanner for external trigger -> AI node -> side-effect node paths.
- MCP scanner for broad filesystem, shell, browser, GitHub, and infrastructure tools.
- Low-code JSON heuristic scanner for Activepieces/Zapier/Make/Pipedream-style flows.
- Markdown, JSON, and SARIF reporters.
- Dry-run `fix` command.
- GitHub Action metadata.
- Skillpack Forge export.
- Local rule marketplace via `rules`.

## v0.2: Mainstream Workflow Platform Coverage

- Activepieces scanner with native schema support.
- Zapier export scanner.
- Make scenario export scanner. Shipped heuristic coverage in v0.2.
- Pipedream workflow scanner. Shipped heuristic coverage in v0.2.
- Node-RED flow scanner. Shipped heuristic coverage in v0.2.
- Airflow DAG heuristic scanner for LLM-to-operator side effects. Shipped in v0.2.
- Browser automation trace scanner for Playwright, browser-use, Skyvern, and similar agent browser stacks. Shipped heuristic coverage in v0.3.

## v0.3: Guided Fixes

- `fix --apply` for low-risk transformations:
  - downgrade broad GitHub permissions to read-only. Shipped in v0.2;
  - add comments and guard blocks around prompt ingestion;
  - add dry-run defaults;
  - generate approval-job snippets.
- Patch output mode for PR bots. Shipped `fix --patch` in v0.3.
- Baseline mode for existing findings. Shipped `baseline create` and `scan --baseline` in v0.3.
- Agent install helpers for project-local instruction files. Shipped `agents install` in v0.3.
- Rule-specific fix confidence levels.

## v0.4: Rule Marketplace

- External rule pack format.
- `rules list`, `rules search`, `rules install`. Shipped core rule-pack metadata install in v0.2.
- `rules verify` checksum validation. Shipped in v0.4.
- Fixture benchmark snapshots via `benchmark`. Shipped in v0.4.
- Community rule packs for GitHub Actions, n8n, MCP, browser automation, and data workflows.
- Signed rule metadata. Checksum metadata shipped in v0.4.

## v0.5: Complete Agent Skill

- Generate and test:
  - `AGENTS.md`
  - Claude Skill
  - Codex Skill
  - Gemini project context and skill bundle
  - Cursor rule
  - GitHub Copilot instructions
  - OpenClaw SKILL.md bundle
  - Hermes SKILL.md bundle
  - MCP resource pack. Shipped in v0.5.
- Keep `agentic-workflow-guard agents` as the visible compatibility matrix for every supported agent surface.
- Add examples showing AI agents using the scanner to review workflows safely.
- Add platform-specific remediation playbooks. Shipped initial GitHub Actions, n8n, MCP, low-code, and browser automation playbooks in v0.5.
- Publish reusable skill packs for GitHub Actions, n8n, MCP, low-code automation, and browser automation.

## v0.6: Agent Runtime Integrations

- Add install helpers for Claude, Gemini, OpenClaw, Hermes, Codex, Cursor, and Copilot instruction paths. Shipped initial `agents install` in v0.3.
- Add smoke tests that verify every generated agent instruction file mentions the current rule catalog and CLI commands.
- Add docs for using the scanner inside agent review loops, PR bots, and local coding-agent sessions.
- Add versioned skill package metadata for future marketplace distribution. MCP resource manifest shipped in v0.5.
- Add policy profiles for advisory, balanced, and strict CI rollout. Shipped in v0.6.
- Add audited inline suppressions with required reasons. Shipped in v0.6.

## v0.7: Auditability and Release Readiness

- Report suppressed findings in JSON and Markdown outputs with reason and suppression location.
- Improve low-code workflow evidence with native step, node, and module labels for Activepieces, Make, Pipedream, and Node-RED.
- Add documentation index for a future docs site.
- Add npm publish checklist and package verification steps.

## v0.8: Stable Schemas and Code Scanning Ergonomics

- Add stable JSON report schema with `schemaVersion`.
- Add `schema report` command for tooling integrations.
- Add `scan --output` for report files without shell redirection.
- Improve GitHub Action inputs and outputs for profile, baseline, report path, and Step Summary.

## v0.9: Structured Fix Recipes

- Add `fix --format json` for agent loops, PR bots, and UIs that need machine-readable remediation plans.
- Add automatic/manual recipe modes and confidence levels for each finding.
- Add stable fix report schema and `schema fix` command.
- Publish fix schema through MCP resources and package files.

## v0.10: Trusted Rule Marketplace Metadata

- Add stable rule pack schema and `schema rule-pack` command.
- Add rule pack compatibility metadata, provenance, publisher, license, and release tags.
- Add install lock files for bundled rule packs.
- Make `rules verify` validate schema metadata before checksum trust.

## v0.11: Public Docs and Schema URLs

- Add GitHub Pages workflow for a static project docs site.
- Add stable public schema URL aliases for report, fix report, and rule pack schemas.
- Add a Marketplace-ready Action landing page and generated schema index.
- Add `docs:build` so release checks can validate the Pages artifact locally.

## v0.12: Zapier Benchmark Coverage

- Add Zapier-specific evidence for AI action -> app side-effect paths.
- Add vulnerable and safe Zapier fixtures to the benchmark matrix.
- Keep low-code marketplace coverage aligned across Activepieces, Zapier, Make, Pipedream, Node-RED, and Airflow.

## v1.0: Stable Automation Safety Layer

- Stable finding schema.
- Stable fix recipe schema.
- Stable rule pack schema.
- Stable rule IDs and severity policy.
- GitHub Marketplace release.
- npm release.
- Documentation site.
- Compatibility matrix across GitHub Actions, n8n, Activepieces, Zapier, Make, Pipedream, MCP, and browser automation stacks.
- Compatibility matrix across Claude, Codex, Gemini, OpenClaw, Hermes, Cursor, Copilot, and AGENTS.md-aware agents.
- Public benchmark repo with vulnerable and safe workflow fixtures for every supported platform.
