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

Resident or admin. Returns one complaint plus its complete
`complaint_status_history` timeline, oldest entry first — the full audit
trail described in `.claude/skills/complaint-lifecycle/SKILL.md`. A
resident may only fetch their own complaints; an admin may fetch any
complaint (this is what backs the admin complaint detail view). The
response also includes `resident_name` (joined from `users`).

- **Auth:** resident or admin
- **Success response `200`:**
  ```json
  {
    "complaint": {
      "id": 2, "resident_id": 3, "resident_name": "Ravi Mehta", "category": "Electrical",
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
  - `403 FORBIDDEN` — a resident requesting a complaint that isn't theirs
    (does not apply to admins)
  - `404 NOT_FOUND` — no complaint with that id exists
  - `401 UNAUTHORIZED` — see shared auth errors above

## Admin

All routes below are admin-only and mounted under `/api/admin`.

### `GET /api/admin/complaints`

Lists every complaint (all residents), with filtering and pagination. Each
row is flagged `is_overdue` per the logic in
`.claude/skills/complaint-lifecycle/SKILL.md`
(`status != 'Resolved' AND now() - created_at > threshold`, computed at
query time, never stored). The threshold is read live from the `settings`
table (see `GET`/`PATCH /api/admin/settings` below) — not a hardcoded
constant or env var. Results sort overdue complaints to the top by
default, then by most recently created.

- **Auth:** admin
- **Query params (all optional):**
  - `status` — one of `Open`, `In Progress`, `Resolved`
  - `category` — one of the standard categories (see `POST /api/complaints`)
  - `date_from` / `date_to` — `YYYY-MM-DD`, inclusive on both ends, filters
    on `created_at`
  - `page` (default `1`), `limit` (default `20`, max `100`)
- **Success response `200`:**
  ```json
  {
    "data": [
      {
        "id": 1, "resident_id": 3, "resident_name": "Asha Kulkarni",
        "category": "Plumbing", "description": "Kitchen sink is leaking continuously.",
        "photo_url": null, "priority": "Low", "status": "Open",
        "created_at": "2026-08-10T09:00:00.000Z", "resolved_at": null,
        "is_overdue": true
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — invalid `status`/`category` value, or
    `date_from`/`date_to` not in `YYYY-MM-DD` format
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `GET /api/admin/complaints/overdue-count`

Convenience endpoint — just the count, using the same live threshold and
`status != 'Resolved'` logic as `is_overdue` above. Intended for the admin
dashboard (a future prompt), so it doesn't need the full listing payload.

- **Auth:** admin
- **Success response `200`:**
  ```json
  { "overdue_count": 3 }
  ```
- **Errors:** `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `PATCH /api/admin/complaints/:id/priority`

Sets a complaint's priority. This is a plain field update — unlike status
changes, priority changes are not recorded in `complaint_status_history`
(that table only tracks the `Open`/`In Progress`/`Resolved` lifecycle).

- **Auth:** admin
- **Request body:**
  ```json
  { "priority": "High" }
  ```
- **Success response `200`:**
  ```json
  {
    "complaint": {
      "id": 1, "resident_id": 3, "category": "Plumbing",
      "description": "Kitchen sink is leaking continuously.",
      "photo_url": null, "priority": "High", "status": "Open",
      "created_at": "2026-08-10T09:00:00.000Z", "resolved_at": null
    }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — `:id` isn't numeric, or `priority` isn't one of
    `Low`, `Medium`, `High`
  - `404 NOT_FOUND` — no complaint with that id exists
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `PATCH /api/admin/complaints/:id/status`

Transitions a complaint's status, enforcing the rules in
`.claude/skills/complaint-lifecycle/SKILL.md` strictly:

- Valid transitions: `Open -> In Progress`, `In Progress -> Resolved`, and
  `Open -> Resolved` (a direct resolve is allowed — no intermediate step is
  required).
- Invalid transitions are rejected with `400 INVALID_TRANSITION`, never
  silently ignored: skipping backwards (`In Progress -> Open`,
  `Resolved -> In Progress`, `Resolved -> Open`), any transition out of
  `Resolved` (it's closed permanently — no reopening), and setting
  `to_status` to the complaint's current status (no-op).
- On success, inserts a new `complaint_status_history` row
  (`from_status`, `to_status`, `actor_id` = the admin, `note`, `changed_at`)
  and updates `complaints.status` in the same transaction (the row is
  `SELECT ... FOR UPDATE`-locked first, so two concurrent updates on the
  same complaint can't both apply against the same `from_status`).
- When `to_status` is `"Resolved"`, `complaints.resolved_at` is set to
  `now()` in the same update.
- On success, also emails the resident about the status change (see
  `docs/EMAIL_SETUP.md`). This is fire-and-forget — not awaited, and any
  failure is logged server-side, never surfaced in the response.

- **Auth:** admin
- **Request body:**
  ```json
  { "to_status": "In Progress", "note": "Plumber scheduled" }
  ```
  `note` is optional.
- **Success response `200`:**
  ```json
  {
    "complaint": {
      "id": 1, "resident_id": 3, "category": "Plumbing",
      "description": "Kitchen sink is leaking continuously.",
      "photo_url": null, "priority": "Low", "status": "In Progress",
      "created_at": "2026-08-10T09:00:00.000Z", "resolved_at": null
    }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — `:id` isn't numeric, `to_status` isn't one of
    `Open`, `In Progress`, `Resolved`, or `note` isn't a string
  - `400 INVALID_TRANSITION` — the transition isn't allowed (see above);
    the message says specifically why (e.g. "A resolved complaint is
    closed and cannot be changed further")
  - `404 NOT_FOUND` — no complaint with that id exists
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `GET /api/admin/settings`

- **Auth:** admin
- **Success response `200`:**
  ```json
  { "settings": { "overdue_threshold_days": 7, "updated_at": "2026-08-20T00:00:00.000Z" } }
  ```
- **Errors:** `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `PATCH /api/admin/settings`

Updates the overdue threshold used everywhere overdue status is computed
(`GET /api/admin/complaints`'s `is_overdue` flag and
`GET /api/admin/complaints/overdue-count`) — takes effect immediately, no
restart needed, since those endpoints read the `settings` table live on
every request.

- **Auth:** admin
- **Request body:**
  ```json
  { "overdue_threshold_days": 10 }
  ```
- **Success response `200`:**
  ```json
  { "settings": { "overdue_threshold_days": 10, "updated_at": "2026-08-23T10:00:00.000Z" } }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — `overdue_threshold_days` isn't an integer
    between 1 and 365
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `GET /api/admin/dashboard`

Aggregate counts for a simple admin dashboard: complaints grouped by
status, grouped by category, and the overdue count. `by_status` and
`by_category` are always fully key-filled (every status/category appears,
even at `0`) — the frontend never has to guess which keys exist.
`overdue_count` uses the exact same logic (and live `settings` threshold)
as `GET /api/admin/complaints/overdue-count` — both read through the same
shared helper, so they can never disagree.

- **Auth:** admin
- **Success response `200`:**
  ```json
  {
    "by_status": { "Open": 5, "In Progress": 3, "Resolved": 12 },
    "by_category": {
      "Plumbing": 4, "Electrical": 2, "Cleanliness": 3, "Security": 1,
      "Structural": 0, "Elevator": 0, "Parking": 0, "Other": 0
    },
    "overdue_count": 3
  }
  ```
- **Errors:** `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

## Notices

The notice board. Both roles can read it; only admins can post.

### `POST /api/notices`

Admin-only. If `is_important` is `true`, also emails every resident (see
`docs/EMAIL_SETUP.md`) — fire-and-forget, same as the status-change email
above: never awaited, failures are logged, never surfaced in the response.

- **Auth:** admin
- **Request body:**
  ```json
  { "title": "Fire drill Friday", "body": "Mandatory evacuation drill at 3pm.", "is_important": true }
  ```
  `is_important` is optional, defaults to `false`.
- **Success response `201`:**
  ```json
  {
    "notice": {
      "id": 3, "admin_id": 2, "title": "Fire drill Friday",
      "body": "Mandatory evacuation drill at 3pm.", "is_important": true,
      "posted_at": "2026-08-19T09:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - `400 VALIDATION_ERROR` — missing/empty `title` (max 255 chars) or `body`
    (max 2000 chars), or `is_important` present but not a boolean
  - `401 UNAUTHORIZED` / `403 FORBIDDEN` — see shared auth errors above

### `GET /api/notices`

Resident or admin — no role restriction, any authenticated user can read
the board. Important notices are pinned to the top; within each group
(important / not important), most recently posted first.

- **Auth:** resident or admin
- **Query params:** `page` (default `1`), `limit` (default `20`, max `100`)
- **Success response `200`:**
  ```json
  {
    "data": [
      {
        "id": 3, "admin_id": 2, "posted_by_name": "Admin User",
        "title": "Fire drill Friday", "body": "Mandatory evacuation drill at 3pm.",
        "is_important": true, "posted_at": "2026-08-19T09:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
  ```
- **Errors:** `401 UNAUTHORIZED` — see shared auth errors above

---

Further endpoints (dashboard, email notifications) are documented here as
they are built.
