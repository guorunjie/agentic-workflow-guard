import { makeFinding } from "../rules/index.js";
import { readJson, walk } from "../utils/files.js";

const browserToolPattern = /(browser-use|skyvern|playwright|puppeteer|browser|chromium|chrome)/i;
const aiPattern = /(llm|ai|agent|openai|anthropic|gemini|claude|model)/i;
const sideEffectPattern = /(click|fill|press|submit|upload|download|navigate|goto|payment|purchase|delete|post|put|patch|send|approve)/i;

function flatten(value) {
  return JSON.stringify(value).toLowerCase();
}

function looksLikeBrowserTrace(relative, text) {
  return /browser|trace|playwright|skyvern/i.test(relative) || browserToolPattern.test(text);
}

export async function scanBrowserTraces(root) {
  const files = await walk(root, (relative) => /\.json$/i.test(relative));
  const findings = [];

  for (const file of files) {
    let json;
    try {
      json = await readJson(root, file);
    } catch {
      continue;
    }
    const text = flatten(json);
    if (!looksLikeBrowserTrace(file, text)) continue;
    if (aiPattern.test(text) && sideEffectPattern.test(text)) {
      const tool = String(json.tool ?? json.platform ?? file);
      findings.push(makeFinding("AWI010", file, `${tool} browser trace lets AI decisions reach browser side effects`));
    }
  }

  return findings;
}
