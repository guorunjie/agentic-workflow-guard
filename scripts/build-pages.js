import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outArgIndex = process.argv.indexOf("--out");
const outDir = path.resolve(outArgIndex === -1 ? "site-dist" : process.argv[outArgIndex + 1]);

const schemaAliases = [
  {
    name: "scan report",
    source: "schemas/agentic-workflow-guard-report.schema.json",
    path: "schemas/report.schema.json",
    url: "https://guorunjie.github.io/agentic-workflow-guard/schemas/report.schema.json"
  },
  {
    name: "fix report",
    source: "schemas/agentic-workflow-guard-fix-report.schema.json",
    path: "schemas/fix-report.schema.json",
    url: "https://guorunjie.github.io/agentic-workflow-guard/schemas/fix-report.schema.json"
  },
  {
    name: "rule pack",
    source: "schemas/agentic-workflow-guard-rule-pack.schema.json",
    path: "schemas/rule-pack.schema.json",
    url: "https://guorunjie.github.io/agentic-workflow-guard/schemas/rule-pack.schema.json"
  }
];

const jsonCopies = [
  "rules/marketplace.json",
  "benchmarks/fixtures.json",
  "mcp/resources/agentic-workflow-guard.resources.json"
];

async function copyProjectFile(relative) {
  const target = path.join(outDir, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(root, relative), target);
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(path.join(root, "docs-site"), outDir, { recursive: true });

for (const item of schemaAliases) {
  const content = await readFile(path.join(root, item.source), "utf8");
  await mkdir(path.dirname(path.join(outDir, item.path)), { recursive: true });
  await writeFile(path.join(outDir, item.path), content);
  await writeFile(path.join(outDir, item.source), content);
}

await writeFile(
  path.join(outDir, "schemas", "index.json"),
  `${JSON.stringify({ schemas: schemaAliases.map(({ name, path, url }) => ({ name, path, url })) }, null, 2)}\n`
);

for (const relative of jsonCopies) {
  await copyProjectFile(relative);
}

await writeFile(path.join(outDir, "robots.txt"), "User-agent: *\nAllow: /\n");
console.log(`Built Pages site at ${outDir}`);
