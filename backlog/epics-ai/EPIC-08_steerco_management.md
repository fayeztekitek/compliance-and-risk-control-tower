# EPIC-08 — SteerCo Management

## Objective

Manage steering committees for projects.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-08.1
As PMO, I want to schedule SteerCo meetings.

### US-08.2
As Project Manager, I want to record agenda, minutes, decisions and actions.

### US-08.3
As Executive, I want to see the latest SteerCo decisions.


## Technical Tasks

- [ ] Create SteerCo entity.
- [ ] Create AgendaItem entity.
- [ ] Create MeetingMinute entity.
- [ ] Create Decision entity.
- [ ] Create ActionItem entity.
- [ ] Link SteerCo to Project.
- [ ] Add status and due date tracking.

## Acceptance Criteria

- SteerCo lifecycle available per project.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement SteerCo management for Projects Monitoring. Add meeting calendar/list, agenda, minutes, decisions, action tracker and participants. Link every SteerCo to a project. Reuse existing committee/action components when possible.

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
