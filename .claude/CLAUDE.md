# GiyantTrace API — Claude Working Guide

## Project Context

Multi-tenant process status management API. Service businesses use it to track jobs (repairs, deliveries, etc.) and share live status updates with clients via public tracking links.

**Monorepo siblings** (same parent directory `giyant_trace/`):
- `giyant_trace_api` — this project (Fastify · Node 20 · TypeScript · PostgreSQL · Drizzle ORM)
- `giyant_trace_client` — Next.js 15 frontend (port 3000)
- `giyant_trace_admin` — admin dashboard (port 3002)

## Stack

| Concern | Library |
|---------|---------|
| Web framework | Fastify v4 |
| ORM | Drizzle ORM (`src/db/schema/`) |
| Validation | Zod (routes + `src/config/env.ts`) |
| Auth | `@fastify/jwt` — JWT access (15m) + refresh tokens (7d) in DB |
| Testing | Vitest + Supertest |
| Package manager | pnpm |

## Key Directories

```
src/
  config/env.ts       — Zod-validated env vars (add new vars here first)
  db/schema/          — Drizzle schema files (one per entity)
  db/migrations/      — Auto-generated; commit these
  plugins/            — Fastify plugins (auth decorator lives here)
  routes/             — One file per feature domain
  services/           — Business logic (notifications, storage, pdf)
  lib/utils.ts        — Pure utilities (ID gen, token gen)
  seeds/              — Local/demo data
```

## Architecture Rules

- Every query **must** filter by `workspaceId` — multi-tenant isolation is enforced at query level, not row-level security
- All responses use envelope: `{ success, data?, error?, pagination? }`
- Protected routes use `preHandler: [server.authenticate]`
- Public routes: `/public/track/*`, `/webhooks/*`, `/health`
- Add new env vars to `src/config/env.ts` Zod schema before using `process.env.*`

## Development Workflow

```bash
pnpm dev           # Start with hot reload
pnpm db:generate   # After schema changes — generates migration
pnpm db:migrate    # Apply pending migrations
pnpm test          # Run tests
```

## Current Phase

**Phase 1 — Core Integrations** (in progress)
- Notification delivery: SendGrid email, WhatsApp Business API, Twilio SMS
- File upload & S3 storage
- PDF report generation

See `docs/development_roadmap.md` for full roadmap.

## Conventions

- All responses: `{ success: boolean, data?, error?, pagination? }`
- Error codes: 400 validation · 401 auth · 403 forbidden · 404 not found · 409 conflict
- Currency default: ZAR · Timezone default: Africa/Johannesburg
- Reference numbers: `GT-XXXXX-0000` format (generated in `lib/utils.ts`)
- **Always update `docs/`** when adding or changing features
