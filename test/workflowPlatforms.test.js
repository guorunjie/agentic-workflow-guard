import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { scanProject } from "../src/scan.js";

async function writeFixture(name, content) {
  const root = await mkdtemp(path.join(tmpdir(), "awg-platforms-"));
  await writeFile(path.join(root, name), content);
  return root;
}

test("detects Node-RED flow exports that chain AI into side effects", async () => {
  const root = await writeFixture(
    "flows.json",
    JSON.stringify([
      { id: "1", type: "inject", name: "Webhook" },
      { id: "2", type: "openai", name: "OpenAI Agent", wires: [["3"]] },
      { id: "3", type: "http request", name: "POST CRM" }
    ])
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI009" && /Node-RED.*OpenAI Agent.*POST CRM/i.test(finding.evidence)));
});

test("detects Make scenario exports that chain AI into HTTP modules", async () => {
  const root = await writeFixture(
    "scenario.blueprint.json",
    JSON.stringify({
      flow: [
        { id: 1, module: "openai-gpt-3:createCompletion" },
        { id: 2, module: "http:ActionSendData", mapper: { url: "https://api.example.test" } }
      ]
    })
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI009" && /Make.*openai-gpt-3:createCompletion.*http:ActionSendData/i.test(finding.evidence)));
});

test("detects Pipedream workflows that chain AI output into actions", async () => {
  const root = await writeFixture(
    "pipedream-workflow.json",
    JSON.stringify({
      steps: {
        generate: { type: "openai", app: "openai", name: "Generate response" },
        send: { type: "action", app: "slack", name: "Send message" }
      }
    })
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI009" && /Pipedream.*generate.*send/i.test(finding.evidence)));
});

test("detects Zapier Zaps that chain AI output into app actions", async () => {
  const root = await writeFixture(
    "zapier-zap.json",
    JSON.stringify({
      zap_id: "ai-ticket-router",
      trigger: { app: "Webhooks by Zapier", event: "Catch Hook", name: "Customer request" },
      actions: [
        { id: "summarize", app: "OpenAI", event: "Conversation", name: "Summarize inbound ticket" },
        { id: "update_crm", app: "Salesforce", event: "Update Record", name: "Update CRM", credential: "salesforce-write" }
      ]
    })
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI009" && /Zapier Zap.*Summarize inbound ticket.*Update CRM/i.test(finding.evidence)));
});

test("detects Activepieces flows that chain AI output into side effects", async () => {
  const root = await writeFixture(
    "activepieces-flow.json",
    JSON.stringify({
      trigger: { type: "WEBHOOK" },
      steps: [
        { name: "summarize", pieceName: "@activepieces/piece-openai", actionName: "ask_chatgpt" },
        { name: "write_pr", pieceName: "@activepieces/piece-github", actionName: "create_pull_request", credential: "repo-write-token" }
      ]
    })
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI009" && /Activepieces.*summarize.*write_pr/i.test(finding.evidence)));
});

test("detects Airflow DAGs that combine LLM calls and side-effect operators", async () => {
  const root = await writeFixture(
    "agent_dag.py",
    `
from airflow import DAG
from airflow.operators.bash import BashOperator
from openai import OpenAI

client = OpenAI()
decision = client.chat.completions.create(model="gpt-4.1", messages=[])
deploy = BashOperator(task_id="deploy", bash_command="kubectl apply -f deployment.yaml")
`
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI009" && /Airflow/i.test(finding.evidence)));
});
