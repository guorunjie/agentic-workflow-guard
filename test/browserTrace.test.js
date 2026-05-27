import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { scanProject } from "../src/scan.js";

test("detects browser automation traces where AI decisions reach side effects", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-browser-"));
  await writeFile(
    path.join(root, "browser-trace.json"),
    JSON.stringify({
      tool: "browser-use",
      steps: [
        { type: "llm", prompt: "Decide which invoice to pay" },
        { type: "click", selector: "#submit-payment" },
        { type: "fill", selector: "#amount", value: "1000" }
      ]
    })
  );

  const findings = await scanProject(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI010" && /browser-use/i.test(finding.evidence)));
});
