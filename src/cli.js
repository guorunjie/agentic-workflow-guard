import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { suppressBaseline, writeBaseline } from "./baseline.js";
import { buildBenchmarkReport, loadBenchmarkCorpus, renderBenchmarkReport, renderBenchmarkCorpus, runBenchmark } from "./benchmark.js";
import { loadConfig, withPolicyProfile } from "./config.js";
import { explainRule } from "./explain.js";
import { renderFixPlan } from "./fix.js";
import { renderAgentSupportJson, renderAgentSupportMarkdown } from "./agentSupport.js";
import { agentInstallTargets, installAgent } from "./agentsInstall.js";
import { renderMcpResources } from "./mcpResources.js";
import { renderJson, summarize } from "./reporters/json.js";
import { renderMarkdown } from "./reporters/markdown.js";
import { renderSarif } from "./reporters/sarif.js";
import { buildReleaseCheck, renderReleaseCheck } from "./releaseCheck.js";
import { renderBenchmarkCorpusSchema, renderBenchmarkReportSchema, renderFixReportSchema, renderReportSchema, renderRulePackSchema } from "./schema.js";
import { installRulePack, renderRulePacks, renderRuleRegistry, renderRuleSearch, renderRules, verifyRulePack } from "./rulesCatalog.js";
import { scanProject, scanProjectWithMetadata, hasHighFindings } from "./scan.js";
import { renderSkillpack } from "./skillpack.js";

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function firstPositional(args, fallback = ".") {
  const optionsWithValues = new Set(["--baseline", "--format", "--output", "--profile", "--target"]);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (optionsWithValues.has(arg)) {
      index += 1;
      continue;
    }
    if (!arg.startsWith("--")) return arg;
  }
  return fallback;
}

function help() {
  return `Agentic Workflow Guard

Usage:
  agentic-workflow-guard scan [path] [--format json|markdown|sarif] [--output report] [--profile advisory|balanced|strict] [--baseline .awg-baseline.json]
  agentic-workflow-guard baseline create [path] [--output .awg-baseline.json]
  agentic-workflow-guard fix [path] [--dry-run|--apply|--patch] [--format markdown|json]
  agentic-workflow-guard explain <rule-id>
  agentic-workflow-guard rules [list|registry|search <query>|install <pack> [path]|verify <file>] [--format markdown|json]
  agentic-workflow-guard schema report|fix|rule-pack|benchmark-corpus|benchmark-report
  agentic-workflow-guard mcp resources [--format markdown|json]
  agentic-workflow-guard benchmark [path]|corpus [path] [--format markdown|json]
  agentic-workflow-guard agents [--format markdown|json]
  agentic-workflow-guard agents install <target|all> [path]
  agentic-workflow-guard release check [path] [--target 1.0.0] [--require-npm-auth] [--format markdown|json]
  agentic-workflow-guard skillpack
`;
}

