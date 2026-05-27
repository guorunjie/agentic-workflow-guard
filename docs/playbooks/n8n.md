# n8n Remediation Playbook

Use this playbook when Agentic Workflow Guard reports AWI005 in an n8n workflow export.

## Risk Pattern

An external trigger such as Webhook, email, chat, GitHub, or form input reaches an AI Agent/OpenAI/LangChain node. The AI output then reaches HTTP Request, Code, Execute Command, database, credential-bearing, or notification nodes that can trigger real side effects.

## Preferred Fixes

1. Insert a validation or normalization step before the AI node.
2. Route AI output to a human approval step before HTTP, command, database, or credential-bearing nodes.
3. Replace open-ended prompts with structured extraction and allowlisted actions.
4. Store credentials only on the final side-effect node, not in AI-visible context.
5. Add dry-run branches for new or user-submitted workflows.
6. Log prompt input, model output, approval decision, and final action target.

## Verification

```bash
agentic-workflow-guard scan path/to/n8n-export --format markdown
agentic-workflow-guard explain AWI005
```

The scan should no longer show an external trigger -> AI node -> side-effect chain without a control.
