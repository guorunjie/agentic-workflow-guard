import { makeFinding } from "../rules/index.js";
import { readText, walk } from "../utils/files.js";

const untrustedContextPattern =
  /github\.event\.(issue|pull_request|comment|review|discussion|client_payload)[^}\n]*(body|title|comment|text|description|message)/i;
const agentSignalPattern = /(prompt|agent|openai|anthropic|llm|ai-inference|copilot|model|chatgpt|claude)/i;
const modelOutputToShellPattern = /run:\s*.*\$\{\{\s*(steps|needs)\.[^}]+outputs\.(result|response|text|completion|output|message)[^}]*\}\}/i;
const writePermissionPattern = /^\s*(contents|pull-requests|id-token|issues|actions|deployments|packages):\s*write\s*$/gim;
const secretPromptPattern = /(prompt|agent|openai|anthropic|llm)[\s\S]{0,400}(secrets\.|env\.[A-Z0-9_]*(TOKEN|KEY|SECRET))/i;
const safetyControlPattern = /(human approval|manual approval|allowlist|allow-list|dry-run|dry_run|safe output|read-only|contents:\s*read)/i;

function actionFiles(relative) {
  return /^\.github\/workflows\/.+\.ya?ml$/i.test(relative);
}

function lineOf(text, index) {
  return text.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

export async function scanGitHubActions(root) {
  const files = await walk(root, actionFiles);
  const findings = [];

  for (const file of files) {
    const text = await readText(root, file);
    const hasAgent = agentSignalPattern.test(text);
    const untrusted = text.match(untrustedContextPattern);
    if (hasAgent && untrusted) {
      findings.push(makeFinding("AWI001", `${file}:${lineOf(text, untrusted.index)}`, untrusted[0]));
    }

    const outputShell = text.match(modelOutputToShellPattern);
    if (outputShell) {
      findings.push(makeFinding("AWI002", `${file}:${lineOf(text, outputShell.index)}`, outputShell[0].trim()));
    }

    if (hasAgent) {
      const writePermissions = [...text.matchAll(writePermissionPattern)];
      if (writePermissions.length) {
        findings.push(
          makeFinding(
            "AWI003",
            `${file}:${lineOf(text, writePermissions[0].index)}`,
            writePermissions.map((match) => match[0].trim()).join(", ")
          )
        );
      }
    }

    if (/pull_request_target/i.test(text) && /(run:|script|agent|openai|anthropic|llm|prompt)/i.test(text)) {
      findings.push(makeFinding("AWI004", file, "pull_request_target with agent/script execution"));
    }

    const secretPrompt = text.match(secretPromptPattern);
    if (secretPrompt) {
      findings.push(makeFinding("AWI007", `${file}:${lineOf(text, secretPrompt.index)}`, secretPrompt[0].replace(/\s+/g, " ").slice(0, 160)));
    }

    if (hasAgent && !safetyControlPattern.test(text)) {
      findings.push(makeFinding("AWI008", file, "agent workflow has no approval/allowlist/dry-run/safe-output marker"));
    }
  }

  return findings;
}
