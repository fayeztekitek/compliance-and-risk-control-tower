# Nexus IQ Report Drill-Down & Vulnerability Browser — Design Document

---

## 1. Nexus IQ REST API Analysis

### 1.1 Available Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v2/organizations` | GET | List all organizations |
| `/api/v2/applications` | GET | List all applications (filter by `?publicId=`) |
| `/api/v2/applications/organization/{orgId}` | GET | Applications by organization |
| `/api/v2/reports/applications/{applicationId}/history` | GET | Scan report history for an app (uses **internal** application `id`) |
| `/api/v2/applications/{publicId}/reports/{reportId}/policy` | GET | Policy violations for a specific scan (uses **publicId**) |
| `/api/v2/applications/{publicId}/reports/{reportId}` | GET | Raw component data for a specific scan |
| `/api/v2/policyViolations?p={policyId}&type=active\|waived\|legacy` | GET | Cross-report active violations (non-fixed only) |
| `/api/v2/applications/{publicId}/reports/policyViolations/diff` | GET | Compare violations between two **SCM commits** |

### 1.2 Critical Limitations

#### Limitation 1: No report-to-report comparison API
The diff endpoint (`policyViolations/diff`) requires `?fromCommit=` and `?toCommit=` git commit hashes. It **cannot** compare two arbitrary scan reports by report ID. This means we must implement comparison at the application layer.

#### Limitation 2: Only active (non-fixed) violations via standard API
The `policyViolations` endpoint only returns violations that have **not** been fixed. Historical violations (previously open, now fixed) cannot be retrieved from this endpoint. They only appear in the per-scan component report (`.../reports/{reportId}/policy`), which includes **all** violation states at the time of that scan.

#### Limitation 3: No pagination
No v2 endpoint supports `?page=` or `?limit=` parameters. For organizations with many applications/reports, responses can be large.

#### Limitation 4: Inconsistent ID usage
- Reports history endpoint uses **internal** application `id` (UUID)
- Violations endpoint uses **publicId** (human-readable, e.g., `MyApp-1234`)
- Must track both IDs to call both endpoints

#### Limitation 5: Report metadata is sparse
The history endpoint returns: `stage`, `evaluationDate`, `reportHtmlUrl`, `embeddableReportHtmlUrl`, `reportPdfUrl`, `reportDataUrl`, `reportTitle`, `commitHash`, `initiator`. It does **not** include:
- Policy evaluation status (pass/fail/warn)
- Total/affected component counts
- Severity breakdown
These must be computed from the per-scan policy violations endpoint.

### 1.3 Threat Level / Severity System

| Threat Level Range | Category | Policy Name Pattern |
|---|---|---|
| 9–10 | Critical | `Security-Critical` |
| 7–8 | High | `Security-High` |
| 4–6 | Medium | `Security-Medium` |
| 1–3 | Low | `Security-Low` |

### 1.4 Report History Response Shape

```json
[{
  "stage": "build",
  "applicationId": "4537e6fe68c24dd5ac83efd97d4fc2f4",
  "evaluationDate": "2015-01-16T13:14:32.139-05:00",
  "reportHtmlUrl": "ui/links/application/MyApp/report/abc123",
  "embeddableReportHtmlUrl": "ui/links/application/MyApp/report/abc123/embeddable",
  "reportPdfUrl": "ui/links/application/MyApp/report/abc123/pdf",
  "reportDataUrl": "api/v2/applications/MyApp/reports/abc123",
  "reportTitle": "Build Report",
  "commitHash": "79d5810d5545dea1db31d32d17d1a98376775186",
  "initiator": "jenkins"
}]
```

### 1.5 Policy Violations per Scan Response Shape

