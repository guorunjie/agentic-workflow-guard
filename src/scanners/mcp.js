import { makeFinding } from "../rules/index.js";
import { readJson, walk } from "../utils/files.js";

const riskyNames = /(filesystem|file-system|shell|bash|terminal|browser|playwright|puppeteer|github|git|docker|kubernetes|aws|gcloud)/i;
const broadScope = /(^\/$|\/Users$|\/home$|\.{2}|--allow-write|--dangerously|--unsafe|--all|--root)/i;

function configFiles(relative) {
  return /(^|\/)(\.?mcp\.json|mcp-config\.json)$/.test(relative) || /^\.cursor\/mcp\.json$/.test(relative) || /claude.*desktop.*config.*\.json$/i.test(relative);
}

function serversFrom(config) {
  if (config.mcpServers) return config.mcpServers;
  if (config.servers) return config.servers;
  return {};
}

export async function scanMcpConfigs(root) {
  const files = await walk(root, configFiles);
  const findings = [];

  for (const file of files) {
    let config;
    try {
      config = await readJson(root, file);
    } catch {
      continue;
    }
    for (const [name, server] of Object.entries(serversFrom(config))) {
      const joined = `${name} ${server.command ?? ""} ${(server.args ?? []).join(" ")}`;
      if (riskyNames.test(joined) && (broadScope.test(joined) || riskyNames.test(name))) {
        findings.push(makeFinding("AWI006", file, joined.replace(/\s+/g, " ").trim()));
      }
    }
  }

  return findings;
}
