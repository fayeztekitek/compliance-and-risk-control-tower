# EPIC-02 — Design System Delta

## Objective

Standardize UI look and feel for dashboards and enterprise modules.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-02.1
As a user, I want a homogeneous interface across all domains.

### US-02.2
As a developer, I want reusable cards, tables, badges and chart containers.

### US-02.3
As an executive, I want clean dashboards readable in COMEX context.


## Technical Tasks

- [ ] Audit existing UI components.
- [ ] Define KPI card component.
- [ ] Define RAG badge component.
- [ ] Define dashboard grid component.
- [ ] Define filter panel component.
- [ ] Define data table component.
- [ ] Define AI insight card component.
- [ ] Add design tokens if missing.

## Acceptance Criteria

- Reusable UI components available and documented.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Create a design system delta without changing business logic. Inspect existing UI components, then standardize cards, KPI widgets, RAG badges, tables, filters, chart containers, AI insight blocks, spacing and typography. Do not redesign the whole app; refactor only reusable UI elements.

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
