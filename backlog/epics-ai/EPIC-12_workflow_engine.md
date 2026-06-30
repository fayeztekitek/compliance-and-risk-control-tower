# EPIC-12 — Workflow Engine

## Objective

Create reusable status/workflow logic for governance processes.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-12.1
As Compliance Officer, I want consistent workflow statuses.

### US-12.2
As Developer, I want reusable workflow definitions.

### US-12.3
As Auditor, I want workflow history.


## Technical Tasks

- [ ] Create WorkflowDefinition.
- [ ] Create WorkflowInstance.
- [ ] Create WorkflowStep.
- [ ] Create status transition rules.
- [ ] Add audit trail for transitions.
- [ ] Start with VEG, roadmap review, project SteerCo, waiver and audit.

## Acceptance Criteria

- Workflow states are reusable and auditable.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement a reusable workflow engine or refactor existing workflow logic. It should support workflow definitions, instances, steps, transitions, owners, due dates, approvals and audit trail. Apply first to VEG, Roadmap Review, Project SteerCo, Waiver, Risk Acceptance and Audit.

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
