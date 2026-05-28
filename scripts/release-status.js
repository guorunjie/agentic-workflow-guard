import { buildReleaseStatus, renderReleaseStatus } from "../src/releaseStatus.js";

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function help() {
  return `Check Agentic Workflow Guard release publication status.

Usage:
  npm run release:status -- [--version 1.0.0] [--dry-run] [--format markdown|json]

Examples:
  npm run release:status -- --version 1.0.0 --dry-run
  npm run release:status -- --version 1.0.0
`;
}

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(help());
  process.exit(0);
}

const format = argValue(args, "--format", "markdown");

if (!["markdown", "json"].includes(format)) {
  process.stderr.write(`Unknown format: ${format}\n`);
  process.exit(1);
}

try {
  const result = await buildReleaseStatus(process.cwd(), {
    version: argValue(args, "--version"),
    packageName: argValue(args, "--package"),
    repository: argValue(args, "--repo"),
    dryRun: args.includes("--dry-run") || args.includes("--plan")
  });
  process.stdout.write(renderReleaseStatus(result, format));
  process.exit(result.mode === "dry-run" || result.summary.readyToPublish ? 0 : 1);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
