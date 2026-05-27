import path from "node:path";

import { explainRule } from "./explain.js";
import { renderFixPlan } from "./fix.js";
import { renderJson } from "./reporters/json.js";
import { renderMarkdown } from "./reporters/markdown.js";
import { renderSarif } from "./reporters/sarif.js";
import { renderRules } from "./rulesCatalog.js";
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
  agentic-workflow-guard fix [path] [--dry-run]
  agentic-workflow-guard explain <rule-id>
  agentic-workflow-guard rules [--format markdown|json]
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
    const findings = await scanProject(root);
    output.write(renderFindings(findings, format));
    return hasHighFindings(findings) ? 1 : 0;
  }

  if (command === "fix") {
    const root = path.resolve(firstPositional(args));
    output.write(await renderFixPlan(root));
    return 0;
  }

  if (command === "explain") {
    output.write(explainRule(args[0]));
    return args[0] ? 0 : 1;
  }

  if (command === "rules") {
    output.write(renderRules(argValue(args, "--format", "markdown")));
    return 0;
  }

  if (command === "skillpack") {
    output.write(renderSkillpack());
    return 0;
  }

  error.write(`Unknown command: ${command}\n\n${help()}`);
  return 1;
}
