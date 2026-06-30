# EPIC-05 — Monthly / Ad Hoc Snapshot Engine

## Objective

Store monthly or ad hoc roadmap snapshots and calculate deltas.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-05.1
As Product Manager, I want to add a monthly roadmap snapshot.

### US-05.2
As COMEX, I want to see what changed since last month.

### US-05.3
As AI Copilot, I need historical data to generate trends.


## Technical Tasks

- [ ] Create RoadmapSnapshot entity.
- [ ] Create SnapshotItem entity.
- [ ] Create snapshot upload/import workflow placeholder.
- [ ] Implement comparison: current vs previous.
- [ ] Detect added, removed, changed features.
- [ ] Detect RTD delta, workload delta, capacity gap delta.
- [ ] Persist immutable snapshot history.

## Acceptance Criteria

- System can compare two roadmap snapshots.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement a monthly/ad hoc snapshot engine for Roadmaps Monitoring. Each uploaded or manually created roadmap state must become an immutable snapshot. Add comparison logic to detect added features, removed features, workload changes, RTD changes, priority changes, release changes and capacity gap changes. Add tests for delta calculation.

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
