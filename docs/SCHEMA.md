# Database Schema Reference

See `.claude/skills/db-schema/SKILL.md` for the conventions (naming,
migration file naming, append-only history rule, indexes) that every table
below follows, and `.claude/skills/complaint-lifecycle/SKILL.md` for the
status lifecycle and overdue-detection rules that these tables support.

Migrations live in `server/migrations/`, applied in filename order by
`server/src/db/migrate.js` (tracked in a `schema_migrations` table). Seed
data is in `server/src/db/seed.js`.

All primary keys are `SERIAL` (auto-incrementing integers); foreign keys
reference them as plain integers.

## users

Residents and admins, distinguished by `role`.

| column          | type                          | notes                              |
|------------------|-------------------------------|-------------------------------------|
| `id`             | `SERIAL PRIMARY KEY`          |                                     |
| `name`           | `VARCHAR(255) NOT NULL`       |                                     |
| `email`          | `VARCHAR(255) NOT NULL UNIQUE`|                                     |
| `password_hash`  | `VARCHAR(255) NOT NULL`       | bcrypt hash, never a plaintext password |
| `role`           | `user_role NOT NULL DEFAULT 'resident'` | enum: `resident`, `admin` |
| `created_at`     | `TIMESTAMPTZ NOT NULL DEFAULT now()` |                              |

## complaints

A resident's complaint. `status` and `priority` are native Postgres enums.
`status` is denormalized from `complaint_status_history` for fast reads -
every status change must update this column and insert a history row in the
same transaction.

| column          | type                              | notes                                  |
|------------------|------------------------------------|------------------------------------------|
| `id`             | `SERIAL PRIMARY KEY`               |                                         |
| `resident_id`    | `INTEGER NOT NULL REFERENCES users(id)` | who raised it                     |
| `category`       | `VARCHAR(100) NOT NULL`            |                                         |
| `description`    | `TEXT NOT NULL`                    |                                         |
| `photo_url`      | `VARCHAR(500)`                     | nullable - photo is optional           |
| `priority`       | `complaint_priority NOT NULL DEFAULT 'Low'` | enum: `Low`, `Medium`, `High` |
| `status`         | `complaint_status NOT NULL DEFAULT 'Open'` | enum: `Open`, `In Progress`, `Resolved` |
| `created_at`     | `TIMESTAMPTZ NOT NULL DEFAULT now()` | overdue detection measures from here |
| `resolved_at`    | `TIMESTAMPTZ`                      | nullable - set when status becomes `Resolved` |

**Indexes:** `status`, `category`, `created_at` - these are the fields the
admin view filters and sorts on (see `.claude/skills/db-schema` for
additional indexes recommended once resident-scoped queries and the
complaint history/notice-board endpoints are built: `resident_id`, a
composite `(status, created_at)`, and `notices(is_important, created_at)`).

## complaint_status_history

**Append-only.** Application code only ever `INSERT`s into this table -
never `UPDATE` or `DELETE`. This is why the table has no `updated_at`
column: a row is immutable the instant it's written, so "when was it last
changed" is not a meaningful question. It is the source of truth for a
complaint's full timeline; `complaints.status` is just a cached copy of the
latest row's `to_status`. A complaint's creation is itself the first history
row (`from_status: NULL -> to_status: 'Open'`), so the entire lifecycle -
including who opened it and when - is always reconstructable from this
table alone, with no separate "created by" field needed anywhere else.

| column          | type                                   | notes                          |
|------------------|------------------------------------------|-----------------------------------|
| `id`             | `SERIAL PRIMARY KEY`                      |                                 |
| `complaint_id`   | `INTEGER NOT NULL REFERENCES complaints(id)` |                              |
| `from_status`    | `complaint_status`                        | nullable - null on the creation row |
| `to_status`      | `complaint_status NOT NULL`               |                                 |
| `actor_id`       | `INTEGER NOT NULL REFERENCES users(id)`   | who made the change            |
| `note`           | `TEXT`                                    | nullable                       |
| `changed_at`     | `TIMESTAMPTZ NOT NULL DEFAULT now()`      | server-set, never client-supplied |

**Indexes:** none yet - `complaint_id` is recommended once the
"get history for this complaint" endpoint is built (see
`.claude/skills/db-schema`).

## notices

Admin-posted notices for the notice board.

| column          | type                              | notes                        |
|------------------|------------------------------------|---------------------------------|
| `id`             | `SERIAL PRIMARY KEY`               |                               |
| `admin_id`       | `INTEGER NOT NULL REFERENCES users(id)` | who posted it            |
| `title`          | `VARCHAR(255) NOT NULL`            |                               |
| `body`           | `TEXT NOT NULL`                    |                               |
| `is_important`   | `BOOLEAN NOT NULL DEFAULT false`   | pinned to top when true      |
| `posted_at`      | `TIMESTAMPTZ NOT NULL DEFAULT now()` |                             |

**Indexes:** none yet - `(is_important, created_at)` is recommended once the
notice board endpoint is built (see `.claude/skills/db-schema`).
