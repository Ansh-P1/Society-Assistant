---
name: api-conventions
description: REST API conventions for the Society Maintenance Tracker backend - endpoint naming, JWT auth, role-guard middleware for resident vs admin routes, standard error response shape, and pagination. Use whenever adding, modifying, or reviewing an Express route or middleware.
---

# API Conventions

Consistency rules for every endpoint in `/server`. Follow these for any new
route rather than inventing a one-off convention.

## Endpoint naming

- Resource-based, plural nouns, kebab-case where multi-word: `/api/complaints`,
  `/api/notices`, `/api/complaint-history` (only if ever exposed as its own
  resource - prefer nesting, see below).
- Nest sub-resources under their parent: `/api/complaints/:id/status`,
  `/api/complaints/:id/history`.
- Use HTTP verbs for actions, not verbs in the path: `POST /api/complaints`
  (create), not `/api/complaints/create`. `PATCH /api/complaints/:id/status`
  to change status, not `/api/complaints/:id/update-status`.
- Auth routes live under `/api/auth`: `/api/auth/register`,
  `/api/auth/login`.
- Dashboard/reporting endpoints live under `/api/dashboard`.

## Auth: JWT-based

- On login/register, issue a signed JWT containing at minimum `{ sub: userId,
  role }`. Sign with `JWT_SECRET` from env - never hardcode a secret.
- Client sends the token as `Authorization: Bearer <token>`.
- An `authenticate` middleware verifies the token and attaches `req.user =
  { id, role }`. Missing/invalid/expired token -> 401.
- Do not store JWTs or session state in the database - JWT auth here is
  stateless. If logout/revocation is needed later, that's a separate
  decision, not assumed by default.

## Role-guard middleware pattern

Two roles: `resident`, `admin`. Guard routes with a small composable
middleware, applied after `authenticate`:

```js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    next();
  };
}

// usage
router.get('/api/complaints', authenticate, requireRole('admin'), listComplaints);
router.post('/api/complaints', authenticate, requireRole('resident'), createComplaint);
```

- Never branch on role inside a controller function as a substitute for this
  middleware - the guard belongs on the route definition so permissions are
  visible by scanning the routes file.
- A resident must only ever see/modify their own complaints; enforce this in
  the query layer (`WHERE resident_id = req.user.id`), not just at the route
  level - the role guard alone does not prevent a resident from guessing
  another resident's complaint id.

## Standard error response shape

Every error response, regardless of status code, uses this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "category is required"
  }
}
```

- `code`: a stable, uppercase-snake machine-readable string
  (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`,
  `INVALID_TRANSITION`, `INTERNAL_ERROR`, ...). Frontend code and tests can
  branch on this; never branch on `message`.
- `message`: human-readable, safe to display.
- Never return a bare string, a raw stack trace, or an array of errors at
  the top level - always wrap in this `error` envelope. Centralize this in
  one error-handling middleware rather than hand-building it per route.

## Pagination

List endpoints accept `?page` (1-indexed, default 1) and `?limit` (default
20, cap at e.g. 100) query params. Response shape:

```json
{
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

Filter/sort query params (e.g. `?status=Open&category=plumbing`) combine
with pagination params on the same endpoint rather than separate
filter-specific routes.
