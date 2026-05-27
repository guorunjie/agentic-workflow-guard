# Benchmark Fixtures

The repository includes vulnerable and safe fixtures for the current scanner surface:

| Fixture | Platform | Expected rule |
| --- | --- | --- |
| `examples/vulnerable-github-action` | GitHub Actions | `AWI001`, `AWI002`, `AWI003`, `AWI004`, `AWI008` |
| `examples/vulnerable-n8n` | n8n | `AWI005` |
| `examples/safe-n8n` | n8n | none |
| `examples/vulnerable-mcp` | MCP | `AWI006` |
| `examples/safe-mcp` | MCP | none |
| `examples/vulnerable-activepieces` | Activepieces-style JSON | `AWI009` |
| `examples/safe-activepieces` | Activepieces-style JSON | none |
| `examples/vulnerable-node-red` | Node-RED | `AWI009` |
| `examples/vulnerable-make` | Make | `AWI009` |
| `examples/vulnerable-pipedream` | Pipedream | `AWI009` |
| `examples/vulnerable-airflow` | Airflow | `AWI009` |
| `examples/vulnerable-browser-trace` | browser-use / browser traces | `AWI010` |

Run `agentic-workflow-guard benchmark` to compare every fixture against `benchmarks/fixtures.json`. The next benchmark step is publishing these fixtures as a standalone reference corpus for agentic workflow security scanning.
