import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

async function projectFile(file, content) {
  const root = await mkdtemp(path.join(tmpdir(), "awg-fix-recipes-"));
  const filePath = path.join(root, file);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
  return { root, filePath };
}

async function workflowProject() {
  const { root, filePath } = await projectFile(
    path.join(".github", "workflows", "agent.yml"),
    `
name: unsafe agent
on: issues
jobs:
  triage:
    permissions:
      contents: write
    steps:
      - uses: actions/ai-inference@v1
        with:
          prompt: "Summarize \${{ github.event.issue.body }}"
`
  );
  return { root, workflowPath: filePath };
}

test("fix --patch includes dry-run guard recipe for workflows without controls", async () => {
  const { root } = await workflowProject();

  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--patch"]);

  assert.match(stdout, /\+    env:/);
  assert.match(stdout, /\+      AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.doesNotMatch(stdout, /-      - uses: actions\/ai-inference@v1/);
});

test("fix --apply applies dry-run guard recipe without removing prompt evidence", async () => {
  const { root, workflowPath } = await workflowProject();

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(workflowPath, "utf8");

  assert.match(updated, /AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.match(updated, /github\.event\.issue\.body/);
});

test("fix --apply adds GitLab CI dry-run variables without removing prompt evidence", async () => {
  const { root, filePath } = await projectFile(
    ".gitlab-ci.yml",
    `
agent_patch:
  image: node:24
  script:
    - npx openai-agent --prompt "Review $CI_MERGE_REQUEST_DESCRIPTION"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /^variables:\n  AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.match(updated, /CI_MERGE_REQUEST_DESCRIPTION/);
});

test("fix --apply reuses an existing GitLab CI variables block", async () => {
  const { root, filePath } = await projectFile(
    ".gitlab-ci.yml",
    `
variables:
  NODE_ENV: test

agent_patch:
  image: node:24
  script:
    - npx openai-agent --prompt "Review $CI_COMMIT_MESSAGE"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /variables:\n  AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"\n  NODE_ENV: test/);
});

test("fix --apply adds Bitbucket Pipelines dry-run script marker", async () => {
  const { root, filePath } = await projectFile(
    "bitbucket-pipelines.yml",
    `
pipelines:
  default:
    - step:
        name: Agent deploy
        script:
          - npx openai-agent --prompt "Review $BITBUCKET_BRANCH"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /script:\n          - export AGENTIC_WORKFLOW_GUARD_DRY_RUN="true"\n          - npx openai-agent/);
  assert.match(updated, /BITBUCKET_BRANCH/);
});

test("fix --apply adds Travis CI top-level dry-run variables", async () => {
  const { root, filePath } = await projectFile(
    ".travis.yml",
    `
language: node_js
script:
  - npx openai-agent --prompt "Review $TRAVIS_COMMIT_MESSAGE"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /^env:\n  global:\n    - AGENTIC_WORKFLOW_GUARD_DRY_RUN="true"/);
  assert.match(updated, /TRAVIS_COMMIT_MESSAGE/);
});

test("fix --apply adds Drone CI dry-run environment", async () => {
  const { root, filePath } = await projectFile(
    ".drone.yml",
    `
kind: pipeline
type: docker
name: default
steps:
  - name: agent-deploy
    image: node:24
    commands:
      - npx openai-agent --prompt "Review $DRONE_COMMIT_MESSAGE"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /    environment:\n      AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"\n    commands:/);
  assert.match(updated, /DRONE_COMMIT_MESSAGE/);
});

test("fix --apply adds TeamCity dry-run parameter", async () => {
  const { root, filePath } = await projectFile(
    path.join(".teamcity", "settings.kts"),
    `
project {
  buildType {
    steps {
      script {
        scriptContent = "npx openai-agent --prompt 'Review %teamcity.build.branch%'"
      }
    }
  }
}
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /params \{\n  param\("env\.AGENTIC_WORKFLOW_GUARD_DRY_RUN", "true"\)/);
  assert.match(updated, /teamcity\.build\.branch/);
});

test("fix --apply adds Harness pipeline dry-run variable", async () => {
  const { root, filePath } = await projectFile(
    path.join(".harness", "pipeline.yaml"),
    `
pipeline:
  name: agent deploy
  stages:
    - stage:
        name: deploy
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  spec:
                    command: npx openai-agent --prompt "Review <+codebase.branch>"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /pipeline:\n  variables:\n    - name: AGENTIC_WORKFLOW_GUARD_DRY_RUN\n      type: String\n      value: "true"/);
  assert.match(updated, /<\+codebase\.branch>/);
});

test("fix --apply adds Tekton dry-run parameter", async () => {
  const { root, filePath } = await projectFile(
    path.join(".tekton", "agent-task.yaml"),
    `
apiVersion: tekton.dev/v1
kind: Task
metadata:
  name: agent-review
spec:
  steps:
    - name: agent
      image: node:24
      script: npx openai-agent --prompt "Review $(params.pull-request-body)"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /spec:\n  params:\n    - name: AGENTIC_WORKFLOW_GUARD_DRY_RUN\n      default: "true"/);
  assert.match(updated, /\$\(params\.pull-request-body\)/);
});

test("fix --apply adds Argo Workflows dry-run parameter", async () => {
  const { root, filePath } = await projectFile(
    path.join("argo-workflows", "agent-workflow.yaml"),
    `
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: agent-review-
spec:
  entrypoint: agent
  templates:
    - name: agent
      container:
        image: node:24
        command: [bash, -lc]
        args:
          - npx openai-agent --prompt "Review {{workflow.parameters.pr-body}}"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /spec:\n  arguments:\n    parameters:\n      - name: AGENTIC_WORKFLOW_GUARD_DRY_RUN\n        value: "true"/);
  assert.match(updated, /\{\{workflow\.parameters\.pr-body\}\}/);
});

test("fix --apply adds AWS CodeBuild env dry-run variable", async () => {
  const { root, filePath } = await projectFile(
    "buildspec.yml",
    `
version: 0.2
phases:
  build:
    commands:
      - npx openai-agent --prompt "Review $CODEBUILD_WEBHOOK_HEAD_REF"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /^env:\n  variables:\n    AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.match(updated, /CODEBUILD_WEBHOOK_HEAD_REF/);
});

test("fix --apply adds Google Cloud Build dry-run substitution", async () => {
  const { root, filePath } = await projectFile(
    "cloudbuild.yaml",
    `
steps:
  - name: node:24
    entrypoint: bash
    args:
      - -lc
      - npx openai-agent --prompt "Review $BRANCH_NAME"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /^substitutions:\n  _AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.match(updated, /BRANCH_NAME/);
});

test("fix --apply adds CircleCI job-level dry-run environment", async () => {
  const { root, filePath } = await projectFile(
    path.join(".circleci", "config.yml"),
    `
version: 2.1
jobs:
  ai_review:
    docker:
      - image: cimg/node:24.0
    steps:
      - checkout
      - run:
          command: npx openai-agent --prompt "Review $CIRCLE_BRANCH"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /    environment:\n      AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"\n    steps:/);
  assert.match(updated, /CIRCLE_BRANCH/);
});

test("fix --apply adds Azure Pipelines top-level dry-run variables", async () => {
  const { root, filePath } = await projectFile(
    "azure-pipelines.yml",
    `
jobs:
  - job: ai_review
    steps:
      - script: npx openai-agent --prompt "Review $(System.PullRequest.SourceBranch)"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /^variables:\n  AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"/);
  assert.match(updated, /System\.PullRequest\.SourceBranch/);
});

test("fix --apply preserves Azure Pipelines list variables", async () => {
  const { root, filePath } = await projectFile(
    "azure-pipelines.yml",
    `
variables:
- group: production-secrets
jobs:
  - job: ai_review
    steps:
      - script: npx openai-agent --prompt "Review $(System.PullRequest.SourceBranch)"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /variables:\n- name: AGENTIC_WORKFLOW_GUARD_DRY_RUN\n  value: "true"\n- group: production-secrets/);
});

test("fix --apply adds Jenkins declarative dry-run environment", async () => {
  const { root, filePath } = await projectFile(
    "Jenkinsfile",
    `
pipeline {
  agent any
  stages {
    stage('agent review') {
      steps {
        sh "npx openai-agent --prompt 'Review \${env.CHANGE_TITLE}'"
      }
    }
  }
}
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /  agent any\n  environment \{\n    AGENTIC_WORKFLOW_GUARD_DRY_RUN = 'true'\n  \}/);
  assert.match(updated, /env\.CHANGE_TITLE/);
});

test("fix --apply adds Buildkite top-level dry-run env", async () => {
  const { root, filePath } = await projectFile(
    path.join(".buildkite", "pipeline.yml"),
    `
steps:
  - label: ":robot: agent deploy"
    command: npx openai-agent --prompt "Review $BUILDKITE_BRANCH"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /^\s*env:\n  AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"\nsteps:/);
  assert.match(updated, /BUILDKITE_BRANCH/);
});

test("fix --apply reuses an existing Buildkite env block", async () => {
  const { root, filePath } = await projectFile(
    path.join(".buildkite", "pipeline.yml"),
    `
env:
  NODE_ENV: test

steps:
  - label: ":robot: agent deploy"
    command: npx openai-agent --prompt "Review $BUILDKITE_MESSAGE"
`
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = await readFile(filePath, "utf8");

  assert.match(updated, /env:\n  AGENTIC_WORKFLOW_GUARD_DRY_RUN: "true"\n  NODE_ENV: test/);
  assert.equal((updated.match(/^env:/gm) ?? []).length, 1);
});

test("fix --patch scopes broad MCP filesystem servers to read-only repository access", async () => {
  const { root, filePath } = await projectFile(
    path.join(".cursor", "mcp.json"),
    JSON.stringify(
      {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["@modelcontextprotocol/server-filesystem", "/"]
          }
        }
      },
      null,
      2
    )
  );

  const before = await readFile(filePath, "utf8");
  const { stdout } = await execFileAsync("node", [bin, "fix", root, "--patch"]);
  const after = await readFile(filePath, "utf8");

  assert.equal(after, before);
  assert.match(stdout, /diff --git a\/\.cursor\/mcp\.json b\/\.cursor\/mcp\.json/);
  assert.match(stdout, /-\s+"\/"/);
  assert.match(stdout, /\+\s+"\.\/"/);
  assert.match(stdout, /\+\s+"readOnly": true/);
});

test("fix --apply scopes MCP filesystem servers and clears the AWI006 finding", async () => {
  const { root, filePath } = await projectFile(
    ".mcp.json",
    JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "/"]
        }
      }
    })
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = JSON.parse(await readFile(filePath, "utf8"));

  assert.deepEqual(updated.mcpServers.filesystem.args, ["@modelcontextprotocol/server-filesystem", "./"]);
  assert.equal(updated.mcpServers.filesystem.readOnly, true);

  const { stdout } = await execFileAsync("node", [bin, "scan", root, "--format", "json"]);
  const report = JSON.parse(stdout);
  assert.equal(report.findings.length, 0);
});

test("fix --apply scopes MCP filesystem root flags", async () => {
  const { root, filePath } = await projectFile(
    "mcp-config.json",
    JSON.stringify({
      servers: {
        repoFiles: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "--root=/"]
        }
      }
    })
  );

  await execFileAsync("node", [bin, "fix", root, "--apply"]);
  const updated = JSON.parse(await readFile(filePath, "utf8"));

  assert.deepEqual(updated.servers.repoFiles.args, ["@modelcontextprotocol/server-filesystem", "--root=./"]);
  assert.equal(updated.servers.repoFiles.readOnly, true);

  const { stdout } = await execFileAsync("node", [bin, "scan", root, "--format", "json"]);
  const report = JSON.parse(stdout);
  assert.equal(report.findings.length, 0);
});
