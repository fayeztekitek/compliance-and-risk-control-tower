# Sprint 8 — DevOps & Deployment (Phase 15)

**Goal:** Production-grade deployment

## Tasks

### Docker
- [ ] Multi-stage builds (dev vs production)
- [ ] Healthcheck endpoints for all services
- [ ] Non-root user in containers
- [ ] Docker Compose production profile

### Kubernetes
- [ ] Manifests: deployments, services, ingresses, configmaps, secrets
- [ ] Kustomize overlays (dev, staging, prod)
- [ ] Horizontal pod autoscaling

### CI/CD (GitHub Actions)
- [ ] CI: lint → test → build → Docker push
- [ ] CD: deploy to K8s cluster
- [ ] DB migration step in pipeline

### Monitoring
- [ ] Prometheus metrics endpoint (`/api/metrics`)
- [ ] Grafana dashboard (request rate, error rate, latency, DB pool, Redis)
- [ ] Alert rules (high error rate, down services)

### Logging
- [ ] Structured JSON logs (all services)
- [ ] Loki log aggregation
- [ ] Log retention policy

### Backup & DR
- [ ] pg_dump cron job → S3 upload
- [ ] Restore procedure documentation
- [ ] RTO/RPO targets defined

### Infrastructure as Code
- [ ] Terraform: VPC, RDS, EKS, Redis, S3
- [ ] Terraform: DNS, SSL certificates, WAF

### Security
- [ ] Secrets management (AWS Secrets Manager or HashiCorp Vault)
- [ ] Network policies (K8s NetworkPolicy)
- [ ] Regular dependency scanning (Dependabot)
