# CI Pipeline Remediation Playbook

Use this playbook when Agentic Workflow Guard reports AWI001, AWI002, AWI007, or AWI008 in GitLab CI, CircleCI, Azure Pipelines, or Jenkins workflows.

## Risk Pattern

Untrusted merge request descriptions, branch names, commit messages, pull request metadata, Azure pipeline variables, or Jenkins change request variables can reach an agent prompt. The same job may then execute model output in `script:`, `run`, or `sh` commands while CI tokens, secrets, CircleCI contexts, Azure service connections, Azure variable groups, or Jenkins credentials are available.

## Recommended Controls

1. Keep agent jobs read-only until the prompt boundary is reviewed.
2. Do not pass raw merge request descriptions, branch names, or commit messages directly into write-capable prompts.
3. Never execute raw model output with `bash -c`, `sh -c`, `eval`, PowerShell, deployment CLIs, or package publishing commands.
4. Move deployment, release, registry, and repository write steps into a separate manual job.
5. Scope GitLab CI tokens, CircleCI contexts, Azure service connections, Azure variable groups, Jenkins credentials, cloud credentials, and package registry tokens away from agent jobs.
6. Add dry-run defaults and approval gates before any agent-selected command can run.

## Useful Commands

```bash
agentic-workflow-guard scan . --format markdown
agentic-workflow-guard scan . --profile strict --format sarif --output awg.sarif
agentic-workflow-guard explain AWI001
agentic-workflow-guard explain AWI002
agentic-workflow-guard explain AWI007
agentic-workflow-guard explain AWI008
agentic-workflow-guard fix . --patch
agentic-workflow-guard fix . --format json
```

## Review Notes

CI jobs often inherit useful environment context. Treat those values as capabilities: if an agent can see a token, context, service connection, variable group, or credential binding, assume prompt injection can steer how it is used unless the job is read-only, dry-run, or approval-gated.

`fix --patch` and `fix --apply` can add low-risk dry-run defaults for GitLab CI, CircleCI, Azure Pipelines, and Jenkins agent jobs. `fix --format json` and Markdown fix plans also include approval, artifact-review, and allowlist snippets. Review shell sinks, prompt boundaries, credential exposure, and approval gates manually before merging.
