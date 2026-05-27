import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { serializeStaticMetadata, staticMetadataTargets } from "../src/staticMetadata.js";

const check = process.argv.includes("--check");
const targets = await staticMetadataTargets(process.cwd());
const drift = [];

for (const target of targets) {
  const filePath = path.join(process.cwd(), target.path);
  const expected = serializeStaticMetadata(target.value);
  if (check) {
    let current = "";
    try {
      current = await readFile(filePath, "utf8");
    } catch {
      drift.push(`${target.path}: missing`);
      continue;
    }
    if (current !== expected) drift.push(`${target.path}: out of sync`);
    continue;
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, expected);
}

if (drift.length) {
  console.error(`Static metadata drift detected:\n${drift.map((item) => `- ${item}`).join("\n")}`);
  process.exitCode = 1;
} else if (check) {
  console.log("Static metadata is in sync.");
} else {
  console.log(`Synced ${targets.length} static metadata files.`);
}
