# Market Analysis: Automation, Agents, Skills, and Safety

Date: 2026-05-27

Method: GitHub API snapshot of high-star repositories in workflow automation, agentic workflows, browser automation, MCP, and agent skill/context distribution.

## High-Star Signals

| Direction | Repository | Stars observed | Signal |
| --- | --- | ---: | --- |
| Workflow automation | [`n8n-io/n8n`](https://github.com/n8n-io/n8n) | 189,902 | Visual workflow automation with AI capabilities and 400+ integrations is a huge category. |
| Agentic workflows | [`langgenius/dify`](https://github.com/langgenius/dify) | 142,838 | Production-ready agentic workflow development attracts platform-scale interest. |
| Browser automation | [`browser-use/browser-use`](https://github.com/browser-use/browser-use) | 95,796 | Making websites accessible to AI agents is a breakout automation use case. |
| MCP browser tools | [`microsoft/playwright-mcp`](https://github.com/microsoft/playwright-mcp) | 33,087 | MCP is becoming a common tool surface for agent automation. |
| AI workflow automation | [`activepieces/activepieces`](https://github.com/activepieces/activepieces) | 22,435 | AI agents, MCPs, and workflow automation are converging. |
| Browser workflow agents | [`Skyvern-AI/skyvern`](https://github.com/Skyvern-AI/skyvern) | 21,752 | Browser-based workflow automation with AI has durable demand. |
| Agent skills | [`anthropics/skills`](https://github.com/anthropics/skills) | 141,630 | Skills are becoming a mainstream agent capability package format. |
| Agent instructions | [`agentsmd/agents.md`](https://github.com/agentsmd/agents.md) | 21,738 | Repo-level agent context is becoming standardized. |
| Copilot configs | [`github/awesome-copilot`](https://github.com/github/awesome-copilot) | 33,907 | Developers collect reusable instructions, agents, skills, and configs. |

## Pattern

High-star automation projects share five traits:

1. **They sit on a daily workflow**: CI, browser work, data movement, support, or operations.
2. **They compose tools**: integrations, MCP tools, browser actions, APIs, and credentials.
3. **They lower automation setup cost**: visual builders, CLIs, reusable skills, or templates.
4. **They are agent-ready**: LLMs can call tools, follow instructions, or operate workflows.
5. **They create new risk surfaces**: prompt injection, overpowered tokens, shell execution, credential-bearing nodes, and broad MCP tools.

## Opportunity

The crowded side is building more automation. The under-served side is guarding automation before it runs.

Agentic Workflow Guard targets the gap:

- static analysis rather than another workflow builder;
- local and CI-friendly rather than hosted;
- no LLM calls or API keys;
- SARIF output for GitHub Code Scanning;
- rules that map directly to agentic workflow risks.

## Product Bet

The likely high-star wedge is:

> "Semgrep for AI automation workflows."

The current version covers GitHub Actions, GitLab CI, CircleCI, Azure Pipelines, Jenkins, n8n exports, MCP configs, and low-code workflow JSON. The roadmap expands precision across Activepieces, Zapier, Make, Pipedream, Node-RED, Airflow, and browser automation traces.
