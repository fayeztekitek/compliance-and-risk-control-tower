# EPIC-00 — Current State Assessment

## Objective

Understand the existing codebase before any modification.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-00.1
As an architect, I want a current-state assessment so that future changes are incremental.

### US-00.2
As a developer, I want a list of reusable components so that I do not duplicate code.

### US-00.3
As a product owner, I want a gap analysis against the AI-GRCP target vision.


## Technical Tasks

- [ ] Inspect folder structure, routing, sidebar, dashboards and services.
- [ ] Identify existing modules matching target domains.
- [ ] Create route inventory and component inventory.
- [ ] Identify missing or duplicated menu entries.
- [ ] Identify technical debt and risks.
- [ ] Produce implementation dependency map.

## Acceptance Criteria

- Do not code. Produce a markdown assessment report only.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
You are a senior enterprise architect. Inspect the existing application and produce a current-state assessment for the AI-GRCP delta program. Do not write code. Identify architecture, routes, sidebar, dashboards, APIs, reusable components, technical debt, gaps, and a safe incremental implementation plan.

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
