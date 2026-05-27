import assert from "node:assert/strict";
import { test } from "node:test";

import { scanProject } from "../src/scan.js";

const safeFixtures = [
  "examples/safe-node-red",
  "examples/safe-make",
  "examples/safe-pipedream",
  "examples/safe-airflow",
  "examples/safe-browser-trace"
];

for (const fixture of safeFixtures) {
  test(`${fixture} has no findings`, async () => {
    const findings = await scanProject(fixture);

    assert.deepEqual(findings, []);
  });
}
