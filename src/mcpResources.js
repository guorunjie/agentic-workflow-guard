import { packageVersion } from "./version.js";

export const mcpResourcePack = {
  name: "agentic-workflow-guard-mcp-resources",
  version: packageVersion,
  protocolRevision: "2025-06-18",
  description: "MCP-style resource descriptors for Agentic Workflow Guard rules, benchmarks, skills, and remediation playbooks.",
  capabilities: {
    resources: {}
  },
  resources: [
    {
      uri: "awg://rules/core",
      name: "core-rules",
      title: "Agentic Workflow Guard Core Rules",
      description: "Rule marketplace metadata for AWI001-AWI010.",
      mimeType: "application/json",
      path: "rules/marketplace.json",
      annotations: { audience: ["assistant", "user"], priority: 1.0 }
    },
    {
      uri: "awg://rules/registry",
      name: "rule-registry",
      title: "Agentic Workflow Guard Rule Registry",
      description: "Installable bundled and community rule pack index with aliases, checksums, and install commands.",
      mimeType: "application/json",
      path: "rules/registry.json",
      annotations: { audience: ["assistant", "user"], priority: 1.0 }
    },
    {
      uri: "awg://benchmarks/fixtures",
      name: "benchmark-fixtures",
      title: "Agentic Workflow Guard Benchmark Fixtures",
      description: "Expected findings for vulnerable and safe workflow fixtures.",
      mimeType: "application/json",
      path: "benchmarks/fixtures.json",
      annotations: { audience: ["assistant"], priority: 0.9 }
    },
    {
      uri: "awg://benchmarks/corpus",
      name: "benchmark-corpus",
      title: "Agentic Workflow Guard Benchmark Corpus",
      description: "Portable benchmark corpus metadata for vulnerable and safe fixtures across supported platforms.",
      mimeType: "application/json",
      path: "benchmarks/corpus.json",
      annotations: { audience: ["assistant", "user"], priority: 0.95 }
    },
    {
      uri: "awg://schemas/report",
      name: "report-schema",
      title: "Agentic Workflow Guard Report Schema",
      description: "Stable JSON Schema for Agentic Workflow Guard scan reports.",
      mimeType: "application/schema+json",
      path: "schemas/agentic-workflow-guard-report.schema.json",
      annotations: { audience: ["assistant", "user"], priority: 0.95 }
    },
    {
      uri: "awg://schemas/fix-report",
      name: "fix-report-schema",
      title: "Agentic Workflow Guard Fix Report Schema",
      description: "Stable JSON Schema for structured fix recipe reports with next steps and remediation snippets.",
      mimeType: "application/schema+json",
      path: "schemas/agentic-workflow-guard-fix-report.schema.json",
      annotations: { audience: ["assistant", "user"], priority: 0.95 }
    },
    {
      uri: "awg://schemas/rule-pack",
      name: "rule-pack-schema",
      title: "Agentic Workflow Guard Rule Pack Schema",
      description: "Stable JSON Schema for marketplace rule pack metadata.",
      mimeType: "application/schema+json",
      path: "schemas/agentic-workflow-guard-rule-pack.schema.json",
      annotations: { audience: ["assistant", "user"], priority: 0.95 }
    },
    {
      uri: "awg://schemas/benchmark-corpus",
      name: "benchmark-corpus-schema",
      title: "Agentic Workflow Guard Benchmark Corpus Schema",
      description: "Stable JSON Schema for benchmark corpus metadata.",
      mimeType: "application/schema+json",
      path: "schemas/agentic-workflow-guard-benchmark-corpus.schema.json",
      annotations: { audience: ["assistant", "user"], priority: 0.95 }
    },
    {
      uri: "awg://schemas/benchmark-report",
      name: "benchmark-report-schema",
      title: "Agentic Workflow Guard Benchmark Report Schema",
      description: "Stable JSON Schema for benchmark scoring reports.",
      mimeType: "application/schema+json",
      path: "schemas/agentic-workflow-guard-benchmark-report.schema.json",
      annotations: { audience: ["assistant", "user"], priority: 0.95 }
    },
    {
      uri: "awg://skill/auditor",
      name: "auditor-skill",
      title: "Agentic Workflow Guard Auditor Skill",
      description: "Portable SKILL.md workflow for auditing AI automation risks.",
      mimeType: "text/markdown",
      path: "skills/agentic-workflow-guard-auditor/SKILL.md",
      annotations: { audience: ["assistant"], priority: 1.0 }
    },
    {
      uri: "awg://policies/profiles",
      name: "policy-profiles",
      title: "Policy Profiles and Suppressions",
      description: "Rollout profiles and audited inline suppression guidance.",
      mimeType: "text/markdown",
      path: "docs/policy-profiles-and-suppressions.md",
      annotations: { audience: ["assistant", "user"], priority: 0.9 }
    },
    {
      uri: "awg://docs/rule-marketplace",
      name: "rule-marketplace-guide",
      title: "Rule Marketplace Guide",
      description: "How to list, install, verify, and contribute focused rule packs.",
      mimeType: "text/markdown",
      path: "docs/rule-marketplace.md",
      annotations: { audience: ["assistant", "user"], priority: 0.9 }
    },
    {
      uri: "awg://docs/index",
      name: "docs-index",
      title: "Agentic Workflow Guard Docs Index",
      description: "Entry point for documentation, playbooks, policies, and release readiness.",
      mimeType: "text/markdown",
      path: "docs/index.md",
      annotations: { audience: ["assistant", "user"], priority: 0.8 }
    },
    {
      uri: "awg://docs/demos",
      name: "demo-playbook",
      title: "Agentic Workflow Guard Demo Playbook",
      description: "High-signal demos for GitHub Actions, n8n, MCP, browser automation, and benchmark proof.",
      mimeType: "text/markdown",
      path: "docs/demos.md",
      annotations: { audience: ["assistant", "user"], priority: 0.9 }
    },
    {
      uri: "awg://release/v1-readiness",
      name: "v1-readiness",
      title: "Agentic Workflow Guard v1.0 Readiness",
      description: "Release gates, blockers, timeline, and cut plan for the stable v1.0 automation safety layer.",
      mimeType: "text/markdown",
      path: "docs/v1-readiness.md",
      annotations: { audience: ["assistant", "user"], priority: 0.85 }
    },
    {
      uri: "awg://release/npm-publish",
      name: "npm-publish-checklist",
      title: "NPM Publish Checklist",
      description: "Package verification and npm publication checklist.",
      mimeType: "text/markdown",
      path: "docs/npm-publish.md",
      annotations: { audience: ["assistant", "user"], priority: 0.7 }
    },
    {
      uri: "awg://playbooks/github-actions",
      name: "github-actions-playbook",
      title: "GitHub Actions Remediation Playbook",
      description: "How to reduce agent prompt injection and write-permission risks in GitHub Actions.",
      mimeType: "text/markdown",
      path: "docs/playbooks/github-actions.md",
      annotations: { audience: ["assistant", "user"], priority: 0.8 }
    },
    {
      uri: "awg://playbooks/ci-pipelines",
      name: "ci-pipelines-playbook",
      title: "CI Pipeline Remediation Playbook",
      description: "How to reduce prompt injection, shell sink, token, context, service connection, and credential risks in GitLab CI, CircleCI, Azure Pipelines, Jenkins, and Buildkite agent jobs.",
      mimeType: "text/markdown",
      path: "docs/playbooks/ci-pipelines.md",
      annotations: { audience: ["assistant", "user"], priority: 0.8 }
    },
    {
      uri: "awg://playbooks/n8n",
      name: "n8n-playbook",
      title: "n8n Remediation Playbook",
      description: "How to guard n8n external trigger -> AI node -> side-effect paths.",
      mimeType: "text/markdown",
      path: "docs/playbooks/n8n.md",
      annotations: { audience: ["assistant", "user"], priority: 0.8 }
    },
    {
      uri: "awg://playbooks/mcp",
      name: "mcp-playbook",
      title: "MCP Tool Governance Playbook",
      description: "How to scope MCP filesystem, shell, browser, GitHub, and infrastructure tools.",
      mimeType: "text/markdown",
      path: "docs/playbooks/mcp.md",
      annotations: { audience: ["assistant", "user"], priority: 0.85 }
    },
    {
      uri: "awg://playbooks/low-code",
      name: "low-code-playbook",
      title: "Low-Code AI Workflow Remediation Playbook",
      description: "How to guard Activepieces, Dify, Flowise, Langflow, Zapier, Make, Pipedream, Node-RED, and Airflow AI workflows.",
      mimeType: "text/markdown",
      path: "docs/playbooks/low-code.md",
      annotations: { audience: ["assistant", "user"], priority: 0.75 }
    },
    {
      uri: "awg://playbooks/browser-automation",
      name: "browser-automation-playbook",
      title: "Browser Automation Remediation Playbook",
      description: "How to guard browser-use, Skyvern, Playwright, and Puppeteer AI browser side effects.",
      mimeType: "text/markdown",
      path: "docs/playbooks/browser-automation.md",
      annotations: { audience: ["assistant", "user"], priority: 0.75 }
    }
  ]
};

export function renderMcpResourcesJson() {
  return `${JSON.stringify({ resourcePack: mcpResourcePack }, null, 2)}\n`;
}

export function renderMcpResourcesMarkdown() {
  const lines = [
    "# MCP Resource Pack",
    "",
    mcpResourcePack.description,
    "",
    `- Name: ${mcpResourcePack.name}`,
    `- Version: ${mcpResourcePack.version}`,
    `- Protocol revision: ${mcpResourcePack.protocolRevision}`,
    "",
    "| URI | Title | MIME type | File |",
    "| --- | --- | --- | --- |"
  ];

  for (const resource of mcpResourcePack.resources) {
    lines.push(`| \`${resource.uri}\` | ${resource.title} | \`${resource.mimeType}\` | \`${resource.path}\` |`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderMcpResources(format = "markdown") {
  if (format === "json") return renderMcpResourcesJson();
  return renderMcpResourcesMarkdown();
}
