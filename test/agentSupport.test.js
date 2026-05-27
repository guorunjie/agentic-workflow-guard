import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { renderAgentSupportMarkdown, supportedAgents } from "../src/agentSupport.js";

test("supportedAgents covers Claude, OpenClaw, Hermes, and Gemini", () => {
  const ids = supportedAgents.map((agent) => agent.id);

  assert.ok(ids.includes("claude"));
  assert.ok(ids.includes("openclaw"));
  assert.ok(ids.includes("hermes"));
  assert.ok(ids.includes("gemini"));
});

test("agent support markdown describes output files", () => {
  const markdown = renderAgentSupportMarkdown();

  assert.match(markdown, /\.claude\/skills\/agentic-workflow-guard-auditor\/SKILL.md/);
  assert.match(markdown, /\.gemini\/skills\/agentic-workflow-guard-auditor\/SKILL.md/);
  assert.match(markdown, /\.openclaw\/skills\/agentic-workflow-guard-auditor\/SKILL.md/);
  assert.match(markdown, /\.hermes\/skills\/agentic-workflow-guard-auditor\/SKILL.md/);
  assert.match(markdown, /skills\/agentic-workflow-guard-auditor\/SKILL.md/);
  assert.match(markdown, /GEMINI.md/);
});

test("repository includes generated support files for mainstream agents", async () => {
  const files = [
    ".claude/skills/agentic-workflow-guard-auditor/SKILL.md",
    ".gemini/skills/agentic-workflow-guard-auditor/SKILL.md",
    ".openclaw/skills/agentic-workflow-guard-auditor/SKILL.md",
    ".hermes/skills/agentic-workflow-guard-auditor/SKILL.md",
    "skills/agentic-workflow-guard-auditor/SKILL.md",
    "GEMINI.md"
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    assert.match(content, /Agentic Workflow Guard|agentic-workflow-guard/i);
  }
});
