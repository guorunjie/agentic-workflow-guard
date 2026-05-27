import { prepareRelease, renderReleasePrepare } from "../src/releasePrepare.js";

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function help() {
  return `Prepare Agentic Workflow Guard release metadata.

Usage:
  npm run release:prepare -- --version <semver> [--dry-run|--apply] [--format markdown|json]

Examples:
  npm run release:prepare -- --version 1.0.0-rc.1 --dry-run
  npm run release:prepare -- --version 1.0.0 --apply
`;
}

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(help());
  process.exit(0);
}

const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run");
const format = argValue(args, "--format", "markdown");

if (apply && dryRun) {
  process.stderr.write("Use either --dry-run or --apply, not both.\n");
  process.exit(1);
}

if (!["markdown", "json"].includes(format)) {
  process.stderr.write(`Unknown format: ${format}\n`);
  process.exit(1);
}

try {
  const result = await prepareRelease(process.cwd(), {
    version: argValue(args, "--version"),
    apply
  });
  process.stdout.write(renderReleasePrepare(result, format));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
