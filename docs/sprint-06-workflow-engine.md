# Sprint 6 — Workflow Engine (Phase 13)

**Goal:** Reusable visual workflow engine

## Tasks

### Backend
- [ ] Workflow definition model (id, name, nodes, transitions, metadata)
- [ ] Workflow instance model (state, current_node, data, assignee)
- [ ] Workflow runner service (process transitions, trigger actions, notify assignees)
- [ ] Workflow templates:
  - [ ] VEG Request
  - [ ] Audit workflow
  - [ ] Risk Acceptance
  - [ ] Waiver
  - [ ] CAPA
  - [ ] Privacy Assessment
  - [ ] Compliance Review
- [ ] Workflow CRUD routes + instance routes (start, transition, reassign)

### Frontend
- [ ] Workflow designer page (drag-and-drop node editor)
- [ ] Workflow tracker page (kanban-style board per instance)
- [ ] Workflow list page (templates + active instances)
- [ ] Workflow detail (current node, history log, assigned user)

### Integration
- [ ] Docker rebuild + restart
- [ ] Verify a VEG Request flows through all stages end-to-end
