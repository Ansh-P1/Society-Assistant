---
name: project-docs
description: Required structure for this project's README.md, .env.example, docs/API.md, and docs/SCHEMA.md, so documentation stays consistent as features are added. Use whenever adding a new endpoint, env var, table, or feature - update the matching doc in the same change, don't let docs drift.
---

# Project Documentation Structure

This project keeps four docs in sync with the code. When a change adds an
endpoint, table, env var, or user-facing feature, update the matching doc
in the same commit - don't defer it.

## README.md (repo root)

Required sections, in order:

1. **Title** - project name and one-line description.
2. **Stack** - the actual technologies used (e.g. Node.js + Express +
   PostgreSQL + React + Vite), including which ORM/DB-client choice was made
   and why (see db-schema).
3. **Setup** - install steps and how to run dev servers for both `/server`
   and `/client`, prerequisites (Node version, PostgreSQL running locally),
   and how to copy `.env.example` to `.env`.
4. **Features** - what the app does, grouped by resident-facing vs
   admin-facing (filled in as features ship - not required before features
   exist).
5. **Project structure** - brief tree of `/server` and `/client` top-level
   folders and what each contains.
6. **Docs** - links to `docs/API.md` and `docs/SCHEMA.md`.
7. **Deployment** - where it's hosted and how to redeploy (filled in once
   deployed).

Keep each section short; link out to `docs/API.md` / `docs/SCHEMA.md`
instead of duplicating endpoint or table detail in the README.

## .env.example

Every variable the app reads from `process.env` must have a placeholder
entry here, grouped by concern, with a one-line comment where the value
isn't self-explanatory:

```
# Server
PORT=4000

# Database
DB_URL=postgresql://user:password@localhost:5432/society_tracker

# Auth
JWT_SECRET=change-me

# Email (see docs/API.md for provider setup)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

# App config
OVERDUE_THRESHOLD_DAYS=7
```

Never commit an actual secret here - placeholders or obviously-fake values
only. When a new env var is introduced anywhere in `/server`, add it here in
the same change.

## docs/API.md

One section per resource, in the order routes were added. Each endpoint
entry includes: method + path, auth requirement (which role, or public),
request body shape, success response shape, and the specific `error.code`
values it can return (see api-conventions for the error envelope shape).
Keep examples as minimal realistic JSON, not prose descriptions of the
fields.

## docs/SCHEMA.md

One section per table, in migration order. Each table entry includes: a
short purpose sentence, a column list (name, type, constraints,
FK-references), and the indexes on that table. Note explicitly which tables
are append-only (see db-schema). Add a table here in the same change that
adds its migration - never let a migration land without its schema doc
entry.
