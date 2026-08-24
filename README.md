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
  append-only constraint. Migrations are plain numbered `.sql` files, applied
  by a small custom runner (`server/src/db/migrate.js`) rather than a
  migration framework — there was never a need for anything heavier.
- **Frontend:** React, scaffolded with [Vite](https://vitejs.dev/), routed
  with `react-router-dom`. Pinned to Vite 5 (not the `@latest` at scaffold
  time) — Vite 8's default rolldown bundler has no prebuilt native binding
  for this Windows/Node combination and crashed on build; Vite 5's classic
  Rollup-based bundler doesn't have that problem.
- **Auth:** JWT-based, role-guarded for `resident` vs `admin` (see
  `.claude/skills/api-conventions`). Passwords hashed with `bcryptjs`.
- **Photo uploads:** `multer`, storing to local disk in development — see
  [Photo storage](#photo-storage) below for what changes before production.
- **Email:** [Nodemailer](https://nodemailer.com/) over plain SMTP (not a
  provider-specific SDK), so any SMTP-capable free-tier provider works -
  see [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md) for how to get
  credentials (Gmail app password is the recommended default) and what to
  set in `.env`.

## Project structure

```
/server
  migrations/            Numbered SQL migrations, applied in filename order
  src/
    app.js               Express app: middleware + route mounting
    index.js             Entry point - starts the HTTP server
    config/              Reads and validates env vars
    constants/            Shared value lists (categories, statuses, priorities)
    controllers/          One file per resource - request handling + validation
    db/
      index.js            pg Pool connection
      migrate.js           Migration runner (tracks applied migrations)
      seed.js              Seeds an admin + 2 residents + 3 sample complaints
    middleware/            authenticate, requireRole, upload (multer), errorHandler
    routes/                One file per resource - maps HTTP verbs to controllers
    services/               settingsService (overdue threshold), emailService
    utils/                  validation.js (email/password format checks)
  uploads/                Uploaded complaint photos (gitignored, created at runtime)

/client
  src/
    api/client.js         Thin fetch wrapper - one exported function per endpoint
    components/            Shared UI (ProtectedRoute, StatusTimeline)
    constants/              Mirrors server/src/constants (categories, statuses)
    pages/                  One file per route/screen
    utils/auth.js          localStorage helpers for the JWT + logged-in user
    App.jsx                Route definitions
    main.jsx                Entry point - mounts <App /> inside <BrowserRouter>

/docs
  API.md                  Endpoint reference
  SCHEMA.md               Database schema reference + ER diagram
  EMAIL_SETUP.md          How to configure email notifications

/.claude/skills           Project-specific conventions Claude follows when
                          extending this codebase (complaint lifecycle rules,
                          API conventions, DB schema conventions, doc structure)
```

## Setup

### Prerequisites

- Node.js 22.x and npm (Vite 5 also supports Node 20.19+, if that's what's
  available instead)
- PostgreSQL 14+ running somewhere reachable (local install, Docker, or a
  hosted free tier like Railway/Supabase/Neon)
- git

### 1. Clone and install

```bash
git clone <this-repo-url>
cd "Unthinkable project"

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

- `DB_URL` — your PostgreSQL connection string
- `JWT_SECRET` — any random string (used to sign auth tokens)
- `PORT` — defaults to `4000`, change if that's taken
- `EMAIL_*` — optional for local dev (see below); leave the placeholders
  and the app runs fine, it just skips sending email and logs why

```bash
cd ../client
cp .env.example .env
```

`client/.env`'s only variable, `VITE_API_URL`, already defaults to
`http://localhost:4000` — only change it if the backend runs somewhere else.

Email is optional but easy to turn on — see
[`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md) for a Gmail app password
(recommended, no third-party signup) or another free SMTP provider.

### 3. Set up the database

With `DB_URL` pointing at an empty database:

```bash
cd server
npm run migrate   # creates all tables
npm run seed      # optional: adds 1 admin + 2 residents + 3 sample complaints
```

The seed script prints the shared password for all seeded accounts
(`password123`). The seeded logins:

| Email                  | Role     |
|-------------------------|----------|
| `admin@society.test`    | admin    |
| `asha@society.test`     | resident |
| `ravi@society.test`     | resident |

(Or skip seeding and register your own resident account through the app —
`POST /api/auth/register` / the Register page. Admin accounts are seed-only,
there's no self-registration path for them, by design.)

### 4. Run it

In two separate terminals:

```bash
cd server && npm run dev    # http://localhost:4000
cd client && npm run dev    # http://localhost:5173
```

Verify the backend is up: `GET http://localhost:4000/api/health` should
return `{ "status": "ok" }`. Then open `http://localhost:5173` and log in
with one of the seeded accounts above (or register a new resident).

## Docs

- [`docs/API.md`](docs/API.md) — every endpoint: method, path, auth,
  request body, response shape, error codes
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — database schema reference, including
  an ER diagram of how the tables relate
- [`docs/EMAIL_SETUP.md`](docs/EMAIL_SETUP.md) — how to configure email
  notifications
- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — design write-up on the
  complaint history model, overdue detection, photo handling, and
  notification flow

## Features

**Auth**
- Resident self-registration and login; admin login (admin accounts are
  seed-only — see Setup above). JWT-based, role-guarded throughout.

**Resident**
- Raise a complaint: category, description, optional photo
- View their own complaints, and each one's full status history timeline
- Read the notice board

**Admin**
- List and filter all complaints (by status, category, date range),
  paginated
- Set a complaint's priority (`Low`/`Medium`/`High`)
- Transition a complaint's status (`Open` → `In Progress` → `Resolved`,
  or `Open` → `Resolved` directly) with strictly enforced transition rules
  (no skipping backwards, nothing reopens a `Resolved` complaint) — see
  `.claude/skills/complaint-lifecycle`. Every change is recorded in an
  append-only history table with a timestamp, actor, and optional note.
- Configure the overdue-complaint threshold at runtime (`/admin/settings`)
  — overdue complaints are flagged and sorted to the top of the admin list,
  no redeploy needed to change the threshold
- Post notices to the board, optionally pinned as important
- Dashboard: complaint counts by status, by category, and the overdue count

**Notifications**
- Residents are emailed when their complaint's status changes, and when an
  admin posts an important notice (see `docs/EMAIL_SETUP.md`) — sent
  fire-and-forget, so a misconfigured or down mail provider never breaks
  the underlying request

### Photo storage

Uploaded complaint photos are currently written to local disk at
`server/uploads/` and served statically at `/uploads/<filename>`. This is
fine for local development, but **on the Render deployment described
below, it does not actually work**: Render's free/standard web services
have an ephemeral filesystem — anything written to disk is wiped on every
deploy and every time the service restarts (including free-tier spin-down/
spin-up). A photo uploaded today may be gone tomorrow, or after the next
`git push`. This is a known, deliberate limitation, not an oversight —
fixing it is a real code change, out of scope for a deployment-config-only
commit.

**Production fix:** swap `server/src/middleware/upload.js`'s
`multer.diskStorage` for an S3-compatible bucket (e.g. AWS S3, Cloudflare
R2, or Render's own persistent disks on a paid plan) or a service like
Cloudinary. The rest of the app only depends on `complaints.photo_url`
being a fetchable URL string, so the swap is isolated to that one file
plus wherever `photo_url` gets built in `complaintController.js` — nothing
else needs to change.

## Deployment

Hosted on [Render](https://render.com), via the `render.yaml` Blueprint at
the repo root — one file that provisions all three pieces (API web
service, static frontend, Postgres database) together, which is why Render
was picked over Vercel (great for static frontends, but not built for a
persistent Express server or a bundled Postgres instance) or Railway (no
Blueprint-as-code equivalent as clean as Render's for a repo like this).

### Deploy steps

1. Push this repo to GitHub (already done if you're reading this on
   [Society-Assistant](https://github.com/Ansh-P1/Society-Assistant)).
2. In the [Render dashboard](https://dashboard.render.com): **New +** →
   **Blueprint** → connect this GitHub repo. Render reads `render.yaml`
   and proposes three resources: `society-tracker-api` (web service),
   `society-tracker-client` (static site), `society-tracker-db`
   (PostgreSQL, free tier).
3. Before clicking **Apply**, fill in the `EMAIL_*` environment variables
   on `society-tracker-api` if you want email notifications live (see
   `docs/EMAIL_SETUP.md`) — they're intentionally left blank in
   `render.yaml` (`sync: false`) so no real credentials ever sit in the
   repo. `DB_URL` and `JWT_SECRET` are generated/wired automatically by
   the Blueprint; leave those alone.
4. Click **Apply**. Render builds and deploys both services — a few
   minutes each.
5. Run the database migrations (and optionally seed data) against the
   live database once. Two ways to do this:
   - **From your own machine:** in the Render dashboard, open
     `society-tracker-db` → copy the **External Database URL** → then:
     ```bash
     cd server
     DB_URL="<external-database-url>" npm run migrate
     DB_URL="<external-database-url>" npm run seed   # optional
     ```
   - **From Render's Shell tab:** open `society-tracker-api` → **Shell**
     → `npm run migrate` (and `npm run seed` if wanted). `DB_URL` is
     already set correctly in that environment.
6. If Render assigned `society-tracker-api` a different subdomain than
   expected (e.g. the name was taken), update `VITE_API_URL` on
   `society-tracker-client` to match, then trigger a manual redeploy of
   that service — Vite bakes this value in at build time, so just editing
   the env var isn't enough on its own.

### Free-tier caveats

- **Cold starts:** free web services spin down after 15 minutes of no
  traffic; the first request after that takes 30-60s to wake back up.
- **Database expiry:** Render's free Postgres databases are deleted after
  90 days unless upgraded to a paid plan.
- **Photo uploads don't persist** — see [Photo storage](#photo-storage) above.

### Live URLs

- **App:** [`https://society-tracker-client.onrender.com`](https://society-tracker-client.onrender.com)
- **API:** [`https://society-tracker-api-43az.onrender.com`](https://society-tracker-api-43az.onrender.com)
  (`-43az` because `society-tracker-api` was already taken)
- Seeded login: `asha@society.test` / `password123` (resident),
  `admin@society.test` / `password123` (admin) — see
  [Set up the database](#3-set-up-the-database) above for the full list.

Verified end-to-end against the live deployment, driving a real browser
against the real URL (not mocked): login, viewing the complaint list,
raising a complaint through the actual UI, admin login, the admin
dashboard's stat cards, and the notice board all confirmed working, with
zero browser console errors.

Two real issues were hit and fixed along the way, both now live:

- The `pg` Pool had no SSL config, and Render's Postgres requires it —
  every database query failed with `ECONNRESET` until this was fixed in
  `server/src/db/index.js` (SSL enabled unless `DB_URL` points at
  localhost).
- `render.yaml`'s `VITE_API_URL` pointed at the API's originally-intended
  subdomain, but Render assigned it `-43az` instead (name collision) —
  since Vite bakes this in at build time, the deployed client was calling
  a URL that resolved to nothing, surfacing in the browser as a CORS
  error. Fixed by correcting the value in `render.yaml` and letting
  Render's Blueprint sync rebuild the client.
