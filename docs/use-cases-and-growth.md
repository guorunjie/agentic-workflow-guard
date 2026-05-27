# Use Cases and Growth Strategy

Agentic Workflow Guard should grow around one memorable idea:

> Semgrep-style scanning for AI automation workflows.

## Current Use Cases

### 1. AI-Powered GitHub Actions

Teams increasingly add agents to issue triage, PR review, release work, changelog generation, and repository maintenance. The risk appears when untrusted issue or PR text reaches a prompt, then the agent receives write permissions or shell execution.

Agentic Workflow Guard detects:

- untrusted GitHub event context in prompts;
- agent output entering `run:` shell steps;
- high write permissions in AI jobs;
- `pull_request_target` combined with agent or script execution;
- secrets or environment values exposed to agent-visible context.

### 2. n8n and Operations Automation

n8n is a natural target because it combines triggers, AI nodes, credentials, HTTP calls, code nodes, and operations workflows. The risky pattern is external trigger -> AI node -> side-effect node.

Agentic Workflow Guard detects:

- Webhook, email, and GitHub trigger nodes;
- AI Agent/OpenAI/LangChain-style nodes;
- HTTP Request, Code, Execute Command, and credential-bearing nodes.

### 3. MCP Tool Governance

MCP makes tools easy for agents to call. That also makes broad filesystem, browser, shell, GitHub, Docker, Kubernetes, or cloud tools risky when scoped too widely.

Agentic Workflow Guard detects:

- filesystem roots such as `/`;
- shell-like MCP servers;
- browser tools with write flags;
- repository and infrastructure tool names that imply broad side effects.

### 4. Low-Code AI Workflows

Activepieces, Zapier, Make, Pipedream, Node-RED, and similar platforms are converging on AI steps plus API actions. Airflow DAGs are also starting to embed LLM calls next to shell, HTTP, Docker, and Kubernetes operators.

Agentic Workflow Guard detects:

- AI or LLM steps in the same flow as HTTP, code, GitHub, Slack, Notion, database, or credential-bearing actions.
- Node-RED, Make, and Pipedream exports that combine AI modules with side-effect steps.
- Airflow DAGs that combine LLM calls with Bash, HTTP, Docker, Kubernetes, or Python side-effect operators.

### 5. Agent Skill and Repository Audits

The scanner exports Skillpack Forge-compatible instructions and portable SKILL.md bundles so coding agents can consistently audit automation risks across AGENTS.md, Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, and Hermes.

## Optimization Directions

Highest-impact improvements:

1. **Make SARIF first-class**  
   Add upload examples, GitHub Code Scanning screenshots, stable rule metadata, and release-tagged Marketplace usage.

2. **Add native platform parsers**  
   Deepen Activepieces, Zapier, Make, Pipedream, Node-RED, Airflow, Playwright, browser-use, and Skyvern beyond the current static heuristics.

3. **Ship trusted examples**  
   Add paired vulnerable/safe fixtures for every platform so users can understand findings in seconds.

4. **Turn `fix` into a patch generator**  
   Expand from current permission downgrades into dry-run defaults, approval gates, split write jobs, and PR-ready patches.

5. **Build the rule marketplace**  
   Grow the current `rules list/search/install` into external rule packs, signed metadata, checksums, and community contributions.

6. **Publish as a complete skill**  
   Maintain generated AGENTS.md, Claude Skill, Codex Skill, Gemini context/skill files, Cursor rule, Copilot instructions, OpenClaw/Hermes SKILL.md bundles, and eventually MCP resources.

7. **Create a benchmark dataset**  
   A public `agentic-workflow-vuln-fixtures` collection can become the reference dataset for this risk category.

## Star Growth Playbook

- README headline: "Semgrep-style scanner for AI automation workflows."
- First demo: one vulnerable GitHub Action producing SARIF, upload-sarif integration, and a `fix --apply` permission patch.
- Distribution: GitHub Action, npm package, Skillpack Forge, AGENTS.md, Claude/Codex/Gemini/OpenClaw/Hermes skills, Cursor rules, Copilot instructions.
- Submit to lists: awesome-copilot, awesome-mcp-servers after MCP resources land, awesome-claude-skills after skill examples mature.
- Content hooks:
  - "Your AI workflow has write access. Who reviewed the prompt boundary?"
  - "n8n + AI Agent + HTTP Request is powerful. It also needs a guardrail."
  - "MCP made tools easy to call. This checks whether they are too easy."

## Repository Description Recommendation

Use this GitHub description:

```text
Security scanner and portable skill pack for AI automation workflows across GitHub Actions, n8n, MCP, Claude, Codex, Gemini, OpenClaw, Hermes, Cursor, and Copilot.
```
