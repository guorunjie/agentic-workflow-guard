import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const workspace = await mkdtemp(path.join(tmpdir(), "awg-package-smoke-"));
let tarball;

async function run(command, args, options = {}) {
  return execFileAsync(command, args, {
    cwd: options.cwd ?? root,
    maxBuffer: 1024 * 1024 * 10
  });
}

try {
  const packed = await run("npm", ["pack", "--json"]);
  const [pack] = JSON.parse(packed.stdout);
  tarball = path.join(root, pack.filename);

  await run("npm", ["init", "-y"], { cwd: workspace });
  await run("npm", ["install", tarball], { cwd: workspace });
  await run("npx", ["agentic-workflow-guard", "--help"], { cwd: workspace });
  await run("npx", ["agentic-workflow-guard", "schema", "benchmark-report"], { cwd: workspace });
  await run("npx", ["agentic-workflow-guard", "scan", "node_modules/agentic-workflow-guard/examples/safe-github-action", "--format", "json"], { cwd: workspace });
  await run("npx", ["agentic-workflow-guard", "benchmark", "node_modules/agentic-workflow-guard", "--format", "json"], { cwd: workspace });

  console.log(`Package smoke passed in ${workspace}`);
} finally {
  if (tarball) await rm(tarball, { force: true });
  await rm(workspace, { recursive: true, force: true });
}