```json
{
  "reportTime": 1552489658463,
  "reportTitle": "Build Report",
  "commitHash": "79d5810d5545dea1db31d32d17d1a98376775186",
  "initiator": "system",
  "application": {
    "id": "463ed0fa4ba14393ae4af264ab110bcf",
    "publicId": "account-storage",
    "name": "Account Storage",
    "organizationId": "6766a6b01bd64e01988e478a3f57b08c",
    "contactUserName": "test"
  },
  "components": [{
    "hash": "28c8b41e...",
    "componentIdentifier": {
      "format": "maven",
      "coordinates": {
        "artifactId": "commons-fileupload",
        "classifier": "",
        "extension": "jar",
        "groupId": "commons-fileupload",
        "version": "1.3.3"
      }
    },
    "proprietary": false,
    "matchState": "known",
    "pathnames": ["path/to/file.jar"],
    "licenseData": { ... },
    "securityData": {
      "securityIssues": [{
        "reference": "sonatype-2020-0103",
        "severity": 9.8,
        "status": "OPEN",
        "threatCategory": "critical",
        "url": "https://..."
      }]
    },
    "constraintViolations": [{
      "constraintId": "19011de2...",
      "constraintName": "CVSS >=7 and <10",
      "threatLevel": 8,
      "threatCategory": "security",
      "reasons": [{
        "reason": "Found security vulnerability sonatype-2020-0103...",
        "reference": {
          "type": "SECURITY_VULNERABILITY_REFID",
          "value": "sonatype-2020-0103"
        }
      }]
    }]
  }],
  "matchSummary": {
    "totalComponentCount": 50,
    "knownComponentCount": 45
  }
}
```

### 1.6 Diff Endpoint (commit-based only)

```
GET /api/v2/applications/{publicId}/reports/policyViolations/diff
  ?fromCommit={hashA}
  &toCommit={hashB}
  &includeViolationTimes=true
```

Response:
```json
{
  "addedViolations": [...],
  "removedViolations": [...],
  "sameViolations": [...]
}
```

Each violation in diff response is the same shape as in `policyViolations` endpoint.

---

## 2. Data Model Design

### 2.1 Strategy: Hybrid Live-Fetch + Local Cache

- **Live fetch**: Connect to Nexus IQ, fetch report history + violations on demand
- **Local cache**: Persist everything in DB so data survives session expiry (1h TTL on credential store)
- **Stale-while-revalidate**: Show cached data immediately, refresh in background

### 2.2 Schema Changes Required

#### Table: `nexus_scan_reports` — Add columns (new migration)

```sql
ALTER TABLE nexus_scan_reports
  ADD COLUMN IF NOT EXISTS report_title VARCHAR(500),
  ADD COLUMN IF NOT EXISTS commit_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS initiator VARCHAR(255),
  ADD COLUMN IF NOT EXISTS embeddable_report_html_url TEXT,
  ADD COLUMN IF NOT EXISTS report_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS report_data_url TEXT,
  ADD COLUMN IF NOT EXISTS total_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS policy_evaluation_status VARCHAR(50)
      DEFAULT 'UNKNOWN'
      CHECK (policy_evaluation_status IN ('OPEN', 'WAIVED', 'ALL_PASSED', 'UNKNOWN'));
```

#### Table: `nexus_scan_reports` — Add application_id as UUID FK

Currently `application_id` is VARCHAR(100) referencing `nexus_applications(application_id)` which is also VARCHAR. We keep this for backward compatibility but also need:

```sql
ALTER TABLE nexus_scan_reports
  ADD COLUMN IF NOT EXISTS application_uuid UUID REFERENCES nexus_applications(id) ON DELETE CASCADE;
```

#### Table: `nexus_policy_violations` — Add columns

```sql
ALTER TABLE nexus_policy_violations
  ADD COLUMN IF NOT EXISTS report_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS policy_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS constraint_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS component_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS component_format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS component_coordinates JSONB,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS security_issue_ref_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS security_issue_severity NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS cve_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS threat_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS open_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waive_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fix_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_waived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE;
```

#### Table: `nexus_components` — Add columns

```sql
ALTER TABLE nexus_components
  ADD COLUMN IF NOT EXISTS component_hash VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS coordinates JSONB,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_state VARCHAR(50);
```

#### Table: `nexus_organizations` — No changes needed (already has `organization_id`, `organization_name`)

#### Table: `nexus_applications` — No changes needed (already has `application_id`, `application_public_id`, `application_name`, `organization_id`, `business_criticality`)

### 2.3 New Indexes

```sql
CREATE INDEX idx_npv_report_id ON nexus_policy_violations(report_id);
CREATE INDEX idx_npv_component_hash ON nexus_policy_violations(component_hash);
CREATE INDEX idx_npv_policy_id ON nexus_policy_violations(policy_id);
CREATE INDEX idx_npv_security_ref ON nexus_policy_violations(security_issue_ref_id);
CREATE INDEX idx_nsr_app_uuid ON nexus_scan_reports(application_uuid);
CREATE INDEX idx_nsr_scan_date ON nexus_scan_reports(scan_date DESC);
CREATE INDEX idx_nc_hash ON nexus_components(component_hash);
```

### 2.4 Entity Relationship

