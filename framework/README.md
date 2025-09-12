# Cursor Agent Framework 4.1 (Extended)

Includes specialized **api_architect** and **database_architect**. The orchestrator can route through
ARCH states (API_ARCH, DB_ARCH) or bypass when not needed.

- SoT: docs/AGENT_PREMISES.md, docs/AGENT_RACI.md
- Runbook: orchestrator.runbook.yaml (version 1.1)
- Agents in /agents
- Tools in /tools
- Housekeeping in housekeeping.manifest.json

Adaptive mode for existing repos: detect stack, scaffold missing contracts/migrations, dry-run housekeeping first.
