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

test("detects Bitbucket Pipelines agent steps with PR context, deployment, OIDC, and shell sinks", async () => {
  const root = await writeCiFixture(
    "bitbucket-pipelines.yml",
    `
pipelines:
  default:
    - step:
        name: Agent deploy
        deployment: production
        oidc: true
        script:
          - PROMPT="Review $BITBUCKET_BRANCH and pull request $BITBUCKET_PR_ID, then choose deploy commands"
          - AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$BITBUCKET_STEP_OIDC_TOKEN")"
          - bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Bitbucket Pipelines deployment production/i.test(finding.evidence)));
  assert.ok(findings.some((finding) => /Bitbucket Pipelines oidc true/i.test(finding.evidence)));
});

test("does not flag a Bitbucket Pipelines read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    "bitbucket-pipelines.yml",
    `
pipelines:
  default:
    - step:
        name: Agent preview
        script:
          - npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
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

test("detects Travis CI agent jobs with PR context, secure env, and shell sinks", async () => {
  const root = await writeCiFixture(
    ".travis.yml",
    `
language: node_js
node_js:
  - "24"
env:
  global:
    - secure: "encrypted-deploy-token"
script:
  - PROMPT="Review $TRAVIS_PULL_REQUEST_BRANCH and $TRAVIS_COMMIT_MESSAGE, then choose deploy commands"
  - AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
  - bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Travis CI secure env encrypted-deploy-token/i.test(finding.evidence)));
});

test("does not flag a Travis CI read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    ".travis.yml",
    `
language: node_js
script:
  - npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Drone CI agent pipelines with PR context, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    ".drone.yml",
    `
kind: pipeline
type: docker
name: default

steps:
  - name: agent-deploy
    image: node:24
    environment:
      DEPLOY_TOKEN:
        from_secret: production_deploy_token
    commands:
      - PROMPT="Review $DRONE_SOURCE_BRANCH and $DRONE_COMMIT_MESSAGE, then choose deploy commands"
      - AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
      - bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Drone CI from_secret production_deploy_token/i.test(finding.evidence)));
});

test("does not flag a Drone CI read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    ".drone.yml",
    `
kind: pipeline
type: docker
name: default

steps:
  - name: agent-preview
    image: node:24
    commands:
      - npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects TeamCity agent builds with branch context, secure parameters, and shell sinks", async () => {
  const root = await writeCiFixture(
    path.join(".teamcity", "settings.kts"),
    `
import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.script

version = "2024.12"

project {
  buildType {
    name = "agent deploy"
    params {
      password("env.DEPLOY_TOKEN", "credentialsJSON:production-token")
    }
    steps {
      script {
        scriptContent = """
          PROMPT="Review %teamcity.build.branch% and choose deploy commands"
          AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
          bash -lc "$AGENT_OUTPUT"
        """
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
  assert.ok(findings.some((finding) => /TeamCity secure parameter env\.DEPLOY_TOKEN/i.test(finding.evidence)));
});

test("does not flag a TeamCity read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    path.join(".teamcity", "settings.kts"),
    `
project {
  buildType {
    steps {
      script {
        scriptContent = "npx openai-agent --prompt 'Summarize docs in read-only dry-run preview only'"
      }
    }
  }
}
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Harness pipelines with codebase context, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    path.join(".harness", "pipeline.yaml"),
    `
pipeline:
  name: agent deploy
  stages:
    - stage:
        name: deploy
        type: CI
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  name: Agent deploy
                  spec:
                    shell: Bash
                    command: |
                      PROMPT="Review <+codebase.branch> and <+trigger.gitCommitMessage>, then choose deploy commands"
                      AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "<+secrets.getValue('production_deploy_token')>")"
                      bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Harness secret production_deploy_token/i.test(finding.evidence)));
});

test("does not flag a Harness read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    path.join(".harness", "pipeline.yaml"),
    `
pipeline:
  name: agent preview
  stages:
    - stage:
        name: preview
        type: CI
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  name: Agent preview
                  spec:
                    shell: Bash
                    command: npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Tekton Pipelines agent tasks with PR params, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    path.join(".tekton", "agent-task.yaml"),
    `
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: agent-deploy
spec:
  params:
    - name: pull-request-body
      type: string
  steps:
    - name: agent
      image: node:24
      env:
        - name: DEPLOY_TOKEN
          valueFrom:
            secretKeyRef:
              name: prod-agent-token
              key: token
      script: |
        PROMPT="Review $(params.pull-request-body), then choose deploy commands"
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
  assert.ok(findings.some((finding) => /Tekton Pipelines Kubernetes secretKeyRef prod-agent-token/i.test(finding.evidence)));
});

test("does not flag a Tekton read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    path.join(".tekton", "agent-task.yaml"),
    `
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: agent-preview
spec:
  steps:
    - name: preview
      image: node:24
      script: npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Argo Workflows agent templates with workflow params, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    path.join("argo-workflows", "agent-deploy.yaml"),
    `
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: agent-deploy-
spec:
  arguments:
    parameters:
      - name: pr-body
        value: "{{workflow.parameters.pr-body}}"
  entrypoint: agent
  templates:
    - name: agent
      container:
        image: node:24
        env:
          - name: DEPLOY_TOKEN
            valueFrom:
              secretKeyRef:
                name: argo-agent-token
                key: token
        command: [bash, -lc]
        args:
          - |
            PROMPT="Review {{workflow.parameters.pr-body}}, then choose deploy commands"
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
  assert.ok(findings.some((finding) => /Argo Workflows Kubernetes secretKeyRef argo-agent-token/i.test(finding.evidence)));
});

test("does not flag an Argo Workflows read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    path.join("argo-workflows", "agent-preview.yaml"),
    `
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: agent-preview-
spec:
  entrypoint: preview
  templates:
    - name: preview
      container:
        image: node:24
        command: [bash, -lc]
        args:
          - npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects AWS CodeBuild agent builds with webhook context, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    "buildspec.yml",
    `
version: 0.2
env:
  secrets-manager:
    DEPLOY_TOKEN: "prod/deploy:token"
phases:
  build:
    commands:
      - PROMPT="Review $CODEBUILD_WEBHOOK_HEAD_REF and $CODEBUILD_SOURCE_VERSION, then choose deploy commands"
      - AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
      - bash -lc "$AGENT_OUTPUT"
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /AWS CodeBuild secret DEPLOY_TOKEN/i.test(finding.evidence)));
});

test("does not flag an AWS CodeBuild read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    "buildspec.yml",
    `
version: 0.2
phases:
  build:
    commands:
      - npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
`
  );

  const findings = await scanCiWorkflows(root);

  assert.deepEqual(findings, []);
});

test("detects Google Cloud Build agent builds with trigger context, secrets, and shell sinks", async () => {
  const root = await writeCiFixture(
    "cloudbuild.yaml",
    `
steps:
  - name: node:24
    entrypoint: bash
    secretEnv: ["DEPLOY_TOKEN"]
    args:
      - -lc
      - |
        PROMPT="Review $BRANCH_NAME and $COMMIT_SHA, then choose deploy commands"
        AGENT_OUTPUT="$(npx openai-agent --prompt "$PROMPT" --token "$DEPLOY_TOKEN")"
        bash -lc "$AGENT_OUTPUT"
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/prod-deploy-token/versions/latest
      env: DEPLOY_TOKEN
`
  );

  const findings = await scanCiWorkflows(root);
  const ids = findings.map((finding) => finding.ruleId);

  assert.ok(ids.includes("AWI001"));
  assert.ok(ids.includes("AWI002"));
  assert.ok(ids.includes("AWI007"));
  assert.ok(ids.includes("AWI008"));
  assert.ok(findings.some((finding) => /Google Cloud Build secretEnv/i.test(finding.evidence)));
});

test("does not flag a Google Cloud Build read-only dry-run preview", async () => {
  const root = await writeCiFixture(
    "cloudbuild.yaml",
    `
steps:
  - name: node:24
    entrypoint: bash
    args:
      - -lc
      - npx openai-agent --prompt "Summarize docs in read-only dry-run preview only"
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
