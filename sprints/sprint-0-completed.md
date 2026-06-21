# Sprint 0: Foundation & Infrastructure — COMPLETED

**Completed:** 2026-06-21
**Duration:** 1 day (scaffolding phase)
**Status:** ✅ COMPLETED

---

## Summary

Sprint 0 established the complete project foundation for the Compliance & Risk Control Tower. The architecture was split into `backend/` and `frontend/` directories with proper separation of concerns. All database schemas were designed as SQL migration files covering 10 domains (users, VEG governance, security, projects, roadmaps, SaaS/privacy, audits, committees, KPIs, Nexus IQ). Docker Compose orchestrates all services. CI/CD pipeline via GitHub Actions is ready.

---

## Tasks Completed

- [x] Backend Express + TypeScript scaffold with layered architecture
- [x] Pino logger, Helmet, CORS middleware configured
- [x] PostgreSQL connection pool with `node-postgres`
- [x] 9 database migration SQL files (up + down) + 1 init migration
- [x] Docker Compose (postgres, redis, api, frontend)
- [x] Backend + Frontend Dockerfiles (multi-stage)
- [x] GitHub Actions CI/CD pipeline
- [x] Frontend scaffold: Vite, React Router, TanStack Query, Zustand, Axios
- [x] Vitest + Testing Library configured on both sides
- [x] 17 passing tests (13 backend + 4 frontend)

---

## Deliverables

| Deliverable | Status |
|-------------|--------|
| `docker compose up` starts all services | ✅ |
| Database health check passes | ✅ |
| CI pipeline passes lint/typecheck/test/build | ✅ |
| Frontend dev server launches on port 5173 | ✅ |
| Backend dev server launches on port 3000 | ✅ |

---

## Tests

| Type | Count | Passing |
|------|-------|---------|
| Unit (backend) | 10 | 10 |
| Functional (backend) | 3 | 3 |
| Unit (frontend) | 4 | 4 |
| **Total** | **17** | **17** |

---

## Key Decisions

1. **bcrypt → bcryptjs**: Pure JS implementation avoids native compilation issues on Windows
2. **BullMQ deferred**: Native `ioredis` dependencies conflict on Windows; BullMQ queuing will be added in Sprint 5 when background jobs are actually needed
3. **Down migrations provided**: All 9 migrations have corresponding `_down.sql` scripts for rollback
4. **Monorepo with `backend/` + `frontend/`**: Clear separation; shared types will be synced via OpenAPI in Sprint 7
5. **No `node-pg-migrate` config yet**: Migration runner config file created; actual runner setup deferred to Sprint 1 when auth endpoints need the database

---

## Next Sprint Prerequisites

- [x] Database schema ready for migration
- [x] Auth middleware structure ready
- [x] API client interceptors ready for JWT
- [x] Zustand store ready for auth state

---

## Retrospective Notes

- Adding `down` migrations at creation time saved future pain
- Docker Compose with health checks prevents race conditions between services
- The `&` in the directory path causes npm script resolution issues on Windows — CI (Linux) is fine
