# EPIC-04 — Roadmaps Monitoring Module

## Objective

Create the product roadmap governance module inspired by Capital Markets roadmap presentations.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-04.1
As Product Management, I want to manage roadmaps by product.

### US-04.2
As COMEX, I want visibility on RTD, capacity, priorities and release health.

### US-04.3
As Portfolio Manager, I want to track products such as Megara, Colline, Digital Collateral and Palmyra.


## Technical Tasks

- [ ] Create entities/models for Product, Roadmap, Release, Feature, Priority, Capacity, RTD.
- [ ] Support products: Megara, Colline, Digital Collateral, Palmyra as examples/mock data.
- [ ] Add CRUD pages if architecture supports it.
- [ ] Add filters by product, release, priority, client, owner, month.
- [ ] Add import placeholder for PDF/PPT/Excel uploads.

## Acceptance Criteria

- Roadmaps Monitoring module can store and display product roadmap data.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement the Roadmaps Monitoring module as an incremental addition. Use the Capital Markets roadmap structure as inspiration: product, release, feature, priority P0/P1/P2, workload, consumed, RTD, capacity, client commitment, regulatory items. Create data model, pages and mock data only if needed. Do not implement snapshots yet.

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
