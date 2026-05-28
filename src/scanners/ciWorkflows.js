import { makeFinding } from "../rules/index.js";
import { readText, walk } from "../utils/files.js";

const agentSignalPattern = /(prompt|agent|openai|anthropic|llm|ai-inference|copilot|model|chatgpt|claude|gemini)/i;
const untrustedCiContextPattern =
  /(\$\{?(CI_MERGE_REQUEST_(DESCRIPTION|TITLE|SOURCE_BRANCH_NAME)|CI_COMMIT_(MESSAGE|TITLE|DESCRIPTION)|CIRCLE_BRANCH|CIRCLE_PULL_REQUEST|CIRCLE_USERNAME|BUILDKITE_(MESSAGE|BRANCH|COMMIT|PULL_REQUEST|PULL_REQUEST_BASE_BRANCH|PULL_REQUEST_REPO)|BITBUCKET_(BRANCH|COMMIT|TAG|PR_ID|PR_DESTINATION_BRANCH|PR_DESTINATION_COMMIT)|TRAVIS_(BRANCH|COMMIT|COMMIT_MESSAGE|PULL_REQUEST|PULL_REQUEST_BRANCH|PULL_REQUEST_SHA)|DRONE_(BRANCH|COMMIT|COMMIT_BRANCH|COMMIT_MESSAGE|COMMIT_REF|COMMIT_SHA|PULL_REQUEST|SOURCE_BRANCH|TARGET_BRANCH)|TEAMCITY_(BUILD_BRANCH|BUILD_VCS_NUMBER)|CHANGE_TITLE|CHANGE_BRANCH|BRANCH_NAME|GIT_BRANCH)\}?|%\s*(teamcity\.build\.branch|build\.vcs\.number|vcsroot\.branch)\s*%|\$\((Build\.(SourceVersionMessage|SourceBranchName|SourceBranch)|System\.PullRequest\.(SourceBranch|TargetBranch|PullRequestId))\)|env\.(CHANGE_TITLE|CHANGE_BRANCH|BRANCH_NAME|CHANGE_ID|CHANGE_URL|GIT_BRANCH)|<<\s*pipeline\.git\.(branch|tag|revision)\s*>>|<\+(codebase\.(branch|prNumber|sourceBranch|targetBranch)|trigger\.(branch|gitCommitMessage|pr\.(title|number)))>)/i;
const modelOutputToShellPattern =
  /((bash|sh|zsh|pwsh|powershell)\s+-[a-z]*c\s+["']?\$[{]?[A-Z0-9_]*(AGENT|AI|LLM|MODEL)[A-Z0-9_]*(OUTPUT|RESULT|RESPONSE|MESSAGE)[}]?["']?|\bsh\s+["']?\$[{]?[A-Z0-9_]*(AGENT|AI|LLM|MODEL)[A-Z0-9_]*(OUTPUT|RESULT|RESPONSE|MESSAGE)[}]?["']?|eval\s+["']?\$[{]?[A-Z0-9_]*(AGENT|AI|LLM|MODEL)[A-Z0-9_]*(OUTPUT|RESULT|RESPONSE|MESSAGE)[}]?["']?)/i;
