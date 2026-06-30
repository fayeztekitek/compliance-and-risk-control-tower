# Sprint 2 — Context-Aware Chatbot (Phase 9)

**Goal:** Floating assistant on every page, page-aware

## Tasks

### Backend
- [ ] Context-aware chat endpoint: receives page type, entity IDs, filters
- [ ] SSE streaming for responses
- [ ] Conversation history CRUD (save, list, delete, resume)
- [ ] Quick action templates per page type

### Frontend
- [ ] Chatbot widget component (fixed bottom-right, expandable/collapsible)
- [ ] Page context provider (detects route, dashboard filters, selected item)
- [ ] Quick action buttons per page type
- [ ] Conversation history panel (recent chats, resume)
- [ ] Badge unread count on widget

### Integration
- [ ] Docker rebuild + restart
- [ ] Verify chatbot visible on all pages
