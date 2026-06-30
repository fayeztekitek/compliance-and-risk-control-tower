# EPIC-17 — Knowledge Base & RAG

## Objective

Prepare document knowledge foundation.

## Scope

This epic is part of the delta enhancement program.  
It must enhance the existing platform without rewriting the overall design.

## User Stories

### US-17.1
As User, I want to upload governance documents.

### US-17.2
As AI, I need indexed knowledge to answer accurately.

### US-17.3
As Auditor, I want source traceability.


## Technical Tasks

- [ ] Create KnowledgeDocument entity.
- [ ] Create document categories.
- [ ] Create upload UI placeholder.
- [ ] Create indexing status field.
- [ ] Create citation/source metadata.
- [ ] Design RAG service interface.

## Acceptance Criteria

- Knowledge base architecture ready for indexing.
- Existing application remains functional.
- Existing routes and permissions are preserved whenever possible.
- Tests are added for new business rules.
- Documentation is updated.

## Suggested OpenCode Prompt

```text
Create Knowledge Base foundation for RAG. Support categories: governance, policies, procedures, controls, risks, compliance, privacy, security, audit templates, meeting minutes, roadmaps, projects and contracts. Add source metadata and citation tracking. Use mock indexing if vector store is not available.

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
