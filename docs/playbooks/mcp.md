# MCP Tool Governance Playbook

Use this playbook when Agentic Workflow Guard reports AWI006 in an MCP configuration.

## Risk Pattern

An agent can call broad tools such as filesystem roots, shell, browser automation, GitHub write APIs, Docker, Kubernetes, cloud, or database tools without tight scoping. The model may convert untrusted context into tool calls with real side effects.

## Preferred Fixes

1. Scope filesystem tools to the current repository or a narrow workspace directory.
2. Remove shell tools from default agent sessions; expose task-specific commands instead.
3. Split read-only MCP servers from write-capable MCP servers.
4. Require confirmation for browser, GitHub, Docker, Kubernetes, cloud, and database writes.
5. Use allowlists for hosts, repositories, commands, file globs, and operation names.
6. Log every write-capable tool call with prompt source, arguments, and approval status.

## Verification

```bash
agentic-workflow-guard scan . --format markdown
agentic-workflow-guard rules search mcp
```

The remaining MCP tools should be narrow, explicit, and safe to expose to a coding agent by default.
