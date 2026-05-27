import path from "node:path";

import { loadConfig } from "./config.js";
import { explainRule } from "./explain.js";
import { renderFixPlan } from "./fix.js";
import { renderAgentSupportJson, renderAgentSupportMarkdown } from "./agentSupport.js";
import { renderJson } from "./reporters/json.js";
import { renderMarkdown } from "./reporters/markdown.js";
import { renderSarif } from "./reporters/sarif.js";
import { installRulePack, renderRulePacks, renderRuleSearch, renderRules } from "./rulesCatalog.js";
import { scanProject, hasHighFindings } from "./scan.js";
import { renderSkillpack } from "./skillpack.js";

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function firstPositional(args, fallback = ".") {
  return args.find((arg) => !arg.startsWith("--")) ?? fallback;
}

function help() {
  return `Agentic Workflow Guard

Usage:
  agentic-workflow-guard scan [path] [--format json|markdown|sarif]
  agentic-workflow-guard fix [path] [--dry-run|--apply]
  agentic-workflow-guard explain <rule-id>
  agentic-workflow-guard rules [list|search <query>|install core [path]] [--format markdown|json]
  agentic-workflow-guard agents [--format markdown|json]
  agentic-workflow-guard skillpack
`;
}

function renderFindings(findings, format) {
  if (format === "json") return renderJson(findings);
  if (format === "sarif") return renderSarif(findings);
  return renderMarkdown(findings);
}

export async function run(argv = process.argv.slice(2), output = process.stdout, error = process.stderr) {
  const [command, ...args] = argv;
  if (!command || command === "--help" || command === "-h") {
    output.write(help());
    return 0;
  }

  if (command === "scan") {
    const root = path.resolve(firstPositional(args));
    const format = argValue(args, "--format", "markdown");
    const config = await loadConfig(root);
    const findings = await scanProject(root, config);
    output.write(renderFindings(findings, format));
    return hasHighFindings(findings, config) ? 1 : 0;
  }

  if (command === "fix") {
    const root = path.resolve(firstPositional(args));
    output.write(await renderFixPlan(root, { apply: args.includes("--apply") }));
    return 0;
  }

  if (command === "explain") {
    output.write(explainRule(args[0]));
    return args[0] ? 0 : 1;
  }

  if (command === "rules") {
    const subcommand = args[0];
    const format = argValue(args, "--format", "markdown");
    if (subcommand === "list") {
      output.write(renderRulePacks(format));
      return 0;
    }
    if (subcommand === "search") {
      output.write(renderRuleSearch(args[1], format));
      return 0;
    }
    if (subcommand === "install") {
      const pack = args[1] ?? "core";
      const root = path.resolve(args[2] ?? ".");
      const outputPath = await installRulePack(root, pack);
      output.write(`Installed ${pack} rule pack to ${outputPath}\n`);
      return 0;
    }
    output.write(renderRules(format));
    return 0;
  }

  if (command === "agents") {
    const format = argValue(args, "--format", "markdown");
    output.write(format === "json" ? renderAgentSupportJson() : renderAgentSupportMarkdown());
    return 0;
  }

  if (command === "skillpack") {
    output.write(renderSkillpack());
    return 0;
  }

  error.write(`Unknown command: ${command}\n\n${help()}`);
  return 1;
}
