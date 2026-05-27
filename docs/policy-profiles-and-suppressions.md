# Policy Profiles and Suppressions

Agentic Workflow Guard supports policy profiles for different rollout stages and inline suppressions for audited exceptions.

## Policy Profiles

| Profile | Exit threshold | Use when |
| --- | --- | --- |
| `advisory` | `critical` | You want reports without blocking CI. |
| `balanced` | `high` | You want CI to fail on high-risk automation paths. This is the default. |
| `strict` | `medium` | You want CI to fail on missing controls and other medium-risk findings too. |

Use a profile from the CLI:

```bash
agentic-workflow-guard scan . --profile strict --format sarif > awg.sarif
```

Or set it in `.awg.yml`:

```yaml
profile: strict
ignore:
  - node_modules/**
rules:
  AWI007: on
```

An explicit `severityThreshold` in `.awg.yml` overrides the profile default for that repository.

## Inline Suppressions

Use inline suppressions only for reviewed exceptions. Suppressions require a reason after `:`.

```yaml
# awg-ignore AWI001: issue body is copied from an internal release form
prompt: "Summarize ${{ github.event.issue.body }}"
```

Supported format:

```text
awg-ignore AWI001: reviewed reason
awg-ignore AWI001, AWI008: reviewed reason
```

Suppressions without a reason are ignored. Prefer fixing the workflow, adding a baseline for legacy findings, or using `profile: advisory` during rollout before adding suppressions.

## Rollout Pattern

1. Start with `profile: advisory` to see findings without failing CI.
2. Create a baseline for accepted legacy findings.
3. Move new repositories to `profile: balanced`.
4. Move sensitive repositories and agent write workflows to `profile: strict`.
5. Require suppression reasons in code review.
