# EPIC-18 — MCP Integration Layer

## Objective

Prepare integration architecture for AI and business modules.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-18.1
As AI Agent, I want standardized connectors.

### US-18.2
As Admin, I want to configure integration endpoints.

### US-18.3
As Platform Architect, I want MCP-ready architecture.


## Technical Tasks

- [ ] Create integration registry.
- [ ] Add connector placeholders for Jira, Nexus IQ, Chronos, Sonar, Fortify, Checkmarx, GitHub, GitLab, Azure DevOps, Confluence, Teams.
- [ ] Define connector interface.
- [ ] Add connection status UI.
- [ ] Do not implement credentials insecurely.

## Acceptance Criteria

- MCP-ready integration layer defined.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Design and implement the first skeleton of an MCP-ready integration layer. Add connector registry and placeholders for Jira, Nexus IQ, Chronos, SonarQube, Fortify, Checkmarx, GitHub, GitLab, Azure DevOps, Confluence, SharePoint, Teams and Slack. Do not hardcode secrets.

Before coding, inspect the existing codebase and produce:
1. Current state
2. Proposed changes
3. Files to modify
4. Risks
5. Implementation plan
6. Tests to add

Do not rewrite the application.
Make incremental changes only.
```

## Risks

- Overwriting existing routing or navigation
- Duplicating components already present
- Mixing Roadmaps Monitoring and Projects Monitoring again
- Implementing too much in one iteration
- Adding AI features without permission and security boundaries

## Deliverables

- Code changes, if applicable
- Tests
- Updated documentation
- Short implementation summary
