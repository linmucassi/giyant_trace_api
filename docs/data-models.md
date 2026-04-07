# GiyantTrace API — Data Models

Schema is defined in `src/db/schema/` using Drizzle ORM. All IDs are UUIDs unless noted.

---

## Entity Relationship Overview

```
workspaces
  ├─< users
  ├─< workspace_settings (1:1)
  ├─< subscriptions
  ├─< clients
  ├─< processes
  │     ├─< process_stages
  │     │     └─< stage_updates
  │     ├─< attachments
  │     ├─< client_feedback
  │     └─< notifications
  └─< templates
        └─< template_stages
```

---

## workspaces

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | Display name |
| slug | text | Unique URL-safe identifier |
| logo_url | text | |
| primary_color | text | Hex color |
| secondary_color | text | Hex color |
| plan | enum | `starter`, `growth`, `pro`, `enterprise` |
| is_active | boolean | Default true |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | Soft delete |

---

## workspace_settings

One-to-one with `workspaces`.

| Column | Type | Notes |
|--------|------|-------|
| workspace_id | uuid | PK, FK → workspaces |
| notifications_email | boolean | Default false |
| notifications_whatsapp | boolean | Default false |
| notifications_sms | boolean | Default false |
| default_template_id | uuid | FK → templates (nullable) |
| timezone | text | Default `UTC` |
| currency | text | Default `USD` |
| whatsapp_number | text | |
| email_from | text | |
| custom_domain | text | |
| updated_at | timestamp | |

---

## users

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces |
| email | text | Unique globally |
| password_hash | text | bcrypt |
| name | text | |
| role | enum | `owner`, `admin`, `member` |
| avatar_url | text | |
| is_active | boolean | Default true |
| last_login_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## refresh_tokens

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| token | text | Unique opaque UUID |
| expires_at | timestamp | Default +7 days |
| created_at | timestamp | |

---

## clients

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces |
| name | text | |
| phone | text | |
| email | text | |
| metadata | jsonb | Custom fields |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## processes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces |
| client_id | uuid | FK → clients |
| template_id | uuid | FK → templates (nullable) |
| title | text | |
| description | text | |
| reference_number | text | Unique per workspace; format: `GT-XXXXX-0000` |
| status | enum | `active`, `completed`, `cancelled`, `on_hold` |
| current_stage_id | uuid | FK → process_stages (nullable) |
| progress_percentage | integer | 0–100 |
| tracking_token | text | Unique; used for public access |
| expected_completion_at | timestamp | |
| actual_completion_at | timestamp | |
| total_cost | decimal | |
| currency | text | Default `USD` |
| created_by_id | uuid | FK → users |
| assigned_to_id | uuid | FK → users (nullable) |
| metadata | jsonb | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## process_stages

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| process_id | uuid | FK → processes |
| template_stage_id | uuid | FK → template_stages (nullable) |
| name | text | |
| description | text | |
| order | integer | Sort order |
| status | enum | `pending`, `active`, `completed`, `skipped` |
| expected_duration_hours | integer | |
| expected_completion_at | timestamp | |
| started_at | timestamp | |
| completed_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## stage_updates

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| process_id | uuid | FK → processes |
| process_stage_id | uuid | FK → process_stages (nullable) |
| content | text | Note/update text |
| is_client_visible | boolean | Controls public visibility |
| created_by_id | uuid | FK → users |
| created_at | timestamp | |

---

## attachments

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces |
| process_id | uuid | FK → processes |
| process_stage_id | uuid | FK → process_stages (nullable) |
| type | enum | `image`, `document`, `video` |
| filename | text | |
| url | text | Storage URL |
| size | integer | Bytes |
| mime_type | text | |
| is_client_visible | boolean | |
| caption | text | |
| uploaded_by_id | uuid | FK → users |
| created_at | timestamp | |

---

## client_feedback

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| process_id | uuid | FK → processes |
| rating | integer | 1–5 |
| comment | text | |
| created_at | timestamp | |

---

## templates

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces; NULL = global template |
| name | text | |
| industry | enum | `auto_repair`, `electronics_repair`, `furniture`, `logistics`, `home_services`, `custom` |
| description | text | |
| is_active | boolean | Default true |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## template_stages

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| template_id | uuid | FK → templates |
| name | text | |
| description | text | |
| order | integer | Sort order |
| expected_duration_hours | integer | |
| color | text | Hex color for UI |
| icon | text | Icon identifier |
| created_at | timestamp | |

---

## notifications

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces |
| process_id | uuid | FK → processes (nullable) |
| client_id | uuid | FK → clients (nullable) |
| channel | enum | `email`, `whatsapp`, `sms` |
| template_key | text | Notification type identifier |
| subject | text | Email subject |
| body | text | Rendered message body |
| status | enum | `pending`, `sent`, `failed`, `delivered` |
| sent_at | timestamp | |
| error | text | Error message on failure |
| created_at | timestamp | |

---

## subscriptions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces |
| plan | enum | `starter`, `growth`, `pro`, `enterprise` |
| status | enum | `trialing`, `active`, `past_due`, `cancelled`, `expired` |
| trial_ends_at | timestamp | |
| current_period_start | timestamp | |
| current_period_end | timestamp | |
| external_id | text | Payment processor subscription ID |
| created_at | timestamp | |
| updated_at | timestamp | |
