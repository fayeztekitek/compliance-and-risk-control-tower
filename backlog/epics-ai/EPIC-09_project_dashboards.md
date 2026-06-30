# EPIC-09 — Project Dashboards

## Objective

Create executive and operational dashboards for project monitoring.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-09.1
As COMEX, I want a project risk dashboard.

### US-09.2
As PMO, I want a portfolio view across projects.

### US-09.3
As Project Manager, I want drill-down to risks, actions and milestones.


## Technical Tasks

- [ ] Create Projects Executive Dashboard.
- [ ] Create single Project Dashboard.
- [ ] Create RAG heatmap.
- [ ] Create milestone timeline.
- [ ] Create risk/action tables.
- [ ] Add filters by client, project, owner, RAG, date.

## Acceptance Criteria

- Dashboards match the Capital Markets Risk Dashboard pattern.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Build Projects Monitoring dashboards. Include executive snapshot, RAG and trend indicators, planning and delivery, scope changes, quality/bugs, security/vulnerabilities, governance/decisions, client mood, resources, milestones, risks and actions. Use mock data if real data is missing.

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
