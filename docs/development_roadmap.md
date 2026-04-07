# GiyantTrace API — Development Roadmap

> **Service**: Process Status Management Platform API  
> **Stack**: Node.js 20 · TypeScript · Fastify · PostgreSQL · Redis  
> **Last updated**: 2026-04-07

---

## Current State

The core infrastructure is production-ready: authentication, multi-tenant workspace isolation, process lifecycle tracking, public client tracking, analytics, and the full API/Swagger setup are all implemented. Several integration layers (notifications, file storage, PDF generation) have their scaffolding in place but their send/write logic is pending.

---

## Phase 1 — Complete Core Integrations

Priority: finish the features that are structurally in place but not yet functional.

### 1.1 Notification Delivery

- [ ] **Email via SendGrid** — implement `sendEmail()` in `src/services/notifications.ts` using the SendGrid Node SDK; wire it into process lifecycle hooks (stage advanced, completed)
- [ ] **WhatsApp via Business API** — implement `sendWhatsApp()` in the notifications service; use `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN`
- [ ] **SMS via Twilio** — implement `sendSms()` in the notifications service; use `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`
- [ ] **Notification queue** — move delivery to a Redis-backed queue (BullMQ) for retries and backoff instead of inline await
- [ ] **Webhook signature verification** — validate `X-Hub-Signature-256` on WhatsApp POST payloads in `src/routes/webhooks.ts`

### 1.2 File Upload & Storage

- [ ] **S3-compatible upload** — implement multipart handler in a new `src/services/storage.ts`; respect `STORAGE_PROVIDER` env var to switch between local disk and S3/MinIO
- [ ] **Attachment endpoints** — add `POST /api/v1/processes/:id/attachments` and `DELETE /api/v1/processes/:id/attachments/:attachmentId`
- [ ] **Local storage fallback** — save to `uploads/` directory when `STORAGE_PROVIDER=local`; serve via a static file handler

### 1.3 PDF Report Generation

- [ ] **Add `@react-pdf/renderer`** to dependencies
- [ ] **Implement `generateProcessPdf()`** in a new `src/services/pdf.ts`
- [ ] **Wire `POST /api/v1/processes/:id/pdf`** — generate on demand; return download URL or stream

---

## Phase 2 — Security & Access Control

### 2.1 Role-Based Access Control (RBAC)

- [ ] Create an `authorize(roles: Role[])` middleware in `src/plugins/auth.ts`
- [ ] Apply role guards:
  - `owner` only: workspace deletion, plan changes
  - `owner | admin`: create/delete templates, manage team members
  - all roles: read access and process management
- [ ] Add `GET/POST/DELETE /api/v1/workspace/members` endpoints for team management

### 2.2 Auth Hardening

- [ ] **Refresh token rotation** — on `/auth/refresh`, invalidate the old token and issue a new one
- [ ] **Email verification** — send verification email on register; block login if unverified (configurable via env flag)
- [ ] **Password reset** — `POST /auth/forgot-password` + `POST /auth/reset-password/:token`
- [ ] **Account lockout** — lock after N failed login attempts; unlock via email or admin

### 2.3 Rate Limiting Refinement

- [ ] Apply per-route overrides (stricter limits on auth endpoints)
- [ ] Use Redis store for distributed rate limiting across multiple API instances

---

## Phase 3 — Product Features

### 3.1 Subscription & Billing

- [ ] **Integrate payment processor** (Stripe recommended) — create `src/services/billing.ts`
- [ ] Add Stripe webhook handler at `POST /api/v1/webhooks/stripe`
- [ ] Enforce plan limits (process count, team member count, integrations) via middleware
- [ ] Implement plan upgrade/downgrade flow; update `subscriptions` table accordingly

### 3.2 Process Enhancements

- [ ] **Bulk actions** — bulk status update, bulk assignment
- [ ] **Process comments** — visible internally vs. client-visible thread
- [ ] **Due date reminders** — cron job that queues notifications for processes approaching `expectedCompletionAt`
- [ ] **Process duplication** — clone a process with its stages from a template
- [ ] **SLA tracking** — flag overdue stages based on `expectedDurationHours`

### 3.3 Advanced Analytics

- [ ] **Stage-level metrics** — average time per stage per template/industry
- [ ] **Throughput charts** — processes created vs. completed over time (daily/weekly/monthly)
- [ ] **Client satisfaction trends** — rating history per workspace
- [ ] **Export** — CSV/Excel export of analytics data

### 3.4 Custom Domains

- [ ] Allow workspaces to set a `customDomain` for the public tracking page
- [ ] Implement domain verification via DNS TXT record check

---

## Phase 4 — Infrastructure & Operations

### 4.1 Observability

- [ ] **Structured logging** — replace `console.*` with `pino` (already bundled with Fastify); add request IDs
- [ ] **APM / tracing** — add OpenTelemetry instrumentation; export to preferred backend (Datadog, Grafana, etc.)
- [ ] **Error tracking** — integrate Sentry (`@sentry/node`) with source maps
- [ ] **Health checks** — extend `/health` to report DB connectivity and Redis connectivity

### 4.2 Performance

- [ ] **Redis caching** — cache workspace settings and global templates with TTL
- [ ] **Database indexes** — audit slow queries; add covering indexes on `processes(workspaceId, status)`, `clients(workspaceId, name)`, etc.
- [ ] **Connection pooling** — configure `max` pool size in Drizzle/pg client for production load

### 4.3 Developer Experience

- [ ] **README** — complete setup guide, Docker instructions, environment variable docs
- [ ] **Seed script** — extend `src/seeds/run.ts` to seed a full demo workspace for local dev
- [ ] **Pre-commit hooks** — add `husky` + `lint-staged` for linting and type-checking on commit
- [ ] **CI/CD pipeline** — GitHub Actions workflow: lint → test → build → push Docker image
- [ ] **Database backup** — documented pg_dump schedule or managed backup policy

### 4.4 Testing

- [ ] Expand integration tests to cover all route modules (clients, processes, templates, analytics)
- [ ] Add database-level integration tests using a test DB (not mocks)
- [ ] Set coverage thresholds in `vitest.config.ts` (target: 80% lines)
- [ ] Add load/stress tests for critical endpoints using `autocannon` or `k6`

---

## Phase 5 — Scale & Multi-Region (Future)

- [ ] Evaluate read replicas for analytics queries
- [ ] Consider sharding strategy if multi-region workspaces are needed
- [ ] Move background jobs to a dedicated worker service (separate Docker container)
- [ ] Add WebSocket support for real-time process updates to the frontend

---

## Milestone Summary

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Notifications, file storage, PDF | In Progress |
| 2 | RBAC, auth hardening, rate limits | Planned |
| 3 | Billing, process enhancements, analytics | Planned |
| 4 | Observability, performance, DX, testing | Planned |
| 5 | Scale, multi-region, real-time | Future |

---

## Related Documentation

- [Architecture Overview](./architecture.md)
- [API Reference](./api-reference.md)
- [Data Models](./data-models.md)
- [Setup Guide](./setup.md)
