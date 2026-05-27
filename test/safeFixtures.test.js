import assert from "node:assert/strict";
import { test } from "node:test";

import { scanProject } from "../src/scan.js";

const safeFixtures = [
  "examples/safe-gitlab-ci",
  "examples/safe-circleci",
  "examples/safe-azure-pipelines",
  "examples/safe-jenkins",
  "examples/safe-dify",
  "examples/safe-flowise",
  "examples/safe-langflow",
  "examples/safe-node-red",
  "examples/safe-make",
  "examples/safe-pipedream",
  "examples/safe-zapier",
  "examples/safe-airflow",
  "examples/safe-browser-trace"
];

for (const fixture of safeFixtures) {
  test(`${fixture} has no findings`, async () => {
    const findings = await scanProject(fixture);

    assert.deepEqual(findings, []);
  });
}
