# System Design

## Complaint history model

`complaints.status` is a denormalized enum column, but it is never the
source of truth. Every change to it is backed by a row in
`complaint_status_history` (`complaint_id`, `from_status`, `to_status`,
`actor_id`, `note`, `changed_at`), and that table is strictly append-only —
application code never issues `UPDATE` or `DELETE` against it. A
complaint's creation is itself the first history row
(`from_status: null -> to_status: 'Open'`, actor = the resident), so the
full lifecycle — including who opened it and when — is always
reconstructable from this one table, with no separate "created by" field
anywhere.

A single mutable status column would lose exactly the information this app
depends on: `GET /api/complaints/:id` renders a resident's status timeline
from the history rows directly, and an admin's status note ("Plumber
scheduled") would have nowhere to live if it were just overwritten on
every change. `PATCH /api/admin/complaints/:id/status` enforces this by
`SELECT ... FOR UPDATE`-locking the row, validating the transition against
a fixed map (`Open -> In Progress`, `In Progress -> Resolved`, or a direct
`Open -> Resolved`; nothing transitions out of `Resolved`, no no-op
writes), then inserting the history row and updating `complaints.status`
in the same transaction — so the denormalized column and the audit trail
can never drift apart.

## Overdue detection

The threshold isn't a constant — it lives in a single-row `settings` table
(`overdue_threshold_days`, default 7, `id` pinned to `1` via a `CHECK`
constraint), editable at runtime through `GET`/`PATCH /api/admin/settings`
and read fresh from the database on every request by
`settingsService.getOverdueThresholdDays()`. There's no in-memory caching,
so a threshold change takes effect on the very next request, no restart.

"Overdue" is never stored — it's computed at query time as
`status != 'Resolved' AND created_at < now() - threshold`, inline in the
SQL for `GET /api/admin/complaints` (as the `is_overdue` column) and in
`countOverdueComplaints()`, a helper shared by
`GET /api/admin/complaints/overdue-count` and
`GET /api/admin/dashboard`'s `overdue_count`, so those two numbers can
never disagree. Computing it at read time means it's always correct
relative to the current threshold and the current clock, with no
background job to keep in sync. The admin listing sorts `is_overdue DESC,
created_at DESC`, so overdue complaints surface first without a separate
endpoint or client-side re-sort.

## Photo handling

`POST /api/complaints` accepts an optional `multipart/form-data` photo,
handled by Multer (`server/src/middleware/upload.js`) with
`diskStorage` into `server/uploads/`, filenames uniqued with a
timestamp + random suffix. A `fileFilter` restricts uploads to
JPEG/PNG/WebP and a 5MB limit; both rejections are translated out of
Multer's native errors into the app's standard
`{ error: { code, message } }` shape rather than leaking a 500. The
resulting path is stored as `complaints.photo_url` and served statically
at `/uploads/<filename>`.

This is a deliberate, documented tradeoff: it's simplest for local
development, but on the Render deployment it doesn't actually persist —
free/standard web services there have an ephemeral filesystem, wiped on
every deploy and restart. The fix is isolated by design: swap
`diskStorage` for an S3-compatible bucket or Cloudinary in that one
middleware file, since the rest of the app only ever treats `photo_url` as
a fetchable URL string, never a local path.

## Notification flow

Email goes through Nodemailer over plain SMTP
(`server/src/services/emailService.js`) rather than a vendor SDK, so any
SMTP-capable provider works via `EMAIL_*` env vars alone. Two triggers:
`PATCH /api/admin/complaints/:id/status`, after its transaction commits,
looks up the resident's email and calls `sendStatusChangeEmail()`; and
`POST /api/notices`, when `is_important` is `true`, looks up every
resident and calls `sendImportantNoticeEmail()` for each.

Both call sites use `pool.query(...).then(...).catch(...)` rather than
`await`, so the HTTP response returns without waiting on either the
recipient lookup or the SMTP round-trip — a slow or unreachable mail
provider can't add latency to the underlying request. `sendEmail()` itself
never rejects: send failures and missing `EMAIL_HOST`/`EMAIL_USER` are
both caught internally and logged to the server console (`[email] Failed
...` / `[email] Skipped ...`), never surfaced to the caller. That means a
misconfigured mail provider degrades to "no email sent, logged," never to
a broken status update or notice post.
