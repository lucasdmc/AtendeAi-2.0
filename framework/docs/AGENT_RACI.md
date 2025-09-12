# AGENT_RACI.md

| Capability | api_architect | database_architect | specification_agent | expert_developer | test_engineer | delivery_reviewer | repository_manager | context_manager |
|---|---|---|---|---|---|---|---|---|
| API Contract (OpenAPI/GraphQL) | **R/A** | C | C | I | C | C | I | I |
| API Versioning & Compat | **R/A** | C | C | I | C | C | I | I |
| DB Logical/Physical Model | C | **R/A** | C | I | C | C | I | I |
| Migrations (reversible) | I | **R/A** | I | C | C | C | I | I |
| Performance (indexes/queries) | I | **R/A** | I | C | C | C | I | I |
| Spec & Acceptance Criteria | I | I | **R/A** | C | C | C | I | I |
| Implementation | I | I | C | **R/A** | C | C | I | I |
| Tests (unit/integration/contract) | I | I | C | C | **R/A** | C | I | I |
| Quality Gate & Security | I | I | C | C | C | **R/A** | I | I |
| Housekeeping & Repo Gov | I | I | I | I | I | C | **R/A** | I |
| Orchestration & Context | I | I | I | I | I | I | I | **R/A** |
Legend: R = Responsible, A = Accountable, C = Consulted, I = Informed.
