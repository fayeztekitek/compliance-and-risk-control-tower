# Sprint 1: Authentication & Authorization

**Duration:** 2 weeks
**Goal:** Real JWT-based auth with 7 roles, login/session management.

---

## Tasks

### Backend — Auth Endpoints
- [ ] `POST /api/auth/register` — create user with bcrypt-hashed password
- [ ] `POST /api/auth/login` — validate credentials, return JWT + refresh token
- [ ] `POST /api/auth/refresh` — rotate refresh tokens
- [ ] `POST /api/auth/logout` — invalidate session
- [ ] `GET /api/auth/me` — current user profile from JWT
- [ ] Auth middleware: verify JWT, attach user to `req`
- [ ] RBAC middleware: check required role + permission against route config

### Backend — Role & Permission Model
- [ ] 7 roles defined: ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, SECURITY_MANAGER, PRODUCT_OWNER, AUDITOR, EXECUTIVE_READ_ONLY
- [ ] Permission matrix: map role → allowed routes/actions
- [ ] Seed migration for 7 default users (from existing `MOCK_USERS`)

### Frontend — Login & Auth
- [ ] `/login` page with email/password form + Zod validation
- [ ] Auth context + `useAuth` hook (token storage, auto-refresh interceptor)
- [ ] `ProtectedRoute` component with role gating (redirect to /login if unauthenticated)
- [ ] Role-based sidebar — menu items filtered by user role
- [ ] Logout button with session clean-up
- [ ] Replace current persona switcher with real role-based rendering

---

## Deliverables

- [ ] User can register and login
- [ ] JWT tokens expire and refresh correctly
- [ ] RBAC prevents unauthorized route access
- [ ] Sidebar shows only permitted workspaces per role
- [ ] Logout clears session and redirects to login

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 4 | Password hashing, JWT verify, RBAC middleware, expired token |
| Integration | 3 | Login flow, auth/me, unauthorized access |
| Functional | 2 | Login → protected route → logout → access rejected |
