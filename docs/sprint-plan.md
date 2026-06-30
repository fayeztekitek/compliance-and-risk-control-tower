# Sprint Plan — Phases 8-15 + Docs + Design System

## Sprint 1 — Complete AI Platform (Phase 8)
**Goal:** 8 copilots + Prompt Library + Knowledge Base CRUD
- Create 8 copilot services (Executive, Compliance, Security, Audit, Roadmap, VEG, Privacy, Reporting)
- Each copilot: Gemini prompt template + system instruction + domain data query
- Prompt Library: done (already built)
- Knowledge Base CRUD (documents table + API + search)
- Frontend: AI Hub landing page with copilot selector cards
- Sidebar: AI section with all copilot links

## Sprint 2 — Context-Aware Chatbot (Phase 9)
**Goal:** Floating assistant on every page, page-aware
- Chatbot widget component (fixed bottom-right, expandable)
- Page context provider: detects route, dashboard filters, selected item
- Backend: context-aware chat endpoint (page + filters + entity IDs)
- SSE streaming for responses
- Quick action buttons per page type
- Conversation history persist/recall

## Sprint 3 — Autonomous AI Agents (Phase 10)
**Goal:** 9 agents with tools, memory, autonomous workflows
- 6 remaining agents: Executive, Security, Audit, Roadmap, Privacy, Reporting
- Agent memory store (Redis-based conversation + state)
- Agent scheduler (cron-based autonomous runs)
- Agent recommendations table + notification on trigger
- Frontend: Agent dashboard showing status, runs, recommendations

## Sprint 4 — MCP Integration Layer (Phase 11)
**Goal:** Unified connector framework for external tools
- MCP connector registry (CRUD for connectors)
- Connector types: Jira, Nexus IQ, SonarQube, Fortify, Checkmarx, Veracode, GitHub, GitLab, Azure DevOps, Chronos, Confluence, SharePoint, Teams, Slack, ServiceNow
- Standardized service interface (fetch data, transform, store)
- SonarQube: refactor existing poll worker into MCP pattern
- Nexus IQ: refactor existing sync into MCP pattern
- Webhook receiver for tool events
- Frontend: Connector management page (test, enable/disable, status)

## Sprint 5 — Knowledge Base & RAG (Phase 12)
**Goal:** Full RAG pipeline with document indexing
- Document upload API (PDF, DOCX, TXT, MD)
- Document chunking service
- Embedding generation (Gemini embedding API or local)
- Vector storage (pgvector) and similarity search
- RAG query service (retrieve chunks → Gemini completion)
- Document categories: Governance, Policies, Standards, Procedures, Controls, Risks, Compliance, Privacy, Security, Audit, Meetings, Regulations, Contracts
- Frontend: Knowledge Base page (upload, search, browse categories)

## Sprint 6 — Workflow Engine (Phase 13)
**Goal:** Reusable visual workflow engine
- Workflow definition model (nodes, transitions, conditions, assignments)
- Workflow instance model (state machine per instance)
- Workflow runner service (process transitions, trigger actions)
- Workflow templates: VEG Request, Audit, Risk Acceptance, Waiver, CAPA, Privacy Assessment, Compliance Review
- Frontend: Workflow designer (drag-drop nodes), Workflow tracker (kanban-style)

## Sprint 7 — Testing Strategy (Phase 14)
**Goal:** Comprehensive test coverage
- Unit tests: all services, repositories, routes (vitest)
- Integration tests: API endpoints with test DB (supertest + pg test container)
- E2E tests: Playwright for critical user journeys
- Performance tests: k6 for key API endpoints
- Security tests: basic OWASP scan, auth bypass checks
- AI prompt tests: evaluate responses against expected patterns
- Accessibility tests: axe-core on all pages
- CI: GitHub Actions running all test suites

## Sprint 8 — DevOps & Deployment (Phase 15)
**Goal:** Production-grade deployment
- Docker: multi-stage builds, healthchecks, non-root users
- Kubernetes: manifests for all services (deployments, services, ingresses, configmaps, secrets)
- CI/CD: GitHub Actions deploy to K8s
- Monitoring: Prometheus metrics endpoint + Grafana dashboard
- Logging: structured JSON logs, Loki aggregation
- Backup: pg_dump cron job, S3 upload
- Disaster Recovery: restore procedure doc
- IaC: Terraform for cloud infra

## Sprint 9 — Documentation (Phases 9-15)
**Goal:** Complete docs folder
- Product Vision update
- Business Requirements
- Functional Specifications
- Non-Functional Requirements
- Domain Model (ERD)
- Information Architecture
- UX/UI Guidelines
- AI Strategy
- MCP Strategy
- Knowledge Base Strategy
- Testing Strategy
- Deployment Guide
- Operations Guide
- Architecture Decision Records (ADR)
- Security Architecture
- Integration Guide

## Sprint 10 — Design System
**Goal:** Reusable enterprise design system
- Color palette tokens (CSS variables, light/dark)
- Typography scale
- Icon library audit + missing icons
- Layout rules (spacing, grid, responsive breakpoints)
- Component library expansion:
  - Cards (metric card, entity card, clickable card)
  - Tables (sortable, filterable, paginated, expandable rows)
  - Charts wrapper (consistent color, legend, tooltip)
  - Forms (field types, validation patterns, layouts)
  - Buttons (variants, sizes, loading states, icon buttons)
  - Notifications (toast, banner, inline alert, notification center)
  - Modals (size variants, nested, confirm dialog)
  - Empty states (per entity, with action CTA)
  - Loading states (skeleton per component type)
  - Error states (inline, full-page, retry)
- Accessibility guidelines (contrast, focus, aria, keyboard nav)
- Storybook or similar component catalog
