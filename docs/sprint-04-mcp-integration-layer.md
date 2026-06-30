# Sprint 4 — MCP Integration Layer (Phase 11)

**Goal:** Unified connector framework for external tools

## Tasks

### Backend
- [ ] MCP connector registry model (connector type, config, status, last sync)
- [ ] Standardized connector interface (fetch, transform, store)
- [ ] Connector implementations:
  - [ ] SonarQube (refactor existing poll worker)
  - [ ] Nexus IQ (refactor existing sync)
  - [ ] Jira (fetch issues, projects)
  - [ ] Fortify (scan results)
  - [ ] Veracode (findings)
  - [ ] GitHub (repos, secrets, dependabot)
  - [ ] GitLab (repos, pipelines)
  - [ ] Confluence (pages, spaces)
  - [ ] Slack (alerts, notifications)
- [ ] Webhook receiver for tool events (SonarQube, GitHub, GitLab)
- [ ] Connector CRUD routes + test connection endpoint

### Frontend
- [ ] Connector management page (list, add, edit, delete)
- [ ] Connector detail (status, last sync, logs)
- [ ] Test connection button

### Integration
- [ ] Docker rebuild + restart
- [ ] Verify at least one connector syncs end-to-end
