# EPIC-07 — Projects Monitoring Module

## Objective

Create strategic project governance inspired by Capital Markets Risk Dashboard.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-07.1
As PMO, I want to add and monitor strategic projects.

### US-07.2
As COMEX, I want RAG status and executive messages.

### US-07.3
As Project Manager, I want milestones, risks, scope, quality and resources tracked.


## Technical Tasks

- [ ] Create Project entity.
- [ ] Create ProjectStatusSnapshot entity.
- [ ] Add RAG fields: planning, quality, scope, governance, security, client mood, resources, global risk.
- [ ] Add executive message field.
- [ ] Add milestone tracking.
- [ ] Add risk/action tracking placeholders.
- [ ] Support project creation under Capital Markets.

## Acceptance Criteria

- Projects Monitoring module can manage strategic projects and RAG snapshots.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement Projects Monitoring as a separate domain inspired by Capital Markets Risk Dashboard. Each project must support executive summary, RAG indicators, trend arrows, planning, quality, scope, governance, security, client mood, resources, milestones, risks, actions and documents. Start with data model, mock data and basic pages.

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
