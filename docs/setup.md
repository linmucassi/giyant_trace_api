# GiyantTrace API — Setup Guide

## Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- Docker & Docker Compose (for local PostgreSQL + Redis)

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd giyant_trace_api
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env — minimum required fields listed below

# 3. Start infrastructure
docker-compose up -d postgres redis

# 4. Run migrations
pnpm db:migrate

# 5. (Optional) Seed default templates
pnpm db:seed

# 6. Start development server
pnpm dev
```

API available at `http://localhost:3001`  
Swagger UI at `http://localhost:3001/docs`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required fields.

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/giyant_trace` | PostgreSQL connection string |
| `JWT_SECRET` | 32+ random chars | Access token signing secret |
| `JWT_REFRESH_SECRET` | 32+ random chars (different) | Refresh token signing secret |
| `ENCRYPTION_KEY` | 32+ random chars | Token encryption key |

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional — Server

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3001` | HTTP port |
| `API_HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | `development`, `production`, `test` |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `WEB_URL` | `http://localhost:3000` | Frontend URL (used in CORS) |
| `ADMIN_URL` | `http://localhost:3002` | Admin dashboard URL (used in CORS) |

### Optional — Auth

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |

### Optional — Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `60000` | Window in ms (60 seconds) |

### Optional — Email (SendGrid)

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `EMAIL_FROM` | Sender address (default: `noreply@giyanttrace.com`) |
| `EMAIL_FROM_NAME` | Sender name (default: `GiyantTrace`) |

### Optional — SMS (Twilio)

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |

### Optional — WhatsApp (Meta Business API)

| Variable | Description |
|----------|-------------|
| `WHATSAPP_API_URL` | WhatsApp Graph API base URL |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from Meta |
| `WHATSAPP_ACCESS_TOKEN` | Permanent or temporary access token |
| `WHATSAPP_VERIFY_TOKEN` | Token for webhook verification challenge |

### Optional — File Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_PROVIDER` | `local` | `local` or `s3` |
| `AWS_REGION` | | S3 bucket region |
| `AWS_BUCKET` | | Bucket name |
| `AWS_ACCESS_KEY_ID` | | AWS/MinIO access key |
| `AWS_SECRET_ACCESS_KEY` | | AWS/MinIO secret key |
| `AWS_ENDPOINT` | | Custom endpoint for MinIO or S3-compatible stores |

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled output |
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm db:generate` | Generate new Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser) |
| `pnpm db:seed` | Seed default templates |

---

## Docker (Full Stack)

Run the entire stack (PostgreSQL, Redis, API) with one command:

```bash
docker-compose up -d
```

Services:
- **postgres**: `localhost:5432` — user `postgres`, password `postgres`, db `giyant_trace`
- **redis**: `localhost:6379`
- **api**: `localhost:3001`

Stop and remove containers:
```bash
docker-compose down
# Add -v to also remove data volumes
docker-compose down -v
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Watch mode during development
pnpm test:watch

# Coverage report (outputs to coverage/)
pnpm test:coverage
```

Tests use a separate test database. Set `TEST_DATABASE_URL` in your `.env` or the test setup will use defaults defined in `tests/setup.ts`.

---

## Database Migrations

After modifying schema files in `src/db/schema/`:

```bash
# Generate migration SQL
pnpm db:generate

# Apply to database
pnpm db:migrate
```

Migration files are stored in `src/db/migrations/` and should be committed to version control.

---

## Project Structure Reference

See [architecture.md](./architecture.md) for the full directory layout and system design.
