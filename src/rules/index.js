export const rules = {
  AWI001: {
    severity: "high",
    title: "Untrusted CI or workflow context reaches an agent prompt",
    risk: "Issue, pull request, merge request, branch, discussion, comment, or commit text from GitHub Actions, Bitbucket Pipelines, GitLab CI, CircleCI, Azure Pipelines, Jenkins, or Buildkite can contain prompt-injection instructions that influence an agent.",
    remediation: "Gate untrusted content, check author association, summarize in read-only mode, or require human approval before tool execution."
  },
  AWI002: {
    severity: "high",
    title: "Agent output flows into shell or workflow command",
    risk: "Model-controlled text can become command execution if passed into run/script/shell steps.",
    remediation: "Never execute raw agent output. Write output to a review artifact, validate it against an allowlist, or require human approval."
  },
  AWI003: {
    severity: "high",
    title: "AI workflow has high write permissions",
    risk: "An agent with write tokens can modify code, pull requests, releases, or cloud identity after prompt manipulation.",
    remediation: "Use read-only permissions by default and move write operations into a separate approved job."
  },
  AWI004: {
    severity: "high",
    title: "pull_request_target combines untrusted code context with agent execution",
    risk: "pull_request_target runs with elevated permissions while processing untrusted pull request content.",
    remediation: "Use pull_request with read-only permissions, or isolate privileged work behind manual review."
  },
  AWI005: {
    severity: "high",
    title: "n8n untrusted trigger reaches AI and side-effect node",
    risk: "External workflow input can steer an AI node into HTTP, code, command, or credential-bearing actions.",
    remediation: "Add validation, allowlists, approval nodes, and dry-run outputs before side-effect nodes."
  },
  AWI006: {
    severity: "high",
    title: "MCP exposes broad high-risk tools",
    risk: "Filesystem, shell, browser, or repository tools with broad scope give agents powerful side effects.",
    remediation: "Scope MCP tools to narrow paths and read-only operations; split write-capable tools behind approval."
  },
  AWI007: {
    severity: "medium",
    title: "Secrets or environment values are visible to agent context",
    risk: "Secrets in prompt-visible context can leak through model output or third-party tools.",
    remediation: "Keep secrets out of prompts and agent-visible environment variables. Use short-lived scoped tokens."
  },
  AWI008: {
    severity: "medium",
    title: "Agentic workflow lacks explicit safety controls",
    risk: "Workflows with agents and tools but no approval, allowlist, dry-run, or safe-output language are harder to audit.",
    remediation: "Add human approval, allowlists, dry-run mode, safe output handling, or staged write gates."
  },
  AWI009: {
    severity: "medium",
    title: "Workflow automation chains AI into side effects",
    risk: "Automation platforms such as Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, or Airflow can route model output into API calls, shell commands, deployment operators, tools, requests, or code nodes.",
    remediation: "Validate model output before side effects and require approvals for credential-bearing actions in low-code flows, Dify workflows, Flowise chatflows, Langflow flows, Zapier Zaps, Node-RED flows, Pipedream workflows, Make scenarios, and Airflow DAGs."
  },
  AWI010: {
    severity: "medium",
    title: "Browser automation trace chains AI into side effects",
    risk: "Browser agents such as browser-use, Skyvern, Playwright, or Puppeteer can turn model decisions into clicks, form fills, uploads, payments, approvals, or destructive web actions.",
    remediation: "Require allowlists, dry-run previews, human approval, and domain/action scopes before AI-driven browser automation performs side effects."
  }
};

export function makeFinding(ruleId, file, evidence, overrides = {}) {
  const rule = rules[ruleId];
  return {
    ruleId,
    severity: overrides.severity ?? rule.severity,
    title: overrides.title ?? rule.title,
    file,
    evidence,
    remediation: overrides.remediation ?? rule.remediation
  };
}
