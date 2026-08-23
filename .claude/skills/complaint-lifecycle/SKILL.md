---
name: complaint-lifecycle
description: Rules for the Society Maintenance Tracker complaint status lifecycle - valid status transitions, the append-only status history model, and overdue detection logic. Use whenever adding or modifying code that creates complaints, changes complaint status, records history, or computes/displays overdue state.
---

# Complaint Lifecycle

Defines how a complaint moves through its lifecycle, how that movement is
recorded, and how "overdue" is computed. Treat this as the source of truth
whenever touching complaint status, history, or overdue logic.

## Status values

Exactly three statuses, in order:

1. `Open`
2. `In Progress`
3. `Resolved`

## Valid transitions

- `Open -> In Progress`
- `In Progress -> Resolved`
- `Open -> Resolved` (allowed - admin can resolve directly without an
  intermediate "In Progress" step)

Invalid transitions (must be rejected by the API with a 4xx error, never
silently ignored):

- Skipping backwards, e.g. `In Progress -> Open`, `Resolved -> In Progress`,
  `Resolved -> Open`
- Any transition **out of** `Resolved`. Once a complaint is `Resolved` it is
  closed permanently - there is no reopening. If a resident has a recurring
  or unresolved issue, they file a new complaint.
- Setting status to its current value (no-op transitions should be rejected
  as a 400, not recorded as a history entry)

## Status history model (append-only)

Every status change produces one new row - existing rows are never updated
or deleted. The history table is the single source of truth for "what
happened and when"; the complaint's current status is a derived/denormalized
field kept in sync on write, not the other way around.

Each history row records:

| field         | notes                                              |
|---------------|-----------------------------------------------------|
| `id`          | primary key                                        |
| `complaint_id`| FK to the complaint                                |
| `actor_id`    | user who made the change (admin or, for creation, resident) |
| `from_status` | null on the creation event                         |
| `to_status`   | required                                           |
| `note`        | optional free text                                 |
| `created_at`  | timestamp, server-set, never client-supplied        |

The complaint's creation itself is the first history entry (`from_status:
null -> to_status: 'Open'`), so a complaint's full timeline - including who
opened it and when - is always reconstructable from the history table alone.

When writing code that changes status: insert the history row and update the
complaint's current-status column in the same transaction. Never let one
succeed without the other.

## Overdue detection

A complaint is overdue when:

```
status != 'Resolved' AND (now - created_at) > threshold_days
```

Notes:

- `threshold_days` is a configurable value (not hardcoded), read from the
  single-row `settings` table (`overdue_threshold_days`, see
  `.claude/skills/db-schema` and `docs/SCHEMA.md`) via
  `server/src/services/settingsService.js`. Admins tune it at runtime through
  `PATCH /api/admin/settings` - no code change or restart required.
- Overdue is a computed property, not a stored column - it must never go
  stale. Compute it at query/read time (e.g. in the SQL query or in the
  response serializer), not written to the row on a schedule.
- The overdue clock is measured from `created_at`, not from the last status
  change - a complaint that sat in `In Progress` for a long time is still
  measured against when it was originally opened.
- `Resolved` complaints are never overdue, regardless of how long they took.

## Overdue sorting in admin views

Admin complaint list views must surface overdue complaints first:

1. Overdue complaints (sorted by how overdue they are - most overdue first,
   i.e. oldest `created_at` first among overdue items)
2. Then everything else, sorted by the view's normal ordering (e.g. newest
   first)

Implement this as an `ORDER BY is_overdue DESC, created_at ASC/DESC` style
clause (or equivalent in the ORM), not as a client-side re-sort - the API
should return complaints already in the correct order so pagination stays
consistent.
