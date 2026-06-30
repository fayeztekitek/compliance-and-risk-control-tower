# EPIC-13 — Notification Center

## Objective

Centralize alerts and reminders.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-13.1
As User, I want one notification center.

### US-13.2
As Manager, I want alerts for overdue actions.

### US-13.3
As Executive, I want alerts for critical risks.


## Technical Tasks

- [ ] Create Notification entity.
- [ ] Create notification rules.
- [ ] Create notification center UI.
- [ ] Add badges in navigation.
- [ ] Add alerts for overdue actions, waivers, snapshot due, SteerCo, critical risks.

## Acceptance Criteria

- Notification center visible and actionable.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement a central notification center. Include rules for overdue actions, upcoming SteerCo, missing roadmap snapshot, high-risk project, expired waiver, SLA breach and critical vulnerability. Add navigation badges and tests for notification rules.

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
