import assert from "node:assert/strict";
import { test } from "node:test";

import { explainRule } from "../src/explain.js";
import { renderJson } from "../src/reporters/json.js";
import { renderMarkdown } from "../src/reporters/markdown.js";
import { renderSarif } from "../src/reporters/sarif.js";

const findings = [
  {
    ruleId: "AWI001",
    severity: "high",
    title: "Untrusted GitHub event context reaches an agent prompt",
    file: ".github/workflows/agent.yml",
    evidence: "github.event.issue.body",
    remediation: "Gate untrusted content."
  }
];

test("JSON reporter emits parseable findings", () => {
  const parsed = JSON.parse(renderJson(findings));
  assert.equal(parsed.findings[0].ruleId, "AWI001");
  assert.equal(parsed.summary.high, 1);
});

test("Markdown reporter includes rule, evidence, and remediation", () => {
  const markdown = renderMarkdown(findings);
  assert.match(markdown, /AWI001/);
  assert.match(markdown, /github.event.issue.body/);
  assert.match(markdown, /Gate untrusted content/);
});

test("SARIF reporter emits GitHub code scanning compatible shape", () => {
  const sarif = JSON.parse(renderSarif(findings));
  assert.equal(sarif.version, "2.1.0");
  assert.equal(sarif.runs[0].results[0].ruleId, "AWI001");
});

test("explainRule returns risk and remediation text", () => {
  const explanation = explainRule("AWI001");
  assert.match(explanation, /Untrusted GitHub event context/);
  assert.match(explanation, /Remediation/);
});
