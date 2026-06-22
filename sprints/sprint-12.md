# Sprint 12: Multi-Scanner Adapters

**Status:** 📋 Planned  
**Branch:** `sprint-12-multi-scanner`  
**Goal:** Extend unified findings beyond Nexus IQ. Add Fortify SSC adapter, SonarQube webhook handler, and Veracode adapter with full sync pipelines.

---

## Tasks

### ScannerHttpClient Base
- [ ] `scannerHttpClient.ts` — shared HTTP client with retry/backoff, rate limiting, token masking, connection testing
- [ ] Unit tests for base client

### Fortify SSC Adapter
- [ ] `fortifyHttpClient.ts` — REST client for Fortify SSC API (projects, artifact versions, vulnerabilities)
- [ ] `fortifyAdapter.ts` — map priority 1–5 → unified severity, extract CWE/file/line/PII
- [ ] `fortifySyncService.ts` — BullMQ worker `fortify-sync`, 6h poll, batch upsert
- [ ] `fortify.routes.ts` — sync status/trigger endpoints
- [ ] Unit tests for adapter mapping
- [ ] Register in `app.ts`

### SonarQube Webhook Handler
- [ ] `POST /api/sonarqube/webhook` route with secret validation
- [ ] `sonarqubeAdapter.ts` — map BLOCKER/CRITICAL/MAJOR/MINOR/INFO → severity, detect GDPR rules
- [ ] `sonarqubePollService.ts` — optional BullMQ worker for hotspot polling
- [ ] `sonarqube.routes.ts` — webhook + status endpoints
- [ ] Unit tests for adapter
- [ ] Register in `app.ts`

### Veracode Adapter
- [ ] `veracodeHttpClient.ts` — HMAC-authenticated REST client
- [ ] `veracodeAdapter.ts` — map Veracode severities (VERY_HIGH/HIGH/MEDIUM/LOW/VERY_LOW)
- [ ] `veracodeSyncService.ts` — BullMQ worker `veracode-sync`, configurable interval
- [ ] `veracode.routes.ts` — sync status/trigger endpoints
- [ ] Unit tests for adapter
- [ ] Register in `app.ts`

### Migration
- [ ] Migration 024: Add FORTIFY, SONARQUBE, VERACODE to `finding_source` enum

---

## Deliverables

- [ ] Fortify sync can connect, ingest, and store findings in unified_findings
- [ ] SonarQube webhook accepts payloads and creates findings
- [ ] Veracode sync functional with HMAC auth
- [ ] All 3 new source_tool values queryable in unified_findings
- [ ] Cross-tool summary shows findings from all sources

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 8 | ScannerHttpClient, Fortify adapter, SonarQube adapter, Veracode adapter, sync services |
| Backend Integration | 2 | SonarQube webhook, Fortify sync |
| Migration | 1 | Enum value verification |
| Regression | ~214 | All Sprint 1–11 tests |

---

## Branch Strategy

```
git checkout -b sprint-12-multi-scanner
# ... develop ...
git checkout main
git merge sprint-12-multi-scanner
```
