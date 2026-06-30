# Sprint 5 — Knowledge Base & RAG (Phase 12)

**Goal:** Full RAG pipeline with document indexing

## Tasks

### Backend
- [ ] Document upload API (PDF, DOCX, TXT, MD) with file validation
- [ ] Document chunking service (paragraph/section splitting)
- [ ] Embedding generation (Gemini embedding API or local model)
- [ ] pgvector extension + vector storage table
- [ ] Similarity search query service
- [ ] RAG chat pipeline: retrieve chunks → Gemini completion
- [ ] Document categories CRUD

### Frontend
- [ ] Knowledge Base page (browse by category, search, upload)
- [ ] Document viewer (rendered content with highlight on search hits)
- [ ] Upload modal with drag-drop, progress bar
- [ ] Category filter + tag filter

### Integration
- [ ] Docker rebuild + restart (add pgvector extension)
- [ ] Verify upload + search + RAG answer accuracy
