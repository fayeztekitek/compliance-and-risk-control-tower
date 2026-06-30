# Sprint 7 — Testing Strategy (Phase 14)

**Goal:** Comprehensive test coverage

## Tasks

### Unit Tests (Vitest)
- [ ] All services under `backend/src/services/`
- [ ] All repositories under `backend/src/repositories/`
- [ ] All routes (request validation, error handling)
- [ ] AI prompt evaluator service

### Integration Tests (Supertest + Test DB)
- [ ] API endpoints with isolated test database
- [ ] Auth flow (register, login, refresh, logout)
- [ ] Dashboard endpoints
- [ ] AI endpoints
- [ ] CRUD endpoints per entity

### E2E Tests (Playwright)
- [ ] Login → Dashboard → Filter → Export CSV
- [ ] Login → VEG workspace → Create deal
- [ ] Login → AI Hub → Chat → View response

### Performance Tests (k6)
- [ ] Dashboard endpoints under load
- [ ] Search endpoint
- [ ] Chat endpoint

### Security Tests
- [ ] Auth bypass checks (no token, expired token, wrong role)
- [ ] SQL injection probes
- [ ] XSS checks on input fields

### AI Prompt Tests
- [ ] Response format validation (JSON schema)
- [ ] Hallucination detection (known facts check)
- [ ] Latency budget enforcement

### Accessibility Tests
- [ ] axe-core scan on all pages
- [ ] Keyboard navigation audit
- [ ] Color contrast check

### CI
- [ ] GitHub Actions workflow: lint → unit → integration → e2e