```
nexus_organizations
  │  organization_id (PK, VARCHAR)
  │  organization_name
  │
  ├── nexus_applications
  │     application_id (PK, VARCHAR)
  │     application_public_id
  │     organization_id (FK → nexus_organizations)
  │     id (UUID, internal PK)
  │
  │     ├── nexus_scan_reports
  │     │     scan_id (PK, VARCHAR) — Nexus IQ report ID
  │     │     application_id (FK → nexus_applications)
  │     │     stage, scan_date, report_title, commit_hash, ...
  │     │     severity_counts (critical_count, high_count, ...)
  │     │
  │     │     └── nexus_policy_violations
  │     │           violation_id (PK, VARCHAR)
  │     │           report_id (FK → nexus_scan_reports)
  │     │           application_id (FK → nexus_applications)
  │     │           component_hash (FK → nexus_components)
  │     │           policy_id, policy_name, threat_level, ...
  │     │
  │     └── unified_findings (where source_tool = 'NEXUS')
  │           id (UUID)
  │           scan_id → nexus_scan_reports.scan_id
  │           application_id (UUID → nexus_applications.id)
  │           cve_id, cvss_score, component_name, ...
  │
  └── nexus_components
        component_hash (PK, VARCHAR)
        display_name, format, coordinates, ...
```

---

## 3. Backend API Endpoints

### 3.1 New Endpoints

#### `POST /api/nexus/reports/sync`

Sync all reports and violations for a single application into the local DB.

**Request:**
```json
{
  "sessionToken": "string",
  "applicationId": "string"          // Nexus IQ internal application ID
}
```

**Response:**
```json
{
  "data": {
    "application": { ... },
    "reportsSynced": 24,
    "violationsSynced": 352,
    "componentsSynced": 89
  }
}
```

**Logic:**
1. Fetch report history: `GET /api/v2/reports/applications/{applicationId}/history`
2. For each report, fetch policy violations: `GET /api/v2/applications/{publicId}/reports/{scanId}/policy`
3. Upsert each report into `nexus_scan_reports`
4. Upsert each violation into `nexus_policy_violations`
5. Upsert each component into `nexus_components`
6. Also upsert linked security issues into `unified_findings` where CVE is available
7. Compute and store severity counts per report

#### `GET /api/nexus/reports`

List stored reports for an application.

**Query:**
```
?applicationId={uuid|string}&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "scanId": "nexus-scan-id",
      "applicationId": "uuid",
      "stage": "build",
      "scanDate": "2026-06-24",
      "reportTitle": "Build Report",
      "commitHash": "abc123",
      "initiator": "jenkins",
      "totalViolations": 12,
      "criticalCount": 3,
      "highCount": 4,
      "mediumCount": 3,
      "lowCount": 2,
      "policyEvaluationStatus": "OPEN",
      "reportHtmlUrl": "ui/links/...",
      "totalComponents": 50,
      "affectedComponents": 8
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 20
}
```

#### `GET /api/nexus/reports/:id`

Get full report detail with metadata.

#### `GET /api/nexus/reports/:id/violations`

Get violations for a specific report.

**Query:**
```
?severity=critical,high&status=OPEN&page=1&limit=50
```

**Response:**
```json
{
  "data": [
    {
      "violationId": "nexus-violation-id",
      "policyId": "uuid",
      "policyName": "Security-Critical",
      "constraintName": "CVSS >= 9",
      "threatLevel": 9,
      "threatCategory": "security",
      "componentHash": "28c8b41e...",
      "displayName": "commons-fileupload:commons-fileupload:1.3.3",
      "componentFormat": "maven",
      "componentCoordinates": {
        "groupId": "commons-fileupload",
        "artifactId": "commons-fileupload",
        "version": "1.3.3"
      },
      "status": "OPEN",
      "openTime": "2026-01-15T10:00:00Z",
      "securityIssueRefId": "sonatype-2020-0103",
      "cveId": "CVE-2020-1234",
      "cvssScore": 9.8,
      "reason": "Found security vulnerability sonatype-2020-0103 with severity >= 9"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 50,
  "summary": {
    "critical": 3,
    "high": 4,
    "medium": 3,
    "low": 2
  }
}
```

#### `POST /api/nexus/reports/compare`

Compare two stored reports.

