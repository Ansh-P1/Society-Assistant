# API Reference

See `.claude/skills/api-conventions/SKILL.md` for the conventions (endpoint
naming, auth, error shape, pagination) that every endpoint below follows.

## Health

### `GET /api/health`

- **Auth:** none
- **Response:** `{ "status": "ok" }`

## Auth

Tokens are JWTs signed with `JWT_SECRET`, containing `{ sub: userId, role }`,
expiring after 7 days. Send them as `Authorization: Bearer <token>` on any
route guarded by the `authenticate` middleware.

### `POST /api/auth/register`

Residents only — there is no `role` field in the request body; every
self-registered account is created as `resident`. Admin accounts are seeded
directly (see `server/src/db/seed.js`), not created through this endpoint.

- **Auth:** none
- **Request body:**
  ```json
  { "name": "Asha Kulkarni", "email": "asha@example.com", "password": "at-least-8-chars" }
  ```
- **Success response `201`:**
  ```json
  {
    "token": "<jwt>",
    "user": { "id": 1, "name": "Asha Kulkarni", "email": "asha@example.com", "role": "resident" }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — missing name, invalid email format, or password
    under 8 characters
  - `409 EMAIL_TAKEN` — an account with this email already exists

### `POST /api/auth/login`

- **Auth:** none
- **Request body:**
  ```json
  { "email": "asha@example.com", "password": "at-least-8-chars" }
  ```
- **Success response `200`:**
  ```json
  {
    "token": "<jwt>",
    "user": { "id": 1, "name": "Asha Kulkarni", "email": "asha@example.com", "role": "resident" }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — invalid email format or missing password
  - `401 INVALID_CREDENTIALS` — email not found or password incorrect (same
    error for both, so login never reveals whether an email is registered)

### Shared auth errors

Any route behind `authenticate` / `requireRole` can also return:

- `401 UNAUTHORIZED` — missing, malformed, invalid, or expired token
- `403 FORBIDDEN` — valid token, but the user's role isn't allowed on this route

## Complaints

### `POST /api/complaints`

Resident-only. Creates a complaint and, in the same transaction, its first
`complaint_status_history` row (`from_status: null -> to_status: "Open"`,
`actor_id` = the resident who filed it) — see
`.claude/skills/complaint-lifecycle/SKILL.md`. New complaints always start
as `status: "Open"`, `priority: "Low"`.

- **Auth:** resident (`Authorization: Bearer <token>`)
- **Request:** `multipart/form-data`
  - `category` (required) — one of: `Plumbing`, `Electrical`, `Cleanliness`,
    `Security`, `Structural`, `Elevator`, `Parking`, `Other`
  - `description` (required) — non-empty string, max 2000 characters
  - `photo` (optional) — JPEG/PNG/WebP image, max 5MB
- **Success response `201`:**
  ```json
  {
    "complaint": {
      "id": 1,
      "resident_id": 3,
      "category": "Plumbing",
      "description": "Kitchen sink is leaking continuously.",
      "photo_url": "/uploads/1787503980339-133288062.png",
      "priority": "Low",
      "status": "Open",
      "created_at": "2026-08-23T10:00:00.000Z",
      "resolved_at": null
    }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — invalid/missing category, missing/oversized
    description, wrong photo file type, or photo over 5MB
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

Uploaded photos are currently stored on local disk under `server/uploads/`
and served statically at `/uploads/<filename>`. This is a development-only
choice — see the "Photo storage" note in the root README for what changes
before production.

### `GET /api/complaints/mine`

Resident-only. Lists the logged-in resident's own complaints, newest first.

- **Auth:** resident
- **Query params:** `page` (default `1`), `limit` (default `20`, max `100`)
- **Success response `200`:**
  ```json
  {
    "data": [
      {
        "id": 2, "resident_id": 3, "category": "Electrical",
        "description": "Common area light on 3rd floor not working.",
        "photo_url": null, "priority": "Low", "status": "In Progress",
        "created_at": "2026-08-22T09:00:00.000Z", "resolved_at": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```
- **Errors:** `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `GET /api/complaints/:id`

Resident-only. Returns one complaint plus its complete
`complaint_status_history` timeline, oldest entry first — the full audit
trail described in `.claude/skills/complaint-lifecycle/SKILL.md`. A
resident may only fetch their own complaints.

- **Auth:** resident
- **Success response `200`:**
  ```json
  {
    "complaint": {
      "id": 2, "resident_id": 3, "category": "Electrical",
      "description": "Common area light on 3rd floor not working.",
      "photo_url": null, "priority": "Low", "status": "In Progress",
      "created_at": "2026-08-22T09:00:00.000Z", "resolved_at": null
    },
    "history": [
      {
        "id": 4, "from_status": null, "to_status": "Open",
        "actor_id": 3, "actor_name": "Ravi Mehta",
        "note": "Complaint raised", "changed_at": "2026-08-22T09:00:00.000Z"
      },
      {
        "id": 5, "from_status": "Open", "to_status": "In Progress",
        "actor_id": 2, "actor_name": "Admin User",
        "note": "Electrician scheduled", "changed_at": "2026-08-22T15:00:00.000Z"
      }
    ]
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — `:id` isn't numeric
  - `403 FORBIDDEN` — the complaint exists but belongs to a different resident
  - `404 NOT_FOUND` — no complaint with that id exists
  - `401 UNAUTHORIZED` — see shared auth errors above

---

Further endpoints (complaint/notice status updates, notice board, dashboard)
are documented here as they are built.
