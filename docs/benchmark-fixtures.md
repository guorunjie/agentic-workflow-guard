# Benchmark Fixtures

The repository includes vulnerable and safe fixtures for the current scanner surface:

| Fixture | Platform | Expected rule |
| --- | --- | --- |
| `examples/vulnerable-github-action` | GitHub Actions | `AWI001`, `AWI002`, `AWI003`, `AWI008` |
| `examples/safe-github-action` | GitHub Actions | none |
| `examples/vulnerable-gitlab-ci` | GitLab CI | `AWI001`, `AWI002`, `AWI007`, `AWI008` |
| `examples/safe-gitlab-ci` | GitLab CI | none |
| `examples/vulnerable-circleci` | CircleCI | `AWI001`, `AWI002`, `AWI007`, `AWI008` |
| `examples/safe-circleci` | CircleCI | none |
| `examples/vulnerable-azure-pipelines` | Azure Pipelines | `AWI001`, `AWI002`, `AWI007`, `AWI008` |
| `examples/safe-azure-pipelines` | Azure Pipelines | none |
| `examples/vulnerable-jenkins` | Jenkins | `AWI001`, `AWI002`, `AWI007`, `AWI008` |
| `examples/safe-jenkins` | Jenkins | none |
| `examples/vulnerable-n8n` | n8n | `AWI005` |
| `examples/safe-n8n` | n8n | none |
| `examples/vulnerable-mcp` | MCP | `AWI006` |
| `examples/safe-mcp` | MCP | none |
| `examples/vulnerable-activepieces` | Activepieces-style JSON | `AWI009` |
| `examples/safe-activepieces` | Activepieces-style JSON | none |
| `examples/vulnerable-node-red` | Node-RED | `AWI009` |
| `examples/safe-node-red` | Node-RED | none |
| `examples/vulnerable-make` | Make | `AWI009` |
| `examples/safe-make` | Make | none |
| `examples/vulnerable-pipedream` | Pipedream | `AWI009` |
| `examples/safe-pipedream` | Pipedream | none |
| `examples/vulnerable-zapier` | Zapier | `AWI009` |
| `examples/safe-zapier` | Zapier | none |
| `examples/vulnerable-airflow` | Airflow | `AWI009` |
| `examples/safe-airflow` | Airflow | none |
| `examples/vulnerable-browser-trace` | browser-use / browser traces | `AWI010` |
| `examples/safe-browser-trace` | browser-use / browser traces | none |

Run `agentic-workflow-guard benchmark` to compare every fixture against `benchmarks/fixtures.json`.

Run `agentic-workflow-guard benchmark --format json` to emit a scored benchmark report with fixture count, pass rate, missing rule IDs, and unexpected rule IDs. The report shape is documented by `agentic-workflow-guard schema benchmark-report`.

Run `agentic-workflow-guard benchmark corpus --format json` to export the portable benchmark corpus metadata. The same generated corpus is shipped as `benchmarks/corpus.json`, published through GitHub Pages, exposed as `awg://benchmarks/corpus` in the MCP resource pack, and copied by `agentic-workflow-guard agents install mcp-resources`. The corpus shape is documented by `agentic-workflow-guard schema benchmark-corpus`.
