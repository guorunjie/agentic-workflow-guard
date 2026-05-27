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

test("allows narrow read-only filesystem MCP servers", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-mcp-safe-"));
  await writeFile(
    path.join(root, ".mcp.json"),
    JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "./"],
          readOnly: true
        }
      }
    })
  );

  const findings = await scanMcpConfigs(root);

  assert.equal(findings.length, 0);
});

test("allows narrow read-only filesystem MCP root flags", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-mcp-safe-root-"));
  await writeFile(
    path.join(root, "mcp-config.json"),
    JSON.stringify({
      servers: {
        repoFiles: {
          command: "npx",
          args: ["@modelcontextprotocol/server-filesystem", "--root=./"],
          readOnly: true
        }
      }
    })
  );

  const findings = await scanMcpConfigs(root);

  assert.equal(findings.length, 0);
});
