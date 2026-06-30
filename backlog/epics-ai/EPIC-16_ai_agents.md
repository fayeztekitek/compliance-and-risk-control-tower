# EPIC-16 — AI Agents

## Objective

Define specialized agents for governance domains.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-16.1
As Executive, I want an agent that summarizes enterprise risks.

### US-16.2
As Product Manager, I want a Roadmap Agent.

### US-16.3
As PMO, I want a Project Agent.


## Technical Tasks

- [ ] Create agent registry.
- [ ] Define Executive, VEG, Roadmap, Project, Security, Audit, Compliance agents.
- [ ] Add agent objectives, tools, permissions and prompt templates.
- [ ] Add UI to select and run an agent.
- [ ] Start with non-autonomous recommendations.

## Acceptance Criteria

- Agents exist as structured services with prompts and permissions.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Create an AI agent registry. Add Executive Agent, VEG Agent, Roadmap Agent, Project Agent, Security Agent, Audit Agent, Compliance Agent and Reporting Agent. Each agent must have objective, allowed data, tools, permissions, prompt template and output format. Start with recommendation mode only.

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
