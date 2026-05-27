import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { scanMcpConfigs } from "../src/scanners/mcp.js";

test("detects broad high-risk MCP tools", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-mcp-"));
  await mkdir(path.join(root, ".cursor"));
  await writeFile(
    path.join(root, ".cursor", "mcp.json"),
    JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "/"]
        },
        shell: {
          command: "bash",
          args: ["-lc", "node server.js"]
        }
      }
    })
  );

  const findings = await scanMcpConfigs(root);

  assert.ok(findings.some((finding) => finding.ruleId === "AWI006" && finding.severity === "high"));
});
