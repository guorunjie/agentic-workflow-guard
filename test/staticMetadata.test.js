import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { serializeStaticMetadata, staticMetadataTargets } from "../src/staticMetadata.js";

const execFileAsync = promisify(execFile);

test("static metadata targets match committed JSON files", async () => {
  const targets = await staticMetadataTargets(".");

  assert.ok(targets.some((target) => target.path === "rules/marketplace.json"));
  assert.ok(targets.some((target) => target.path === "benchmarks/corpus.json"));
  assert.ok(targets.some((target) => target.path === "mcp/resources/agentic-workflow-guard.resources.json"));

  for (const target of targets) {
    const current = await readFile(target.path, "utf8");
    assert.equal(current, serializeStaticMetadata(target.value), `${target.path} is out of sync`);
  }
});

test("release sync check passes when static metadata is current", async () => {
  const { stdout } = await execFileAsync("node", [path.resolve("scripts/sync-static.js"), "--check"]);

  assert.match(stdout, /Static metadata is in sync/);
});
