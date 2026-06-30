# EPIC-06 — Roadmap Dashboards

## Objective

Create executive and operational roadmap dashboards.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-06.1
As COMEX, I want an executive product roadmap dashboard.

### US-06.2
As Product Manager, I want operational details by release and feature.

### US-06.3
As Portfolio Manager, I want capacity vs demand analysis.


## Technical Tasks

- [ ] Create Roadmap Executive Dashboard.
- [ ] Create Product Dashboard.
- [ ] Create Release Dashboard.
- [ ] Create Capacity Dashboard.
- [ ] Create RTD Dashboard.
- [ ] Add charts: RTD evolution, capacity gap, priority mix, release progress.
- [ ] Add AI insights placeholder.

## Acceptance Criteria

- Roadmap dashboards support drill-down from product to release to feature.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Build Roadmaps Monitoring dashboards using existing chart/table components. Include executive KPIs: initial workload, revised workload, consumed, RTD, capacity gap, P0/P1/P2 mix, release progress, overrun, delayed features. Add filters and drill-down. Do not implement AI generation yet; add placeholders for AI insights.

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
