import { publishRelease, renderReleasePublish } from "../src/releasePublish.js";

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

function help() {
  return `Publish Agentic Workflow Guard to npm and run post-publish verification.

Usage:
  npm run release:publish -- [--version 1.0.0] [--otp 123456] [--dry-run] [--plan] [--provenance] [--skip-verify] [--final] [--format markdown|json]

Examples:
  npm run release:publish -- --version 1.0.0 --plan
  npm run release:publish -- --version 1.0.0 --dry-run
  npm run release:publish -- --version 1.0.0 --otp 123456
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
  const report = await publishRelease(process.cwd(), {
    version: argValue(args, "--version"),
    packageName: argValue(args, "--package"),
    repository: argValue(args, "--repo"),
    npmTag: argValue(args, "--tag"),
    otp: argValue(args, "--otp", process.env.NPM_OTP),
    dryRun: args.includes("--dry-run"),
    plan: args.includes("--plan"),
    provenance: args.includes("--provenance"),
    skipVerify: args.includes("--skip-verify"),
    finalVerify: args.includes("--final")
  });
  process.stdout.write(renderReleasePublish(report, format));
  process.exit(report.summary.failed > 0 ? 1 : 0);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