**Request:**
```json
{
  "reportIdA": "uuid",
  "reportIdB": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "reportA": { "id": "...", "scanDate": "2026-06-20", "stage": "build" },
    "reportB": { "id": "...", "scanDate": "2026-06-24", "stage": "build" },
    "addedViolations": [...],
    "removedViolations": [...],
    "sameViolations": [...],
    "summary": {
      "added": { "critical": 1, "high": 2, "medium": 0, "low": 0 },
      "removed": { "critical": 0, "high": 1, "medium": 1, "low": 0 },
      "same": { "critical": 2, "high": 3, "medium": 2, "low": 2 }
    }
  }
}
```

#### `GET /api/nexus/reports/:applicationId/evolution`

Get vulnerability evolution over time for an application.

**Query:**
```
?fromDate=2026-01-01&toDate=2026-06-24
```

**Response:**
```json
{
  "data": [
    {
      "scanDate": "2026-06-24",
      "reportId": "uuid",
      "stage": "build",
      "totalViolations": 12,
      "severityCounts": { "critical": 3, "high": 4, "medium": 3, "low": 2 },
      "componentChurn": {
        "newComponents": 5,
        "removedComponents": 2,
        "versionChanges": 3
      },
      "newViolations": 2,
      "fixedViolations": 1,
      "netChange": 1
    }
  ]
}
```

### 3.2 Modified Endpoints

#### `POST /api/nexus/reports/history` (existing)

Add optional `storeInDb` parameter. When `true`, upserts results into `nexus_scan_reports` before returning.

#### `POST /api/nexus/reports/violations` (existing)

Add optional `storeInDb` parameter. When `true`, upserts results into `nexus_policy_violations` and `nexus_components` before returning.

### 3.3 Session Management

All new endpoints require either:
- `sessionToken` in request body (for endpoints that may trigger live Nexus IQ fetches)
- Or read from stored DB data only (no sessionToken needed for `GET /api/nexus/reports` etc.)

---

## 4. Comparison Algorithm

Since Nexus IQ's native diff endpoint requires commit hashes (not report IDs), we implement comparison at the application layer:

```
function compareViolations(violationsA, violationsB):
  // Index violations by (componentHash, policyId) composite key
  indexA = indexBy(violationsA, v => `${v.componentHash}:${v.policyId}`)
  indexB = indexBy(violationsB, v => `${v.componentHash}:${v.policyId}`)

  added   = violationsB.filter(v => !indexA.has(key(v)))
  removed = violationsA.filter(v => !indexB.has(key(v)))
  same    = violationsA.filter(v => indexB.has(key(v)))
  // Within "same", also check if status changed
  statusChanged = same.filter(v => indexB.get(key(v)).status !== v.status)

  return { added, removed, same, statusChanged }
```

**Composite key rationale:**
- A violation is uniquely identified by **which component** + **which policy** it violates
- Using `componentHash + policyId` correctly matches the same violation across scans
- If the same component violates the same policy in both scans, it's "same" (even if other attributes like `constraintName` differ)

**Edge cases:**
- Version change: If `commons-fileupload:1.3.3` appears in Report A and `commons-fileupload:1.3.4` in Report B, the component hash will differ → treated as "removed + added" (component-level churn). The frontend should display this as an upgrade event.
- Waived state: If a violation exists in both reports but is waived in Report B but not in A, `statusChanged` captures this.

---

## 5. Evolution Tracking

### 5.1 Per-Scan Snapshot

On each sync, compute and store a denormalized snapshot:

```sql
CREATE TABLE nexus_evolution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id),
  report_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id),
  scan_date DATE NOT NULL,
  stage scan_stage,
  total_violations INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  total_components INTEGER DEFAULT 0,
  affected_components INTEGER DEFAULT 0,
  component_churn JSONB,    -- { "new": [...], "removed": [...], "versionChanged": [...] }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Churn Detection Algorithm

To detect component churn between consecutive reports A → B:

```
function detectChurn(reportA, reportB):
  hashA = set of component hashes in report A
  hashB = set of component hashes in report B

  newComponents       = hashB - hashA
  removedComponents   = hashA - hashB

  // Version changes: same artifactId+groupId but different version
  versionChanges = []
  for each component in reportA:
    match = find in reportB by (groupId, artifactId) match
    if match && match.version != component.version:
      versionChanges.push({
        component: component.displayName,
        fromVersion: component.version,
        toVersion: match.version
      })

  return { newComponents, removedComponents, versionChanges }
