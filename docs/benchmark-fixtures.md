# Benchmark Fixtures

The repository now includes vulnerable fixtures for the current scanner surface:

| Fixture | Platform | Expected rule |
| --- | --- | --- |
| `examples/vulnerable-github-action` | GitHub Actions | `AWI001`, `AWI002`, `AWI003`, `AWI004`, `AWI008` |
| `examples/vulnerable-n8n` | n8n | `AWI005` |
| `examples/vulnerable-mcp` | MCP | `AWI006` |
| `examples/vulnerable-activepieces` | Activepieces-style JSON | `AWI009` |
| `examples/vulnerable-node-red` | Node-RED | `AWI009` |
| `examples/vulnerable-make` | Make | `AWI009` |
| `examples/vulnerable-pipedream` | Pipedream | `AWI009` |
| `examples/vulnerable-airflow` | Airflow | `AWI009` |

The next benchmark step is adding paired safe fixtures for every platform plus snapshot tests for expected findings. That turns the repository into a reference dataset for agentic workflow security scanning.
