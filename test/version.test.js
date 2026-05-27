import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { packageVersion, packageVersionRange, semverPattern } from "../src/version.js";

test("runtime package version is loaded from package.json", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));

  assert.equal(packageVersion, pkg.version);
  assert.ok(semverPattern.test("1.0.0"));
  assert.ok(semverPattern.test("1.0.0-rc.1"));
});

test("packageVersionRange supports prerelease and stable major ranges", () => {
  assert.equal(packageVersionRange("0.20.0"), ">=0.20.0 <1.0.0");
  assert.equal(packageVersionRange("1.0.0-rc.1"), ">=1.0.0-rc.1 <2.0.0");
  assert.equal(packageVersionRange("1.0.0"), ">=1.0.0 <2.0.0");
});

test("runtime version consumers use the shared version module", async () => {
  for (const file of ["src/benchmark.js", "src/rulesCatalog.js", "src/mcpResources.js"]) {
    const content = await readFile(file, "utf8");

    assert.match(content, /version\.js/);
    assert.doesNotMatch(content, /const packageVersion = "[^"]+"/);
  }
});
