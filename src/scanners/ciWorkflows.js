import { makeFinding } from "../rules/index.js";
import { readText, walk } from "../utils/files.js";

const agentSignalPattern = /(prompt|agent|openai|anthropic|llm|ai-inference|copilot|model|chatgpt|claude|gemini)/i;
const untrustedCiContextPattern =
  /(\$\{?(CI_MERGE_REQUEST_(DESCRIPTION|TITLE|SOURCE_BRANCH_NAME)|CI_COMMIT_(MESSAGE|TITLE|DESCRIPTION)|CIRCLE_BRANCH|CIRCLE_PULL_REQUEST|CIRCLE_USERNAME)\}?|<<\s*pipeline\.git\.(branch|tag|revision)\s*>>)/i;
const modelOutputToShellPattern =
  /((bash|sh|zsh|pwsh|powershell)\s+-[a-z]*c\s+["']?\$[{]?[A-Z0-9_]*(AGENT|AI|LLM|MODEL)[A-Z0-9_]*(OUTPUT|RESULT|RESPONSE|MESSAGE)[}]?["']?|eval\s+["']?\$[{]?[A-Z0-9_]*(AGENT|AI|LLM|MODEL)[A-Z0-9_]*(OUTPUT|RESULT|RESPONSE|MESSAGE)[}]?["']?)/i;
const secretPromptPattern =
  /(prompt|agent|openai|anthropic|llm)[\s\S]{0,500}(\$?(CI_JOB_TOKEN|GITLAB_TOKEN|CIRCLE_TOKEN|AWS_[A-Z0-9_]*|GCLOUD_[A-Z0-9_]*|GOOGLE_[A-Z0-9_]*|DOCKER_[A-Z0-9_]*|KUBE[A-Z0-9_]*|[A-Z0-9_]*(SECRET|TOKEN|KEY)))/i;
const circleContextPattern = /^\s*context:\s*([\w .:/@-]+|\[[^\]]+\])\s*$/gim;
const safetyControlPattern = /(human approval|manual approval|allowlist|allow-list|dry-run|dry_run|safe output|read-only|preview only|approval gate)/i;

function ciWorkflowFiles(relative) {
  return /^\.gitlab-ci\.ya?ml$/i.test(relative) || /^\.circleci\/config\.ya?ml$/i.test(relative);
}

function lineOf(text, index) {
  return text.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function platformName(file) {
  return file.startsWith(".circleci/") ? "CircleCI" : "GitLab CI";
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

    if (hasAgent && !safetyControlPattern.test(text)) {
      findings.push(makeFinding("AWI008", file, `${platform} agent workflow has no approval/allowlist/dry-run/safe-output marker`));
    }
  }

  return findings;
}
