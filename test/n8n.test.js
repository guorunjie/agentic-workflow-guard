import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { scanN8nWorkflows } from "../src/scanners/n8n.js";

test("detects webhook to AI to HTTP/code risk path in n8n workflow exports", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-n8n-"));
  await writeFile(
    path.join(root, "workflow.json"),
    JSON.stringify({
      nodes: [
        { id: "1", name: "Webhook", type: "n8n-nodes-base.webhook" },
        { id: "2", name: "AI Agent", type: "@n8n/n8n-nodes-langchain.agent" },
        { id: "3", name: "HTTP Request", type: "n8n-nodes-base.httpRequest", credentials: { httpHeaderAuth: "prod" } }
      ],
      connections: {
        Webhook: { main: [[{ node: "AI Agent" }]] },
        "AI Agent": { main: [[{ node: "HTTP Request" }]] }
      }
    })
  );

  const findings = await scanN8nWorkflows(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI005"));
});