async function writeReport(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

function renderFindings(findings, format, metadata = {}) {
  if (format === "json") return renderJson(findings, metadata);
  if (format === "sarif") return renderSarif(findings, metadata);
  return renderMarkdown(findings, metadata);
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
    let config;
    try {
      config = withPolicyProfile(await loadConfig(root), argValue(args, "--profile"));
    } catch (profileError) {
      error.write(`${profileError.message}\n`);
      return 1;
    }
    const result = await scanProjectWithMetadata(root, config);
    const findings = await suppressBaseline(result.findings, argValue(args, "--baseline"));
    const report = renderFindings(findings, format, { suppressions: result.suppressions });
    const outputPath = argValue(args, "--output");
    if (outputPath) {
      await writeReport(path.resolve(outputPath), report);
      const summary = summarize(findings);
      output.write(`Wrote ${format} report to ${outputPath}\n`);
      output.write(`Summary: ${summary.total} total, ${summary.high} high, ${summary.medium} medium, ${summary.low} low, ${result.suppressions.length} suppressed.\n`);
    } else {
      output.write(report);
    }
    return hasHighFindings(findings, config) ? 1 : 0;
  }

  if (command === "baseline") {
    const subcommand = args[0];
    if (subcommand !== "create") {
      error.write(`Unknown baseline command: ${subcommand ?? ""}\n\n${help()}`);
      return 1;
    }
    const root = path.resolve(args[1] && !args[1].startsWith("--") ? args[1] : ".");
    const outputPath = await writeBaseline(root, await scanProject(root), argValue(args, "--output", ".awg-baseline.json"));
    output.write(`Wrote baseline to ${outputPath}\n`);
    return 0;
  }

  if (command === "fix") {
    const root = path.resolve(firstPositional(args));
    output.write(await renderFixPlan(root, { apply: args.includes("--apply"), patch: args.includes("--patch"), format: argValue(args, "--format", "markdown") }));
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
    if (subcommand === "registry") {
      output.write(renderRuleRegistry(format));
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
    if (subcommand === "verify") {
      const file = args[1];
      if (!file) {
        error.write("Missing rule pack file.\n");
        return 1;
      }
      const result = await verifyRulePack(path.resolve(file));
      output.write(`Rule pack verified: ${result.name} ${result.checksum}\n`);
      return 0;
    }
    output.write(renderRules(format));
    return 0;
  }

  if (command === "schema") {
    const subcommand = args[0] ?? "report";
    if (subcommand === "report") {
      output.write(await renderReportSchema());
      return 0;
    }
    if (subcommand === "fix") {
      output.write(await renderFixReportSchema());
      return 0;
    }
    if (subcommand === "rule-pack") {
      output.write(await renderRulePackSchema());
      return 0;
    }
    if (subcommand === "benchmark-corpus") {
      output.write(await renderBenchmarkCorpusSchema());
      return 0;
    }
    if (subcommand === "benchmark-report") {
      output.write(await renderBenchmarkReportSchema());
      return 0;
    }
    if (!["report", "fix", "rule-pack", "benchmark-corpus", "benchmark-report"].includes(subcommand)) {
      error.write(`Unknown schema command: ${subcommand}\n`);
      return 1;
    }
  }

  if (command === "benchmark") {
    if (args[0] === "corpus") {
      const root = path.resolve(firstPositional(args.slice(1)));
      const format = argValue(args, "--format", "markdown");
      output.write(renderBenchmarkCorpus(await loadBenchmarkCorpus(root), format));
      return 0;
    }
    const root = path.resolve(firstPositional(args));
    const format = argValue(args, "--format", "markdown");
    const results = await runBenchmark(root);
    output.write(renderBenchmarkReport(buildBenchmarkReport(results), format));
    return results.some((result) => !result.passed) ? 1 : 0;
  }

  if (command === "mcp") {
    const subcommand = args[0] ?? "resources";
    const format = argValue(args, "--format", "markdown");
    if (subcommand !== "resources") {
      error.write(`Unknown mcp command: ${subcommand}\n`);
      return 1;
    }
    output.write(renderMcpResources(format));
    return 0;
  }

  if (command === "agents") {
    if (args[0] === "install") {
      const target = args[1];
      if (!target) {
        error.write(`Missing agent target. Supported targets: ${agentInstallTargets().join(", ")}, all\n`);
        return 1;
      }
      const root = path.resolve(args[2] ?? ".");
      const installed = await installAgent(target, root);
      output.write(`Installed ${target} agent files into ${root}\n`);
      for (const file of installed) output.write(`- ${file}\n`);
      return 0;
    }
    const format = argValue(args, "--format", "markdown");
    output.write(format === "json" ? renderAgentSupportJson() : renderAgentSupportMarkdown());
    return 0;
  }

  if (command === "release") {
    const subcommand = args[0] ?? "check";
    if (subcommand !== "check") {
      error.write(`Unknown release command: ${subcommand}\n`);
      return 1;
    }
    const releaseArgs = args.slice(1);
    const root = path.resolve(firstPositional(releaseArgs));
    const format = argValue(releaseArgs, "--format", "markdown");
    const report = await buildReleaseCheck(root, {
      targetVersion: argValue(releaseArgs, "--target"),
      requireNpmAuth: releaseArgs.includes("--require-npm-auth")
    });
    output.write(renderReleaseCheck(report, format));
    return report.summary.fail ? 1 : 0;
  }

  if (command === "skillpack") {
    output.write(renderSkillpack());
    return 0;
  }

  error.write(`Unknown command: ${command}\n\n${help()}`);
  return 1;
}
