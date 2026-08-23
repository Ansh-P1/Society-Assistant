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

---

Further endpoints (complaints, notices, dashboard) are documented here as
they are built.
