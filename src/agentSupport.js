const skillName = "agentic-workflow-guard-auditor";

export const supportedAgents = [
  {
    id: "agents-md",
    name: "AGENTS.md ecosystem",
    status: "supported",
    integration: "Repository instruction file",
    outputs: ["AGENTS.md"],
    loading: "Read by AGENTS.md-aware coding agents at repository root."
  },
  {
    id: "claude",
    name: "Claude Code",
    status: "supported",
    integration: "Project skill",
    outputs: [`.claude/skills/${skillName}/SKILL.md`],
    loading: "Loaded as a repository-local Claude Skill."
  },
  {
    id: "codex",
    name: "Codex",
    status: "supported",
    integration: "Project skill",
    outputs: [`.codex/skills/${skillName}/SKILL.md`],
    loading: "Loaded as a repository-local Codex skill."
  },
  {
    id: "cursor",
    name: "Cursor",
    status: "supported",
    integration: "Project rule",
    outputs: [".cursor/rules/agentic-workflow-guard.mdc"],
    loading: "Loaded as an always-on Cursor project rule."
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    status: "supported",
    integration: "Repository custom instructions",
    outputs: [".github/copilot-instructions.md"],
    loading: "Read as repository-level Copilot instructions."
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    status: "supported",
    integration: "GEMINI.md plus skill bundle",
    outputs: ["GEMINI.md", `.gemini/skills/${skillName}/SKILL.md`],
    loading: "Uses GEMINI.md as project context; the skill bundle is included for skill-capable Gemini setups."
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    status: "supported",
    integration: "SKILL.md bundle",
    outputs: [`skills/${skillName}/SKILL.md`, `.openclaw/skills/${skillName}/SKILL.md`],
    loading: "Uses the portable SKILL.md format in a workspace skills directory or OpenClaw skill install path."
  },
  {
    id: "hermes",
    name: "Hermes",
    status: "supported",
    integration: "SKILL.md bundle",
    outputs: [`skills/${skillName}/SKILL.md`, `.hermes/skills/${skillName}/SKILL.md`],
    loading: "Uses the portable SKILL.md format; copy to the Hermes skills directory or include via external skill dirs."
  },
  {
    id: "mcp-resources",
    name: "MCP resource pack",
    status: "supported",
    integration: "Resource manifest",
    outputs: ["mcp/resources/agentic-workflow-guard.resources.json", "docs/playbooks/*.md"],
    loading: "Expose the manifest resources through an MCP server or copy the playbooks into an agent context bundle."
  }
];

function renderOutputList(outputs) {
  return outputs.map((output) => `\`${output}\``).join("<br>");
}

export function renderAgentSupportMarkdown() {
  const rows = supportedAgents
    .map((agent) => `| ${agent.name} | ${agent.status} | ${agent.integration} | ${renderOutputList(agent.outputs)} | ${agent.loading} |`)
    .join("\n");

  return `# Agent Compatibility

Agentic Workflow Guard ships instructions and skill bundles for the mainstream AI coding agent surface area.

| Agent | Status | Integration | Output files | Loading notes |
| --- | --- | --- | --- | --- |
${rows}
`;
}

export function renderAgentSupportJson() {
  return `${JSON.stringify({ supportedAgents }, null, 2)}\n`;
}
