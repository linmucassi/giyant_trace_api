# GiyantTrace API — API Reference

**Base URL**: `http://localhost:3001`  
**Version**: v1  
**Prefix**: `/api/v1`

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

All responses follow this envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": "message if success is false",
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

## Authentication

### Register

`POST /api/v1/auth/register`

Creates a new workspace, owner account, and trial subscription.

**Body**
```json
{
  "workspaceName": "Acme Repairs",
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "password": "min8chars"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Jane Smith", "email": "...", "role": "owner" },
    "workspace": { "id": "...", "name": "Acme Repairs", "slug": "acme-repairs" },
    "accessToken": "<jwt>",
    "refreshToken": "<uuid>"
  }
}
```

---

### Login

`POST /api/v1/auth/login`

**Body**
```json
{ "email": "jane@acme.com", "password": "min8chars" }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Jane Smith", "email": "...", "role": "owner" },
    "workspace": { "id": "...", "name": "Acme Repairs" },
    "accessToken": "<jwt>",
    "refreshToken": "<uuid>"
  }
}
```

---

### Get Current User

`GET /api/v1/auth/me` — **Auth required**

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "role": "owner",
    "workspace": { "id": "...", "name": "Acme Repairs", "plan": "starter" }
  }
}
```

---

## Workspace

### Get Workspace

`GET /api/v1/workspace/` — **Auth required**

### Update Workspace

`PUT /api/v1/workspace/` — **Auth required**

**Body** (all fields optional)
```json
{
  "name": "Acme Auto",
  "logoUrl": "https://...",
  "primaryColor": "#FF5733",
  "secondaryColor": "#C70039"
}
```

### Get Settings

`GET /api/v1/workspace/settings` — **Auth required**

### Update Settings

`PUT /api/v1/workspace/settings` — **Auth required**

**Body** (all fields optional)
```json
{
  "notificationsEmail": true,
  "notificationsWhatsapp": false,
  "notificationsSms": false,
  "timezone": "Africa/Johannesburg",
  "currency": "ZAR",
  "whatsappNumber": "+27821234567",
  "emailFrom": "support@acme.com"
}
```

---

## Clients

### List Clients

`GET /api/v1/clients/` — **Auth required**

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | — | Filter by name |

### Get Client

`GET /api/v1/clients/:id` — **Auth required**

### Create Client

`POST /api/v1/clients/` — **Auth required**

**Body**
```json
{
  "name": "John Doe",
  "phone": "+27821234567",
  "email": "john@example.com",
  "metadata": { "vehicleReg": "ABC123" }
}
```

### Update Client

`PUT /api/v1/clients/:id` — **Auth required**

### Delete Client

`DELETE /api/v1/clients/:id` — **Auth required**

---

## Processes

### List Processes

`GET /api/v1/processes/` — **Auth required**

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `status` | `active\|completed\|cancelled\|on_hold` | Filter by status |
| `page` | number | |
| `limit` | number | |

### Get Process

`GET /api/v1/processes/:id` — **Auth required**

Returns process with all stages, updates, and client info.

### Create Process

`POST /api/v1/processes/` — **Auth required**

**Body**
```json
{
  "clientId": "...",
  "templateId": "...",
  "title": "iPhone 14 Screen Repair",
  "description": "Cracked front glass",
  "expectedCompletionAt": "2026-04-10T17:00:00Z",
  "totalCost": 1200,
  "currency": "ZAR",
  "assignedToId": "...",
  "metadata": {}
}
```

**Response 201** — includes generated `referenceNumber` (e.g. `GT-ABCDE-1234`) and `trackingToken`.

### Advance to Next Stage

`POST /api/v1/processes/:id/advance` — **Auth required**

Moves the process to its next pending stage. Returns updated process.

### Add Stage Update

`POST /api/v1/processes/:id/updates` — **Auth required**

**Body**
```json
{
  "content": "Parts ordered, expected in 2 days",
  "isClientVisible": true
}
```

### Generate PDF

`POST /api/v1/processes/:id/pdf` — **Auth required**

Queues a PDF report for generation. Returns job ID (implementation pending).

---

## Templates

### List Templates

`GET /api/v1/templates/` — **Auth required**

Returns global (system) templates plus workspace-specific templates.

### Create Template

`POST /api/v1/templates/` — **Auth required**

**Body**
```json
{
  "name": "Bicycle Repair",
  "industry": "custom",
  "description": "Standard bicycle repair workflow",
  "stages": [
    { "name": "Drop-off", "order": 1, "expectedDurationHours": 1 },
    { "name": "Assessment", "order": 2, "expectedDurationHours": 2 },
    { "name": "Repair", "order": 3, "expectedDurationHours": 4 },
    { "name": "Quality Check", "order": 4, "expectedDurationHours": 1 },
    { "name": "Ready for Collection", "order": 5, "expectedDurationHours": 0 }
  ]
}
```

**Industry values**: `auto_repair`, `electronics_repair`, `furniture`, `logistics`, `home_services`, `custom`

### Delete Template

`DELETE /api/v1/templates/:id` — **Auth required**

Only workspace-owned templates can be deleted (not global templates).

---

## Public Tracking

No authentication required for these endpoints.

### Track Process

`GET /api/v1/public/track/:token`

Returns client-safe process data: stages, client-visible updates, progress percentage.

**Response 200**
```json
{
  "success": true,
  "data": {
    "referenceNumber": "GT-ABCDE-1234",
    "title": "iPhone 14 Screen Repair",
    "status": "active",
    "progressPercentage": 60,
    "stages": [ ... ],
    "updates": [ ... ]
  }
}
```

### Submit Feedback

`POST /api/v1/public/track/:token/feedback`

**Body**
```json
{ "rating": 5, "comment": "Fast and professional service!" }
```

---

## Webhooks

### WhatsApp Verification

`GET /api/v1/webhooks/whatsapp`

Handles the Meta webhook verification challenge. Requires `hub.verify_token` to match `WHATSAPP_VERIFY_TOKEN`.

### WhatsApp Incoming Messages

`POST /api/v1/webhooks/whatsapp`

Receives delivery status updates and client message replies from the WhatsApp Business API.

---

## Analytics

### Overview

`GET /api/v1/analytics/overview` — **Auth required**

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalProcesses": 142,
    "activeProcesses": 38,
    "completedProcesses": 99,
    "onHoldProcesses": 5,
    "newLast30Days": 22,
    "averageRating": 4.7
  }
}
```

---

## Health

### Health Check

`GET /health`

```json
{ "status": "ok", "timestamp": "2026-04-07T10:00:00.000Z" }
```

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Validation error — check `error` field for details |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role/permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
