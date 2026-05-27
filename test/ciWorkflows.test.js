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

test("detects Azure Pipelines agent jobs with pull request context and service connections", async () => {
  const root = await writeCiFixture(
    "azure-pipelines.yml",
    `
trigger:
  - main
jobs:
  - job: ai_release
    variables:
      - group: production-secrets
    steps:
      - script: |
          PROMPT="Review $(System.PullRequest.SourceBranch) and decide release commands"
          AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$(System.AccessToken)")"
          bash -lc "$AGENT_OUTPUT"
      - task: AzureCLI@2
        inputs:
          azureSubscription: production-service-connection
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Azure Pipelines group production-secrets/i.test(finding.evidence)));
  assert.ok(findings.some((finding) => /Azure Pipelines azureSubscription production-service-connection/i.test(finding.evidence)));
});

test("does not flag an Azure Pipelines dry-run summary", async () => {
  const root = await writeCiFixture(
    "azure-pipelines.yml",
    `
jobs:
  - job: ai_summary
    steps:
      - script: npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Jenkinsfile agent jobs with change request context and credentials", async () => {
  const root = await writeCiFixture(
    "Jenkinsfile",
    `
pipeline {
  agent any
  stages {
    stage('agent deploy') {
      steps {
        withCredentials([string(credentialsId: 'prod-token', variable: 'DEPLOY_TOKEN')]) {
          script {
            def prompt = "Review \${env.CHANGE_TITLE} and choose deploy commands"
            env.AGENT_OUTPUT = sh(returnStdout: true, script: "npx openai-agent --prompt '\${prompt}' --token '$DEPLOY_TOKEN'")
            sh "$AGENT_OUTPUT"
          }
        }
      }
    }
  }
}
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Jenkins credential binding withCredentials/i.test(finding.evidence)));
});

test("does not flag a Jenkinsfile dry-run preview", async () => {
  const root = await writeCiFixture(
    "Jenkinsfile",
    `
pipeline {
  agent any
  stages {
    stage('agent preview') {
      steps {
        sh "npx openai-agent --prompt 'Summarize docs in read-only dry-run preview only'"
      }
    }
  }
}
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Buildkite agent pipelines with untrusted context, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    path.join(".buildkite", "pipeline.yml"),
    `
env:
  DEPLOY_TOKEN: "\${DEPLOY_TOKEN}"

steps:
  - label: ":robot: agent deploy"
    command: |
      PROMPT="Review $BUILDKITE_BRANCH and $BUILDKITE_MESSAGE, then choose deploy commands"
      AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
      bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Buildkite env DEPLOY_TOKEN/i.test(finding.evidence)));
});

test("does not flag a Buildkite read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    path.join(".buildkite", "pipeline.yml"),
    `
steps:
  - label: ":robot: agent preview"
    command: npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});