```

### 5.3 Evolution Query

```sql
-- Get violation evolution over time for an application
SELECT
  nes.scan_date,
  nes.stage,
  nes.total_violations,
  nes.critical_count,
  nes.high_count,
  nes.medium_count,
  nes.low_count,
  nes.component_churn,
  -- Calculate delta from previous report
  LAG(nes.total_violations) OVER (ORDER BY nes.scan_date) as prev_total,
  nes.total_violations - LAG(nes.total_violations) OVER (ORDER BY nes.scan_date) as net_change
FROM nexus_evolution_snapshots nes
WHERE nes.application_id = $1
  AND nes.scan_date BETWEEN $2 AND $3
ORDER BY nes.scan_date ASC;
```

---

## 6. Component-Level Churn

### 6.1 Data Flow

1. During sync, for each report, extract all component hashes from the policy violations response
2. Upsert into `nexus_components` with full metadata
3. Store the set of component hashes per report in `nexus_scan_reports` (new JSONB column `component_hashes TEXT[]`)
4. On evolution query, compare consecutive reports' component hash sets

### 6.2 New Column on `nexus_scan_reports`

```sql
ALTER TABLE nexus_scan_reports
  ADD COLUMN IF NOT EXISTS component_hashes TEXT[] DEFAULT '{}';
```

### 6.3 Component Impact Score

For each component, track across all reports for an application:

| Metric | Calculation |
|---|---|
| First seen | MIN(scan_date) across all reports for this app |
| Last seen | MAX(scan_date) |
| Reports affected | COUNT(DISTINCT report_id) |
| Vulnerability count | COUNT(DISTINCT violation_id) per component |
| Max severity | MAX(threat_level) |
| Version count | COUNT(DISTINCT version) over time |

```sql
CREATE TABLE nexus_component_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id),
  component_hash VARCHAR(255) REFERENCES nexus_components(component_hash),
  first_seen DATE NOT NULL,
  last_seen DATE NOT NULL,
  reports_affected INTEGER DEFAULT 0,
  violation_count INTEGER DEFAULT 0,
  max_threat_level INTEGER DEFAULT 0,
  versions_seen TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_app_component UNIQUE (application_id, component_hash)
);
```

---

## 7. Sync Workflow

### 7.1 Manual Sync (per application)

```
User clicks "Sync" button on application detail page
  → Frontend: POST /api/nexus/reports/sync { sessionToken, applicationId }
  → Backend:
      1. Validate sessionToken → decrypt credentials from CredentialStore
      2. Fetch application info from Nexus IQ (get publicId + orgId)
      3. Upsert organization into nexus_organizations
      4. Upsert application into nexus_applications
      5. Fetch report history from Nexus IQ
      6. FOR EACH report (LIMIT 50, configurable):
           a. Fetch policy violations from Nexus IQ
           b. Upsert report into nexus_scan_reports
           c. Upsert each violation into nexus_policy_violations
           d. Upsert each component into nexus_components
           e. Upsert linked security CVEs into unified_findings
           f. Compute severity counts and update report row
      7. Compute evolution snapshot (compare with previous report)
      8. Upsert into nexus_evolution_snapshots
      9. Return summary
  → Frontend: Show progress (X of Y reports synced)
