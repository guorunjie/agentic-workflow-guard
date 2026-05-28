import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { availableRulePacks } from "./rulesCatalog.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const communityRulePackFiles = availableRulePacks
  .filter((pack) => pack.provenance.source === "community")
  .map((pack) => `rules/community/${pack.name}.json`);

const installTargets = {
  "agents-md": ["AGENTS.md"],
  claude: [".claude/skills/agentic-workflow-guard-auditor/SKILL.md"],
  codex: [".codex/skills/agentic-workflow-guard-auditor/SKILL.md"],
  cursor: [".cursor/rules/agentic-workflow-guard.mdc"],
  copilot: [".github/copilot-instructions.md"],
  gemini: ["GEMINI.md", ".gemini/skills/agentic-workflow-guard-auditor/SKILL.md"],
  openclaw: ["skills/agentic-workflow-guard-auditor/SKILL.md", ".openclaw/skills/agentic-workflow-guard-auditor/SKILL.md"],
  hermes: ["skills/agentic-workflow-guard-auditor/SKILL.md", ".hermes/skills/agentic-workflow-guard-auditor/SKILL.md"],
  "mcp-resources": [
    "mcp/resources/agentic-workflow-guard.resources.json",
    "rules/marketplace.json",
    "rules/registry.json",
    ...communityRulePackFiles,
    "benchmarks/fixtures.json",
    "benchmarks/corpus.json",
    "schemas/agentic-workflow-guard-report.schema.json",
    "schemas/agentic-workflow-guard-fix-report.schema.json",
    "schemas/agentic-workflow-guard-rule-pack.schema.json",
    "schemas/agentic-workflow-guard-benchmark-corpus.schema.json",
    "schemas/agentic-workflow-guard-benchmark-report.schema.json",
    "skills/agentic-workflow-guard-auditor/SKILL.md",
    "docs/policy-profiles-and-suppressions.md",
    "docs/rule-marketplace.md",
    "docs/demos.md",
    "docs/v1-readiness.md",
    "docs/index.md",
    "docs/npm-publish.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "docs/playbooks/github-actions.md",
    "docs/playbooks/ci-pipelines.md",
    "docs/playbooks/n8n.md",
    "docs/playbooks/mcp.md",
    "docs/playbooks/low-code.md",
    "docs/playbooks/browser-automation.md"
  ]
};

export function agentInstallTargets() {
  return Object.keys(installTargets);
}

async function copyFileToProject(relative, root) {
  const source = path.join(packageRoot, relative);
  const target = path.join(root, relative);
  if (path.resolve(source) === path.resolve(target)) return relative;
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target);
  return relative;
}

export async function installAgent(target, root) {
  const files = target === "all" ? [...new Set(Object.values(installTargets).flat())] : installTargets[target];
  if (!files) {
    throw new Error(`Unknown agent target: ${target}`);
  }
  const installed = [];
  for (const file of files) {
    installed.push(await copyFileToProject(file, root));
  }
  return installed;
}
