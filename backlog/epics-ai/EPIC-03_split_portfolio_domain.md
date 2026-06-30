# EPIC-03 — Split Portfolio Domain

## Objective

Replace the combined Roadmaps & Projects concept with two first-class domains.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-03.1
As COMEX, I want Roadmaps Monitoring and Projects Monitoring separated.

### US-03.2
As Product Management, I want roadmap-specific tracking.

### US-03.3
As PMO, I want project-specific governance and SteerCo tracking.


## Technical Tasks

- [ ] Create Roadmaps Monitoring domain shell.
- [ ] Create Projects Monitoring domain shell.
- [ ] Add route groups.
- [ ] Add dashboard placeholders.
- [ ] Define shared Portfolio Analytics concept.
- [ ] Ensure both domains can later share KPI engine, workflow engine and reporting.

## Acceptance Criteria

- Two independent domains exist in the navigation and routing.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Split the previous Roadmaps & Projects concept into two separate domains: Roadmaps Monitoring and Projects Monitoring. Create route shells and placeholder dashboards only. Preserve existing code. Do not implement detailed dashboards yet.

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
