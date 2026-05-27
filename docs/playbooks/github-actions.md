# GitHub Actions Remediation Playbook

Use this playbook when Agentic Workflow Guard reports AWI001, AWI002, AWI003, AWI004, AWI007, or AWI008 in a GitHub Actions workflow.

## Risk Pattern

Untrusted issue, pull request, comment, discussion, or release text reaches an agent prompt. The same job can then run shell commands, write to the repository, comment on pull requests, publish releases, or access secrets.

## Preferred Fixes

1. Keep AI review jobs read-only by default.
2. Move write operations into a separate job that requires explicit approval.
3. Never pass raw `github.event.*.body`, PR titles, commit messages, or comments into a write-capable agent without sanitization and allowlists.
4. Add `AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"` to agent jobs until the workflow has approval gates.
5. Use `permissions:` at the job level and start from `contents: read`.
6. Avoid `pull_request_target` for agent execution unless the job only reads trusted code and has no write sinks.

## Verification

```bash
agentic-workflow-guard fix . --patch
agentic-workflow-guard fix . --format json
agentic-workflow-guard fix . --format json --output awg-fix.json
agentic-workflow-guard scan . --format sarif > awg.sarif
```

Review the patch before applying it. Use `--output awg-fix.json` when a PR bot, UI, or agent loop needs recipe confidence, automatic/manual remediation modes, approval snippets, and next steps as an artifact. The scanner can safely downgrade broad permissions and add dry-run defaults, but shell sinks and prompt boundaries still need human review.
