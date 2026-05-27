# Demo Playbook

Use these demos when explaining why AI automation needs a scanner before it gets write access.

## GitHub Action: untrusted issue text reaches a write-capable agent

Risk path:

1. An issue, pull request, comment, or discussion body is copied into an agent prompt.
2. The workflow grants broad write permissions.
3. The agent output can reach shell, repository write, release, deployment, or issue mutation steps.

Run it:

```bash
node ./bin/agentic-workflow-guard.js scan examples/unsafe-ai-pr-bot --format markdown
node ./bin/agentic-workflow-guard.js fix examples/unsafe-ai-pr-bot --patch
```

What to show:

- `AWI001` for untrusted workflow context entering the prompt.
- `AWI002` for model output reaching a shell sink.
- `AWI003` for write-capable permissions.
- A reviewable permission downgrade and dry-run patch preview.

## n8n: webhook input flows through AI into an HTTP side effect

Risk path:

1. A public webhook or email trigger receives attacker-controlled content.
2. An AI node processes that content.
3. A downstream HTTP, Code, Execute Command, or credential-bearing node performs a side effect.

Run it:

```bash
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-n8n --format markdown
node ./bin/agentic-workflow-guard.js scan examples/safe-n8n --format markdown
```

What to show:

- `AWI005` catches the external trigger -> AI -> side-effect path.
- The safe fixture demonstrates approval or review separation.

## MCP: broad tools make side effects too easy

Risk path:

1. An agent runtime exposes filesystem, shell, browser, GitHub, Docker, Kubernetes, or cloud tools.
2. Tool scope is broad enough that prompt-injected instructions can reach high-impact actions.
3. The project has no visible allowlist, approval, or sandbox boundary.

Run it:

```bash
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-mcp --format markdown
node ./bin/agentic-workflow-guard.js explain AWI006
```

What to show:

- `AWI006` flags broad high-risk MCP tool exposure.
- The remediation text pushes least privilege, narrow paths, and approval gates.

## Browser automation: AI decisions click, fill, upload, or submit

Risk path:

1. A browser agent receives untrusted webpage or task content.
2. The model chooses browser actions.
3. The trace includes click, fill, submit, upload, approve, purchase, or navigation side effects.

Run it:

```bash
node ./bin/agentic-workflow-guard.js scan examples/vulnerable-browser-trace --format markdown
node ./bin/agentic-workflow-guard.js scan examples/safe-browser-trace --format markdown
```

What to show:

- `AWI010` catches AI-driven browser side effects.
- The safe fixture shows review mode or read-only browsing behavior.

## Benchmark proof

Use the benchmark report when you want to show scanner coverage as data instead of anecdotes:

```bash
node ./bin/agentic-workflow-guard.js benchmark
node ./bin/agentic-workflow-guard.js benchmark --format json
node ./bin/agentic-workflow-guard.js benchmark corpus --format json
```

The JSON report includes fixture count, pass rate, platforms, rule IDs, and per-fixture missing or unexpected rule IDs.
