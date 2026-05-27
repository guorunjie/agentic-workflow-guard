import { makeFinding } from "../rules/index.js";
import { readJson, readText, walk } from "../utils/files.js";

function isLowCodeAutomation(json) {
  return (
    Array.isArray(json) ||
    Array.isArray(json.actions) ||
    Array.isArray(json.steps) ||
    Array.isArray(json.flows) ||
    Array.isArray(json.flow) ||
    Boolean(json.trigger) ||
    Boolean(json.steps && typeof json.steps === "object")
  );
}

function flatten(value) {
  return JSON.stringify(value).toLowerCase();
}

function platformEvidence(file, json, text) {
  if (/activepieces/i.test(file) || /activepieces|@activepieces|pieceName|actionName/i.test(text)) {
    return "Activepieces flow chains AI steps into side-effect actions";
  }
  if (Array.isArray(json) && json.some((node) => typeof node?.type === "string" && /http request|openai|agent|function/i.test(node.type))) {
    return "Node-RED flow chains AI nodes into side-effect nodes";
  }
  if (/scenario\.blueprint\.json$/i.test(file) || (Array.isArray(json.flow) && /http:|openai|anthropic/i.test(text))) {
    return "Make scenario chains AI modules into HTTP or app actions";
  }
  if (/pipedream/i.test(file) || (json.steps && typeof json.steps === "object" && /slack|github|http|notion|database/i.test(text))) {
    return "Pipedream workflow chains AI output into side-effect actions";
  }
  if (/zapier|zap/i.test(text)) {
    return "Zapier workflow chains AI steps into side-effect actions";
  }
  return "AI step appears in the same low-code workflow as side-effect actions";
}

function isAirflowDag(relative, text) {
  return /\.py$/i.test(relative) && /airflow|DAG\(/.test(text);
}

function stripPythonComments(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

function airflowHasAiAndSideEffect(text) {
  return /(openai|anthropic|llm|langchain|chat\.completions|completion)/i.test(text) && /(BashOperator|PythonOperator|KubernetesPodOperator|DockerOperator|SimpleHttpOperator|HttpOperator|kubectl|requests\.)/i.test(text);
}

export async function scanLowCodeWorkflows(root) {
  const files = await walk(root, (relative) => /\.(json|py)$/i.test(relative));
  const findings = [];

  for (const file of files) {
    if (/\.py$/i.test(file)) {
      const text = await readText(root, file);
      const code = stripPythonComments(text);
      if (isAirflowDag(file, code) && airflowHasAiAndSideEffect(code)) {
        findings.push(makeFinding("AWI009", file, "Airflow DAG combines LLM calls with side-effect operators"));
      }
      continue;
    }

    let json;
    try {
      json = await readJson(root, file);
    } catch {
      continue;
    }
    if (!isLowCodeAutomation(json)) continue;
    const text = flatten(json);
    if (/(openai|anthropic|ai|agent|llm)/.test(text) && /(http|webhook|code|script|gmail|slack|github|notion|database|credential)/.test(text)) {
      findings.push(makeFinding("AWI009", file, platformEvidence(file, json, text)));
    }
  }

  return findings;
}
