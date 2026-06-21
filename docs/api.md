# Compliance & Risk Control Tower — API Reference

The API documentation is available interactively via Swagger UI when the backend is running:

> **http://localhost:3000/api/docs**

This reference provides an overview of all API endpoints, grouped by module.

---

## Base URL

All endpoints are prefixed with `/api`:

```
http://localhost:3000/api
```

---

## Authentication

Most endpoints require a Bearer JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Obtain a Token

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "fayez.tekitek@vermeg.com",
  "password": "admin123!"
}

Response 200:
{
  "data": {
    "token": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "ADMIN" }
  }
}
```

### Refresh Token

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}

Response 200:
{
  "token": "eyJhbGci..."
}
```

### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>

Response 200:
{
  "data": { "id": "...", "name": "...", "email": "...", "role": "ADMIN" }
}
```

### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@vermeg.com",
  "password": "securePassword123!",
  "role": "AUDITOR"
}

Response 201:
{
  "data": { "id": "...", "name": "...", "email": "...", "role": "AUDITOR" }
}
```

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>

Response 200:
{
  "data": { "success": true }
}
```

---

## Endpoint Index

| Module | Base Path | Auth | Description |
|--------|-----------|------|-------------|
| Health | `GET /api/health` | No | Service health check |
| Auth | `POST /api/auth/*` | Varies | Authentication & registration |
| VEG | `GET/POST/PATCH/DELETE /api/veg/*` | JWT | Vendor governance requests |
| Security | `GET/POST/PATCH/DELETE /api/security/*` | JWT | Vulnerabilities, waivers, SLA |
| Projects | `GET/POST/PATCH/DELETE /api/projects/*` | JWT | Projects, roadmaps, SaaS, audits, committees |
| Nexus | `GET/POST/DELETE /api/nexus/*` | JWT | Nexus IQ integration & risk scoring |
| Dashboard | `GET /api/dashboard/*` | JWT | Executive KPIs, KRIs, heatmap, trends |
| Export | `GET /api/export/*` | JWT | CSV & PDF data export |
| Docs | `GET /api/docs` | No | Swagger UI (interactive docs) |

---

## Health

```
GET /api/health

Response 200:
{
  "status": "ok",
  "timestamp": "2026-06-21T12:00:00.000Z"
}
```

---

## VEG Governance (`/api/veg`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/veg` | List VEG requests (paginated, searchable) |
| POST | `/api/veg` | Create a new VEG request |
| GET | `/api/veg/:id` | Get VEG request by ID |
| PATCH | `/api/veg/:id` | Update VEG request |
| DELETE | `/api/veg/:id` | Delete VEG request |
| PATCH | `/api/veg/:id/signoff/:department` | Department sign-off (finance/sales/product/legal) |
| PATCH | `/api/veg/:id/bid` | Set bid decision (BID/NO_BID) |
| PATCH | `/api/veg/:id/gonogo` | Set go/no-go decision (GO/NO_GO) |
| POST | `/api/veg/:id/opportunities` | Add opportunity to VEG request |
| POST | `/api/veg/opportunities/:oppId/contracts` | Add contract to opportunity |
| POST | `/api/veg/batch-sync` | Batch sync VEG requests from CRM |

### Query Parameters (List)

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `status` | string | Filter by status |
| `type` | string | Filter by type |
| `client` | string | Filter by client name |
| `search` | string | Search in title and client |

---

## Security (`/api/security`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/security/vulnerabilities` | List vulnerabilities |
| POST | `/api/security/vulnerabilities` | Create vulnerability |
| GET | `/api/security/vulnerabilities/:id` | Get vulnerability by ID |
| PATCH | `/api/security/vulnerabilities/:id` | Update vulnerability |
| POST | `/api/security/vulnerabilities/:id/false-positive` | Mark as false positive |
| GET | `/api/security/waivers` | List waivers |
| POST | `/api/security/waivers` | Create waiver request |
| PATCH | `/api/security/waivers/:id/approve` | Approve waiver |
| PATCH | `/api/security/waivers/:id/reject` | Reject waiver |
| GET | `/api/security/risk-acceptances` | List risk acceptances |
| POST | `/api/security/risk-acceptances` | Create risk acceptance |
| PATCH | `/api/security/risk-acceptances/:id/approve` | Approve risk acceptance |
| GET | `/api/security/sla-incidents` | List SLA incidents |
| POST | `/api/security/detect-sla-breaches` | Detect SLA breaches |
| POST | `/api/security/check-waiver-expiry` | Check/auto-expire waivers |
| POST | `/api/security/import/scan` | Import scan results (JSON array) |

---

## Projects (`/api/projects`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project by ID |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/roadmaps` | List project roadmaps |
| POST | `/api/projects/:id/roadmaps` | Create roadmap |
| GET | `/api/projects/:id/rtd` | List RTD submissions |
| POST | `/api/projects/:id/rtd` | Submit RTD declaration |
| GET | `/api/projects/:id/saas` | List SaaS applications for project |
| POST | `/api/projects/:id/saas` | Create SaaS application |
| GET | `/api/projects/:id/privacy` | List data processing inventory |
| POST | `/api/projects/:id/privacy` | Add data processing record |
| GET | `/api/projects/:id/readiness` | Get go-live readiness |
| POST | `/api/projects/:id/readiness` | Create go-live readiness assessment |
| GET | `/api/projects/:id/audits` | List audits for project |
| POST | `/api/projects/:id/audits` | Create audit |
| GET | `/api/audits/:id/findings` | List audit findings |
| POST | `/api/audits/:id/findings` | Create audit finding |
| GET | `/api/findings/:id/capa` | List CAPAs for finding |
| POST | `/api/findings/:id/capa` | Create corrective action |
| GET | `/api/obligations` | List contractual obligations |
| POST | `/api/obligations` | Create contractual obligation |
| PATCH | `/api/obligations/:id` | Update obligation |
| GET | `/api/committees` | List committees |
| POST | `/api/committees` | Create committee |
| PATCH | `/api/committees/:id` | Update committee |
| GET | `/api/committees/:id/agenda` | List committee agenda items |
| POST | `/api/committees/:id/agenda` | Add agenda item |
| GET | `/api/committees/:id/decisions` | List committee decisions |
| POST | `/api/committees/:id/decisions` | Record decision |

---

## Nexus IQ (`/api/nexus`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/nexus/config` | Get Nexus IQ configuration |
| POST | `/api/nexus/config` | Update configuration |
| POST | `/api/nexus/config/test` | Test connection |
| POST | `/api/nexus/sync` | Trigger synchronization |
| GET | `/api/nexus/sync/status` | Get sync status |
| GET | `/api/nexus/sync/logs` | Get sync logs |
| GET | `/api/nexus/products` | List products |
| GET | `/api/nexus/products/:id` | Get product detail |
| GET | `/api/nexus/products/:id/vulnerabilities` | List product vulnerabilities |
| GET | `/api/nexus/applications` | List applications |
| GET | `/api/nexus/waivers` | List waivers |
| POST | `/api/nexus/waivers` | Create waiver |
| GET | `/api/nexus/kpi/executive` | Get executive KPIs |
| GET | `/api/nexus/kpi/product/:id` | Get product KPIs |
| GET | `/api/nexus/risk-score/:productId` | Get product risk score |
| GET | `/api/nexus/jobs` | List background job status |

---

## Dashboard (`/api/dashboard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/executive` | Consolidated dashboard (all KPIs, KRIs, heatmap, trends, alerts) |
| GET | `/api/dashboard/kpi` | 16 KPI values |
| GET | `/api/dashboard/kri` | 4 KRI thresholds with status |
| GET | `/api/dashboard/heatmap` | 5x5 risk heatmap data |
| GET | `/api/dashboard/trends?months=12` | Monthly KPI trends |

---

## Export (`/api/export`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/export/csv?dataset=kpis` | Export dataset as CSV |
| GET | `/api/export/pdf?dataset=kpis` | Export dataset as PDF (HTML) |

### Dataset Options

| Value | Content |
|-------|---------|
| `kpis` | All 16 KPI values |
| `kris` | 4 KRI indicators |
| `vulnerabilities` | Full vulnerability list |
| `projects` | Project list |

---

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global | 100 requests | 1 minute |
| Auth endpoints | 10 requests | 1 minute |

Exceeded limits return `429 Too Many Requests`.

---

## Response Envelope

All responses follow a consistent envelope:

### Success
```json
{
  "data": <response_body>
}
```

### Paginated
```json
{
  "data": [<items>],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Error
```json
{
  "error": "Description of what went wrong",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Interactive Documentation

The full interactive API documentation with request/response schemas is available at:

> **http://localhost:3000/api/docs**

This provides:
- Complete endpoint listing with descriptions
- Request body schemas (JSON)
- Response schemas with example values
- Authentication testing (click "Authorize" and paste your token)
- Try-it-out functionality for all endpoints
