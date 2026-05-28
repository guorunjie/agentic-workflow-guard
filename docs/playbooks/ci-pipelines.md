# CI Pipeline Remediation Playbook

Use this playbook when Agentic Workflow Guard reports AWI001, AWI002, AWI007, or AWI008 in Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, or Buildkite workflows.

## Risk Pattern

Untrusted pull request descriptions, merge request descriptions, branch names, commit messages, pull request metadata, Azure pipeline variables, Jenkins change request variables, Bitbucket Pipelines variables, Travis variables, Drone variables, TeamCity branch parameters, Harness codebase/trigger context, CodeBuild webhook context, Cloud Build trigger substitutions, or Buildkite branch/message variables can reach an agent prompt. The same job may then execute model output in `script:`, `run`, `command`, or `sh` commands while CI tokens, secrets, Bitbucket deployments/OIDC tokens, Travis secure env, Drone secrets, TeamCity secure parameters, Harness secrets, CodeBuild Secrets Manager or Parameter Store env, Cloud Build Secret Manager env, CircleCI contexts, Azure service connections, Azure variable groups, Jenkins credentials, or Buildkite env secrets are available.

## Recommended Controls

1. Keep agent jobs read-only until the prompt boundary is reviewed.
2. Do not pass raw merge request descriptions, branch names, or commit messages directly into write-capable prompts.
3. Never execute raw model output with `bash -c`, `sh -c`, `eval`, PowerShell, deployment CLIs, or package publishing commands.
4. Move deployment, release, registry, and repository write steps into a separate manual job.
5. Scope Bitbucket deployment variables, OIDC tokens, GitLab CI tokens, Travis secure env, Drone secrets, TeamCity secure parameters, Harness secrets, CodeBuild Secrets Manager or Parameter Store env, Cloud Build Secret Manager env, CircleCI contexts, Azure service connections, Azure variable groups, Jenkins credentials, Buildkite env secrets, cloud credentials, and package registry tokens away from agent jobs.
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
agentic-workflow-guard fix . --format json --output awg-fix.json
```

## Review Notes

CI jobs often inherit useful environment context. Treat those values as capabilities: if an agent can see a token, context, service connection, variable group, or credential binding, assume prompt injection can steer how it is used unless the job is read-only, dry-run, or approval-gated.

`fix --patch` and `fix --apply` can add low-risk dry-run defaults for Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite agent jobs. `fix --format json --output awg-fix.json` and Markdown fix plans also include approval, artifact-review, and allowlist snippets. Review shell sinks, prompt boundaries, credential exposure, and approval gates manually before merging.
