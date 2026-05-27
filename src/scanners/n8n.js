import { makeFinding } from "../rules/index.js";
import { readJson, walk } from "../utils/files.js";

function looksLikeN8n(workflow) {
  return Array.isArray(workflow.nodes) && workflow.connections && typeof workflow.connections === "object";
}

function textOf(node) {
  return `${node.name ?? ""} ${node.type ?? ""}`.toLowerCase();
}

function isSource(node) {
  return /(webhook|github.*trigger|email|imap|telegram.*trigger|form.*trigger|trigger)/i.test(textOf(node));
}

function isAi(node) {
  return /(ai|agent|openai|anthropic|langchain|lmchat|chatmodel|llm)/i.test(textOf(node));
}

function isSideEffect(node) {
  return /(http|code|execute|command|ssh|postgres|mysql|database|google|slack|github|notion|send|write)/i.test(textOf(node)) || Boolean(node.credentials);
}

function nextNames(workflow, nodeName) {
  const entry = workflow.connections?.[nodeName];
  const names = [];
  const branches = entry?.main ?? [];
  for (const branch of branches) {
    for (const target of branch ?? []) {
      if (target?.node) names.push(target.node);
    }
  }
  return names;
}

function reaches(workflow, start, predicate, maxDepth = 5) {
  const nodesByName = new Map(workflow.nodes.map((node) => [node.name, node]));
  const queue = [{ name: start.name, path: [start.name] }];
  const seen = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (seen.has(current.name) || current.path.length > maxDepth) continue;
    seen.add(current.name);
    const node = nodesByName.get(current.name);
    if (node && node !== start && predicate(node)) return current.path;
    for (const next of nextNames(workflow, current.name)) queue.push({ name: next, path: [...current.path, next] });
  }
  return null;
}

export async function scanN8nWorkflows(root) {
  const files = await walk(root, (relative) => relative.endsWith(".json"));
  const findings = [];

  for (const file of files) {
    let workflow;
    try {
      workflow = await readJson(root, file);
    } catch {
      continue;
    }
    if (!looksLikeN8n(workflow)) continue;
    for (const source of workflow.nodes.filter(isSource)) {
      const aiPath = reaches(workflow, source, isAi);
      if (!aiPath) continue;
      const aiNode = workflow.nodes.find((node) => node.name === aiPath.at(-1));
      const sinkPath = aiNode ? reaches(workflow, aiNode, isSideEffect) : null;
      if (sinkPath) {
        findings.push(makeFinding("AWI005", file, [...aiPath, ...sinkPath.slice(1)].join(" -> ")));
      }
    }
  }

  return findings;
}
