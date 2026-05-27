# Roadmap

Agentic Workflow Guard should evolve from a lightweight scanner into a complete automation safety skill that covers mainstream platforms.

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
- Make scenario export scanner.
- Pipedream workflow scanner.
- Node-RED flow scanner.
- Airflow DAG heuristic scanner for LLM-to-operator side effects.

## v0.3: Guided Fixes

- `fix --apply` for low-risk transformations:
  - downgrade broad GitHub permissions to read-only;
  - add comments and guard blocks around prompt ingestion;
  - add dry-run defaults;
  - generate approval-job snippets.
- Patch output mode for PR bots.
- Rule-specific fix confidence levels.

## v0.4: Rule Marketplace

- External rule pack format.
- `rules list`, `rules search`, `rules install`.
- Community rule packs for GitHub Actions, n8n, MCP, browser automation, and data workflows.
- Signed rule metadata and checksums.

## v0.5: Complete Agent Skill

- Generate and test:
  - `AGENTS.md`
  - Claude Skill
  - Codex Skill
  - Cursor rule
  - GitHub Copilot instructions
  - MCP resource pack
- Add examples showing AI agents using the scanner to review workflows safely.
- Add platform-specific remediation playbooks.

## v1.0: Stable Automation Safety Layer

- Stable finding schema.
- Stable rule IDs and severity policy.
- GitHub Marketplace release.
- npm release.
- Documentation site.
- Compatibility matrix across GitHub Actions, n8n, Activepieces, Zapier, Make, Pipedream, MCP, and browser automation stacks.
