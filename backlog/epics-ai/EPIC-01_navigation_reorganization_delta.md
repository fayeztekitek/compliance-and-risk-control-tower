# EPIC-01 — Navigation Reorganization Delta

## Objective

Reorganize the menu around governance domains while preserving existing pages.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-01.1
As an executive, I want a clear domain-based menu.

### US-01.2
As an operational user, I want collapsible submenus.

### US-01.3
As an admin, I want the Administration section preserved.


## Technical Tasks

- [ ] Map old menu entries to new governance domains.
- [ ] Create separate entries for Roadmaps Monitoring and Projects Monitoring.
- [ ] Add AI Hub entry.
- [ ] Add collapsible menu support if missing.
- [ ] Preserve existing route paths when possible.
- [ ] Create Coming Soon placeholders only where pages do not exist.

## Acceptance Criteria

- Menu reorganized without broken routes.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Reorganize the left navigation only. Keep all existing pages and routes whenever possible. Create domain-based sections: Executive, Organizations, VEG Governance, Security Governance, Roadmaps Monitoring, Projects Monitoring, SaaS Governance, Compliance, Audits, Committees, AI Hub, Administration. Inspect first, propose old-to-new mapping, then implement incrementally.

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
