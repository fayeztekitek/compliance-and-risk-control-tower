# EPIC-19 — Reporting Engine

## Objective

Generate executive reports and presentations.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-19.1
As Executive, I want COMEX reports.

### US-19.2
As PMO, I want SteerCo packs.

### US-19.3
As Product Manager, I want roadmap review packs.


## Technical Tasks

- [ ] Create report templates.
- [ ] Create export service interface.
- [ ] Support PDF/Excel/PPT placeholders depending on stack.
- [ ] Generate executive narrative sections.
- [ ] Add reports list page.

## Acceptance Criteria

- Reporting engine can generate or prepare key report structures.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Create reporting engine foundation. Support report templates for COMEX Pack, Roadmap Review, Project SteerCo, Security Committee, Audit Report and Executive Monthly Summary. Add export hooks for PDF, Excel and PowerPoint depending on existing stack.

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
