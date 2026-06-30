# EPIC-10 — Cross-Traceability Model

## Objective

Connect clients, opportunities, contracts, roadmaps, projects, vulnerabilities, audits and decisions.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-10.1
As Executive, I want to navigate from client to all related risks and projects.

### US-10.2
As Compliance Manager, I want complete traceability from VEG to delivery.

### US-10.3
As AI Agent, I need entity relationships to reason across modules.


## Technical Tasks

- [ ] Define TraceLink model.
- [ ] Link Client to Opportunity/VEG.
- [ ] Link Opportunity to Contract and Project.
- [ ] Link Project to Roadmap Feature if relevant.
- [ ] Link Application to vulnerabilities.
- [ ] Link risks to committees, audits and CAPA.
- [ ] Add related-items panel.

## Acceptance Criteria

- Users can see related objects across domains.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement cross-traceability as a delta feature. Add a generic Related Items panel and relationship model connecting Client, Opportunity, VEG, Contract, Project, Roadmap Feature, Application, Vulnerability, Risk Acceptance, Committee Decision, Audit Finding and CAPA. Avoid large rewrites.

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
