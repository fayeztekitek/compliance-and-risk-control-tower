# EPIC-15 — Context-Aware AI Chatbot

## Objective

Add a floating AI assistant aware of the current page context.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-15.1
As User, I want to ask questions from any page.

### US-15.2
As Executive, I want AI to summarize current dashboard.

### US-15.3
As Admin, I want AI to respect permissions.


## Technical Tasks

- [ ] Create floating chat component.
- [ ] Capture current page context.
- [ ] Capture filters and selected entity.
- [ ] Pass user role/permissions to AI service.
- [ ] Add safe mock AI response if real API unavailable.
- [ ] Add conversation history.

## Acceptance Criteria

- Chatbot can answer context-aware questions at least with mocked responses.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Implement a floating context-aware AI chatbot. It must know current route, page title, filters, selected client/project/product, user role and permissions. Start with a mock AI service if no LLM key is configured. Do not expose unauthorized data.

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
