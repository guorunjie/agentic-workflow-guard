import { makeFinding } from "../rules/index.js";
import { readJson, walk } from "../utils/files.js";

const riskyNames = /(filesystem|file-system|shell|bash|terminal|browser|playwright|puppeteer|github|git|docker|kubernetes|aws|gcloud)/i;
const unsafeScopeFlag = /^--(?:allow-write|dangerously|unsafe|all)(?:=.*)?$/i;
const unsafeScopeText = /--allow-write|--dangerously|--unsafe|--all/i;
const broadKeyValueScope = /^--(?:root|path|dir|directory|workspace)=(\/|\/Users|\/home|\.{2}(?:\/.*)?)$/i;
const filesystemServer = /(filesystem|file-system|server-filesystem)/i;

function configFiles(relative) {
  return /(^|\/)(\.?mcp\.json|mcp-config\.json)$/.test(relative) || /^\.cursor\/mcp\.json$/.test(relative) || /claude.*desktop.*config.*\.json$/i.test(relative);
}

function serversFrom(config) {
  if (config.mcpServers) return config.mcpServers;
  if (config.servers) return config.servers;
  return {};
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function serverText(name, server) {
  if (!isRecord(server)) return String(name);
  const args = Array.isArray(server.args) ? server.args.join(" ") : "";
  return `${name} ${server.command ?? ""} ${args}`.replace(/\s+/g, " ").trim();
}

function isFilesystemServer(name, server) {
  return filesystemServer.test(serverText(name, server));
}

function hasReadOnlySignal(server) {
  if (!isRecord(server)) return false;
  const args = Array.isArray(server.args) ? server.args.join(" ") : "";
  return server.readOnly === true || server.readonly === true || server.read_only === true || /--read-?only|--readonly/.test(args);
}

function isBroadRoot(value) {
  return value === "/" || value === "/Users" || value === "/home" || value === ".." || value.startsWith("../");
}

function hasBroadScope(server) {
  if (!isRecord(server)) return false;
  const args = Array.isArray(server.args) ? server.args : [];
  if (args.some((arg) => typeof arg === "string" && (isBroadRoot(arg) || unsafeScopeFlag.test(arg) || broadKeyValueScope.test(arg)))) {
    return true;
  }
  if (typeof server.root === "string" && isBroadRoot(server.root)) return true;
  if (Array.isArray(server.roots) && server.roots.some((root) => typeof root === "string" && isBroadRoot(root))) return true;
  return unsafeScopeText.test(serverText("", server));
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
      const joined = serverText(name, server);
      if (isFilesystemServer(name, server)) {
        if (hasBroadScope(server) || !hasReadOnlySignal(server)) {
          findings.push(makeFinding("AWI006", file, joined));
        }
        continue;
      }

      if (riskyNames.test(joined) && (hasBroadScope(server) || riskyNames.test(name))) {
        findings.push(makeFinding("AWI006", file, joined));
      }
    }
  }

  return findings;
}
