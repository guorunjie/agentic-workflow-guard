# Use Cases and Growth Strategy

Agentic Workflow Guard should grow around one memorable idea:

> Semgrep-style scanning for AI automation workflows.

## Current Use Cases

### 1. AI-Powered CI Pipelines

Teams increasingly add agents to issue triage, merge request review, release work, changelog generation, and repository maintenance. The risk appears when untrusted issue, PR, merge request, branch, or commit text reaches a prompt, then the agent receives tokens, contexts, write permissions, or shell execution.

Agentic Workflow Guard detects:

- untrusted GitHub, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, and Buildkite event or pipeline context in prompts;
- agent output entering GitHub Actions `run:` steps, Bitbucket Pipelines `script:` lines, GitLab CI `script:` lines, Travis CI `script:` lines, Drone `commands:`, TeamCity script steps, Harness Run steps, Tekton scripts, Argo container args, CodeBuild buildspec commands, Cloud Build bash steps, CircleCI `run` commands, Azure Pipelines `script:` steps, Jenkins `sh` steps, or Buildkite `command` steps;
- high write permissions in AI jobs;
- CI tokens, secret-like environment values, Bitbucket deployment/OIDC tokens, Travis secure env, Drone secrets, TeamCity secure parameters, Harness secrets, Tekton or Argo Kubernetes secret refs, CodeBuild Secrets Manager or Parameter Store env, Cloud Build Secret Manager env, CircleCI contexts, Azure service connections, Azure variable groups, Jenkins credential bindings, and Buildkite env secrets near agent execution;
- `pull_request_target` combined with agent or script execution;
- secrets or environment values exposed to agent-visible context.

Teams can start with `agentic-workflow-guard init .` to scaffold `.awg.yml` and a release-tagged GitHub Actions Code Scanning workflow, then run `agentic-workflow-guard doctor .` to verify the setup before tuning policies.

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

Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, and similar platforms are converging on AI steps plus API actions. Airflow DAGs are also starting to embed LLM calls next to shell, HTTP, Docker, and Kubernetes operators.

Agentic Workflow Guard detects:

- AI or LLM steps in the same flow as HTTP, code, GitHub, Slack, Notion, database, or credential-bearing actions.
- Dify DSL, Flowise chatflows, and Langflow exports that connect AI nodes to HTTP requests, tools, custom components, or API requests.
- Zapier Zaps that route AI actions into app updates such as CRM, issue tracker, messaging, or webhook writes.
- Node-RED, Make, and Pipedream exports that combine AI modules with side-effect steps.
- Airflow DAGs that combine LLM calls with Bash, HTTP, Docker, Kubernetes, or Python side-effect operators.
- Browser automation traces where AI decisions reach clicks, forms, submissions, uploads, approvals, or payment-like actions.

### 5. Agent Skill and Repository Audits

The scanner exports Skillpack Forge-compatible instructions and portable SKILL.md bundles so coding agents can consistently audit automation risks across AGENTS.md, Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, and Hermes.

## Optimization Directions

Highest-impact improvements:

1. **Make SARIF first-class**  
   Add upload examples, GitHub Code Scanning screenshots, stable rule metadata, and release-tagged Marketplace usage.

2. **Add native platform parsers**  
   Deepen Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, Buildkite, Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, Airflow, Playwright, browser-use, and Skyvern beyond the current static heuristics.

3. **Ship trusted examples**  
   Add paired vulnerable/safe fixtures for every platform so users can understand findings in seconds.

4. **Turn `fix` into a remediation engine**
   Expand from current permission downgrades, MCP filesystem read-only scoping, platform-aware dry-run defaults, approval snippets, `fix --output`, `fix --patch`, and `fix --format json` recipes into split write jobs, richer allowlists, and PR-ready patches.

5. **Build the rule marketplace**
   Grow the current `rules list/registry/search/install` into external rule packs with a stable schema, lock files, signed metadata, checksums, and community contributions.

