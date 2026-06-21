# Current Sprint: Sprint 7 — Production Hardening & OpenAPI

**Status:** `IN PROGRESS`  
**Started:** 2026-06-21  
**Branch:** sprint-7

---

## Backlog

### Done
- [x] OpenAPI/Swagger setup with swagger-jsdoc + swagger-ui-express
- [x] JSDoc annotations on all route files (auth, veg, security, project, nexus, dashboard, export)
- [x] Swagger UI served at `GET /api/docs`
- [x] Request body size limit (1mb) — already in place
- [x] Security headers via Helmet — already in place
- [x] CORS whitelist — already in place
- [x] Structured JSON logging via Pino — already in place
- [x] Request logging middleware — already in place
- [x] Health check endpoint — already in place
- [x] Error standardization (AppError + errorMiddleware) — already in place

### Pending
- [ ] Rate limiting middleware (express-rate-limit)
- [ ] Graceful shutdown handler (SIGTERM)
- [ ] npm audit — fix low severity vulnerability
- [ ] Generate TypeScript client from OpenAPI spec
- [ ] Replace manual API client with generated client
- [ ] Executive Dashboard frontend page (KPI grid, heatmap, charts)
- [ ] Export buttons (CSV + PDF) in frontend
- [ ] Error boundaries, loading states, empty states, toast notifications
- [ ] E2E tests (Playwright)
- [ ] Sprint 7 unit/integration/functional tests

## Previous Sprint Reports

| Sprint | Status | Report |
|--------|--------|--------|
| Sprint 0 | ✅ | — |
| Sprint 1 | ✅ | — |
| Sprint 2 | ✅ | `sprints/sprint-2-completed.md` |
| Sprint 3 | ✅ | `sprints/sprint-3-completed.md` |
| Sprint 4 | ✅ | `sprints/sprint-4-completed.md` |
| Sprint 5 | ✅ | `sprints/sprint-5-completed.md` |
| Sprint 6 | ✅ | `sprints/sprint-6-completed.md` |

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | fayez.tekitek@vermeg.com | admin123! |
| COMPLIANCE_OFFICER | amandine.rousset@vermeg.com | compliance123! |
| RISK_MANAGER | m.dubois@vermeg.com | risk123! |
| SECURITY_MANAGER | t.lemaire@vermeg.com | security123! |
| PRODUCT_OWNER | s.laroche@vermeg.com | product123! |
| AUDITOR | j.mercer@vermeg.com | auditor123! |
| EXECUTIVE_READ_ONLY | jp.v@vermeg.com | exec123! |
