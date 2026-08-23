# Society Maintenance Tracker

A platform for apartment societies to manage maintenance complaints:
residents raise and track complaints with photos, admins manage them through
a status workflow with priorities and overdue flagging, and everyone stays
informed via a notice board and email updates.

## Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL, accessed via [`pg`](https://node-postgres.com/)
  (the plain node-postgres client) rather than an ORM like Prisma. Chosen so
  the append-only status-history model and overdue-detection queries (see
  `.claude/skills/complaint-lifecycle` and `.claude/skills/db-schema`) can be
  written as explicit SQL/migrations without an ORM abstracting over the
  append-only constraint.
- **Frontend:** React, scaffolded with [Vite](https://vitejs.dev/)
- **Auth:** JWT-based, role-guarded for `resident` vs `admin` (see
  `.claude/skills/api-conventions`)
- **Email:** [Nodemailer](https://nodemailer.com/) over plain SMTP (not a
  provider-specific SDK), so any SMTP-capable free-tier provider works -
  see [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md) for how to get
  credentials (Gmail app password is the recommended default) and what to
  set in `.env`.

## Project structure

```
/server   Express API (src/app.js, src/index.js, src/config, src/db, src/routes)
/client   React app (Vite)
```

## Setup

Prerequisites: Node.js 22+, a running local PostgreSQL instance.

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in DB_URL, JWT_SECRET, EMAIL_*, etc.
npm run dev             # starts on PORT (default 4000)
```

Verify it's up: `GET http://localhost:4000/api/health` should return
`{ "status": "ok" }`.

### Frontend

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:4000
npm run dev             # starts the Vite dev server
```

## Docs

- [`docs/API.md`](docs/API.md) — API endpoint reference
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — database schema reference
- [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md) — how to configure email
  notifications

## Features

- Resident registration/login, admin login (JWT-based, role-guarded)
- Residents can raise a complaint (category, description, optional photo),
  view their own complaints, and see each one's full status history
- Admin can list/filter all complaints (status, category, date range), set
  priority, and transition status (`Open` → `In Progress` → `Resolved`,
  enforced strictly — see `.claude/skills/complaint-lifecycle`)
- Overdue detection with an admin-configurable threshold (`/admin/settings`)
  — overdue complaints sort to the top of the admin list
- Notice board, readable by both roles; admins can post notices and pin
  important ones to the top
- Email notifications (see `docs/EMAIL_SETUP.md`): residents are emailed
  when their complaint's status changes, and when an admin posts an
  important notice

Still TODO: admin dashboard (aggregate counts/reporting).

### Photo storage

Uploaded complaint photos are currently written to local disk at
`server/uploads/` and served statically at `/uploads/<filename>`. This is
fine for local development but doesn't survive redeploys on most hosting
platforms (e.g. Render/Railway's filesystem is ephemeral) and doesn't scale
across multiple server instances. Before production, swap
`server/src/middleware/upload.js`'s disk storage for an S3-compatible
bucket or a service like Cloudinary — the rest of the app only depends on
`complaints.photo_url` being a fetchable URL, so the swap is isolated to
that one file plus wherever `photo_url` gets built.

## Deployment

TODO — filled in once deployed.
