# Sprint 1 — Complete AI Platform (Phase 8)

**Goal:** 8 copilots + Prompt Library + Knowledge Base CRUD

## Tasks

### Backend
- [ ] Create 8 copilot services under `backend/src/services/ai/copilots/`:
  - `executive.copilot.ts`
  - `compliance.copilot.ts`
  - `security.copilot.ts`
  - `audit.copilot.ts`
  - `roadmap.copilot.ts`
  - `veg.copilot.ts`
  - `privacy.copilot.ts`
  - `reporting.copilot.ts`
- [ ] Each copilot: Gemini prompt template + system instruction + domain data query
- [ ] Knowledge Base CRUD: migration 034, `knowledgeBase.service.ts`, `knowledgeBase.routes.ts`
- [ ] Knowledge Base search endpoint (full-text on title, content, tags)

### Frontend
- [ ] AI Hub landing page with copilot selector cards
- [ ] Copilot chat page (reusable, driven by copilot type)
- [ ] Knowledge Base page (browse, search, upload)
- [ ] Sidebar: AI section with all copilot links

### Integration
- [ ] Docker rebuild + restart
- [ ] Verify all 8 copilots respond via `/api/ai/copilots/:type/chat`
