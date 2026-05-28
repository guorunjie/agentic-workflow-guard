# I built a safety scanner that turns AI workflows into portable agent skills

AI automation is getting powerful fast: GitHub Actions can call agents, n8n, Activepieces, Dify, Flowise, and Langflow can connect AI nodes to production APIs, and MCP servers can expose browsers, shells, filesystems, and repo tools.

The gap is review. Before an agent gets write access, maintainers need a local, CI-friendly way to ask:

- did untrusted issue or PR text reach an agent prompt?
- did model output flow into a shell command?
- does an AI job have write permissions?
- does an n8n, Activepieces, Dify, Flowise, Langflow, Make, Pipedream, Node-RED, or Airflow workflow chain AI into side effects?
- do browser-use, Skyvern, Playwright, or Puppeteer traces let AI decisions click, fill, submit, or approve?
- are MCP tools scoped tightly enough?

Agentic Workflow Guard is a deterministic scanner for that gap. It has no hosted service, no LLM call, and no API key requirement.

```bash
npx agentic-workflow-guard init .
npx agentic-workflow-guard scan examples/unsafe-ai-pr-bot --format markdown
npx agentic-workflow-guard scan examples/unsafe-ai-pr-bot --format sarif > awg.sarif
npx agentic-workflow-guard fix examples/unsafe-ai-pr-bot --patch
npx agentic-workflow-guard skillpack > skillpack.yaml
```

The last command is the combo move: the scanner emits a Skillpack Forge manifest, and Skillpack Forge compiles it into `AGENTS.md`, Claude Skills, Codex Skills, Cursor rules, and Copilot instructions. The same safety workflow can then travel with the repo and be used by multiple coding agents.

The project is intentionally small:

- static scanner for AI automation workflows;
- Markdown, JSON, and SARIF output;
- GitHub Action support for Code Scanning upload;
- one-command `.awg.yml` and GitHub Actions workflow scaffolding;
- baseline mode for incremental adoption;
- browser automation trace checks;
- `fix --patch` for PR-ready GitHub permission, MCP filesystem, and CI dry-run diffs;
- low-risk `fix --apply` for permission downgrades, MCP filesystem read-only scoping, and CI dry-run defaults;
- `agents install` helpers for project-local agent context;
- portable skillpack export for agent instructions.

The positioning is narrow on purpose. This is not another general AI security platform. It is workflow-aware scanning for the places where automation already touches external input, credentials, and write-capable tools.

Repos:

- Agentic Workflow Guard: https://github.com/guorunjie/agentic-workflow-guard
- Skillpack Forge: https://github.com/guorunjie/skillpack-forge

Useful places to submit after the first release:

- GitHub Copilot configs: https://github.com/github/awesome-copilot
- Claude Skills lists: https://github.com/ComposioHQ/awesome-claude-skills
- MCP server lists after MCP resource output lands: https://github.com/punkpeye/awesome-mcp-servers
- Hacker News, Reddit, X, and relevant AI security/workflow automation communities
