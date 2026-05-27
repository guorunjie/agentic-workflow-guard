import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { scanCiWorkflows } from "../src/scanners/ciWorkflows.js";

async function writeCiFixture(file, content) {
  const root = await mkdtemp(path.join(tmpdir(), "awg-ci-"));
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), content);
  return root;
}

test("detects GitLab CI agent jobs that use merge request text and execute model output", async () => {
  const root = await writeCiFixture(
    ".gitlab-ci.yml",
    `
agent_patch:
  image: node:24
  script:
    - export PROMPT="Patch this merge request: $CI_MERGE_REQUEST_DESCRIPTION"
    - export AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$CI_JOB_TOKEN")"
    - bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
});

test("does not flag a GitLab CI dry-run agent preview", async () => {
  const root = await writeCiFixture(
    ".gitlab-ci.yml",
    `
agent_preview:
  image: node:24
  script:
    - npx openai-agent --prompt "Summarize release notes for dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects CircleCI agent jobs with PR context, contexts, and shell sinks", async () => {
  const root = await writeCiFixture(
    ".circleci/config.yml",
    `
version: 2.1
jobs:
  ai_deploy:
    docker:
      - image: cimg/node:24.0
    context: production-deploy
    steps:
      - checkout
      - run:
          name: Agent deploy
          command: |
            PROMPT="Review branch $CIRCLE_BRANCH and choose deploy commands"
            AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$CIRCLE_TOKEN")"
            bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /CircleCI context production-deploy/i.test(finding.evidence)));
});

test("does not flag a CircleCI read-only dry-run summary", async () => {
  const root = await writeCiFixture(
    ".circleci/config.yml",
    `
version: 2.1
jobs:
  ai_summary:
    docker:
      - image: cimg/node:24.0
    steps:
      - checkout
      - run:
          name: Dry-run summary
          command: npx openai-agent --prompt "Summarize static docs in read-only dry-run mode"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});