6. **Make adoption incremental**
   Use `init`, `doctor`, `baseline create`, and `scan --baseline` so existing repositories can scaffold CI quickly, verify setup, and adopt the scanner without failing CI on known legacy findings.

7. **Publish as a complete skill**
   Maintain generated AGENTS.md, Claude Skill, Codex Skill, Gemini context/skill files, Cursor rule, Copilot instructions, OpenClaw/Hermes SKILL.md bundles, and eventually MCP resources.

8. **Create a benchmark dataset**
   A public `agentic-workflow-vuln-fixtures` collection can become the reference dataset for this risk category.

## Growth Space Assessment

There is still meaningful room for iteration. The project is no longer just a CLI idea; it has a working scanner, one-command project initialization, setup doctor diagnostics, SARIF output, a GitHub Action, trusted rule metadata, benchmark snapshots, structured fix recipes, fix previews, stable config/report/fix/rule/benchmark schemas, portable agent skill files, an MCP-style resource pack, policy profiles, audited suppression comments, suppression reports, and release-readiness docs. The next growth curve is turning that foundation into a trusted security layer for every place where agents can trigger side effects.

Priority directions:

1. **Deeper native parsers**
   Replace broad heuristics with native understanding of GitHub Actions, Bitbucket Pipelines, GitLab CI, Travis CI, Drone CI, TeamCity, Harness CI/CD, Tekton Pipelines, Argo Workflows, AWS CodeBuild, Google Cloud Build, CircleCI, Azure Pipelines, Jenkins, Buildkite, n8n, Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, Airflow, Playwright, browser-use, and Skyvern exports. This improves precision, evidence quality, and trust.

2. **Policy and fix engine**
   Expand `fix --format json`, `fix --output`, and `fix --patch` into policy-aware remediation: approval snippets, allowlists, split read/write jobs, MCP filesystem read-only scoping, permission minimization, platform-specific dry-run defaults, and PR-ready patches with confidence levels.

3. **Trusted rule marketplace**
   Evolve the local rule catalog and community registry into signed community rule packs with schema validation, lock files, checksum verification, SemVer compatibility, provenance metadata, and review guidelines.

4. **Benchmark as moat**
   Grow the shipped `benchmark corpus` output, `benchmark --format json` scoring report, and `benchmarks/corpus.json` into the reference test set for agentic workflow security tools.

5. **Agent-native distribution**
   Keep Claude, Codex, Cursor, Copilot, Gemini, OpenClaw, Hermes, and AGENTS.md outputs generated and tested. Extend the MCP resource pack into marketplace-ready skill packages once those ecosystems stabilize.

6. **Enterprise adoption path**
   Add org-level config examples, Code Scanning dashboards, and richer audit reports. Baselines, suppression comments, suppression reporting, and policy severity profiles are now in place.

The strongest star-growth path is to show one scary, easy-to-understand demo per platform: untrusted input -> AI decision -> write-capable action, then show how the scanner catches it before it runs.

## Star Growth Playbook

- README headline: "Semgrep-style scanner for AI automation workflows."
- First demo: `init .`, one vulnerable GitHub Action producing SARIF, upload-sarif integration, and a `fix --apply` permission patch.
- Distribution: GitHub Action, npm package, Skillpack Forge, public benchmark corpus, AGENTS.md, Claude/Codex/Gemini/OpenClaw/Hermes skills, Cursor rules, Copilot instructions.
- Submit to lists: awesome-copilot, awesome-mcp-servers after MCP resources land, awesome-claude-skills after skill examples mature.
- Content hooks:
  - "Your AI workflow has write access. Who reviewed the prompt boundary?"
  - "n8n + AI Agent + HTTP Request is powerful. It also needs a guardrail."
  - "MCP made tools easy to call. This checks whether they are too easy."

## Repository Description Recommendation

Use this GitHub description:

```text
Find dangerous AI automation workflows before agents get write access; covers CI, low-code, MCP, browser agents, SARIF, community rule packs, a benchmark corpus, and portable skills.
```
