# Contributing

Agentic Workflow Guard is built around one contract: every new platform, rule pack, or fix recipe must be easy to verify without trusting an LLM.

## Development Setup

```bash
npm install
npm test
npm run release:sync:check
npm run docs:build
```

Use Node.js 20 or newer. The release workflows currently validate on Node.js 24.

## Adding Platform Coverage

When adding scanner support for a new automation platform:

1. Add a vulnerable fixture in `examples/vulnerable-<platform>`.
2. Add a safe fixture in `examples/safe-<platform>`.
3. Add both fixtures to `benchmarks/fixtures.json`.
4. Update the scanner, rule-pack platform metadata, docs, and agent skill outputs.
5. Run `npm run release:sync` so `benchmarks/corpus.json`, rule-pack JSON, registry JSON, and MCP resources stay generated.
6. Add focused tests for vulnerable detection, safe fixture behavior, benchmark metadata, and any `fix` support.

The benchmark must remain fully deterministic: `agentic-workflow-guard benchmark` should pass with no unexpected findings.

## Rule Pack Contributions

Rule packs must include:

- schema version, package version, publisher, license, compatibility, provenance, and checksum metadata;
- a focused platform list;
- stable AWI rule IDs until external custom rule execution lands;
- tests for `rules list`, `rules registry`, `rules install`, and `rules verify` behavior.

Run:

```bash
node ./bin/agentic-workflow-guard.js rules registry --format json
node ./bin/agentic-workflow-guard.js rules verify rules/community/agentic-workflow-guard-ci-pipeline-hardening.json
npm run release:sync:check
```

## Fix Recipe Contributions

Only low-risk, reviewable transformations should be automatic. Shell sinks, deployment commands, credential movement, repository writes, and browser side effects should stay manual unless the patch is clearly reversible and reviewable.

Automatic fixes should provide:

- `fix --patch` output;
- `fix --apply` behavior;
- structured `fix --format json` recipe data;
- confidence, automatic/manual mode, snippets, and next steps;
- tests that preserve the original risk evidence while adding a safe control.

## Documentation And Agent Outputs

Update all relevant surfaces when behavior changes:

- `README.md`
- `docs/*`
- `skillpack.yaml`
- `AGENTS.md`
- `.claude`, `.codex`, `.cursor`, `.github/copilot-instructions.md`
- `GEMINI.md`, `.gemini`, `.openclaw`, `.hermes`
- `mcp/resources/agentic-workflow-guard.resources.json`

Use Skillpack Forge after editing `skillpack.yaml`:

```bash
node ../skillpack-forge/bin/skillpack-forge.js compile .
node ../skillpack-forge/bin/skillpack-forge.js doctor .
```

## Pull Request Checklist

Before opening a pull request:

```bash
npm test
npm run release:sync:check
npm run docs:build
npm run release:check
node ./bin/agentic-workflow-guard.js benchmark
git diff --check
```

Do not include real secrets, production tokens, private workflow exports, or customer data in fixtures.