```

### 7.2 Progress Reporting

Since sync can take time (e.g., 24 reports × network latency), the endpoint should:
1. Accept an optional `async` parameter
2. If `async: true`, enqueue a BullMQ job and return immediately with `jobId`
3. Frontend polls `GET /api/nexus/sync/status/:jobId` for progress
4. If `async: false` (default for now), block and return when done (with timeout)

### 7.3 Deduplication

All upserts use `ON CONFLICT` clauses:

```sql
-- nexus_scan_reports
INSERT INTO nexus_scan_reports (scan_id, ...)
VALUES (...)
ON CONFLICT (scan_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  scan_date = EXCLUDED.scan_date,
  total_violations = EXCLUDED.total_violations,
  updated_at = NOW();

-- nexus_policy_violations
INSERT INTO nexus_policy_violations (violation_id, ...)
VALUES (...)
ON CONFLICT (violation_id) DO UPDATE SET
  status = EXCLUDED.status,
  threat_level = EXCLUDED.threat_level,
  updated_at = NOW();

-- nexus_components
INSERT INTO nexus_components (component_hash, ...)
VALUES (...)
ON CONFLICT (component_hash) DO UPDATE SET
  latest_version = EXCLUDED.latest_version,
  updated_at = NOW();
```

---

## 8. Frontend Components

### 8.1 New Pages / Routes

| Route | Component | Purpose |
|---|---|---|
| `/nexus` | `NexusOverview` | Existing — orgs/apps grid |
| `/nexus/app/:id` | `NexusApplicationDetail` | Rewritten — tree view + reports list |
| `/nexus/app/:id/report/:reportId` | `ReportDetail` | NEW — report metadata + violation list |
| `/nexus/app/:id/report/:reportId/violations` | `ViolationList` | NEW — violations table with filters |
| `/nexus/app/:id/compare` | `ReportComparison` | NEW — side-by-side diff view |
| `/nexus/app/:id/evolution` | `EvolutionTimeline` | NEW — chart + timeline |

### 8.2 NexusApplicationDetail (rewritten)

```
┌─────────────────────────────────────────────┐
│ ← Back to Applications                      │
│                                             │
│ Account Storage                              │
│ Organization: Payment Systems                │
│ Total Reports: 24    Last Sync: 2m ago      │
│                                             │
│ [ Sync Now ]                                │
│                                             │
├─────────────────────────────────────────────┤
│ Reports (24)                                │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Jun 24, 2026  Build   2C 4H 3M 2L  ⚡  │ │
│ │                        12 violations   │ │
│ ├─────────────────────────────────────────┤ │
│ │ Jun 20, 2026  Build   2C 4H 3M 2L      │ │
│ │                        11 violations   │ │
│ ├─────────────────────────────────────────┤ │
│ │ Jun 15, 2026  Build   2C 3H 3M 2L      │ │
│ │                        10 violations   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Compare Selected ]                        │
│ [ View Evolution ]                          │
└─────────────────────────────────────────────┘
```

### 8.3 ReportDetail (new)

```
┌─────────────────────────────────────────────┐
│ ← Back to Application                       │
│                                             │
│ Build Report — Jun 24, 2026                 │
│ Stage: Build  |  Initiator: jenkins  |      │
│ Commit: 79d5810  |  [View in Nexus IQ ↗]    │
│                                             │
│ ┌─── Severity Summary ────────────────────┐ │
│ │  CRITICAL    HIGH     MEDIUM    LOW     │ │
│ │      3        4         3        2      │ │
│ │  [🔴 Red]   [🟠 Orng] [🟡 Yel] [🟢 Grn]│ │
│ │  Total: 12 violations across 8 components│
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─── Violations (12) ─────────────────────┐ │
│ │ [Filter: All | Open | Waived | Fixed]   │ │
│ │ [Severity: All | Critical | High | ...] │ │
│ │ [Search...                              ]│ │
│ │                                         │ │
│ │ ┌─────────────────────────────────────┐ │ │
│ │ │🔴 CRITICAL  commons-fileupload     │ │ │
│ │ │  CVE-2020-1234 (CVSS 9.8)          │ │ │
│ │ │  Policy: Security-Critical          │ │ │
│ │ │  Status: OPEN  |  Since: Jan 2026  │ │ │
│ │ │  [View Detail] [Waive]             │ │ │
│ │ ├─────────────────────────────────────┤ │ │
│ │ │🟠 HIGH       log4j-core:2.17.0     │ │ │
│ │ │  CVE-2021-44228 (CVSS 7.5)         │ │ │
│ │ │  Policy: Security-High             │ │ │
│ │ │  Status: WAIVED  |  Waived: Mar 2026 │ │
│ │ │  [View Detail]                     │ │ │
│ │ └─────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [ Compare with Previous Report ]             │
└─────────────────────────────────────────────┘
```

### 8.4 ReportComparison (new)

```
┌─────────────────────────────────────────────┐
│ ← Back                                      │
│                                             │
│ Compare: Jun 20  vs  Jun 24  2026           │
│                                             │
│ ┌─── Summary ────────────────────────────┐  │
│ │  Added: 1 critical, 1 high             │  │
│ │  Removed: 1 high, 1 medium              │  │
│ │  Same: 2 critical, 3 high, 2 medium    │  │
│ │  Status changed: 1 (OPEN → WAIVED)     │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─── Added (2) ──────────────────────────┐  │
│ │  🔴 CRITICAL  jackson-databind:2.13.0  │  │
│ │              CVE-2026-1234              │  │
│ │  🟠 HIGH      snakeyaml:1.30           │  │
│ │              CVE-2026-5678              │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─── Removed (2) ────────────────────────┐  │
│ │  🟠 HIGH      old-lib:1.0 (fixed)       │  │
│ │  🟡 MEDIUM    deprecated-lib:2.0        │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─── Same (7) ───────────────────────────┐  │
│ │  🔴 CRITICAL  commons-fileupload (OPEN) │  │
│ │  🟠 HIGH      log4j (WAIVED)            │  │
│ │  ...                                    │  │
│ └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 8.5 EvolutionTimeline (new)

