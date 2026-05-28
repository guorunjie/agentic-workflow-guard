import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bin = path.resolve("bin/agentic-workflow-guard.js");

test("rules search finds rules by platform and risk text", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "github"]);

  assert.match(stdout, /AWI001/);
  assert.match(stdout, /GitHub/i);
  assert.doesNotMatch(stdout, /AWI005/);
});

test("rules search finds expanded workflow platforms", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "airflow"]);

  assert.match(stdout, /AWI009/);
  assert.match(stdout, /Airflow/i);
});

test("rules search finds CI platform coverage", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "gitlab"]);

  assert.match(stdout, /AWI001/);
  assert.match(stdout, /GitLab|CI/i);
});

test("rules search finds expanded CI platform coverage", async () => {
  const bitbucket = await execFileAsync("node", [bin, "rules", "search", "bitbucket"]);
  const travis = await execFileAsync("node", [bin, "rules", "search", "travis"]);
  const drone = await execFileAsync("node", [bin, "rules", "search", "drone"]);
  const teamcity = await execFileAsync("node", [bin, "rules", "search", "teamcity"]);
  const harness = await execFileAsync("node", [bin, "rules", "search", "harness"]);
  const codebuild = await execFileAsync("node", [bin, "rules", "search", "codebuild"]);
  const cloudBuild = await execFileAsync("node", [bin, "rules", "search", "cloud build"]);
  const azure = await execFileAsync("node", [bin, "rules", "search", "azure"]);
  const jenkins = await execFileAsync("node", [bin, "rules", "search", "jenkins"]);
  const buildkite = await execFileAsync("node", [bin, "rules", "search", "buildkite"]);

  assert.match(bitbucket.stdout, /AWI001/);
  assert.match(bitbucket.stdout, /Bitbucket Pipelines/i);
  assert.match(travis.stdout, /AWI001/);
  assert.match(travis.stdout, /Travis CI/i);
  assert.match(drone.stdout, /AWI001/);
  assert.match(drone.stdout, /Drone CI/i);
  assert.match(teamcity.stdout, /AWI001/);
  assert.match(teamcity.stdout, /TeamCity/i);
  assert.match(harness.stdout, /AWI001/);
  assert.match(harness.stdout, /Harness CI\/CD/i);
  assert.match(codebuild.stdout, /AWI001/);
  assert.match(codebuild.stdout, /AWS CodeBuild/i);
  assert.match(cloudBuild.stdout, /AWI001/);
  assert.match(cloudBuild.stdout, /Google Cloud Build/i);
  assert.match(azure.stdout, /AWI001/);
  assert.match(azure.stdout, /Azure Pipelines/i);
  assert.match(jenkins.stdout, /AWI001/);
  assert.match(jenkins.stdout, /Jenkins/i);
  assert.match(buildkite.stdout, /AWI001/);
  assert.match(buildkite.stdout, /Buildkite/i);
});

test("rules search finds Zapier low-code coverage", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "search", "zapier"]);

  assert.match(stdout, /AWI009/);
  assert.match(stdout, /Zapier/i);
});

test("rules search finds agent workflow builder coverage", async () => {
  const dify = await execFileAsync("node", [bin, "rules", "search", "dify"]);
  const flowise = await execFileAsync("node", [bin, "rules", "search", "flowise"]);
  const langflow = await execFileAsync("node", [bin, "rules", "search", "langflow"]);

  assert.match(dify.stdout, /AWI009/);
  assert.match(flowise.stdout, /AWI009/);
  assert.match(langflow.stdout, /AWI009/);
});

test("rules install writes core rule pack metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "core", root]);
  const installed = await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-core-rules.json"), "utf8");
  const parsed = JSON.parse(installed);

  assert.match(stdout, /Installed/);
  assert.equal(parsed.name, "agentic-workflow-guard-core-rules");
  assert.ok(parsed.rules.includes("AWI009"));
});

test("rules registry lists installable community packs", async () => {
  const { stdout } = await execFileAsync("node", [bin, "rules", "registry", "--format", "json"]);
  const registry = JSON.parse(stdout);

  assert.equal(registry.schemaVersion, "1.0.0");
  assert.ok(registry.packs.some((pack) => pack.alias === "github-actions-hardening" && pack.source === "community"));
  assert.ok(
    registry.packs.some(
      (pack) =>
        pack.alias === "ci-pipeline-hardening" &&
        pack.platforms.includes("bitbucket-pipelines") &&
        pack.platforms.includes("travis-ci") &&
        pack.platforms.includes("drone-ci") &&
        pack.platforms.includes("teamcity") &&
        pack.platforms.includes("harness") &&
        pack.platforms.includes("aws-codebuild") &&
        pack.platforms.includes("google-cloud-build") &&
        pack.platforms.includes("buildkite")
    )
  );
  assert.ok(registry.packs.some((pack) => pack.alias === "low-code-automation" && /rules install low-code-automation/.test(pack.install)));
  assert.ok(registry.packs.some((pack) => pack.alias === "mcp-tool-governance" && pack.rules.includes("AWI006")));
});

test("rules install writes community rule pack metadata and lock source", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-community-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "github-actions-hardening", root]);
  const installed = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-github-actions-hardening.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-rules.lock.json"), "utf8"));

  assert.match(stdout, /Installed github-actions-hardening/);
  assert.equal(installed.provenance.source, "community");
  assert.deepEqual(installed.platforms, ["github-actions"]);
  assert.equal(lock.packs[0].source, "community");
  assert.equal(lock.packs[0].checksum, installed.checksum);
});

test("rules install writes CI pipeline hardening community pack metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-ci-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "ci-pipeline-hardening", root]);
  const installed = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-ci-pipeline-hardening.json"), "utf8"));

  assert.match(stdout, /Installed ci-pipeline-hardening/);
  assert.equal(installed.provenance.source, "community");
  assert.ok(installed.platforms.includes("bitbucket-pipelines"));
  assert.ok(installed.platforms.includes("travis-ci"));
  assert.ok(installed.platforms.includes("drone-ci"));
  assert.ok(installed.platforms.includes("teamcity"));
  assert.ok(installed.platforms.includes("harness"));
  assert.ok(installed.platforms.includes("aws-codebuild"));
  assert.ok(installed.platforms.includes("google-cloud-build"));
  assert.ok(installed.platforms.includes("buildkite"));
  assert.deepEqual(installed.rules, ["AWI001", "AWI002", "AWI007", "AWI008"]);
});

test("rules install writes MCP tool governance community pack metadata", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "awg-mcp-rules-"));

  const { stdout } = await execFileAsync("node", [bin, "rules", "install", "mcp-tool-governance", root]);
  const installed = JSON.parse(await readFile(path.join(root, ".awg", "rules", "agentic-workflow-guard-mcp-tool-governance.json"), "utf8"));

  assert.match(stdout, /Installed mcp-tool-governance/);
  assert.equal(installed.provenance.source, "community");
  assert.deepEqual(installed.platforms, ["mcp"]);
  assert.deepEqual(installed.rules, ["AWI006"]);
});
