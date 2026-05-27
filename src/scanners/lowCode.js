import { makeFinding } from "../rules/index.js";
import { readJson, readText, walk } from "../utils/files.js";

const aiSignalPattern = /(openai|anthropic|chatgpt|chatopenai|llm|agent|type:\s*(llm|agent))/i;
const sideEffectSignalPattern =
  /(http|webhook|code|script|exec|gmail|email|slack|github|notion|database|credential|salesforce|hubspot|google sheets|airtable|jira|stripe|shopify|requests?(get|post|put|patch|delete)|apirequest|api request|customcomponent|customtool|toolnode|type:\s*(tool|http-request|code))/i;

function isLowCodeAutomation(json) {
  return (
    Array.isArray(json) ||
    Array.isArray(json.actions) ||
    Array.isArray(json.steps) ||
    Array.isArray(json.flows) ||
    Array.isArray(json.flow) ||
    Array.isArray(json.nodes) ||
    Array.isArray(json.data?.nodes) ||
    Array.isArray(json.data?.edges) ||
    typeof json.flowData === "string" ||
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

function workflowCandidates(json) {
  const candidates = [json];
  if (typeof json.flowData === "string") {
    try {
      candidates.push(JSON.parse(json.flowData));
    } catch {
      // Flowise stores flowData as a JSON string; ignore malformed exports here.
    }
  }
  return candidates;
}

function isN8nWorkflow(json) {
  return Array.isArray(json.nodes) && json.nodes.some((node) => typeof node?.type === "string" && /(^|@)n8n|n8n-nodes-base|n8n-nodes-langchain/i.test(node.type));
}

function graphNodes(json) {
  if (Array.isArray(json.nodes)) return json.nodes;
  if (Array.isArray(json.data?.nodes)) return json.data.nodes;
  if (Array.isArray(json.flow?.nodes)) return json.flow.nodes;
  if (Array.isArray(json.graph?.nodes)) return json.graph.nodes;
  return [];
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

function zapierSteps(json) {
  if (Array.isArray(json.actions)) return json.actions.map((step, index) => [valueLabel(step, `action-${index + 1}`), step]);
  if (Array.isArray(json.steps)) return json.steps.map((step, index) => [valueLabel(step, `step-${index + 1}`), step]);
  if (json.steps && typeof json.steps === "object") return Object.entries(json.steps);
  return [];
}

function zapierEvidence(json) {
  const steps = zapierSteps(json);
  const aiStep = steps.find(([, step]) => includesAny(step, /openai|anthropic|chatgpt|ai|agent|llm/));
  const sideEffectStep = steps.find(([, step]) =>
    includesAny(step, /webhook|http|code by zapier|code|slack|gmail|email|google sheets|salesforce|hubspot|github|jira|notion|airtable|database|stripe|shopify|credential/)
  );
  if (aiStep && sideEffectStep) {
    return `Zapier Zap chains AI action ${aiStep[0]} (${moduleLabel(aiStep[1])}) into side-effect action ${sideEffectStep[0]} (${moduleLabel(sideEffectStep[1])})`;
  }
  return "Zapier Zap chains AI steps into side-effect actions";
}

function flowiseEvidence(json) {
  const nodes = graphNodes(json);
  const aiNode = firstMatching(nodes, /chatopenai|openai|anthropic|llm|agent|chatmodel/);
  const sideEffectNode = firstMatching(nodes, /customtool|requests?(get|post|put|patch|delete)|http|webhook|slack|github|gmail|notion|database|jira|salesforce|credential/);
  if (aiNode && sideEffectNode) {
    return `Flowise flow chains AI node ${valueLabel(aiNode, "ai-node")} (${moduleLabel(aiNode)}) into side-effect node ${valueLabel(sideEffectNode, "side-effect-node")} (${moduleLabel(sideEffectNode)})`;
  }
  return "Flowise chatflow or agentflow chains AI nodes into side-effect tools or requests";
}

function langflowEvidence(json) {
  const nodes = graphNodes(json);
  const aiNode = firstMatching(nodes, /openai|anthropic|llm|agent|model/);
  const sideEffectNode = firstMatching(nodes, /apirequest|api request|customcomponent|tool|http|webhook|github|slack|gmail|notion|database|credential/);
  if (aiNode && sideEffectNode) {
    return `Langflow flow chains AI component ${valueLabel(aiNode, "ai-component")} (${moduleLabel(aiNode)}) into side-effect component ${valueLabel(sideEffectNode, "side-effect-component")} (${moduleLabel(sideEffectNode)})`;
  }
  return "Langflow JSON chains AI components into side-effect tools or API requests";
}

function platformEvidence(file, json, text) {
  if (/langflow/i.test(file) || /langflow|chatinput|openaimodel|apirequest|customcomponent/i.test(text)) {
    return langflowEvidence(json);
  }
  if (/flowise/i.test(file) || /flowise|flowdata|chatflow|agentflow|chatopenai|customtool/i.test(text)) {
    return flowiseEvidence(json);
  }
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
  if (/zapier|zap_id|zap[-_ ]?step/i.test(file) || /zapier|zap_id|zap[-_ ]?step/i.test(text)) {
    return zapierEvidence(json);
  }
  return "AI step appears in the same low-code workflow as side-effect actions";
}

function isDifyDsl(relative, text) {
  return /\.ya?ml$/i.test(relative) && (/dify/i.test(relative) || /Dify DSL|kind:\s*app|app:\s*workflow|mode:\s*workflow|workflow:/i.test(text)) && /nodes:|graph:/i.test(text);
}

function difyHasAiAndSideEffect(text) {
  return aiSignalPattern.test(text) && sideEffectSignalPattern.test(text);
}

function difyEvidence(text) {
  const ai =
    text.match(/(?:title|name):\s*["']?([^"'\n]+?(?:llm|agent|openai|anthropic)[^"'\n]*)/i)?.[1]?.trim() ??
    text.match(/type:\s*["']?(llm|agent)/i)?.[1]?.trim() ??
    "LLM or agent node";
  const sideEffect =
    text.match(/(?:title|name):\s*["']?([^"'\n]+?(?:http|tool|code|github|slack|webhook|api|request)[^"'\n]*)/i)?.[1]?.trim() ??
    text.match(/type:\s*["']?(tool|http-request|code)/i)?.[1]?.trim() ??
    "side-effect node";
  return `Dify DSL chains AI node ${ai} into ${sideEffect}`;
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
  const files = await walk(root, (relative) => /\.(json|py|ya?ml)$/i.test(relative));
  const findings = [];

  for (const file of files) {
    if (/\.ya?ml$/i.test(file)) {
      const text = await readText(root, file);
      if (isDifyDsl(file, text) && difyHasAiAndSideEffect(text)) {
        findings.push(makeFinding("AWI009", file, difyEvidence(text)));
      }
      continue;
    }

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
    if (isN8nWorkflow(json)) continue;
    const candidates = workflowCandidates(json);
    if (!candidates.some(isLowCodeAutomation)) continue;
    const text = flatten(candidates);
    if (aiSignalPattern.test(text) && sideEffectSignalPattern.test(text)) {
      const evidenceSource = candidates.find((candidate) => graphNodes(candidate).length) ?? candidates.find(isLowCodeAutomation) ?? json;
      findings.push(makeFinding("AWI009", file, platformEvidence(file, evidenceSource, text)));
    }
  }

  return findings;
}
