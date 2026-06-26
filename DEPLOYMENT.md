# Deployment Guide

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Browser     │────▶│  nginx       │────▶│  API (Node.js)   │
│  :5173       │     │  (frontend)  │     │  :3000           │
└─────────────┘     └──────────────┘     └───────┬──────────┘
                                                  │
                                    ┌─────────────┴──────────┐
                                    │                        │
                              ┌─────▼─────┐           ┌──────▼───┐
                              │ PostgreSQL │           │  Redis   │
                              │  :5432     │           │  :6379   │
                              └───────────┘           └──────────┘
```

- **Frontend**: Nginx serves the built SPA + proxies `/api/*` to the backend
- **API**: Node.js (Express) compiled with esbuild, runs migrations on startup
- **Database**: PostgreSQL 16 with volume persistence
- **Cache**: Redis 7 for sessions and job queues
- **Nexus IQ**: External dependency at `soft-security:8070` (resolved via `extra_hosts`)

---

## Quick Start (Development)

```bash
# Start all services
docker compose up -d --build

# View logs
docker compose logs -f api frontend
```

The app is available at `http://localhost:5173`.

> The dev compose mounts source code as volumes and uses `tsx watch` for hot reload.

---

## Production Deployment

### Option 1: Local Build (no registry)

```bash
# Build and run using production Dockerfiles
docker compose -f docker-compose.prod.yml up -d --build
```

The frontend is served by Nginx on `http://localhost:5173`.

### Option 2: GitOps with GitHub Container Registry (recommended)

#### Prerequisites

1. A server with Docker and Git installed
2. GitHub account with access to this repository
3. The following secrets configured in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key |
| `DEPLOY_PORT` | SSH port (default 22) |
| `DEPLOY_PATH` | Path to project on server (e.g. `/opt/compliance-tower`) |
| `JWT_SECRET` | (Optional) JWT signing secret |
| `CORS_ORIGIN` | (Optional) Allowed CORS origin |

#### Setup on the server

```bash
# Clone the repository
git clone https://github.com/fayeztekitek/compliance-and-risk-control-tower.git /opt/compliance-tower
cd /opt/compliance-tower

# Configure environment
cp docker-compose.prod.yml docker-compose.yml  # or create a .env file

# Set extra_hosts for Nexus IQ if needed
# Edit docker-compose.prod.yml and set soft-security to your Nexus IQ IP

# Grant docker permissions
sudo usermod -aG docker $USER
```

#### Workflow

On every push to `main`, GitHub Actions:
1. Builds backend and frontend images
2. Pushes them to `ghcr.io` (GitHub Container Registry)
3. SSHes into the server
4. Pulls the new images
5. Restarts services with `docker compose up -d`

### Option 3: Self-Hosted GitHub Runner

For environments without SSH access, install a self-hosted runner:

```bash
# On the deployment server
mkdir /opt/actions-runner && cd /opt/actions-runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-linux-x64-2.*.tar.gz
tar xzf actions-runner.tar.gz
./config.sh --url https://github.com/fayeztekitek/compliance-and-risk-control-tower --token <REGISTRATION_TOKEN>
sudo ./svc.sh install && sudo ./svc.sh start
```

Then the deploy job runs natively on the server without SSH.

---

## Configuration

### Environment Variables

Set these in `docker-compose.prod.yml` under the `api` service:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime mode |
| `PORT` | `3000` | API port |
| `DB_HOST` | `postgres` | PostgreSQL hostname |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `compliance_tower` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | `prod-secret-change-me` | **Change this in production** |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` | Allow self-signed certs for Nexus IQ |

### Nexus IQ Connection

Add the following `extra_hosts` to the `api` service in `docker-compose.prod.yml`:

```yaml
extra_hosts:
  - "soft-security:<NEXUS_IQ_IP>"
```

Then connect via the Nexus Overview page in the UI.

---

## Health Checks

```bash
# API health
curl http://localhost:3000/api/health

# Postgres
docker exec ct-postgres pg_isready -U postgres

# Redis
docker exec ct-redis redis-cli ping
```

---

## Backup

```bash
# Backup PostgreSQL database
docker exec ct-postgres pg_dump -U postgres compliance_tower > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
cat backup.sql | docker exec -i ct-postgres psql -U postgres compliance_tower
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Dashboard shows "Not Connected to Nexus IQ" | No session token in localStorage | Go to Nexus Overview and connect |
| API request cancelled after 15s | Axios timeout (frontend) | Increased to 120s for live KPIs |
| `uv_spawn EPERM` | Backend tried to spawn process inside container | Start manually with `tsx` |
| `soft-security` not resolving | Missing `extra_hosts` in compose | Add `soft-security:<IP>` to api service |
