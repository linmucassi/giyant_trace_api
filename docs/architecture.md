# GiyantTrace API — Architecture Overview

## System Summary

GiyantTrace is a multi-tenant process status management platform. Businesses use it to track service jobs (repairs, deliveries, installations) and share live status updates with their clients via a public tracking link.

---

## High-Level Architecture

```
                        ┌─────────────────────────────────┐
                        │         Client Applications      │
                        │  Web App  │  Admin  │  Public     │
                        └──────┬────┴────┬────┴─────┬───────┘
                               │         │          │
                        ┌──────▼─────────▼──────────▼───────┐
                        │         GiyantTrace API             │
                        │  Fastify · TypeScript · Node 20    │
                        │                                    │
                        │  ┌──────────┐  ┌───────────────┐  │
                        │  │  Routes  │  │   Plugins     │  │
                        │  │ (8 mods) │  │ JWT·Swagger   │  │
                        │  └────┬─────┘  │ Helmet·CORS   │  │
                        │       │        └───────────────┘  │
                        │  ┌────▼─────┐  ┌───────────────┐  │
                        │  │ Services │  │   DB Layer    │  │
                        │  │ Notif.   │  │  Drizzle ORM  │  │
                        │  │ Storage  │  └──────┬────────┘  │
                        │  │ PDF      │         │           │
                        │  └──────────┘         │           │
                        └─────────────────────┬─┘           │
                                              │             │
                        ┌─────────────────────▼─────────────▼─┐
                        │           Infrastructure              │
                        │  PostgreSQL 16    │    Redis 7        │
                        │  (primary store)  │  (cache · queue)  │
                        └──────────────────────────────────────┘
```

---

## Multi-Tenancy Model

Every resource in the system is scoped to a **workspace**. Isolation is enforced at the query level — every data-access query includes a `workspaceId` filter.

```
Workspace (tenant)
  ├── Users (owner · admin · member)
  ├── WorkspaceSettings
  ├── Subscription
  ├── Clients
  ├── Processes
  │     ├── ProcessStages
  │     ├── StageUpdates
  │     ├── Attachments
  │     └── ClientFeedback
  └── Templates
        └── TemplateStages
```

A user belongs to exactly one workspace. Cross-workspace access is not supported.

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
Fastify Core (parser · schema validation)
    │
    ▼
Global Plugins
  · @fastify/helmet   — security headers
  · @fastify/cors     — CORS policy
  · @fastify/rate-limit — per-IP throttle
    │
    ▼
Route preHandler
  · server.authenticate()  (JWT verify + DB user check)
    │  (skipped for public/webhook/health routes)
    ▼
Route Handler
  · Zod input validation
  · Business logic (inline or via service)
  · Drizzle ORM query
    │
    ▼
Response  { success, data?, error?, pagination? }
```

---

## Authentication

- **Access token**: HS256 JWT, 15-minute TTL, signed with `JWT_SECRET`
- **Refresh token**: Opaque UUID stored in `refresh_tokens` table, 7-day TTL
- **Payload**:
  ```json
  { "sub": "userId", "workspaceId": "...", "role": "owner|admin|member", "email": "..." }
  ```
- Public routes (`/public/track/*`, `/webhooks/*`, `/health`) bypass JWT middleware

---

## Database

- **Engine**: PostgreSQL 16
- **ORM**: Drizzle ORM with `drizzle-kit` for migrations
- **Migrations**: stored in `src/db/migrations/`, run with `pnpm db:migrate`
- **Schema**: defined in `src/db/schema/` — one file per entity group

Key relationships:
- `users` → `workspaces` (many-to-one)
- `processes` → `clients`, `workspaces`, `templates`, `users`
- `process_stages` → `processes`, `template_stages`
- `stage_updates` → `processes`, `process_stages`, `users`
- `notifications` → `workspaces`, `processes`, `clients`
- `subscriptions` → `workspaces`

---

## Caching & Queuing (Redis)

Currently configured but minimally used. Planned uses:

| Use Case | Key Pattern | TTL |
|----------|-------------|-----|
| Workspace settings | `ws:settings:{workspaceId}` | 5 min |
| Global templates | `templates:global` | 60 min |
| Rate limit counters | managed by `@fastify/rate-limit` | per window |
| Notification jobs | BullMQ queue (planned) | — |

---

## External Services

| Service | Purpose | Status |
|---------|---------|--------|
| SendGrid | Transactional email | Configured, not wired |
| Twilio | SMS delivery | Configured, not wired |
| WhatsApp Business API | WhatsApp messages + webhooks | Webhook handler done; send pending |
| S3 / MinIO | File attachment storage | Config only |

---

## API Documentation

Swagger UI is auto-generated and served at `/docs` in non-production environments. The OpenAPI 3.0 spec is built from Fastify schema decorations in each route file.

---

## Project Layout

```
src/
├── config/     env variable validation (Zod)
├── db/         Drizzle client, schema, migrations
├── plugins/    Fastify plugin registration (JWT, Swagger, security)
├── routes/     HTTP route handlers (one file per feature domain)
├── services/   Business logic (notifications, storage, PDF)
├── lib/        Pure utility functions
├── types/      Shared TypeScript interfaces
└── seeds/      DB seed scripts for local/demo data
```
