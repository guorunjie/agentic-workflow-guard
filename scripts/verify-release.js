import { renderReleaseVerify, verifyRelease } from "../src/releaseVerify.js";

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function help() {
  return `Verify the public Agentic Workflow Guard release.

Usage:
  npm run release:verify -- [--version 1.0.0] [--dry-run] [--allow-draft] [--format markdown|json]

Examples:
  npm run release:verify -- --version 1.0.0 --dry-run
  npm run release:verify -- --version 1.0.0 --allow-draft
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
  const result = await verifyRelease(process.cwd(), {
    version: argValue(args, "--version"),
    packageName: argValue(args, "--package"),
    repository: argValue(args, "--repo"),
    dryRun: args.includes("--dry-run") || args.includes("--plan"),
    allowDraft: args.includes("--allow-draft")
  });
  process.stdout.write(renderReleaseVerify(result, format));
  process.exit(result.summary.failed > 0 ? 1 : 0);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
