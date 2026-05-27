import { loadBenchmarkCorpus } from "./benchmark.js";
import { mcpResourcePack } from "./mcpResources.js";
import { availableRulePacks, coreRulePack, ruleRegistry, withChecksum } from "./rulesCatalog.js";

export function serializeStaticMetadata(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function staticMetadataTargets(root = ".") {
  const communityPacks = availableRulePacks
    .filter((pack) => pack.provenance.source === "community")
    .map((pack) => ({
      path: `rules/community/${pack.name}.json`,
      value: withChecksum(pack)
    }));

  return [
    {
      path: "rules/marketplace.json",
      value: withChecksum(coreRulePack)
    },
    ...communityPacks,
    {
      path: "rules/registry.json",
      value: ruleRegistry()
    },
    {
      path: "benchmarks/corpus.json",
      value: await loadBenchmarkCorpus(root)
    },
    {
      path: "mcp/resources/agentic-workflow-guard.resources.json",
      value: mcpResourcePack
    }
  ];
}
