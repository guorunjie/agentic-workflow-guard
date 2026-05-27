import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

import { availableRulePacks, coreRulePack, ruleRegistry, withChecksum } from "../src/rulesCatalog.js";
import { packageVersion, packageVersionRange } from "../src/version.js";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("rules list exposes v1 marketplace metadata for the core rule pack", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "list", "--format", "json"]);
  const parsed = JSON.parse(stdout);
  const pack = parsed.packs[0];

  assert.equal(pack.schemaVersion, "1.0.0");
  assert.equal(pack.version, packageVersion);
  assert.ok(parsed.packs.length >= 3);
  assert.ok(parsed.packs.some((entry) => entry.provenance.source === "community"));
  assert.equal(pack.ruleCount, pack.rules.length);
  assert.equal(pack.compatibility.cli, packageVersionRange());
  assert.equal(pack.provenance.releaseTag, `v${packageVersion}`);
  assert.match(pack.checksum, /^sha256:[a-f0-9]{64}$/);
});

test("static marketplace file matches the runtime core rule pack", async () => {
  const staticPack = JSON.parse(await readFile("rules/marketplace.json", "utf8"));

  assert.deepEqual(staticPack, withChecksum(coreRulePack));
});

test("static community rule pack files match runtime packs", async () => {
  for (const pack of availableRulePacks.filter((entry) => entry.provenance.source === "community")) {
    const staticPack = JSON.parse(await readFile(`rules/community/${pack.name}.json`, "utf8"));
    assert.deepEqual(staticPack, withChecksum(pack));
  }
});

test("static rule registry matches runtime registry", async () => {
  const staticRegistry = JSON.parse(await readFile("rules/registry.json", "utf8"));

  assert.deepEqual(staticRegistry, ruleRegistry());
});

test("schema rule-pack emits the shipped rule pack schema", async () => {
  const schema = JSON.parse(await readFile("schemas/agentic-workflow-guard-rule-pack.schema.json", "utf8"));
  const { stdout } = await execFileAsync("node", [bin, "schema", "rule-pack"]);
  const parsed = JSON.parse(stdout);

  assert.equal(schema.$id, "https://guorunjie.github.io/agentic-workflow-guard/schemas/rule-pack.schema.json");
  assert.equal(parsed.title, "Agentic Workflow Guard Rule Pack");
  assert.match("1.0.0-rc.1", new RegExp(parsed.properties.version.pattern));
  assert.ok(parsed.required.includes("compatibility"));
  assert.ok(parsed.required.includes("provenance"));
});

test("rules install writes a marketplace lock file with the installed checksum", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-rule-pack-lock-"));

  await execFileAsync("node", [bin, "rules", "install", "core", root]);
  const pack = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-core-rules.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-rules.lock.json"), "utf8"));

  assert.equal(lock.schemaVersion, "1.0.0");
  assert.equal(lock.packs[0].name, pack.name);
  assert.equal(lock.packs[0].version, pack.version);
  assert.equal(lock.packs[0].checksum, pack.checksum);
});

test("rules verify rejects structurally invalid packs before trusting checksum", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-invalid-rule-pack-"));
  const invalidPath = path.join(root, "invalid-rules.json");
  const invalid = withChecksum({
    name: "invalid-pack",
    version: "1.0.0",
    description: "Missing required marketplace metadata.",
    platforms: ["github-actions"],
    rules: ["AWI001"]
  });
  await writeFile(invalidPath, `${JSON.stringify(invalid, null, 2)}\n`);

  await assert.rejects(
    execFileAsync("node", [bin, "rules", "verify", invalidPath]),
    /schemaVersion/
  );
});
