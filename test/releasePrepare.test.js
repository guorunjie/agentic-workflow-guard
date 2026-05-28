import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildReleasePreparePlan, prepareRelease, renderReleasePrepare } from "../src/releasePrepare.js";

async function writeFixture(root) {
  await mkdir(path.join(root, "docs"), { recursive: true });
  await mkdir(path.join(root, "docs-site"), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    `${JSON.stringify({ name: "agentic-workflow-guard", version: "0.20.0", scripts: {} }, null, 2)}\n`
  );
  await writeFile(
    path.join(root, "README.md"),
    "Use guorunjie/agentic-workflow-guard@v0.20.0. Marketplace tag v0.20.0.\n"
  );
  await writeFile(
    path.join(root, "docs", "github-action-marketplace.md"),
    "Use guorunjie/agentic-workflow-guard@v0.20.0 and release tag v0.20.0.\n"
  );
  await writeFile(
    path.join(root, "docs-site", "marketplace.html"),
    "<code>guorunjie/agentic-workflow-guard@v0.20.0</code>\n"
  );
}

async function withFixture(run) {
  const root = await mkdtemp(path.join(tmpdir(), "awg-release-prepare-"));
  try {
    await writeFixture(root);
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("release prepare dry-run previews version and release tag changes without writing", async () => {
  await withFixture(async (root) => {
    const result = await prepareRelease(root, { version: "1.0.0-rc.1" });
    const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    const readme = await readFile(path.join(root, "README.md"), "utf8");

    assert.equal(result.mode, "dry-run");
    assert.equal(result.applied, false);
    assert.equal(result.currentVersion, "0.20.0");
    assert.equal(result.targetVersion, "1.0.0-rc.1");
    assert.equal(result.summary.changed, 4);
    assert.equal(pkg.version, "0.20.0");
    assert.match(readme, /v0\.20\.0/);
    assert.ok(result.followUpCommands.includes("npm run release:sync"));
    assert.ok(result.followUpCommands.includes("npm run release:status -- --version 1.0.0-rc.1 --dry-run"));
    assert.ok(result.followUpCommands.includes("npm pack --dry-run"));
  });
});

test("release prepare apply updates package version and release-tagged docs", async () => {
  await withFixture(async (root) => {
    const result = await prepareRelease(root, { version: "1.0.0", apply: true });
    const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
    const readme = await readFile(path.join(root, "README.md"), "utf8");
    const marketplace = await readFile(path.join(root, "docs", "github-action-marketplace.md"), "utf8");
    const page = await readFile(path.join(root, "docs-site", "marketplace.html"), "utf8");

    assert.equal(result.mode, "apply");
    assert.equal(result.applied, true);
    assert.equal(pkg.version, "1.0.0");
    assert.match(readme, /agentic-workflow-guard@v1\.0\.0/);
    assert.doesNotMatch(readme, /v0\.20\.0/);
    assert.match(marketplace, /agentic-workflow-guard@v1\.0\.0/);
    assert.match(page, /agentic-workflow-guard@v1\.0\.0/);
  });
});

test("release prepare validates semver and renders markdown and JSON", async () => {
  await withFixture(async (root) => {
    await assert.rejects(() => buildReleasePreparePlan(root, { version: "one-point-oh" }), /Invalid release version/);
    const plan = await buildReleasePreparePlan(root, { version: "1.0.0-rc.1" });
    assert.match(renderReleasePrepare(plan), /Release prepare dry run/);
    assert.equal(JSON.parse(renderReleasePrepare(plan, "json")).targetVersion, "1.0.0-rc.1");
  });
});
