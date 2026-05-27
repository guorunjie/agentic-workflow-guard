# Low-Code AI Workflow Remediation Playbook

Use this playbook when Agentic Workflow Guard reports AWI009 in Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, Airflow, or similar automation exports.

## Risk Pattern

A workflow combines an AI/LLM step with a side-effect step such as HTTP, tool calls, request nodes, code execution, database writes, GitHub actions, Slack, Notion, email, deployments, or infrastructure operations. The issue is strongest when the trigger is external or user-controlled.

## Preferred Fixes

1. Separate AI classification from write-capable execution.
2. Add explicit approval before API calls, database writes, deployments, or notifications.
3. Convert natural-language output into a structured schema with allowlisted enum values.
4. Add dry-run mode for every side-effect branch.
5. Restrict credentials to the final action and keep them out of AI-visible fields.
6. Keep vulnerable and safe exports side by side in tests so scanner behavior stays understandable.

## Verification

```bash
agentic-workflow-guard benchmark
agentic-workflow-guard scan path/to/workflow-export --format json
```

A safe flow can contain an AI step or a side-effect step, but should not chain AI output into a side effect without a control.