const secretPromptPattern =
  /(prompt|agent|openai|anthropic|llm)[\s\S]{0,500}(\$?(CI_JOB_TOKEN|GITLAB_TOKEN|CIRCLE_TOKEN|SYSTEM_ACCESSTOKEN|System\.AccessToken|AZURE_DEVOPS_EXT_PAT|ARM_CLIENT_SECRET|AWS_[A-Z0-9_]*|GCLOUD_[A-Z0-9_]*|GOOGLE_[A-Z0-9_]*|DOCKER_[A-Z0-9_]*|KUBE[A-Z0-9_]*|[A-Z0-9_]*(SECRET|TOKEN|KEY))|withCredentials\s*\(|credentials\s*\()/i;
const circleContextPattern = /^\s*context:\s*([\w .:/@-]+|\[[^\]]+\])\s*$/gim;
const azureCredentialPattern = /^\s*-?\s*(group|azureSubscription|connectedServiceNameARM|serviceConnection|secureFile):\s*["']?([^"'\n]+)["']?\s*$/gim;
const jenkinsCredentialPattern = /(withCredentials\s*\(|credentials\s*\()/gim;
const buildkiteCredentialPattern = /^\s*([A-Z0-9_]*(?:SECRET|TOKEN|KEY)):\s*["']?([^"'\n]+)["']?\s*$/gim;
const bitbucketCredentialPattern = /^\s*(deployment|oidc):\s*["']?([^"'\n]+)["']?\s*$/gim;
const travisCredentialPattern = /^\s*-\s+secure:\s*["']?([^"'\n]+)["']?\s*$/gim;
const droneCredentialPattern = /^\s*(from_secret|secrets?):\s*["']?([^"'\n\[\]]+)["']?\s*$/gim;
const teamcityCredentialPattern = /(password\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)|credentialsJSON:[A-Za-z0-9_:/+=.-]+)/gim;
const harnessCredentialPattern = /(<\+secrets\.getValue\(["']([^"')]+)["']\)>|secretIdentifier:\s*["']?([^"'\n]+)["']?)/gim;
const safetyControlPattern = /(human approval|manual approval|allowlist|allow-list|dry-run|dry_run|safe output|read-only|preview only|approval gate)/i;

function ciWorkflowFiles(relative) {
  return (
    /^\.gitlab-ci\.ya?ml$/i.test(relative) ||
    /^\.travis\.ya?ml$/i.test(relative) ||
    /^\.drone\.ya?ml$/i.test(relative) ||
    /^\.teamcity\/.+\.(kts|xml)$/i.test(relative) ||
    /^\.harness\/.+\.ya?ml$/i.test(relative) ||
    /^harness\/.+\.ya?ml$/i.test(relative) ||
    /^bitbucket-pipelines\.ya?ml$/i.test(relative) ||
    /^\.bitbucket\/.*pipelines\.ya?ml$/i.test(relative) ||
    /^\.circleci\/config\.ya?ml$/i.test(relative) ||
    /^\.buildkite\/.+\.ya?ml$/i.test(relative) ||
    /^azure-pipelines\.ya?ml$/i.test(relative) ||
    /^\.azure-pipelines\/.+\.ya?ml$/i.test(relative) ||
    /(^|\/)Jenkinsfile(\..*)?$/i.test(relative)
  );
}

function lineOf(text, index) {
  return text.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function platformName(file) {
  if (/^bitbucket-pipelines\.ya?ml$/i.test(file) || /^\.bitbucket\/.*pipelines\.ya?ml$/i.test(file)) return "Bitbucket Pipelines";
  if (/^\.travis\.ya?ml$/i.test(file)) return "Travis CI";
  if (/^\.drone\.ya?ml$/i.test(file)) return "Drone CI";
  if (file.startsWith(".teamcity/")) return "TeamCity";
  if (file.startsWith(".harness/") || file.startsWith("harness/")) return "Harness CI/CD";
  if (file.startsWith(".circleci/")) return "CircleCI";
  if (file.startsWith(".buildkite/")) return "Buildkite";
  if (/Jenkinsfile/i.test(file)) return "Jenkins";
  if (/azure-pipelines|\.azure-pipelines/i.test(file)) return "Azure Pipelines";
  return "GitLab CI";
}

export async function scanCiWorkflows(root) {
  const files = await walk(root, ciWorkflowFiles);
  const findings = [];

  for (const file of files) {
    const text = await readText(root, file);
    const hasAgent = agentSignalPattern.test(text);
    const platform = platformName(file);

    const untrusted = text.match(untrustedCiContextPattern);
    if (hasAgent && untrusted) {
      findings.push(makeFinding("AWI001", `${file}:${lineOf(text, untrusted.index)}`, `${platform} prompt references untrusted CI context ${untrusted[0]}`));
    }

    const outputShell = text.match(modelOutputToShellPattern);
    if (outputShell) {
      findings.push(makeFinding("AWI002", `${file}:${lineOf(text, outputShell.index)}`, `${platform} script executes model-controlled output: ${outputShell[0].trim()}`));
    }

    const secretPrompt = text.match(secretPromptPattern);
    if (secretPrompt) {
      findings.push(makeFinding("AWI007", `${file}:${lineOf(text, secretPrompt.index)}`, `${platform} agent context is near token or secret material`));
    }

    if (hasAgent && platform === "CircleCI") {
      const contexts = [...text.matchAll(circleContextPattern)];
      for (const context of contexts) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, context.index)}`, `CircleCI context ${context[1].trim()} is attached to an agent job`));
      }
    }

    if (hasAgent && platform === "Azure Pipelines") {
      const credentials = [...text.matchAll(azureCredentialPattern)];
      for (const credential of credentials) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Azure Pipelines ${credential[1]} ${credential[2].trim()} is attached to an agent job`));
      }
    }

    if (hasAgent && platform === "Jenkins") {
      const credentials = [...text.matchAll(jenkinsCredentialPattern)];
      for (const credential of credentials) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Jenkins credential binding ${credential[1].trim()} is attached to an agent job`));
      }
    }

    if (hasAgent && platform === "Buildkite") {
      const credentials = [...text.matchAll(buildkiteCredentialPattern)];
      for (const credential of credentials) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Buildkite env ${credential[1].trim()} is attached to an agent pipeline`));
      }
    }

    if (hasAgent && platform === "Bitbucket Pipelines") {
      const credentials = [...text.matchAll(bitbucketCredentialPattern)];
      for (const credential of credentials) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Bitbucket Pipelines ${credential[1]} ${credential[2].trim()} is attached to an agent step`));
      }
    }

    if (hasAgent && platform === "Travis CI") {
      const credentials = [...text.matchAll(travisCredentialPattern)];
      for (const credential of credentials) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Travis CI secure env ${credential[1].trim()} is attached to an agent job`));
      }
    }

    if (hasAgent && platform === "Drone CI") {
      const credentials = [...text.matchAll(droneCredentialPattern)];
      for (const credential of credentials) {
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Drone CI ${credential[1]} ${credential[2].trim()} is attached to an agent pipeline`));
      }
    }

    if (hasAgent && platform === "TeamCity") {
      const credentials = [...text.matchAll(teamcityCredentialPattern)];
      for (const credential of credentials) {
        const name = credential[2] || credential[0];
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `TeamCity secure parameter ${name.trim()} is attached to an agent build`));
      }
    }

    if (hasAgent && platform === "Harness CI/CD") {
      const credentials = [...text.matchAll(harnessCredentialPattern)];
      for (const credential of credentials) {
        const name = credential[2] || credential[3] || credential[0];
        findings.push(makeFinding("AWI007", `${file}:${lineOf(text, credential.index)}`, `Harness secret ${name.trim()} is attached to an agent pipeline`));
      }
    }

    if (hasAgent && !safetyControlPattern.test(text)) {
      findings.push(makeFinding("AWI008", file, `${platform} agent workflow has no approval/allowlist/dry-run/safe-output marker`));
    }
  }

  return findings;
}
