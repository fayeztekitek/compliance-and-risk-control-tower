# Sprint 12: Multi-Scanner Adapters

**Status:** ✅ Completed  
**Branch:** `sprint-12-multi-scanner` (merged to main)  
**Goal:** Extend unified findings beyond Nexus IQ. Add Fortify SSC adapter, SonarQube webhook handler, and Veracode adapter with full sync pipelines.

---

## Tasks

### ScannerHttpClient Base
- [x] `scannerHttpClient.ts` — shared HTTP client with retry/backoff, token masking, connection testing
- [x] Unit tests for base client

### Fortify SSC Adapter
- [x] `fortifyHttpClient.ts` — REST client for Fortify SSC API (projects, artifact versions, vulnerabilities)
- [x] `fortifyAdapter.ts` — map priority 1–5 → unified severity, extract CWE/file/line
- [x] `fortifySyncService.ts` — direct sync (worker-ready, no BullMQ dependency yet)
- [x] `fortify.routes.ts` — `POST /api/fortify/sync`, `POST /api/fortify/test`
- [x] Unit tests for adapter mapping
- [x] Register in `app.ts`

### SonarQube Webhook Handler
- [x] `POST /api/sonarqube/webhook` route (secret validation deferred to Sprint 14)
- [x] `sonarqubeAdapter.ts` — map BLOCKER/CRITICAL/MAJOR/MINOR/INFO → severity, filter resolved issues
- [x] `sonarqube.routes.ts` — webhook endpoint
- [x] Unit tests for adapter (mapping + webhook payload processing)
- [x] Register in `app.ts`

### Veracode Adapter
- [x] `veracodeHttpClient.ts` — REST client with token-based auth (HMAC-ready)
- [x] `veracodeAdapter.ts` — map numeric severity 0–5 → unified severity
- [x] `veracodeSyncService.ts` — direct sync, filters FIXED flaws
- [x] `veracode.routes.ts` — `POST /api/veracode/sync`, `POST /api/veracode/test`
- [x] Unit tests for adapter
- [x] Register in `app.ts`

### Migration
- [ ] (not needed — `finding_source` enum already had FORTIFY, SONARQUBE, VERACODE)

### Note
BullMQ workers (`fortify-sync`, `veracode-sync`, `sonarqube-poll`) deferred to Sprint 14 to avoid over-complicating the initial adapter layer. Direct sync via POST endpoints is functional for manual/CI triggers.

---

## Deliverables

- [x] Fortify sync can connect, ingest, and store findings in unified_findings
- [x] SonarQube webhook accepts payloads and creates findings (filters resolved)
- [x] Veracode sync functional with HTTP auth
- [x] All 3 scanners write to unified_findings with correct source_tool
- [x] 11 unit tests passing (beats the 8 planned)

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 11 | ScannerHttpClient (1), Fortify adapter (3), SonarQube adapter (4), Veracode adapter (3) |
| Regression | 221 | 32 files, 221 — 0 failures |

---

## Branch Strategy

```
git checkout -b sprint-12-multi-scanner
# ... develop ...
git checkout main
git merge sprint-12-multi-scanner
```