```
┌─────────────────────────────────────────────┐
│ ← Back                                      │
│                                             │
│ Vulnerability Evolution — Account Storage    │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  [Bar chart: violations over time]      │ │
│ │                                        │ │
│ │  Critical ■■■■ 4                       │ │
│ │  High     ■■■■■ 5                      │ │
│ │  Medium   ■■■■ 4                       │ │
│ │  Low      ■■■ 3                        │ │
│ │                                        │ │
│ │  ───┬───┬───┬───┬───┬───┬───┬───┬───  │ │
│ │  Jan Feb Mar Apr May Jun Jul Aug Sep   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─── Component Churn ────────────────────┐ │
│ │  New: jackson-databind (+1 CRITICAL)   │ │
│ │  Removed: old-lib (fixed -1 HIGH)      │ │
│ │  Upgraded: log4j 2.16 → 2.17           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─── Report Timeline ────────────────────┐ │
│ │  [Clickable list of all reports with   │ │
│ │   net change indicator per row]        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 8.6 API Client Methods (new)

```typescript
// nexus.api.ts — new methods
syncReports(sessionToken: string, applicationId: string): Promise<SyncResult>
getReports(applicationId: string, params: PageParams): Promise<PaginatedResponse<ScanReport>>
getReport(reportId: string): Promise<ReportDetail>
getReportViolations(reportId: string, params: FilterParams): Promise<PaginatedViolations>
compareReports(reportIdA: string, reportIdB: string): Promise<ComparisonResult>
getEvolution(applicationId: string, params: DateRange): Promise<EvolutionPoint[]>
```

### 8.7 Query Hooks (new)

```typescript
// hooks/useNexusReports.ts
useSyncReports(sessionToken, applicationId)
useStoredReports(applicationId, page, limit)
useStoredReport(reportId)
useReportViolations(reportId, filters)
useReportComparison(reportIdA, reportIdB)
useEvolution(applicationId, dateRange)
```

---

## 9. Migration Plan

### Migration `029_nexus_report_enhancements.sql`

```sql
-- ============================================================================
-- Migration 029: Nexus Report Drill-Down Enhancements
-- Adds columns to nexus_scan_reports, nexus_policy_violations, nexus_components
-- and creates new tables for evolution tracking and component impact.
-- ============================================================================

BEGIN;

-- ==============================
-- 1. Enhance nexus_scan_reports
-- ==============================
ALTER TABLE nexus_scan_reports
  ADD COLUMN IF NOT EXISTS report_title VARCHAR(500),
  ADD COLUMN IF NOT EXISTS commit_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS initiator VARCHAR(255),
  ADD COLUMN IF NOT EXISTS embeddable_report_html_url TEXT,
  ADD COLUMN IF NOT EXISTS report_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS report_data_url TEXT,
  ADD COLUMN IF NOT EXISTS total_violations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS policy_evaluation_status VARCHAR(50)
      DEFAULT 'UNKNOWN'
      CHECK (policy_evaluation_status IN ('OPEN', 'WAIVED', 'ALL_PASSED', 'UNKNOWN')),
  ADD COLUMN IF NOT EXISTS application_uuid UUID REFERENCES nexus_applications(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS component_hashes TEXT[] DEFAULT '{}';

-- ==============================
-- 2. Enhance nexus_policy_violations
-- ==============================
ALTER TABLE nexus_policy_violations
  ADD COLUMN IF NOT EXISTS report_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS policy_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS constraint_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS component_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS component_format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS component_coordinates JSONB,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_state VARCHAR(50),
  ADD COLUMN IF NOT EXISTS security_issue_ref_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS security_issue_severity NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS cve_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS threat_category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS open_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waive_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fix_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_waived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE;

-- ==============================
-- 3. Enhance nexus_components
-- ==============================
ALTER TABLE nexus_components
  ADD COLUMN IF NOT EXISTS component_hash VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS coordinates JSONB,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(500),
  ADD COLUMN IF NOT EXISTS proprietary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS match_state VARCHAR(50);

-- ==============================
-- 4. Evolution snapshots table
-- ==============================
CREATE TABLE IF NOT EXISTS nexus_evolution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  report_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE,
  scan_date DATE NOT NULL,
  stage scan_stage,
  total_violations INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  total_components INTEGER DEFAULT 0,
  affected_components INTEGER DEFAULT 0,
  component_churn JSONB,
  new_violations INTEGER DEFAULT 0,
  fixed_violations INTEGER DEFAULT 0,
  CONSTRAINT uq_evolution_report UNIQUE (report_id)
);

