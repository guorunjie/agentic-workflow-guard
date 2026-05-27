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

function valueLabel(value, fallback = "unnamed") {
  if (!value || typeof value !== "object") return fallback;
  return String(value.name ?? value.label ?? value.key ?? value.id ?? value.module ?? value.type ?? value.pieceName ?? fallback);
}

function moduleLabel(value, fallback = "unknown") {
  if (!value || typeof value !== "object") return fallback;
  return String(value.module ?? value.type ?? value.pieceName ?? value.app ?? value.actionName ?? valueLabel(value, fallback));
}

function includesAny(value, pattern) {
  return pattern.test(JSON.stringify(value).toLowerCase());
}

function firstMatching(values, pattern) {
  return values.find((value) => includesAny(value, pattern));
}

function activepiecesEvidence(json) {
  const steps = Array.isArray(json.steps) ? json.steps : [];
  const aiStep = firstMatching(steps, /openai|anthropic|ai|agent|llm|chatgpt/);
  const sideEffectStep = firstMatching(steps, /github|http|webhook|code|script|gmail|slack|notion|database|credential/);
  if (aiStep && sideEffectStep) {
    return `Activepieces flow chains AI step ${valueLabel(aiStep)} (${moduleLabel(aiStep)}:${aiStep.actionName ?? "action"}) into side-effect step ${valueLabel(sideEffectStep)} (${moduleLabel(sideEffectStep)}:${sideEffectStep.actionName ?? "action"})`;
  }
  return "Activepieces flow chains AI steps into side-effect actions";
}

function nodeRedEvidence(json) {
  const nodes = Array.isArray(json) ? json : [];
  const aiNode = firstMatching(nodes, /openai|anthropic|ai|agent|llm|chatgpt/);
  const sideEffectNode = firstMatching(nodes, /http request|function|exec|code|gmail|slack|github|notion|database/);
  if (aiNode && sideEffectNode) {
    return `Node-RED flow chains AI node ${valueLabel(aiNode)} (${moduleLabel(aiNode)}) into side-effect node ${valueLabel(sideEffectNode)} (${moduleLabel(sideEffectNode)})`;
  }
  return "Node-RED flow chains AI nodes into side-effect nodes";
}

function makeEvidence(json) {
  const flow = Array.isArray(json.flow) ? json.flow : [];
  const aiModule = firstMatching(flow, /openai|anthropic|ai|agent|llm|chatgpt/);
  const sideEffectModule = firstMatching(flow, /http:|webhook|github|gmail|slack|notion|database|credential/);
  if (aiModule && sideEffectModule) {
    return `Make scenario chains AI module ${moduleLabel(aiModule)} into side-effect module ${moduleLabel(sideEffectModule)}`;
  }
  return "Make scenario chains AI modules into HTTP or app actions";
}

function pipedreamEvidence(json) {
  const steps = json.steps && typeof json.steps === "object" ? Object.entries(json.steps) : [];
  const aiStep = steps.find(([, step]) => includesAny(step, /openai|anthropic|ai|agent|llm|chatgpt/));
  const sideEffectStep = steps.find(([, step]) => includesAny(step, /slack|github|http|notion|database|gmail|credential/));
  if (aiStep && sideEffectStep) {
    return `Pipedream workflow chains AI step ${aiStep[0]} (${moduleLabel(aiStep[1])}) into side-effect step ${sideEffectStep[0]} (${moduleLabel(sideEffectStep[1])})`;
  }
  return "Pipedream workflow chains AI output into side-effect actions";
}

function platformEvidence(file, json, text) {
  if (/activepieces/i.test(file) || /activepieces|@activepieces|pieceName|actionName/i.test(text)) {
    return activepiecesEvidence(json);
  }
  if (Array.isArray(json) && json.some((node) => typeof node?.type === "string" && /http request|openai|agent|function/i.test(node.type))) {
    return nodeRedEvidence(json);
  }
  if (/scenario\.blueprint\.json$/i.test(file) || (Array.isArray(json.flow) && /http:|openai|anthropic/i.test(text))) {
    return makeEvidence(json);
  }
  if (/pipedream/i.test(file) || (json.steps && typeof json.steps === "object" && /slack|github|http|notion|database/i.test(text))) {
    return pipedreamEvidence(json);
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
