# EPIC-20 — Testing & Hardening

## Objective

Secure and stabilize all delta features.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-20.1
As Product Owner, I want confidence that new features do not break the app.

### US-20.2
As Security Manager, I want security controls validated.

### US-20.3
As Developer, I want regression tests.


## Technical Tasks

- [ ] Add unit tests for KPI formulas.
- [ ] Add tests for snapshot deltas.
- [ ] Add tests for filters and workflow transitions.
- [ ] Add permission tests.
- [ ] Add accessibility checks where possible.
- [ ] Run build and fix regressions.

## Acceptance Criteria

- All new deltas tested and documented.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Add tests and hardening for all delta features. Focus on KPI formulas, roadmap snapshot comparison, workflow transitions, permissions, notification rules, chatbot authorization, filters and dashboard rendering. Do not add new features in this epic.

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
