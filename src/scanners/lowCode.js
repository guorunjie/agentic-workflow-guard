import { makeFinding } from "../rules/index.js";
import { readJson, walk } from "../utils/files.js";

function isLowCodeAutomation(json) {
  return Array.isArray(json.actions) || Array.isArray(json.steps) || Array.isArray(json.flows) || json.trigger;
}

function flatten(value) {
  return JSON.stringify(value).toLowerCase();
}

export async function scanLowCodeWorkflows(root) {
  const files = await walk(root, (relative) => relative.endsWith(".json"));
  const findings = [];

  for (const file of files) {
    let json;
    try {
      json = await readJson(root, file);
    } catch {
      continue;
    }
    if (!isLowCodeAutomation(json)) continue;
    const text = flatten(json);
    if (/(openai|anthropic|ai|agent|llm)/.test(text) && /(http|webhook|code|script|gmail|slack|github|notion|database|credential)/.test(text)) {
      findings.push(makeFinding("AWI009", file, "AI step appears in the same low-code workflow as side-effect actions"));
    }
  }

  return findings;
}
