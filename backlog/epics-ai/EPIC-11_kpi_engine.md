# EPIC-11 — KPI/KRI Engine

## Objective

Centralize KPI and KRI calculation across domains.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-11.1
As Executive, I want consistent KPIs across dashboards.

### US-11.2
As Admin, I want thresholds configurable.

### US-11.3
As AI, I need KPI definitions to explain results.


## Technical Tasks

- [ ] Create KPI definition registry.
- [ ] Create KPI calculation service.
- [ ] Create thresholds and RAG rules.
- [ ] Create KPI history storage.
- [ ] Add KPI explanation metadata.
- [ ] Add tests for KPI formulas.

## Acceptance Criteria

- Dashboards consume centralized KPI engine.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Create or refactor toward a centralized KPI/KRI engine. Every KPI must have name, definition, formula, owner, frequency, thresholds, source domain, history and AI explanation. Start with roadmap, project, security, compliance and VEG KPIs.

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