-- ==============================
-- 5. Component impact table
-- ==============================
CREATE TABLE IF NOT EXISTS nexus_component_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
  component_hash VARCHAR(255) REFERENCES nexus_components(component_hash) ON DELETE CASCADE,
  first_seen DATE NOT NULL,
  last_seen DATE NOT NULL,
  reports_affected INTEGER DEFAULT 0,
  violation_count INTEGER DEFAULT 0,
  max_threat_level INTEGER DEFAULT 0,
  versions_seen TEXT[] DEFAULT '{}',
  CONSTRAINT uq_app_component UNIQUE (application_id, component_hash)
);

-- ==============================
-- 6. New indexes
-- ==============================
CREATE INDEX IF NOT EXISTS idx_npv_report_id ON nexus_policy_violations(report_id);
CREATE INDEX IF NOT EXISTS idx_npv_component_hash ON nexus_policy_violations(component_hash);
CREATE INDEX IF NOT EXISTS idx_npv_policy_id ON nexus_policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_npv_cve_id ON nexus_policy_violations(cve_id);
CREATE INDEX IF NOT EXISTS idx_nsr_app_uuid ON nexus_scan_reports(application_uuid);
CREATE INDEX IF NOT EXISTS idx_nsr_scan_date ON nexus_scan_reports(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_nc_hash ON nexus_components(component_hash);
CREATE INDEX IF NOT EXISTS idx_nes_app_date ON nexus_evolution_snapshots(application_id, scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_nci_app_hash ON nexus_component_impact(application_id, component_hash);

-- ==============================
-- 7. Triggers
-- ==============================
DROP TRIGGER IF EXISTS update_nexus_evolution_snapshots_updated_at ON nexus_evolution_snapshots;
CREATE TRIGGER update_nexus_evolution_snapshots_updated_at
  BEFORE UPDATE ON nexus_evolution_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_nexus_component_impact_updated_at ON nexus_component_impact;
CREATE TRIGGER update_nexus_component_impact_updated_at
  BEFORE UPDATE ON nexus_component_impact
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

COMMIT;
```

---

## 10. Implementation Order

| Step | Description | Est. Effort |
|---|---|---|
| 1 | Migration 029 — run SQL to add columns + new tables | 1h |
| 2 | Backend service: `NexusReportService` — sync, read, compare, evolution | 4h |
| 3 | Backend routes: new endpoints for reports, violations, compare, evolution | 2h |
| 4 | Backend: integrate sync into existing `POST /reports/history` and `POST /reports/violations` | 1h |
| 5 | Frontend API client: add new methods + types | 1h |
| 6 | Frontend: rewrite `NexusApplicationDetail` with tree view | 3h |
| 7 | Frontend: `ReportDetail` page with violation list + filters | 3h |
| 8 | Frontend: `ReportComparison` page (diff view) | 2h |
| 9 | Frontend: `EvolutionTimeline` page (chart + churn) | 2h |
| 10 | E2E tests for the new flows | 2h |
| **Total** | | **21h** |

---

## 11. Summary of Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Comparison method** | Application-layer via `componentHash:policyId` composite key | Nexus IQ diff API requires commit hashes, not report IDs |
| **Sync model** | Manual per-app (async optional via BullMQ later) | Requested by user; simpler to implement first |
| **Violation uniqueness** | `componentHash + policyId` | Correctly identifies same violation across scans |
| **Severity thresholds** | Critical ≥8, High 5-7, Medium 3-4, Low <3 | Matches Nexus IQ policy threat levels |
| **Stored vs live** | Hybrid: sync to DB, then read from DB | Session token expires in 1h; DB provides persistence |
| **Evolution tracking** | Per-scan snapshot in `nexus_evolution_snapshots` | Denormalized for fast queries; avoids complex joins |
| **Component churn** | Hash-set diff between consecutive reports | Simple and efficient; detects adds, removes, and version changes |
| **ID reference** | Track both internal UUID and Nexus IQ VARCHAR IDs | Nexus IQ endpoints use different ID types inconsistently |
