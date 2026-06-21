# All Sprints Complete

**Status:** ✅ All 8 sprints completed  
**Final branch:** main

---

## Summary

| Sprint | Description | Tests |
|--------|-------------|-------|
| Sprint 0 | Foundation (Express, DB, Docker, CI, frontend scaffold) | 17 |
| Sprint 1 | Auth & RBAC (JWT, 7-role hierarchy, protected routes) | 33 |
| Sprint 2 | VEG Governance (CRUD, sign-offs, bid/gonogo, CRM sync) | 25 |
| Sprint 3 | Security Governance (vulns, waivers, SLA, scan import) | 29 |
| Sprint 4 | Projects, Roadmaps, SaaS, Audits, Committees | 27 |
| Sprint 5 | Nexus IQ & Background Jobs (BullMQ, risk scoring, sync) | 20 |
| Sprint 6 | Executive Dashboard & KPI Engine (16 KPIs, 4 KRIs, 5x5 heatmap) | 10 |
| Sprint 7 | Production Hardening & OpenAPI + Frontend UX + Dashboard page | 9 |
| **Total** | | **143+** |

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

## Known Issues
- Directory name `&` breaks npm script resolution on Windows (use full paths)
- `npm audit`: 1 low (esbuild in vitest, Windows only) ; 1 high (xlsx, client-side only)
- Git push may require retry on intermittent timeout
