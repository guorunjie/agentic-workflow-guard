# Browser Automation Remediation Playbook

Use this playbook when Agentic Workflow Guard reports AWI010 in browser-use, Skyvern, Playwright, Puppeteer, or similar browser automation traces.

## Risk Pattern

An AI decision reaches browser side effects such as clicking, filling forms, submitting, uploading files, approving actions, making purchases, changing settings, or sending messages.

## Preferred Fixes

1. Keep AI browsing sessions in observe-only mode until the intended action is reviewed.
2. Require human approval before submit, pay, upload, delete, invite, publish, merge, or deploy actions.
3. Restrict navigation to allowlisted domains and block unknown login or payment flows.
4. Record screenshots and action arguments before side effects.
5. Add dry-run traces that prove the agent can inspect without acting.
6. Treat page text, clipboard content, downloads, and hidden form values as untrusted prompt input.

## Verification

```bash
agentic-workflow-guard scan path/to/browser-traces --format markdown
agentic-workflow-guard explain AWI010
```

The trace should show an explicit approval or safe-output control before any AI-selected browser side effect.
